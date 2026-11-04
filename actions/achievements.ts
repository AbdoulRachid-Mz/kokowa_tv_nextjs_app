// actions/achievements.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

export type AchievementEntityType = 'fighter' | 'region' | 'others';
export type AchievementPosition = '1st' | '2nd' | '3rd' | 'finalist' | 'semifinalist' | 'quarterfinalist';
export type AchievementType =
  | 'competition'
  | 'kirari'
  | 'fair-play'
  | 'point'
  | 'walki'
  | 'dance'
  | 'tchali_tchali'
  | 'once_beat'
  | 'best_beaten'
  | 'other';

export interface AchievementRecord {
  id?: number;
  entity_type: AchievementEntityType;
  fighter_id?: number | null;
  region_id?: number | null;
  edition_id: number;
  year: number;
  position: AchievementPosition;
  type: AchievementType | string;
  title: string;
  description?: string | null;
  medal_image?: string | null;
  match_id?: number | null;
  other_actor_name?: string | null;
  other_actor_role?: string | null;
}

/**
 * Génère le titre officiel d'une distinction en fonction de la position et de l'entité
 */
export function buildAchievementTitle(
  entityType: AchievementEntityType,
  position: AchievementPosition,
  editionNumber?: number,
  competitionName: string = "Sabre National"
): string {
  const editionStr = editionNumber ? ` - ${editionNumber}e Édition` : '';

  if (entityType === 'region') {
    switch (position) {
      case '1st':
        return `Région Championne (${competitionName}${editionStr})`;
      case '2nd':
        return `Région Vice-Championne (${competitionName}${editionStr})`;
      case '3rd':
        return `Région 3ème Place (${competitionName}${editionStr})`;
      default:
        return `Distinction Régionale (${competitionName}${editionStr})`;
    }
  }

  // Pour les lutteurs
  switch (position) {
    case '1st':
      return `Champion National (${competitionName}${editionStr})`;
    case '2nd':
      return `Vice-Champion National (${competitionName}${editionStr})`;
    case '3rd':
      return `3ème Place Nationale (${competitionName}${editionStr})`;
    default:
      return `Distinction Individuelle (${competitionName}${editionStr})`;
  }
}

/**
 * Génère la description textuelle d'un palmarès
 */
export function buildAchievementDescription(
  entityType: AchievementEntityType,
  targetName: string,
  regionName: string,
  position: AchievementPosition,
  year: number,
  competitionName: string = "Sabre National"
): string {
  const medal = position === '1st' ? '🥇' : position === '2nd' ? '🥈' : '🥉';
  const posLabel = position === '1st' ? '1ère place (Vainqueur)' : position === '2nd' ? '2ème place (Finaliste)' : '3ème place';

  if (entityType === 'region') {
    return `${medal} La région de ${regionName} s'est classée à la ${posLabel} lors du ${competitionName} en ${year}.`;
  }

  return `${medal} Le lutteur ${targetName} de la région ${regionName} a décroché la ${posLabel} du ${competitionName} en ${year}.`;
}

/**
 * Insère ou met à jour une distinction de manière idempotente (UPSERT)
 */
export async function upsertAchievement(
  achievement: AchievementRecord,
  dbClient?: PoolClient
): Promise<number> {
  const executeQuery = dbClient
    ? (sql: string, params: any[]) => dbClient.query(sql, params).then(res => res.rows)
    : (sql: string, params: any[]) => query(sql, params);

  const {
    entity_type,
    fighter_id = null,
    region_id = null,
    edition_id,
    year,
    position,
    type = 'competition',
    title,
    description = null,
    medal_image = null,
    match_id = null,
    other_actor_name = null,
    other_actor_role = null,
  } = achievement;

  // Clé d'unicité basée sur (edition_id, entity_type, bénéficiaire, type, position)
  let existingId: number | null = null;

  if (entity_type === 'fighter' && fighter_id) {
    const existing = await executeQuery(
      `SELECT id FROM fighter_achievements 
       WHERE edition_id = $1 AND entity_type = 'fighter' AND fighter_id = $2 AND type = $3 AND position = $4
       LIMIT 1`,
      [edition_id, fighter_id, type, position]
    );
    if (existing.length > 0) existingId = existing[0].id;
  } else if (entity_type === 'region' && region_id) {
    const existing = await executeQuery(
      `SELECT id FROM fighter_achievements 
       WHERE edition_id = $1 AND entity_type = 'region' AND region_id = $2 AND type = $3 AND position = $4
       LIMIT 1`,
      [edition_id, region_id, type, position]
    );
    if (existing.length > 0) existingId = existing[0].id;
  }

  if (existingId) {
    await executeQuery(
      `UPDATE fighter_achievements SET
         title = $1,
         description = $2,
         match_id = $3,
         region_id = COALESCE($4, region_id),
         medal_image = COALESCE($5, medal_image)
       WHERE id = $6`,
      [title, description, match_id, region_id, medal_image, existingId]
    );
    return existingId;
  }

  const insertSql = `
    INSERT INTO fighter_achievements (
      entity_type, fighter_id, region_id, edition_id, year,
      position, type, title, description, medal_image, match_id,
      other_actor_name, other_actor_role
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id
  `;

  const rows = await executeQuery(insertSql, [
    entity_type,
    fighter_id,
    region_id,
    edition_id,
    year,
    position,
    type,
    title,
    description,
    medal_image,
    match_id,
    other_actor_name,
    other_actor_role,
  ]);

  return rows[0].id;
}

