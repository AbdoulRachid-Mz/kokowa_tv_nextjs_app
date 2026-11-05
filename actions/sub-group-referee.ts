// actions/sub-group-referee.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Informations complètes sur un arbitre
 */
export interface RefereeInfo {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string | null;
  profile_image?: string | null;
  is_active: boolean;
}

/**
 * Récupère le type de phase pour un match donné
 */
export async function getMatchPhaseType(matchId: number): Promise<{
  phase_type: string | null;
  sub_group_id: number;
  group_id: number | null;
} | null> {
  try {
    const res = await queryOne<{
      phase_type: string | null;
      sub_group_id: number;
      group_id: number | null;
    }>(
      `SELECT p.phase_type, m.sub_group_id, sg.group_id
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );
    return res || null;
  } catch (error) {
    console.error("Error in getMatchPhaseType:", error);
    return null;
  }
}

/**
 * Récupère le type de phase pour un sous-groupe donné
 */
export async function getSubGroupPhaseType(subGroupId: number): Promise<{
  phase_type: string | null;
  group_id: number | null;
} | null> {
  try {
    const res = await queryOne<{
      phase_type: string | null;
      group_id: number | null;
    }>(
      `SELECT p.phase_type, sg.group_id
       FROM sub_groups sg
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       WHERE sg.id = $1`,
      [subGroupId]
    );
    return res || null;
  } catch (error) {
    console.error("Error in getSubGroupPhaseType:", error);
    return null;
  }
}

/**
 * Affecte un arbitre directement à un match individuel (Cas 1 : phases éliminatoires & non-group)
 * Si le match fait partie d'une phase de type 'group', synchronise également le sous-groupe
 * pour maintenir la cohérence demandée.
 */
export async function assignMatchReferee(
  matchId: number,
  refereeId: number | null
): Promise<{ success: boolean; message: string; matchId: number; refereeId: number | null }> {
  try {
    if (!matchId || isNaN(matchId)) {
      throw new Error("Identifiant de match invalide");
    }

    // 1. Vérifier que le match existe et récupérer son sous-groupe et phase_type
    const matchInfo = await queryOne<{
      id: number;
      sub_group_id: number;
      group_id: number | null;
      phase_type: string | null;
    }>(
      `SELECT m.id, m.sub_group_id, sg.group_id, p.phase_type
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (!matchInfo) {
      throw new Error("Match non trouvé");
    }

    // 2. Si un arbitre est spécifié, vérifier qu'il existe et est actif
    if (refereeId) {
      const referee = await queryOne<{ id: number; first_name: string; last_name: string; is_active: boolean }>(
        `SELECT id, first_name, last_name, is_active FROM referees WHERE id = $1`,
        [refereeId]
      );

      if (!referee) {
        throw new Error("Arbitre non trouvé");
      }
    }

    const isGroupPhase = matchInfo.phase_type === 'group';

    // 3. Mettre à jour le match
    await query(
      `UPDATE matches SET referee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [refereeId || null, matchId]
    );

    // 4. Si phase de type 'group', synchroniser aussi le sous-groupe et tous ses autres matchs
    if (isGroupPhase && matchInfo.sub_group_id) {
      await query(
        `UPDATE sub_groups SET main_referee_id = $1 WHERE id = $2`,
        [refereeId || null, matchInfo.sub_group_id]
      );
      await query(
        `UPDATE matches SET referee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE sub_group_id = $2`,
        [refereeId || null, matchInfo.sub_group_id]
      );
    }

    // 5. Invalidation sécurisée du cache (protégée pour les environnements de test / hors Next context)
    try {
      revalidatePath(`/ad/matches`);
      revalidatePath(`/ad/matches/${matchId}`);
      if (matchInfo.sub_group_id) {
        revalidatePath(`/ad/sub-groups/${matchInfo.sub_group_id}`);
        revalidatePath(`/ad/sub-groups/${matchInfo.sub_group_id}/matches`);
        revalidatePath(`/ad/sub-groups/${matchInfo.sub_group_id}/matches/${matchId}`);
      }
      if (matchInfo.group_id) {
        revalidatePath(`/ad/phase-groups/${matchInfo.group_id}`);
        revalidatePath(`/ad/phase-groups/${matchInfo.group_id}/organisation`);
      }
      revalidateTag("matches", {});
      revalidateTag(`match:${matchId}`, {});
      revalidateTag("sub-groups", {});
    } catch (_) {}

    return {
      success: true,
      message: refereeId ? "Arbitre assigné avec succès au match" : "Arbitre retiré du match",
      matchId,
      refereeId: refereeId || null,
    };
  } catch (error: any) {
    console.error("Error in assignMatchReferee:", error);
    throw new Error(error.message || "Erreur lors de l'assignation de l'arbitre au match");
  }
}

/**
 * Assigne ou modifie l'arbitre principal d'un sous-groupe (rencontre).
 * Règle métier Kokowa TV :
 * - Si phase_type === 'group' : synchronise matches.referee_id pour TOUS les matchs du sous-groupe.
 * - Si phase non-group : met à jour sub_groups.main_referee_id sans écraser les affectations individuelles existantes.
 */
export async function assignSubGroupReferee(
  subGroupId: number,
  refereeId: number | null
): Promise<{ success: boolean; message: string; subGroupId: number; refereeId: number | null }> {
  try {
    if (!subGroupId || isNaN(subGroupId)) {
      throw new Error("Identifiant de sous-groupe invalide");
    }

    // 1. Vérifier que le sous-groupe existe et récupérer son type de phase
    const subGroup = await queryOne<{
      id: number;
      group_id: number | null;
      name: string;
      phase_type: string | null;
    }>(
      `SELECT sg.id, sg.group_id, sg.name, p.phase_type
       FROM sub_groups sg
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       WHERE sg.id = $1`,
      [subGroupId]
    );

    if (!subGroup) {
      throw new Error("Sous-groupe non trouvé");
    }

    // 2. Si un arbitre est spécifié, vérifier qu'il existe et est actif
    if (refereeId) {
      const referee = await queryOne<{ id: number; first_name: string; last_name: string; is_active: boolean }>(
        `SELECT id, first_name, last_name, is_active FROM referees WHERE id = $1`,
        [refereeId]
      );

      if (!referee) {
        throw new Error("Arbitre non trouvé");
      }
    }

    // 3. Mettre à jour l'arbitre principal du sous-groupe
    await query(
      `UPDATE sub_groups SET main_referee_id = $1 WHERE id = $2`,
      [refereeId || null, subGroupId]
    );

    // 4. Si phase 'group', synchroniser TOUS les matchs de ce sous-groupe
    const isGroupPhase = subGroup.phase_type === 'group';
    if (isGroupPhase) {
      await query(
        `UPDATE matches SET referee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE sub_group_id = $2`,
        [refereeId || null, subGroupId]
      );
    }

    // 5. Invalidation sécurisée du cache
    try {
      revalidatePath(`/ad/sub-groups/${subGroupId}`);
      revalidatePath(`/ad/sub-groups/${subGroupId}/matches`);
      if (subGroup.group_id) {
        revalidatePath(`/ad/phase-groups/${subGroup.group_id}`);
        revalidatePath(`/ad/phase-groups/${subGroup.group_id}/organisation`);
      }
      revalidatePath(`/ad/matches`);
      revalidateTag("sub-groups", {});
      revalidateTag(`sub-group:${subGroupId}`, {});
      revalidateTag("matches", {});
    } catch (_) {}

    return {
      success: true,
      message: refereeId
        ? (isGroupPhase
            ? "Arbitre assigné avec succès à la rencontre et synchronisé sur tous ses matchs"
            : "Arbitre assigné au sous-groupe")
        : "Arbitre retiré de la rencontre",
      subGroupId,
      refereeId: refereeId || null,
    };
  } catch (error: any) {
    console.error("Error in assignSubGroupReferee:", error);
    throw new Error(error.message || "Erreur lors de l'assignation de l'arbitre");
  }
}

/**
 * Récupère l'arbitre actuel et les informations du sous-groupe
 */
export async function getSubGroupRefereeInfo(subGroupId: number) {
  try {
    const subGroup = await queryOne<{
      id: number;
      name: string;
      main_referee_id: number | null;
      referee_first_name?: string;
      referee_last_name?: string;
      referee_nickname?: string;
      referee_profile_image?: string;
      phase_type?: string;
      matches_count: number;
    }>(
      `SELECT sg.id, sg.name, sg.main_referee_id,
              r.first_name as referee_first_name,
              r.last_name as referee_last_name,
              r.nickname as referee_nickname,
              r.profile_image as referee_profile_image,
              p.phase_type,
              COUNT(m.id)::int as matches_count
       FROM sub_groups sg
       LEFT JOIN referees r ON sg.main_referee_id = r.id
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       LEFT JOIN matches m ON sg.id = m.sub_group_id
       WHERE sg.id = $1
       GROUP BY sg.id, sg.name, sg.main_referee_id, r.first_name, r.last_name, r.nickname, r.profile_image, p.phase_type`,
      [subGroupId]
    );

    return subGroup;
  } catch (error) {
    console.error("Error in getSubGroupRefereeInfo:", error);
    return null;
  }
}

/**
 * Récupère les informations d'arbitre pour un match individuel
 */
export async function getMatchRefereeInfo(matchId: number) {
  try {
    const matchInfo = await queryOne<{
      id: number;
      match_number: number;
      referee_id: number | null;
      referee_first_name?: string;
      referee_last_name?: string;
      referee_nickname?: string;
      referee_profile_image?: string;
      sub_group_id: number;
      sub_group_main_referee_id: number | null;
      phase_type: string | null;
    }>(
      `SELECT m.id, m.match_number, m.referee_id,
              r.first_name as referee_first_name,
              r.last_name as referee_last_name,
              r.nickname as referee_nickname,
              r.profile_image as referee_profile_image,
              sg.id as sub_group_id,
              sg.main_referee_id as sub_group_main_referee_id,
              p.phase_type
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       LEFT JOIN referees r ON m.referee_id = r.id
       LEFT JOIN phase_groups pg ON sg.group_id = pg.id
       LEFT JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );

    return matchInfo;
  } catch (error) {
    console.error("Error in getMatchRefereeInfo:", error);
    return null;
  }
}
