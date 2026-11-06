// actions/mobile/fighters.ts
"use server";

import { query } from "@/lib/db/neon-client";
import { getParticipatedEditions } from "./editions";
import { formatDateTime, formatDuration } from "@/utils/duration";
import { enrichMatchData, getCardsForMatches } from "@/utils/match-utils";
import { generateAchievementDescription } from "@/lib/achievements";

export async function getMobileFighters(filters?: {
  page?: number;
  limit?: number;
  userId?: number; // Pour vérifier les favoris
  search?: string;
  sortOrder?: "asc" | "desc";
  regionId?: number;
  isChampion?: boolean;
  isActive?: boolean;
  achievementFilter?: "champion" | "finalist" | "medalist" | "all";
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const userId = filters?.userId;
    const search = filters?.search;
    const sortOrder = filters?.sortOrder || "asc";
    const regionId = filters?.regionId;
    const isChampion = filters?.isChampion;
    const isActive = filters?.isActive ?? true; // default true
    const achievementFilter = filters?.achievementFilter;

    // Build dynamic WHERE clauses
    const whereConditions: string[] = [];
    const countWhereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Base active filter
    if (isActive !== undefined) {
      whereConditions.push(`f.is_active = $${paramIndex}`);
      countWhereConditions.push(`f.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereConditions.push(
        `(f.first_name ILIKE $${paramIndex} OR f.last_name ILIKE $${paramIndex} OR f.nickname ILIKE $${paramIndex})`,
      );
      countWhereConditions.push(
        `(f.first_name ILIKE $${paramIndex} OR f.last_name ILIKE $${paramIndex} OR f.nickname ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Region filter
    if (regionId !== undefined) {
      whereConditions.push(`f.region_id = $${paramIndex}`);
      countWhereConditions.push(`f.region_id = $${paramIndex}`);
      params.push(regionId);
      paramIndex++;
    }

    // Champion filter
    if (isChampion !== undefined) {
      whereConditions.push(`f.is_champion = $${paramIndex}`);
      countWhereConditions.push(`f.is_champion = $${paramIndex}`);
      params.push(isChampion);
      paramIndex++;
    }

    // Achievement filter
    if (achievementFilter && achievementFilter !== "all") {
      let achievementCondition = "";
      if (achievementFilter === "champion") {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position = '1st'
        )`;
      } else if (achievementFilter === "finalist") {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position IN ('1st', '2nd')
        )`;
      } else if (achievementFilter === "medalist") {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position IN ('1st', '2nd', '3rd')
        )`;
      }
      whereConditions.push(achievementCondition);
      countWhereConditions.push(achievementCondition);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";
    const countWhereClause =
      countWhereConditions.length > 0
        ? `WHERE ${countWhereConditions.join(" AND ")}`
        : "";

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighters f
      ${countWhereClause}
    `;

    // Count total / page / global stats sont indépendants : une seule vague.
    const countPromise = query(countSql, params.slice(0, paramIndex - 1));

    // Determine ORDER BY
    let orderBy = "";
    if (sortOrder === "asc") {
      orderBy = "f.ranking ASC, f.last_name ASC, f.first_name ASC";
    } else {
      orderBy = "f.ranking DESC, f.last_name DESC, f.first_name DESC";
    }

    // Main query with likes and favorites
    const sql = `
      SELECT 
        f.id,
        f.first_name as "firstName",
        f.last_name as "lastName",
        f.nickname,
        f.birth_date as "birthDate",
        f.birth_place as "birthPlace",
        f.region_id as "regionId",
        f.height,
        f.weight,
        f.profile_image as "profileImage",
        f.debut_year as "debutYear",
        f.is_active as "isActive",
        f.is_champion as "isChampion",        
        r.name as "regionName",
        r.flag_image as "regionFlagImage",
        
        -- Count likes
        COALESCE((
          SELECT COUNT(*)
          FROM interactions i
          WHERE i.entity_type = 'fighter'
            AND i.entity_id = f.id
            AND i.interaction_type = 'like'
        ), 0) as "likes"
        
      FROM fighters f
      LEFT JOIN regions r ON f.region_id = r.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = userId
      ? [...params, userId, limit, offset]
      : [...params, limit, offset];

    // Calculate global stats
    const statsSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN is_champion = true THEN 1 ELSE 0 END) as champions,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) as averageAge
      FROM fighters
      WHERE birth_date IS NOT NULL
    `;

    const [countResult, fighters, statsResult] = await Promise.all([
      countPromise,
      query(sql, queryParams),
      query(statsSql),
    ]);

    const total = parseInt(countResult[0]?.total || "0");

    const fightersWithDecodedSocialLinks = fighters.map((fighter) => ({
      ...fighter,
    }));

    const stats = {
      total: parseInt(statsResult[0]?.total || "0"),
      actifs: parseInt(statsResult[0]?.actifs || "0"),
      champions: parseInt(statsResult[0]?.champions || "0"),
      ageMoyen: parseFloat(statsResult[0]?.averageAge || "0").toFixed(1),
    };

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        fighters: fightersWithDecodedSocialLinks,
        count: fighters.length,
        total: total,
        stats,
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
      message: "Lutteurs récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileFighters:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des lutteurs",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function getMobileFighterById(fighterId: number, userId?: number) {
  try {
    // Récupérer les informations de base du lutteur (sert aussi d'existence check)
    const fighterInfo = await getFighterInfo(fighterId, userId);

    if (!fighterInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Lutteur non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Les données associées sont indépendantes : une seule vague de requêtes.
    const [achievements, transfers, cards, region, stats, editions] =
      await Promise.all([
        getFighterAchievements(fighterId),
        getFighterTransfers(fighterId),
        getFighterCards(fighterId),
        getFighterRegion(fighterInfo.regionId),
        calculateFighterStats(fighterId),
        getParticipatedEditions(fighterId, "fighter"),
      ]);

    return {
      success: true,
      data: {
        fighter: {
          ...fighterInfo,
          region: region,
          stats: stats,
          achievements: achievements,
          transfers: transfers,
          cards: cards,
          editions: editions,
        },
      },
      message: "Détails du lutteur récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileFighterById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des détails du lutteur",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Fonctions auxiliaires
async function getFighterInfo(fighterId: number, userId?: number) {
  const sql = `
    SELECT 
      f.id,
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.birth_date as "birthDate",
      f.birth_place as "birthPlace",
      f.region_id as "regionId",
      f.height,
      f.weight,
      f.profile_image as "profileImage",
      f.debut_year as "debutYear",
      f.is_active as "isActive",
      f.is_champion as "isChampion",
      
      r.name as "regionName",
      r.flag_image as "regionFlagImage",
      
      -- Compter le nombre de likes
      COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'fighter'
          AND i.entity_id = f.id
          AND i.interaction_type = 'like'
      ), 0) as "likes"
      
    FROM fighters f
    LEFT JOIN regions r ON f.region_id = r.id
    WHERE f.id = $1 AND f.is_active = true
  `;

  const result = await query(sql, [fighterId]);
  const fighter = result[0];

  return fighter;
}

// Les autres fonctions restent inchangées...
async function getFighterRegion(regionId: number) {
  if (!regionId) return {};

  const sql = `
    SELECT 
      id, name, flag_image as "flagImage"
    FROM regions 
    WHERE id = $1
  `;

  const result = await query(sql, [regionId]);
  return result[0] || {};
}

async function getFighterAchievements(fighterId: number) {
  const sql = `
    SELECT 
      fa.title,
      fa.position,
      fa.type,
      fa.description,
      fa.medal_image as "medalImage",
      
      ce.theme as "editionTheme",
      ce.year as "editionYear",
      ce.edition_number as "editionNumber",
      
      c.name as "competitionName",
      
      r.name as "regionName",
      r.flag_image as "regionFlagImage",
      r.stadium_name as "stadiumName",
      
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.nickname as "fighterNickname"
      
    FROM fighter_achievements fa
    JOIN competition_editions ce ON fa.edition_id = ce.id
    LEFT JOIN competitions c ON ce.competition_id = c.id
    JOIN regions r ON fa.region_id = r.id
    JOIN fighters f ON fa.fighter_id = f.id
    WHERE fa.fighter_id = $1
    ORDER BY fa.year DESC, 
      CASE fa.position 
        WHEN '1st' THEN 1
        WHEN '2nd' THEN 2
        WHEN '3rd' THEN 3
        WHEN 'finalist' THEN 4
        WHEN 'semifinalist' THEN 5
        WHEN 'quarterfinalist' THEN 6
        ELSE 7
      END
  `;

  const achievements = await query(sql, [fighterId]);
  
  // Add dynamic description and return only necessary fields
  return achievements.map(achievement => {
    const dynamic_description = generateAchievementDescription({
      fighter: {
        first_name: achievement.fighterFirstName,
        last_name: achievement.fighterLastName,
        nickname: achievement.fighterNickname,
      } as any,
      region: {
        name: achievement.regionName,
      } as any,
      edition: {
        year: achievement.editionYear,
        edition_number: achievement.editionNumber,
        stadium_name: achievement.stadiumName,
        competition: {
          name: achievement.competitionName,
        },
      } as any,
      year: achievement.editionYear,
      position: achievement.position,
      type: achievement.type,
      title: achievement.title,
    });
    
    return {
      // title: achievement.title,
      position: achievement.position,
      // type: achievement.type,
      // description: achievement.description,
      // medalImage: achievement.medalImage,
      // editionTheme: achievement.editionTheme,
      // editionYear: achievement.editionYear,
      // competitionName: achievement.competitionName,
      // regionName: achievement.regionName,
      // regionFlagImage: achievement.regionFlagImage,
      // stadiumName: achievement.stadiumName,
      // fighterFirstName: achievement.fighterFirstName,
      // fighterLastName: achievement.fighterLastName,
      // fighterNickname: achievement.fighterNickname,
      description: dynamic_description,
      // dynamic_description,
    };
  });
}

async function getFighterTransfers(fighterId: number) {
  const sql = `
    SELECT 
      ft.id,
      ft.transfer_date as "transferDate",
      ft.transfer_reason as "transferReason",
      ft.transfer_fee as "transferFee",
      ft.contract_duration as "contractDuration",
      ft.is_permanent as "isPermanent",
      ft.status,
      ft.created_at as "createdAt",
      
      fr.id as "fromRegionId",
      fr.name as "fromRegionName",
      fr.code as "fromRegionCode",
      fr.flag_image as "fromRegionFlagImage",
      
      tr.id as "toRegionId",
      tr.name as "toRegionName",
      tr.code as "toRegionCode",
      tr.flag_image as "toRegionFlagImage"
      
    FROM fighter_transfers ft
    JOIN regions fr ON ft.from_region_id = fr.id
    JOIN regions tr ON ft.to_region_id = tr.id
    WHERE ft.fighter_id = $1
    ORDER BY ft.transfer_date DESC
  `;

  return await query(sql, [fighterId]);
}

async function getFighterCards(fighterId: number) {
  const sql = `
    SELECT 
      fc.id,
      fc.match_id as "matchId",
      fc.card_type as "cardType",
      fc.minute_given as "minuteGiven",
      fc.created_at as "createdAt",
      
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      
      CASE 
        WHEN m.fighter1_id = $1 THEN f2.id
        ELSE f1.id
      END as "opponentId",
      CASE 
        WHEN m.fighter1_id = $1 THEN f2.nickname
        ELSE f1.nickname
      END as "opponentNickname"
      
    FROM fighter_cards fc
    JOIN matches m ON fc.match_id = m.id
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    WHERE fc.fighter_id = $1
    ORDER BY m.match_date DESC, fc.minute_given
  `;

  return await query(sql, [fighterId]);
}

// Remplacer la fonction getAllMatchesForFighter
async function getAllMatchesForFighter(
  fighterId: number,
  editionId?: number,
  limit: number = 20,
  offset: number = 0,
) {
  let whereClause = "(m.fighter1_id = $1 OR m.fighter2_id = $1)";
  const params: any[] = [fighterId];
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
      m.created_at as "createdAt",
      m.updated_at as "updatedAt",
      m.sub_group_id as "subGroupId",

      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      f1.region_id as "fighter1RegionId",
      r1.name as "fighter1RegionName",
      r1.color as "fighter1RegionColor",
      r1.code as "fighter1RegionCode",
      m.fighter1_initial_state as "fighter1InitialState",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      f2.region_id as "fighter2RegionId",
      r2.name as "fighter2RegionName",
      r2.color as "fighter2RegionColor",
      r2.code as "fighter2RegionCode",
      m.fighter2_initial_state as "fighter2InitialState",
      
      -- Résultats
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Contexte
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
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);
  const matches = await query(sql, params);

  // UNE seule requête cartons pour toute la page.
  const cardsByMatch = await getCardsForMatches(
    matches.map((match: any) => Number(match.id)),
  );
  return Promise.all(
    matches.map((match: any) => enrichMatchData(match, cardsByMatch)),
  );
}

async function calculateFighterStats(fighterId: number) {
  // UNE seule requête : matchs, cartons et temps de combat.
  const statsSql = `
    SELECT 
      COUNT(*) as "totalMatches",
      COALESCE(SUM(CASE WHEN winner_fighter_id = $1 THEN 1 ELSE 0 END), 0) as "wins",
      COALESCE(SUM(CASE WHEN winner_fighter_id != $1 AND winner_fighter_id IS NOT NULL THEN 1 ELSE 0 END), 0) as "losses",
      COALESCE(SUM(EXTRACT(EPOCH FROM total_duration)) FILTER (WHERE total_duration IS NOT NULL), 0) as "totalSeconds",
      (
        SELECT COUNT(*) FROM fighter_cards fc
        WHERE fc.fighter_id = $1 AND fc.is_cancelled = FALSE
      ) as "totalCards",
      (
        SELECT COALESCE(SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END), 0)
        FROM fighter_cards fc
        WHERE fc.fighter_id = $1 AND fc.is_cancelled = FALSE
      ) as "yellowCards"
    FROM matches 
    WHERE (fighter1_id = $1 OR fighter2_id = $1) 
    AND status = 'completed'
  `;

  const statsResult = await query(statsSql, [fighterId]);
  const matchStats = statsResult[0] || {};

  const totalSeconds = parseInt(matchStats.totalSeconds || "0");

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Calculer le ratio de victoires
  const totalMatches = parseInt(matchStats.totalMatches || "0");
  const wins = parseInt(matchStats.wins || "0");
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  return {
    totalMatches: totalMatches,
    wins: wins,
    losses: parseInt(matchStats.losses || "0"),
    winRate: Math.round(winRate * 10) / 10,
    yellowCards: parseInt(matchStats.yellowCards || "0"),
    totalCards: parseInt(matchStats.totalCards || "0"),
    totalFightTime: {
      hours: hours,
      minutes: minutes,
      totalMinutes: totalMinutes,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    },
    averageFightTime:
      totalMatches > 0
        ? {
            minutes: Math.round(totalMinutes / totalMatches),
            formatted: `${Math.round(totalMinutes / totalMatches)}m`,
          }
        : { minutes: 0, formatted: "0m" },
  };
}

export async function getMobileFighterMatches(
  fighterId: number,
  editionId?: number,
  filters?: { page?: number; limit?: number; all?: boolean },
) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const all = filters?.all || false;

    // Existence du lutteur et éditions participantes sont indépendantes :
    // une seule vague.
    const needsEditions = !editionId && !all;
    const [existsResult, participatedEditions] = await Promise.all([
      query("SELECT id FROM fighters WHERE id = $1 AND is_active = true", [
        fighterId,
      ]),
      needsEditions
        ? getParticipatedEditions(fighterId, "fighter")
        : Promise.resolve([] as any[]),
    ]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Lutteur non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Déterminer l'édition à utiliser
    let finalEditionId = editionId;
    if (needsEditions && participatedEditions.length > 0) {
      finalEditionId = participatedEditions[0].id;
    }

    // Un seul GROUP BY status fournit le total et le résumé.
    let countWhereClause = "(m.fighter1_id = $1 OR m.fighter2_id = $1)";
    const countParams: any[] = [fighterId];
    let paramIndex = 2;
    if (finalEditionId) {
      countWhereClause += ` AND p.edition_id = $${paramIndex}`;
      countParams.push(finalEditionId);
      paramIndex++;
    }

    const statsSql = `
      SELECT m.status, COUNT(*) as count 
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE ${countWhereClause}
      GROUP BY m.status
    `;

    // Stats et page de matchs sont indépendantes : une seule vague.
    const [statsResult, matches] = await Promise.all([
      query<{ status: string; count: string }>(statsSql, countParams),
      getAllMatchesForFighter(fighterId, finalEditionId, limit, offset),
    ]);

    const stats: Record<string, number> = {};
    let total = 0;
    statsResult.forEach((row) => {
      const count = parseInt(row.count);
      stats[row.status] = count;
      total += count;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        matches: {
          all: matches,
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
          total: total,
          live: (stats["live"] || 0) + (stats["round_break"] || 0) + (stats["reclamation"] || 0),
          scheduled: stats["scheduled"] || 0,
          completed: stats["completed"] || 0,
          cancelled: stats["cancelled"] || 0,
          postponed: stats["postponed"] || 0,
          reclamation: stats["reclamation"] || 0,
          wins: matches.filter((m: any) => m.result?.winnerId === fighterId).length,
          losses: matches.filter((m: any) => m.result?.loserId === fighterId).length,
        },
      },
      message: "Matchs du lutteur récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileFighterMatches:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des matchs du lutteur",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