/**
 * Cœur Métier Lot 3 : Synchronise automatiquement les palmarès officiels d'un match de classement.
 * Déclenché uniquement lorsque :
 * 1. Le match est 'completed'.
 * 2. Un vainqueur officiel est déclaré.
 * 3. La phase est explicitement 'final' ou 'third_place'.
 * 
 * Si le match a été corrigé ou annulé, les palmarès issus de ce match sont réconciliés.
 */
export async function syncMatchOfficialAchievements(
  matchId: number,
  dbClient?: PoolClient
): Promise<{ success: boolean; applied: boolean; count: number; reason?: string }> {
  try {
    const executeQuery = dbClient
      ? (sql: string, params: any[]) => dbClient.query(sql, params).then(res => res.rows)
      : (sql: string, params: any[]) => query(sql, params);

    // 1. Récupérer le match avec son sous-groupe, sa phase, et l'édition
    const matchData = await executeQuery(
      `SELECT m.id, m.status, m.winner_fighter_id, m.loser_fighter_id,
              m.fighter1_id, m.fighter2_id,
              sg.id as sub_group_id, sg.region1_id, sg.region2_id,
              p.phase_type, p.name as phase_name,
              ce.id as edition_id, ce.year, ce.edition_number,
              c.name as competition_name
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       JOIN competition_editions ce ON p.edition_id = ce.id
       LEFT JOIN competitions c ON ce.competition_id = c.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchData.length === 0) {
      return { success: false, applied: false, count: 0, reason: "Match non trouvé" };
    }

    const match = matchData[0];
    const isCompleted = match.status === 'completed';
    const isOfficialRankingPhase = match.phase_type === 'final' || match.phase_type === 'third_place';

    // Si le match a été annulé ou n'est plus officiel, réconcilier/nettoyer les distinctions créées par ce match
    if (!isCompleted || !isOfficialRankingPhase) {
      const deleted = await executeQuery(
        `DELETE FROM fighter_achievements WHERE match_id = $1`,
        [matchId]
      );
      return {
        success: true,
        applied: true,
        count: deleted.length || 0,
        reason: "Distinctions nettoyées (match non complété ou phase ordinaire)",
      };
    }

    if (!match.winner_fighter_id) {
      return { success: true, applied: false, count: 0, reason: "Aucun vainqueur déclaré sur ce match" };
    }

    // Récupérer les informations précises sur le vainqueur et le perdant (incluant leur région d'édition)
    const fightersInfo = await executeQuery(
      `SELECT ef.fighter_id, ef.region_id,
              f.first_name, f.last_name, f.nickname,
              r.name as region_name
       FROM edition_fighters ef
       JOIN fighters f ON ef.fighter_id = f.id
       LEFT JOIN regions r ON ef.region_id = r.id
       WHERE ef.edition_id = $1 AND ef.fighter_id IN ($2, $3)`,
      [match.edition_id, match.winner_fighter_id, match.loser_fighter_id || 0]
    );

    const winner = fightersInfo.find((f: any) => f.fighter_id === match.winner_fighter_id);
    const loser = fightersInfo.find((f: any) => f.fighter_id === match.loser_fighter_id);

    if (!winner) {
      return { success: false, applied: false, count: 0, reason: "Données du lutteur vainqueur introuvables" };
    }

    let count = 0;
    const year = match.year;
    const editionId = match.edition_id;
    const compName = match.competition_name || "Sabre National";
    const edNum = match.edition_number;

    // A. Cas FINALE : Attribution 1ère Place (Vainqueur) & 2ème Place (Perdant)
    if (match.phase_type === 'final') {
      // 1. Lutteur Champion (1ère Place)
      const wTitle = buildAchievementTitle('fighter', '1st', edNum, compName);
      const wDesc = buildAchievementDescription('fighter', `${winner.first_name} ${winner.last_name}`, winner.region_name || '', '1st', year, compName);
      await upsertAchievement({
        entity_type: 'fighter',
        fighter_id: winner.fighter_id,
        region_id: winner.region_id,
        edition_id: editionId,
        year,
        position: '1st',
        type: 'competition',
        title: wTitle,
        description: wDesc,
        match_id: matchId,
      }, dbClient);
      count++;

      // 2. Région Championne (1ère Place)
      if (winner.region_id) {
        const rwTitle = buildAchievementTitle('region', '1st', edNum, compName);
        const rwDesc = buildAchievementDescription('region', '', winner.region_name || '', '1st', year, compName);
        await upsertAchievement({
          entity_type: 'region',
          fighter_id: null,
          region_id: winner.region_id,
          edition_id: editionId,
          year,
          position: '1st',
          type: 'competition',
          title: rwTitle,
          description: rwDesc,
          match_id: matchId,
        }, dbClient);
        count++;
      }

      // 3. Lutteur Vice-Champion (2ème Place)
      if (loser) {
        const lTitle = buildAchievementTitle('fighter', '2nd', edNum, compName);
        const lDesc = buildAchievementDescription('fighter', `${loser.first_name} ${loser.last_name}`, loser.region_name || '', '2nd', year, compName);
        await upsertAchievement({
          entity_type: 'fighter',
          fighter_id: loser.fighter_id,
          region_id: loser.region_id,
          edition_id: editionId,
          year,
          position: '2nd',
          type: 'competition',
          title: lTitle,
          description: lDesc,
          match_id: matchId,
        }, dbClient);
        count++;

        // 4. Région Vice-Championne (2ème Place)
        if (loser.region_id) {
          const rlTitle = buildAchievementTitle('region', '2nd', edNum, compName);
          const rlDesc = buildAchievementDescription('region', '', loser.region_name || '', '2nd', year, compName);
          await upsertAchievement({
            entity_type: 'region',
            fighter_id: null,
            region_id: loser.region_id,
            edition_id: editionId,
            year,
            position: '2nd',
            type: 'competition',
            title: rlTitle,
            description: rlDesc,
            match_id: matchId,
          }, dbClient);
          count++;
        }
      }
    }

    // B. Cas MATCH 3E PLACE : Attribution 3ème Place (Vainqueur)
    if (match.phase_type === 'third_place') {
      // 1. Lutteur 3ème Place
      const tTitle = buildAchievementTitle('fighter', '3rd', edNum, compName);
      const tDesc = buildAchievementDescription('fighter', `${winner.first_name} ${winner.last_name}`, winner.region_name || '', '3rd', year, compName);
      await upsertAchievement({
        entity_type: 'fighter',
        fighter_id: winner.fighter_id,
        region_id: winner.region_id,
        edition_id: editionId,
        year,
        position: '3rd',
        type: 'competition',
        title: tTitle,
        description: tDesc,
        match_id: matchId,
      }, dbClient);
      count++;

      // 2. Région 3ème Place
      if (winner.region_id) {
        const rtTitle = buildAchievementTitle('region', '3rd', edNum, compName);
        const rtDesc = buildAchievementDescription('region', '', winner.region_name || '', '3rd', year, compName);
        await upsertAchievement({
          entity_type: 'region',
          fighter_id: null,
          region_id: winner.region_id,
          edition_id: editionId,
          year,
          position: '3rd',
          type: 'competition',
          title: rtTitle,
          description: rtDesc,
          match_id: matchId,
        }, dbClient);
        count++;
      }
    }

    // Revalidation des chemins
    revalidatePath(`/ad/fighters/achievements`);
    revalidatePath(`/ad/editions/${editionId}`);
    revalidatePath(`/editions/${editionId}`);

    return {
      success: true,
      applied: true,
      count,
      reason: `Distinctions attribuées avec succès (${count} distinctions générées)`,
    };
  } catch (error: any) {
    console.error("Error in syncMatchOfficialAchievements:", error);
    return {
      success: false,
      applied: false,
      count: 0,
      reason: error.message || "Erreur attribution palmarès",
    };
  }
}
