// tests/referee-assignment-lot3.test.ts
import { describe, it, expect } from "bun:test";
import { pool } from "@/lib/db/neon-client";
import {
  assignMatchReferee,
  assignSubGroupReferee,
  getMatchPhaseType,
  getSubGroupPhaseType,
} from "@/actions/sub-group-referee";

describe("LOT 3 - Refonte Affectation des Arbitres - Scénarios A à E", () => {
  // Scénario D : Vérification du schéma et migration 009
  it("Scénario D : matches.referee_id existe dans le schéma SQL avec sa clé étrangère", async () => {
    const colRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'matches' AND column_name = 'referee_id';
    `);
    expect(colRes.rows.length).toBe(1);
    expect(colRes.rows[0].column_name).toBe("referee_id");
    expect(colRes.rows[0].data_type).toBe("integer");
    expect(colRes.rows[0].is_nullable).toBe("YES");

    const fkRes = await pool.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'matches' 
        AND tc.constraint_name = 'fk_matches_referee_id';
    `);
    expect(fkRes.rows.length).toBe(1);
    expect(fkRes.rows[0].constraint_name).toBe("fk_matches_referee_id");
  });

  // Validation d'entrée des actions
  it("assignMatchReferee rejette un identifiant de match invalide", async () => {
    expect(assignMatchReferee(0, 1)).rejects.toThrow("Identifiant de match invalide");
    expect(assignMatchReferee(NaN, 1)).rejects.toThrow("Identifiant de match invalide");
  });

  it("assignSubGroupReferee rejette un identifiant de sous-groupe invalide", async () => {
    expect(assignSubGroupReferee(0, 1)).rejects.toThrow("Identifiant de sous-groupe invalide");
    expect(assignSubGroupReferee(NaN, 1)).rejects.toThrow("Identifiant de sous-groupe invalide");
  });

  // Scénario A & C : Affectation individuelle pour match éliminatoire
  it("Scénario A & C : assignMatchReferee affecte et retire un arbitre individuel sur un match", async () => {
    // Trouver un match existant et un arbitre existant
    const matchRes = await pool.query(`SELECT id, sub_group_id, referee_id FROM matches LIMIT 1`);
    const refereeRes = await pool.query(`SELECT id FROM referees WHERE is_active = true LIMIT 1`);

    if (matchRes.rows.length > 0 && refereeRes.rows.length > 0) {
      const testMatchId = matchRes.rows[0].id;
      const originalRefereeId = matchRes.rows[0].referee_id;
      const testRefereeId = refereeRes.rows[0].id;

      // 1. Affecter l'arbitre au match
      const assignResult = await assignMatchReferee(testMatchId, testRefereeId);
      expect(assignResult.success).toBe(true);
      expect(assignResult.refereeId).toBe(testRefereeId);

      // Vérifier en base
      const checkRes = await pool.query(`SELECT referee_id FROM matches WHERE id = $1`, [testMatchId]);
      expect(checkRes.rows[0].referee_id).toBe(testRefereeId);

      // 2. Scénario C : Retirer l'arbitre (assigner null)
      const removeResult = await assignMatchReferee(testMatchId, null);
      expect(removeResult.success).toBe(true);
      expect(removeResult.refereeId).toBeNull();

      const checkNullRes = await pool.query(`SELECT referee_id FROM matches WHERE id = $1`, [testMatchId]);
      expect(checkNullRes.rows[0].referee_id).toBeNull();

      // Restaurer la valeur initiale
      if (originalRefereeId) {
        await pool.query(`UPDATE matches SET referee_id = $1 WHERE id = $2`, [originalRefereeId, testMatchId]);
      }
    }
  });

  // Scénario B : Synchronisation phase 'group'
  it("Scénario B : assignSubGroupReferee synchronise tous les matchs du sous-groupe si phase group", async () => {
    // Trouver un sous-groupe de phase 'group' avec des matchs
    const sgRes = await pool.query(`
      SELECT sg.id, sg.main_referee_id, COUNT(m.id) as match_count
      FROM sub_groups sg
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN matches m ON m.sub_group_id = sg.id
      WHERE p.phase_type = 'group'
      GROUP BY sg.id, sg.main_referee_id
      HAVING COUNT(m.id) > 0
      LIMIT 1;
    `);

    const refRes = await pool.query(`SELECT id FROM referees WHERE is_active = true LIMIT 1`);

    if (sgRes.rows.length > 0 && refRes.rows.length > 0) {
      const testSgId = sgRes.rows[0].id;
      const originalRefId = sgRes.rows[0].main_referee_id;
      const testRefId = refRes.rows[0].id;

      // Exécuter l'assignation sur le sous-groupe
      const res = await assignSubGroupReferee(testSgId, testRefId);
      expect(res.success).toBe(true);
      expect(res.refereeId).toBe(testRefId);

      // Vérifier que sub_groups.main_referee_id est mis à jour
      const sgCheck = await pool.query(`SELECT main_referee_id FROM sub_groups WHERE id = $1`, [testSgId]);
      expect(sgCheck.rows[0].main_referee_id).toBe(testRefId);

      // Vérifier que TOUS les matchs du sous-groupe ont matches.referee_id = testRefId
      const matchesCheck = await pool.query(`
        SELECT COUNT(*) as unsynced
        FROM matches
        WHERE sub_group_id = $1 AND referee_id != $2
      `, [testSgId, testRefId]);
      expect(parseInt(matchesCheck.rows[0].unsynced)).toBe(0);

      // Restaurer
      await pool.query(`UPDATE sub_groups SET main_referee_id = $1 WHERE id = $2`, [originalRefId, testSgId]);
      await pool.query(`UPDATE matches SET referee_id = $1 WHERE sub_group_id = $2`, [originalRefId, testSgId]);
    }
  });

  // Scénario E : Helper phase type
  it("Scénario E : getMatchPhaseType et getSubGroupPhaseType retournent les types attendus", async () => {
    const match = await pool.query(`SELECT id FROM matches LIMIT 1`);
    if (match.rows.length > 0) {
      const info = await getMatchPhaseType(match.rows[0].id);
      expect(info).not.toBeNull();
      expect(info?.sub_group_id).toBeDefined();
    }

    const sg = await pool.query(`SELECT id FROM sub_groups LIMIT 1`);
    if (sg.rows.length > 0) {
      const sgInfo = await getSubGroupPhaseType(sg.rows[0].id);
      expect(sgInfo).not.toBeNull();
    }
  });
});
