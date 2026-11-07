// @/actions/mobile/matches.ts
"use server";

import { query } from "@/lib/db/neon-client";
import { enrichMatchData, getCardsForMatches } from "@/utils/match-utils";

export async function getMobileMatchesBySubGroup(
  subGroupId: number,
  filters?: { page?: number; limit?: number },
) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Les informations du sous-groupe servent aussi d'existence check :
    // une seule requête au lieu de deux.
    const subGroupInfo = await getSubGroupInfo(subGroupId);

    if (!subGroupInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Sous-groupe non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Un seul GROUP BY status fournit à la fois le total paginable et le résumé.
    const statsSql = `
      SELECT status, COUNT(*) as count 
      FROM matches 
      WHERE sub_group_id = $1 
      GROUP BY status
    `;
    const statsResult = await query<{ status: string; count: string }>(
      statsSql,
      [subGroupId],
    );
    const stats: Record<string, number> = {};
    statsResult.forEach((row) => {
      if (row.status !== null && row.status !== undefined) {
        stats[row.status] = parseInt(row.count);
      }
    });
    const total = Object.entries(stats).reduce(
      (sum, [status, count]) =>
        status === "live" || status === "round_break" ? sum : sum + count,
      0,
    );

    // Récupérer le match en direct (s'il existe) - Toujours récupéré à part
    const liveMatchSql = `
      SELECT m.*, 
             f1.first_name as "fighter1FirstName", f1.last_name as "fighter1LastName", f1.nickname as "fighter1Nickname", f1.profile_image as "fighter1ProfileImage", r1.name as "fighter1RegionName",
             f2.first_name as "fighter2FirstName", f2.last_name as "fighter2LastName", f2.nickname as "fighter2Nickname", f2.profile_image as "fighter2ProfileImage", r2.name as "fighter2RegionName",
             ce.id as "editionId"
      FROM matches m
      JOIN fighters f1 ON m.fighter1_id = f1.id
      JOIN fighters f2 ON m.fighter2_id = f2.id
      JOIN regions r1 ON f1.region_id = r1.id
      JOIN regions r2 ON f2.region_id = r2.id
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.sub_group_id = $1 AND m.status IN ('live', 'round_break')
      LIMIT 1
    `;
    const liveMatchResult = await query(liveMatchSql, [subGroupId]);

    // Récupérer les autres matchs paginés
    const otherMatchesSql = `
      SELECT m.*, 
             f1.first_name as "fighter1FirstName", f1.last_name as "fighter1LastName", f1.nickname as "fighter1Nickname", f1.profile_image as "fighter1ProfileImage", r1.name as "fighter1RegionName",
             f2.first_name as "fighter2FirstName", f2.last_name as "fighter2LastName", f2.nickname as "fighter2Nickname", f2.profile_image as "fighter2ProfileImage", r2.name as "fighter2RegionName",
             ce.id as "editionId"
      FROM matches m
      JOIN fighters f1 ON m.fighter1_id = f1.id
      JOIN fighters f2 ON m.fighter2_id = f2.id
      JOIN regions r1 ON f1.region_id = r1.id
      JOIN regions r2 ON f2.region_id = r2.id
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.sub_group_id = $1 AND m.status NOT IN ('live', 'round_break')
      ORDER BY m.match_number ASC
      LIMIT $2 OFFSET $3
    `;
    const otherMatchesResult = await query(otherMatchesSql, [
      subGroupId,
      limit,
      offset,
    ]);

    // UNE seule requête cartons pour le live + la page courante.
    const allMatches = [
      ...(liveMatchResult[0] ? [liveMatchResult[0]] : []),
      ...otherMatchesResult,
    ];
    const cardsByMatch = await getCardsForMatches(
      allMatches.map((m) => Number(m.id)),
    );

    const liveMatch = liveMatchResult[0]
      ? await enrichMatchData(liveMatchResult[0], cardsByMatch)
      : null;
    const otherMatches = await Promise.all(
      otherMatchesResult.map((m) => enrichMatchData(m, cardsByMatch)),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        subGroup: subGroupInfo,
        liveMatch,
        matches: {
          all: otherMatches,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        summary: {
          total: (liveMatch ? 1 : 0) + total,
          live: stats["live"] || 0,
          round_break: stats["round_break"] || 0,
          scheduled: stats["scheduled"] || 0,
          completed: stats["completed"] || 0,
          cancelled: stats["cancelled"] || 0,
          postponed: stats["postponed"] || 0,
          reclamation: stats["reclamation"] || 0,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Matchs du sous-groupe récupérés avec succès",
    };
  } catch (error: any) {
    console.error("Error in getMobileMatchesBySubGroup:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: error.message || "Erreur lors de la récupération des matchs",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function getMobileMatchById(matchId: number) {
  try {
    // Récupérer les détails du match avec les infos nécessaires pour enrichMatchData
    const sql = `
      SELECT m.*, 
             f1.first_name as "fighter1FirstName", f1.last_name as "fighter1LastName", f1.nickname as "fighter1Nickname", f1.profile_image as "fighter1ProfileImage", r1.name as "fighter1RegionName",
             f2.first_name as "fighter2FirstName", f2.last_name as "fighter2LastName", f2.nickname as "fighter2Nickname", f2.profile_image as "fighter2ProfileImage", r2.name as "fighter2RegionName",
             ce.id as "editionId"
      FROM matches m
      JOIN fighters f1 ON m.fighter1_id = f1.id
      JOIN fighters f2 ON m.fighter2_id = f2.id
      JOIN regions r1 ON f1.region_id = r1.id
      JOIN regions r2 ON f2.region_id = r2.id
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.id = $1 AND m.is_active = true
    `;
    const result = await query(sql, [matchId]);

    if (result.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Match non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const match = result[0];
    const editionId = match.editionId || match.edition_id || match["editionId"];

    // Statistiques groupées des deux lutteurs dans le contexte de l'édition
    const fighterIds = [match.fighter1_id || match.fighter1Id, match.fighter2_id || match.fighter2Id].filter(Boolean);
    const statsMap = await getFighterStatsForEdition(fighterIds, editionId);

    // Enrichir les données du match
    const enrichedMatch = await enrichMatchData(match, undefined, statsMap);

    return {
      success: true,
      data: {
        match: enrichedMatch,
        timestamp: new Date().toISOString(),
      },
      message: "Match récupéré avec succès",
    };
  } catch (error: any) {
    console.error("Error in getMobileMatchById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: error.message || "Erreur lors de la récupération du match",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Récupérer les détails d'un match spécifique
async function getMatchDetails(matchId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time2 as "startTime",
      m.end_time as "endTime",
      m.status,
      m.match_result as "matchResult",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      m.sub_group_id as "subGroupId",
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Sous-groupe
      sg.name as "subGroupName",
      sg.period as "subGroupPeriod",
      sg.status as "subGroupStatus",
      sg.is_completed as "subGroupIsCompleted",
      sg.score_region1 as "subGroupScoreRegion1",
      sg.score_region2 as "subGroupScoreRegion2",
      sg.nulls as "subGroupNulls",
      
      -- Région 1 (du sous-groupe)
      sg.region1_id as "region1Id",
      r1.name as "region1Name",
      r1.flag_image as "region1FlagImage",
      r1.color as "region1Color",
      
      -- Région 2 (du sous-groupe)
      sg.region2_id as "region2Id",
      r2.name as "region2Name",
      r2.flag_image as "region2FlagImage",
      r2.color as "region2Color",
      
      -- Ceintures
      b1.color as "belt1Color",
      b2.color as "belt2Color",
      
      -- Arbitre
      COALESCE(m.referee_id, sg.main_referee_id) as "refereeId",
      m.referee_id as "matchRefereeId",
      sg.main_referee_id as "mainRefereeId",
      ref.first_name as "refereeFirstName",
      ref.last_name as "refereeLastName",
      ref.profile_image as "refereeProfileImage",
      
      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      f1r.name as "fighter1RegionName",
      f1r.flag_image as "fighter1RegionFlagImage",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      f2r.name as "fighter2RegionName",
      f2r.flag_image as "fighter2RegionFlagImage",
      
      -- Contexte de l'édition
      ce.id as "editionId",
      ce.theme as "editionTheme",
      ce.year as "editionYear",
      ce.edition_number as "editionNumber",
      c.name as "competitionName"

    FROM matches m
    LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    LEFT JOIN referees ref ON COALESCE(m.referee_id, sg.main_referee_id) = ref.id
    LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
    LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
    LEFT JOIN regions f1r ON f1.region_id = f1r.id
    LEFT JOIN regions f2r ON f2.region_id = f2r.id
    LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
    LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
    LEFT JOIN phase_groups pg ON sg.group_id = pg.id
    LEFT JOIN phases p ON pg.phase_id = p.id
    LEFT JOIN competition_editions ce ON p.edition_id = ce.id
    LEFT JOIN competitions c ON ce.competition_id = c.id
    WHERE m.id = $1
  `;

  const result = await query(sql, [matchId]);
  return result[0] || null;
}

// Fonctions auxiliaires
async function getSubGroupInfo(subGroupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.period,
      sg.status,
      sg.video_url as "videoUrl",
      sg.score_region1 as "scoreRegion1",
      sg.score_region2 as "scoreRegion2",
      sg.nulls,
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r1.flag_image as "region1FlagImage",
      r2.name as "region2Name",
      r2.flag_image as "region2FlagImage",
      sg.belt_region1 as "beltRegion1Id",
      sg.belt_region2 as "beltRegion2Id",
      b1.color as "beltRegion1Color",
      b2.color as "beltRegion2Color",
      sg.main_referee_id as "mainRefereeId",
      ref.first_name as "refereeFirstName",
      ref.last_name as "refereeLastName",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    LEFT JOIN referees ref ON sg.main_referee_id = ref.id
    WHERE sg.id = $1
  `;

  const result = await query(sql, [subGroupId]);
  const subGroup = result[0];

  if (subGroup) {
    // Formater les données du sous-groupe
    subGroup.scores = {
      region1: subGroup.scoreRegion1,
      region2: subGroup.scoreRegion2,
      nulls: subGroup.nulls,
    };

    subGroup.belts = {
      region1: subGroup.beltRegion1Id
        ? {
            id: subGroup.beltRegion1Id,
            color: subGroup.beltRegion1Color,
          }
        : null,
      region2: subGroup.beltRegion2Id
        ? {
            id: subGroup.beltRegion2Id,
            color: subGroup.beltRegion2Color,
          }
        : null,
    };

    subGroup.referee = subGroup.mainRefereeId
      ? {
          id: subGroup.mainRefereeId,
          firstName: subGroup.refereeFirstName,
          lastName: subGroup.refereeLastName,
        }
      : null;

    // Nettoyer les données redondantes
    const fieldsToDelete = [
      "scoreRegion1",
      "scoreRegion2",
      "nulls",
      "beltRegion1Id",
      "beltRegion2Id",
      "beltRegion1Color",
      "beltRegion2Color",
      "mainRefereeId",
      "refereeFirstName",
      "refereeLastName",
    ];

    fieldsToDelete.forEach((field) => delete subGroup[field]);
  }

  return subGroup;
}

async function getAllMatchesForSubGroup(subGroupId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.status,
      m.start_time2 as "startTime",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.notes,
      m.sub_group_id as "subGroupId",
      
      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      r1.name as "fighter1RegionName",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      r2.name as "fighter2RegionName",
      
      -- Vainqueur et perdant
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId"

    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    WHERE m.sub_group_id = $1
    ORDER BY 
      CASE 
        WHEN m.status IN ('live', 'round_break') THEN 0
        ELSE 1
      END,
      m.match_number ASC
  `;

  return await query(sql, [subGroupId]);
}



async function getMatchStats(matchId: number) {
  const cardsStats = await countCardsForMatch(matchId);
  const duration = await getMatchDuration(matchId);
  const breaks = await getBreakCount(matchId);

  return {
    totalCards: cardsStats.total,
    yellowCards: cardsStats.yellow,
    redCards: cardsStats.red,
    duration,
    breaks,
  };
}

async function countCardsForMatch(matchId: number) {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN card_type = 'yellow' THEN 1 ELSE 0 END) as yellow,
      SUM(CASE WHEN card_type = 'red' THEN 1 ELSE 0 END) as red
    FROM fighter_cards 
    WHERE match_id = $1 AND is_cancelled = FALSE
  `;

  const result = await query(sql, [matchId]);
  return result[0];
}

async function getMatchDuration(matchId: number) {
  const sql =
    'SELECT total_duration as "totalDuration" FROM matches WHERE id = $1';
  const result = await query(sql, [matchId]);
  return result[0]?.totalDuration || 0;
}

async function getBreakCount(matchId: number) {
  const sql = 'SELECT break_count as "breakCount" FROM matches WHERE id = $1';
  const result = await query(sql, [matchId]);
  return result[0]?.breakCount || 0;
}
// Statistiques groupées des lutteurs dans le contexte d'une édition.
// Retourne une Map fighterId -> { isInRace, totalMatches, wins }.
// Les chutes (falls) ne sont pas historiquement tracées dans le schéma :
// on retourne 0 (pas de valeur inventée).
export async function getFighterStatsForEdition(
  fighterIds: number[],
  editionId: number,
): Promise<Map<number, { isInRace: boolean | null; totalMatches: number; wins: number; winRatio: number }>> {
  const map = new Map<number, { isInRace: boolean | null; totalMatches: number; wins: number; winRatio: number }>();
  if (!fighterIds.length || !editionId) return map;

  const sql = `
    SELECT
      f.id as "fighterId",
      COALESCE(ef.is_eliminated, false) as "isEliminated",
      COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as "totalMatches",
      COUNT(DISTINCT CASE WHEN m.status = 'completed' AND (
        (m.fighter1_id = f.id AND m.match_result = 'fighter1_win') OR
        (m.fighter2_id = f.id AND m.match_result = 'fighter2_win')
      ) THEN m.id END) as "wins"
    FROM fighters f
    LEFT JOIN edition_fighters ef
      ON ef.fighter_id = f.id AND ef.edition_id = $1
    LEFT JOIN matches m
      ON (m.fighter1_id = f.id OR m.fighter2_id = f.id)
      AND m.sub_group_id IN (
        SELECT sg.id FROM sub_groups sg
        JOIN phase_groups pg ON sg.group_id = pg.id
        JOIN phases ph ON pg.phase_id = ph.id
        WHERE ph.edition_id = $1
      )
    WHERE f.id = ANY($2::int[])
    GROUP BY f.id, ef.is_eliminated
  `;

  const rows = await query(sql, [editionId, fighterIds]);
  for (const row of rows) {
    const total = Number(row.totalMatches || 0);
    const wins = Number(row.wins || 0);
    map.set(Number(row.fighterId), {
      isInRace: row.isEliminated === null ? null : !Boolean(row.isEliminated),
      totalMatches: total,
      wins,
      winRatio: total > 0 ? Math.round((wins / total) * 100) : 0,
    });
  }
  // Ensure all requested fighters are present (even if no rows)
  for (const id of fighterIds) {
    if (!map.has(id)) {
      map.set(id, { isInRace: null, totalMatches: 0, wins: 0, winRatio: 0 });
    }
  }
  return map;
}
