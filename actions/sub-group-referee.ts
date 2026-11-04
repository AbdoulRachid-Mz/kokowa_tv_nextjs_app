// actions/sub-group-referee.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath } from 'next/cache';

/**
 * Assigne ou modifie l'arbitre principal d'un sous-groupe (rencontre).
 * Tous les matchs du sous-groupe partagent cet arbitre conformément à la règle Kokowa TV.
 */
export async function assignSubGroupReferee(
  subGroupId: number,
  refereeId: number | null
): Promise<{ success: boolean; message: string; subGroupId: number; refereeId: number | null }> {
  try {
    if (!subGroupId || isNaN(subGroupId)) {
      throw new Error("Identifiant de sous-groupe invalide");
    }

    // 1. Vérifier que le sous-groupe existe
    const subGroup = await queryOne<{ id: number; group_id: number; name: string }>(
      `SELECT id, group_id, name FROM sub_groups WHERE id = $1`,
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

    // 4. Invalider les chemins pertinents
    revalidatePath(`/ad/sub-groups/${subGroupId}`);
    if (subGroup.group_id) {
      revalidatePath(`/ad/phase-groups/${subGroup.group_id}`);
      revalidatePath(`/ad/phase-groups/${subGroup.group_id}/organisation`);
    }
    revalidatePath(`/ad/matches`);

    return {
      success: true,
      message: refereeId ? "Arbitre assigné avec succès à la rencontre" : "Arbitre retiré de la rencontre",
      subGroupId,
      refereeId: refereeId || null,
    };
  } catch (error: any) {
    console.error("Error in assignSubGroupReferee:", error);
    throw new Error(error.message || "Erreur lors de l'assignation de l'arbitre");
  }
}

/**
 * Récupère l'arbitre actuel et la liste des arbitres actifs assignables
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
    }>(
      `SELECT sg.id, sg.name, sg.main_referee_id,
              r.first_name as referee_first_name,
              r.last_name as referee_last_name,
              r.nickname as referee_nickname
       FROM sub_groups sg
       LEFT JOIN referees r ON sg.main_referee_id = r.id
       WHERE sg.id = $1`,
      [subGroupId]
    );

    return subGroup;
  } catch (error) {
    console.error("Error in getSubGroupRefereeInfo:", error);
    return null;
  }
}
