"use server";

import { query } from "@/lib/db/neon-client";
import { Region } from "@/types";
import { getParticipatedEditions } from "./editions";
import { formatDateTime, formatDuration } from "@/utils/duration";

export async function getMobileRegions(filters?: {
  page?: number;
  limit?: number;
  userId?: number;
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const userId = filters?.userId;

    // Compter le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM regions
    `;

    const countResult = await query<{ total: string }>(countSql);
    const total = parseInt(countResult[0]?.total || "0");

    const sql = `
      SELECT 
        id,
        name,
        code,
        description,
        flag_image as "flagImage"
      FROM regions 
      ORDER BY name
      LIMIT $1 OFFSET $2
    `;

    const params = [limit, offset];
    const regions = await query<Region>(sql, params);

    // Calculer la pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        regions,
        count: regions.length,
        total: total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Régions récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileRegions:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des régions",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Mettre à jour la fonction getMobileRegionById pour accepter editionId
export async function getMobileRegionById(
  regionId: number,
  userId?: number,
  editionId?: number,
) {
  try {
    // Récupérer les informations de la région avec likes et favoris
    const regionInfo = await getRegionInfo(regionId, userId);
    if (!regionInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Région non trouvée",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Récupérer toutes les données de la région
    const fighters = await getRegionFighters(regionId);
    const matches = await getRegionMatches(regionId, editionId);
    const transfers = await getRegionTransfers(regionId);
    const achievements = await getRegionAchievements(regionId);
    const stats = calculateRegionStats(
      fighters,
      matches?.data?.matches?.all || [],
      achievements,
    );

    return {
      success: true,
      data: {
        region: regionInfo,
        fighters: fighters,
        matches: organizeMatches(matches?.data?.matches?.all || []),
        transfers: transfers,
        achievements: organizeAchievements(achievements),
        stats: stats,
        summary: {
          totalFighters: fighters.length,
          totalMatches: matches.data?.matches?.all?.length || 0,
          totalTransfers: transfers.length,
          totalAchievements: achievements.length,
          liveMatches:
            matches?.data?.matches.all.filter(
              (m) =>
                m.status === "live" ||
                m.status === "round_break" ||
                m.status === "reclamation",
            ).length || 0,
          wins:
            matches?.data?.matches?.all.filter(
              (m) => m.result?.winnerId === regionId,
            ).length || 0,
          losses:
            matches?.data?.matches?.all.filter(
              (m) => m.result?.loserId === regionId,
            ).length || 0,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Données de la région récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileRegionById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des données de la région",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
// Mettre à jour la fonction getMobileRegionById pour accepter editionId
export async function getMobileRegionById2(
  regionId: number,
  userId?: number,
  editionId?: number,
) {
  try {
    // Récupérer les informations de la région avec likes et favoris
    const regionInfo = await getRegionInfo(regionId, userId);
    if (!regionInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Région non trouvée",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Récupérer toutes les données de la région
    const fighters = await getRegionFighters(regionId);
    const editions = await getParticipatedEditions(regionId, "region");
    const transfers = await getRegionTransfers(regionId);
    const achievements = await getRegionAchievements(regionId);
    const stats = calculateRegionStats(fighters, [], achievements);

    return {
      success: true,
      data: {
        region: {
          ...regionInfo,
          editions: editions,
          fighters: fighters,
          transfers: transfers,
          achievements: organizeAchievements(achievements),
          stats: stats,
          summary: {
            totalFighters: fighters.length,
            totalEditions: editions.length,
            totalTransfers: transfers.length,
            totalAchievements: achievements.length,
            liveMatches: 0,
            wins: 0,
            losses: 0,
          },
        },
        timestamp: new Date().toISOString(),
      },
      message: "Données de la région récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileRegionById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des données de la région",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Si getCardsForMatch n'est pas dans ce fichier, ajoutez-la :
async function getCardsForMatch(matchId: number) {
  const sql = `
    SELECT 
      fc.id,
      fc.fighter_id as "fighterId",
      fc.card_type as "cardType",
      fc.minute_given as "minuteGiven"
    FROM fighter_cards fc
    WHERE fc.match_id = $1
    ORDER BY fc.minute_given
  `;

  return await query(sql, [matchId]);
}

// async function getRegionInfo(regionId: number, userId?: number) {
//   const sql = `
//     SELECT
//       r.id,
//       r.name,
//       r.code,
//       r.color,
//       r.stadium_name as "stadiumName",
//       r.description,
//       r.total_champions as "totalChampions",
//       r.flag_image as "flagImage",
//       r.stadium_image as "stadiumImage",
//       r.total_fighters as "totalFighters",
//       r.created_at as "createdAt",

//       -- Compter le nombre de likes
//       COALESCE((
//         SELECT COUNT(*)
//         FROM interactions i
//         WHERE i.entity_type = 'region'
//           AND i.entity_id = r.id
//           AND i.interaction_type = 'like'
//       ), 0) as "likes",

//       -- Vérifier si l'utilisateur a liké cette région
//       ${userId ? `
//       EXISTS(
//         SELECT 1
//         FROM interactions i
//         WHERE i.entity_type = 'region'
//           AND i.entity_id = r.id
//           AND i.interaction_type = 'like'
//           AND i.user_id = $2
//       ) as "isMyFavorite"
//       ` : 'FALSE as "isMyFavorite"' }

//     FROM regions r
//     WHERE r.id = $1
//   `;

//   const params = userId ? [regionId, userId] : [regionId];
//   const result = await query(sql, params);
//   return result[0] || null;
// }
async function getRegionInfo(regionId: number, userId?: number) {
  const sql = `
    SELECT 
      r.id,
      r.name,
      r.code,
      r.stadium_name as "stadiumName",
      r.description,
      r.total_champions as "totalChampions",
      r.flag_image as "flagImage",
      r.stadium_image as "stadiumImage",
      r.total_fighters as "totalFighters",
      r.created_at as "createdAt",
      
      -- Compter le nombre de likes
      COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'region'
          AND i.entity_id = r.id
          AND i.interaction_type = 'like'
      ), 0) as "likes",
      
      -- Vérifier si l'utilisateur a liké cette région
      ${
        userId
          ? `
      EXISTS(
        SELECT 1
        FROM interactions i
        WHERE i.entity_type = 'region'
          AND i.entity_id = r.id
          AND i.interaction_type = 'like'
          AND i.user_id = $2
      ) as "isMyFavorite"
      `
          : 'FALSE as "isMyFavorite"'
      },
      
      -- Infos du coach
      c.id as "coachId",
      c.first_name as "coachFirstName",
      c.last_name as "coachLastName",
      c.profile_image as "coachProfileImage"
      
    FROM regions r
    LEFT JOIN coaches c ON r.id = c.region_id AND c.is_active = TRUE
    WHERE r.id = $1
  `;

  const params = userId ? [regionId, userId] : [regionId];
  const result = await query(sql, params);
  return result[0] || null;
}

async function getRegionFighters(regionId: number) {
  const sql = `
    SELECT 
      f.id,
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.profile_image as "profileImage"
    FROM fighters f
    WHERE f.region_id = $1
    ORDER BY f.nickname ASC
  `;

  return await query(sql, [regionId]);
}

export async function getRegionMatches(regionId: number, editionId?: number) {
  try {
    // Récupérer tous les matchs de la région
    const matches = await getAllMatchesForRegion(regionId, editionId);

    // Grouper par statut
    const liveMatches = matches.filter((m) =>
      ["live", "round_break", "reclamation"].includes(m.status),
    );
    const scheduledMatches = matches.filter((m) => m.status === "scheduled");
    const completedMatches = matches.filter((m) => m.status === "completed");
    const otherMatches = matches.filter(
      (m) => !["live", "round_break", "reclamation"].includes(m.status),
    );

    // Grouper par année d'édition (utilisation des champs directs)
    const matchesByEdition: Record<string, any> = {};
    matches.forEach((match) => {
      // ✅ Correction : plus de match.context, on utilise match.editionYear et match.editionTheme
      const editionKey = `${match.editionYear} - ${match.editionTheme}`;
      if (!matchesByEdition[editionKey]) {
        matchesByEdition[editionKey] = {
          edition: {
            id: match.editionId,
            year: match.editionYear,
            theme: match.editionTheme,
          },
          matches: [],
        };
      }
      matchesByEdition[editionKey].matches.push(match);
    });

    return {
      success: true,
      data: {
        matches: {
          all: matches,
        },
        summary: {
          total: matches.length,
          live: liveMatches.length,
          scheduled: scheduledMatches.length,
          completed: completedMatches.length,
          other: otherMatches.length,
          wins: matches.filter((m) => m.result?.winnerId === regionId).length,
          losses: matches.filter((m) => m.result?.loserId === regionId).length,
        },
      },
      message: "Matchs de la région récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getRegionMatches:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des matchs de la région",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

async function getAllMatchesForRegion(regionId: number, editionId?: number) {
  let whereClause = "(f1.region_id = $1 OR f2.region_id = $1)";
  const params: any[] = [regionId];
  let paramIndex = 2;

  if (editionId) {
    whereClause += " AND p.edition_id = $" + paramIndex;
    params.push(editionId);
    paramIndex++;
  }

  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time2 as "startTime",
      m.status,
      m.match_result as "matchResult",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
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
      f2.region_id as "fighter2RegionId",
      r2.name as "fighter2RegionName",
      m.fighter2_initial_state as "fighter2InitialState",
      
      -- Contexte (uniquement les IDs nécessaires)
      sg.id as "subGroupId",
      sg.name as "subGroupName",
      ce.id as "editionId",
      ce.theme as "editionTheme",
      ce.year as "editionYear"

    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN competition_editions ce ON p.edition_id = ce.id
    WHERE ${whereClause}
    ORDER BY 
      CASE 
        WHEN m.status IN ('live', 'round_break') THEN 0
        WHEN m.status = 'scheduled' THEN 1
        WHEN m.status = 'completed' THEN 2
        ELSE 3
      END,
      m.match_date DESC,
      m.start_time2 DESC
    LIMIT 50
  `;

  const matches = await query(sql, params);
  const enrichedMatches = [];
  for (const match of matches) {
    const enriched = await enrichRegionMatchData(match, regionId);
    enrichedMatches.push(enriched);
  }
  return enrichedMatches;
}

async function enrichRegionMatchData(match: any, regionId: number) {
  const cards = await getCardsForMatch(match.id);
  const formattedDuration = formatDuration(match.totalDuration);
  const formattedStartTime = formatDateTime(match.matchDate, match.startTime);

  const fighter1 = {
    id: match.fighter1Id,
    firstName: match.fighter1FirstName,
    lastName: match.fighter1LastName,
    nickname: match.fighter1Nickname,
    profileImage: match.fighter1ProfileImage,
    regionName: match.fighter1RegionName,
    initialState: match.fighter1InitialState,
    cards: cards.filter((card: any) => card.fighterId === match.fighter1Id),
  };

  const fighter2 = {
    id: match.fighter2Id,
    firstName: match.fighter2FirstName,
    lastName: match.fighter2LastName,
    nickname: match.fighter2Nickname,
    profileImage: match.fighter2ProfileImage,
    regionName: match.fighter2RegionName,
    initialState: match.fighter2InitialState,
    cards: cards.filter((card: any) => card.fighterId === match.fighter2Id),
  };

  const isRegionInvolved =
    match.fighter1RegionId === regionId || match.fighter2RegionId === regionId;
  const isRegionWinner =
    match.winnerFighterId &&
    ((match.fighter1RegionId === regionId &&
      match.winnerFighterId === match.fighter1Id) ||
      (match.fighter2RegionId === regionId &&
        match.winnerFighterId === match.fighter2Id));

  let winner = null;
  let loser = null;
  let resultType = match.matchResult;

  if (match.winnerFighterId) {
    winner = match.winnerFighterId === match.fighter1Id ? fighter1 : fighter2;
    loser = match.winnerFighterId === match.fighter1Id ? fighter2 : fighter1;
  }

  // ✅ Retour simplifié – plus d'objet "context"
  const enrichedMatch = {
    id: match.id,
    matchNumber: match.matchNumber,
    matchDate: match.matchDate,
    startTime: formattedStartTime,
    status: match.status,
    matchResult: resultType,
    totalDuration: formattedDuration,
    breakCount: match.breakCount,
    videoUrl: match.videoUrl,
    liveStreamUrl: match.liveStreamUrl,
    notes: match.notes,
    subGroupId: match.subGroupId,
    editionId: match.editionId,
    editionTheme: match.editionTheme,
    editionYear: match.editionYear,

    fighters: { fighter1, fighter2 },

    result: winner
      ? { loserId: match.loserFighterId, winnerId: match.winnerFighterId }
      : null,

    allCards: cards,
  };

  return enrichedMatch;
}

async function getRegionTransfers(regionId: number) {
  const sql = `
    SELECT 
      ft.id,
      ft.fighter_id as "fighterId",
      f.nickname as "fighterNickname",
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.profile_image as "fighterProfileImage",
      ft.from_region_id as "fromRegionId",
      r1.name as "fromRegionName",
      r1.flag_image as "fromRegionFlagImage",
      r1.code as "fromRegionCode",
      ft.to_region_id as "toRegionId",
      r2.name as "toRegionName",
      r2.flag_image as "toRegionFlagImage",
      r2.code as "toRegionCode",
      ft.transfer_date as "transferDate",
      ft.created_at as "createdAt"
    FROM fighter_transfers ft
    JOIN fighters f ON ft.fighter_id = f.id
    JOIN regions r1 ON ft.from_region_id = r1.id
    JOIN regions r2 ON ft.to_region_id = r2.id
    WHERE ft.from_region_id = $1 OR ft.to_region_id = $1
    ORDER BY ft.transfer_date DESC
  `;

  return await query(sql, [regionId]);
}

async function getRegionAchievements(regionId: number) {
  const sql = `
    SELECT 
      fa.id,
      fa.fighter_id as "fighterId",
      f.nickname as "fighterNickname",
      fa.edition_id as "editionId",
      e.theme as "editionTheme",
      e.year as "editionYear",
      fa.position,
      fa.title,
      fa.description,
      fa.created_at as "createdAt"
    FROM fighter_achievements fa
    JOIN fighters f ON fa.fighter_id = f.id
    JOIN competition_editions e ON fa.edition_id = e.id
    WHERE f.region_id = $1
    ORDER BY 
      CASE fa.position
        WHEN '1st' THEN 1
        WHEN '2nd' THEN 2
        WHEN '3rd' THEN 3
        WHEN 'finalist' THEN 4
        WHEN 'semifinalist' THEN 5
        WHEN 'quarterfinalist' THEN 6
        ELSE 7
      END,
      e.year DESC
  `;

  return await query(sql, [regionId]);
}

function organizeMatches(matches: any[]) {
  const liveMatches = matches.filter((m) =>
    ["live", "round_break", "reclamation"].includes(m.status),
  );
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const completedMatches = matches.filter((m) => m.status === "completed");

  // Grouper par édition (en utilisant les champs directs)
  const matchesByEdition: Record<string, any> = {};
  matches.forEach((match) => {
    // ✅ Utiliser match.editionYear et match.editionTheme au lieu de match.context
    const editionKey = `${match.editionYear} - ${match.editionTheme}`;
    if (!matchesByEdition[editionKey]) {
      matchesByEdition[editionKey] = {
        edition: {
          id: match.editionId,
          year: match.editionYear,
          theme: match.editionTheme,
        },
        matches: [],
      };
    }
    matchesByEdition[editionKey].matches.push(match);
  });

  return {
    live: liveMatches,
    scheduled: scheduledMatches,
    completed: completedMatches,
    byEdition: Object.values(matchesByEdition),
  };
}

function organizeAchievements(achievements: any[]) {
  // Grouper par compétition/édition
  const byCompetition: Record<string, any> = {};
  achievements.forEach((achievement) => {
    const key = `${achievement.editionTheme} ${achievement.editionYear}`;
    if (!byCompetition[key]) {
      byCompetition[key] = {
        edition: {
          theme: achievement.editionTheme,
          year: achievement.editionYear,
        },
        achievements: [],
      };
    }
    byCompetition[key].achievements.push(achievement);
  });

  return {
    all: achievements,
    byCompetition: Object.values(byCompetition),
  };
}

function calculateRegionStats(
  fighters: any[],
  matches: any[],
  achievements: any[],
) {
  const totalMatches = matches.length;
  const wins = matches.filter((match) => {
    // Correction: utiliser le résultat du match
    if (!match.result) return false;
    // Vérifier si le vainqueur est de cette région
    return fighters.some((fighter) => fighter.id === match.result?.winner?.id);
  }).length;

  const losses = totalMatches - wins;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100 * 10) / 10 : 0;

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    totalFighters: fighters.length,
    champions: fighters.filter((f) => f.isChampion).length,
    totalAchievements: achievements.length,
  };
}
