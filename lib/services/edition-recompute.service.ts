export async function recomputeEditionState(tx: any, editionId: number) {
  // 🔄 RESET PROPRE
  await resetEditionState(tx, editionId);

  // 📥 MATCHS VALIDÉS UNIQUEMENT
  const result = await tx.query(`
    SELECT 
      m.id,
      m.sub_group_id,
      m.winner_fighter_id,
      m.loser_fighter_id,
      f1.region_id AS winner_region,
      f2.region_id AS loser_region
    FROM matches m
    LEFT JOIN fighters f1 ON m.winner_fighter_id = f1.id
    LEFT JOIN fighters f2 ON m.loser_fighter_id = f2.id
    WHERE m.status = 'completed'
      AND m.winner_fighter_id IS NOT NULL
      AND m.loser_fighter_id IS NOT NULL
      AND m.sub_group_id IN (
        SELECT sg.id
        FROM sub_groups sg
        JOIN phase_groups pg ON sg.group_id = pg.id
        JOIN phases p ON pg.phase_id = p.id
        WHERE p.edition_id = ${editionId}
      )
    ORDER BY m.match_date ASC
  `);

  const matches = Array.isArray(result) ? result : result.rows || [];

  for (const match of matches) {
    if (!match.winner_fighter_id || !match.loser_fighter_id) continue;

    // +3 au vainqueur dans edition_regions
    if (match.winner_region) {
      await tx.query(`
        UPDATE edition_regions
        SET points = points + 3
        WHERE edition_id = ${editionId}
          AND region_id = ${match.winner_region}
      `);
    }

    // score du sous-groupe
    const subGroupInfo = await tx.query(`
      SELECT region1_id, region2_id
      FROM sub_groups
      WHERE id = ${match.sub_group_id}
    `);

    const sg = Array.isArray(subGroupInfo) ? subGroupInfo[0] : (subGroupInfo.rows || [])[0];
    if (sg) {
      if (sg.region1_id === match.winner_region) {
        await tx.query(`
          UPDATE sub_groups
          SET score_region1 = score_region1 + 3
          WHERE id = ${match.sub_group_id}
        `);
      } else if (sg.region2_id === match.winner_region) {
        await tx.query(`
          UPDATE sub_groups
          SET score_region2 = score_region2 + 3
          WHERE id = ${match.sub_group_id}
        `);
      }
    }

    // élimination du perdant
    await tx.query(`
      UPDATE edition_fighters
      SET is_eliminated = true
      WHERE fighter_id = ${match.loser_fighter_id}
        AND edition_id = ${editionId}
    `);
  }
}

async function resetEditionState(tx: any, editionId: number) {
  // Réinitialiser les points des régions
  await tx.query(`
    UPDATE edition_regions
    SET points = 0
    WHERE edition_id = ${editionId}
  `);

  // Réinitialiser les scores des sous-groupes liés
  await tx.query(`
    UPDATE sub_groups sg
    SET score_region1 = 0,
        score_region2 = 0
    FROM phase_groups pg
    JOIN phases p ON pg.phase_id = p.id
    WHERE sg.group_id = pg.id
      AND p.edition_id = ${editionId}
  `);

  // Réinitialiser l'état d'élimination des lutteurs
  await tx.query(`
    UPDATE edition_fighters
    SET is_eliminated = false
    WHERE edition_id = ${editionId}
  `);
}