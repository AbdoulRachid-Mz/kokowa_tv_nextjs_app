'use server';

import { query } from '@/lib/db/neon-client';
import { getParticipatedEditions } from './editions';
import { formatDateTime, formatDuration } from '@/utils/duration';

export async function getMobileFighters(filters?: {
  page?: number;
  limit?: number;
  userId?: number; // Pour vérifier les favoris
  search?: string;
  sortOrder?: 'asc' | 'desc';
  regionId?: number;
  isChampion?: boolean;
  isActive?: boolean;
  achievementFilter?: 'champion' | 'finalist' | 'medalist' | 'all';
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const userId = filters?.userId;
    const search = filters?.search;
    const sortOrder = filters?.sortOrder || 'asc';
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
        `(f.first_name ILIKE $${paramIndex} OR f.last_name ILIKE $${paramIndex} OR f.nickname ILIKE $${paramIndex})`
      );
      countWhereConditions.push(
        `(f.first_name ILIKE $${paramIndex} OR f.last_name ILIKE $${paramIndex} OR f.nickname ILIKE $${paramIndex})`
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
    if (achievementFilter && achievementFilter !== 'all') {
      let achievementCondition = '';
      if (achievementFilter === 'champion') {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position = '1st'
        )`;
      } else if (achievementFilter === 'finalist') {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position IN ('1st', '2nd')
        )`;
      } else if (achievementFilter === 'medalist') {
        achievementCondition = `EXISTS (
          SELECT 1 FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id AND fa.position IN ('1st', '2nd', '3rd')
        )`;
      }
      whereConditions.push(achievementCondition);
      countWhereConditions.push(achievementCondition);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const countWhereClause = countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(' AND ')}` : '';

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighters f
      ${countWhereClause}
    `;

    const countResult = await query(countSql, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult[0]?.total || '0');

    // Determine ORDER BY
    let orderBy = '';
    if (sortOrder === 'asc') {
      orderBy = 'f.ranking ASC, f.last_name ASC, f.first_name ASC';
    } else {
      orderBy = 'f.ranking DESC, f.last_name DESC, f.first_name DESC';
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

    const queryParams = userId ? [...params, userId, limit, offset] : [...params, limit, offset];
    const fighters = await query(sql, queryParams);

    const fightersWithDecodedSocialLinks = fighters.map(fighter => ({
      ...fighter,
    }));

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        fighters: fightersWithDecodedSocialLinks,
        count: fighters.length,
        total: total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString()
      },
      message: 'Lutteurs récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileFighters:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des lutteurs',
        timestamp: new Date().toISOString()
      }
    };
  }
}


export async function getMobileFighterById(fighterId: number, userId?: number) {
  try {
    // Vérifier que le lutteur existe
    const existsSql = "SELECT id FROM fighters WHERE id = $1 AND is_active = true";
    const existsResult = await query(existsSql, [fighterId]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Lutteur non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer les informations de base du lutteur avec likes et favoris
    const fighterInfo = await getFighterInfo(fighterId, userId);

    // Récupérer les données associées
    const achievements = await getFighterAchievements(fighterId);
    const transfers = await getFighterTransfers(fighterId);
    const cards = await getFighterCards(fighterId);
    const region = await getFighterRegion(fighterInfo.regionId);
    const stats = await calculateFighterStats(fighterId);
    // NOUVEAU: Récupérer les éditions auxquelles le lutteur a participé
    const editions = await getParticipatedEditions(fighterId, "fighter");

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
          editions: editions
        },
      },
      message: 'Détails du lutteur récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileFighterById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des détails du lutteur',
        timestamp: new Date().toISOString()
      }
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
      f.slug,
      f.birth_date as "birthDate",
      f.birth_place as "birthPlace",
      f.region_id as "regionId",
      f.height,
      f.weight,
      f.profile_image as "profileImage",
      f.cover_image as "coverImage",
      f.bio,
      f.fighting_style as "fightingStyle",
      f.debut_year as "debutYear",
      f.ranking,
      f.is_active as "isActive",
      f.is_champion as "isChampion",
      f.social_links as "socialLinks",
      f.created_at as "createdAt",
      f.updated_at as "updatedAt",
      
      r.name as "regionName",
      r.code as "regionCode",
      r.color as "regionColor",
      r.flag_image as "regionFlagImage",
      
      -- Compter le nombre de likes
      COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'fighter'
          AND i.entity_id = f.id
          AND i.interaction_type = 'like'
      ), 0) as "likes",
      
      -- Vérifier si l'utilisateur a liké ce lutteur
      ${userId ? `
      EXISTS(
        SELECT 1
        FROM interactions i
        WHERE i.entity_type = 'fighter'
          AND i.entity_id = f.id
          AND i.interaction_type = 'like'
          AND i.user_id = $2
      ) as "isMyFavorite"
      ` : 'FALSE as "isMyFavorite"'}
      
    FROM fighters f
    LEFT JOIN regions r ON f.region_id = r.id
    WHERE f.id = $1
  `;

  const params = userId ? [fighterId, userId] : [fighterId];
  const result = await query(sql, params);
  const fighter = result[0];

  if (!fighter.socialLinks) {
    fighter.socialLinks = [];
  }

  return fighter;
}


// Les autres fonctions restent inchangées...
async function getFighterRegion(regionId: number) {
  if (!regionId) return {};

  const sql = `
    SELECT 
      id, name, code, color, flag_image as "flagImage",
      stadium_name as "stadiumName", stadium_image as "stadiumImage",
      total_fighters as "totalFighters", total_champions as "totalChampions"
    FROM regions 
    WHERE id = $1
  `;

  const result = await query(sql, [regionId]);
  return result[0] || {};
}

async function getFighterAchievements(fighterId: number) {
  const sql = `
    SELECT 
      fa.id,
      fa.title,
      fa.year,
      fa.position,
      fa.description,
      fa.medal_image as "medalImage",
      fa.created_at as "createdAt",
      
      ce.id as "editionId",
      ce.theme as "editionTheme",
      ce.year as "editionYear",
      
      r.id as "regionId",
      r.name as "regionName",
      r.code as "regionCode"
      
    FROM fighter_achievements fa
    JOIN competition_editions ce ON fa.edition_id = ce.id
    JOIN regions r ON fa.region_id = r.id
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

  return await query(sql, [fighterId]);
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
      fc.card_reason as "cardReason",
      fc.minute_given as "minuteGiven",
      fc.is_cancelled as "isCancelled",
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
    WHERE fc.fighter_id = $1 AND fc.is_cancelled = FALSE
    ORDER BY m.match_date DESC, fc.minute_given
  `;

  return await query(sql, [fighterId]);
}

async function getAllMatchesForFighter(fighterId: number, editionId?: number) {
  let whereClause = "(m.fighter1_id = $1 OR m.fighter2_id = $1)";
  const params: any[] = [fighterId];

  // Ajouter le filtre par édition si fourni
  if (editionId) {
    whereClause += " AND p.edition_id = $2";
    params.push(editionId);
  } else {
    // Sinon, récupérer la dernière édition
    whereClause += ` AND p.edition_id = (
      SELECT id 
      FROM competition_editions 
      ORDER BY year DESC, id DESC 
      LIMIT 1
    )`;
  }

  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time as "startTime",
      m.start_time2 as "startTime2",
      m.end_time as "endTime",
      m.status,
      m.match_result as "matchResult",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.audience_count as "audienceCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      m.created_at as "createdAt",
      m.updated_at as "updatedAt",

      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      f1.birth_date as "fighter1BirthDate",
      f1.height as "fighter1Height",
      f1.weight as "fighter1Weight",
      f1.fighting_style as "fighter1Style",
      f1.ranking as "fighter1Ranking",
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
      f2.birth_date as "fighter2BirthDate",
      f2.height as "fighter2Height",
      f2.weight as "fighter2Weight",
      f2.fighting_style as "fighter2Style",
      f2.ranking as "fighter2Ranking",
      f2.region_id as "fighter2RegionId",
      r2.name as "fighter2RegionName",
      r2.color as "fighter2RegionColor",
      r2.code as "fighter2RegionCode",
      m.fighter2_initial_state as "fighter2InitialState",
      
      -- Résultats
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Contexte du match
      sg.id as "subGroupId",
      sg.name as "subGroupName",
      
      pg.id as "groupId",
      pg.name as "groupName",
      
      p.id as "phaseId",
      p.name as "phaseName",
      p.phase_type as "phaseType",
      
      ce.id as "editionId",
      ce.theme as "editionTheme",
      ce.year as "editionYear",
      ce.competition_id as "competitionId",
      c.name as "competitionName"

    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN competition_editions ce ON p.edition_id = ce.id
    JOIN competitions c ON ce.competition_id = c.id
    WHERE ${whereClause}
    ORDER BY 
      CASE 
        WHEN m.status IN ('live', 'round_break') THEN 0
        WHEN m.status = 'scheduled' THEN 1
        WHEN m.status = 'completed' THEN 2
        ELSE 3
      END,
      m.match_date DESC,
      m.start_time DESC,
      m.start_time2 DESC
  `;

  const matches = await query(sql, params);

  // Enrichir les données des matchs
  return Promise.all(matches.map(match => enrichMatchData(match)));
}

async function enrichMatchData(match: any) {
  // Récupérer les cartons pour ce match
  const cards = await getCardsForMatch(match.id);

  // Formater les durées et heures
  const formattedDuration = formatDuration(match.totalDuration);
  const formattedStartTime = formatDateTime(match.matchDate, match.startTime);
  const formattedEndTime = formatDateTime(match.matchDate, match.endTime);

  // Formater les données des lutteurs
  const fighter1 = {
    id: match.fighter1Id,
    firstName: match.fighter1FirstName,
    lastName: match.fighter1LastName,
    nickname: match.fighter1Nickname,
    profileImage: match.fighter1ProfileImage,
    birthDate: match.fighter1BirthDate,
    height: match.fighter1Height,
    weight: match.fighter1Weight,
    fightingStyle: match.fighter1Style,
    ranking: match.fighter1Ranking,
    region: {
      id: match.fighter1RegionId,
      name: match.fighter1RegionName,
      color: match.fighter1RegionColor,
      code: match.fighter1RegionCode,
    },
    initialState: match.fighter1InitialState,
    cards: cards.filter((card: any) => card.fighterId === match.fighter1Id),
  };

  const fighter2 = {
    id: match.fighter2Id,
    firstName: match.fighter2FirstName,
    lastName: match.fighter2LastName,
    nickname: match.fighter2Nickname,
    profileImage: match.fighter2ProfileImage,
    birthDate: match.fighter2BirthDate,
    height: match.fighter2Height,
    weight: match.fighter2Weight,
    fightingStyle: match.fighter2Style,
    ranking: match.fighter2Ranking,
    region: {
      id: match.fighter2RegionId,
      name: match.fighter2RegionName,
      color: match.fighter2RegionColor,
      code: match.fighter2RegionCode,
    },
    initialState: match.fighter2InitialState,
    cards: cards.filter((card: any) => card.fighterId === match.fighter2Id),
  };

  // Déterminer le vainqueur et le perdant
  let winner = null;
  let loser = null;
  let resultType = match.matchResult;

  if (match.winnerFighterId) {
    winner = match.winnerFighterId === match.fighter1Id ? fighter1 : fighter2;
    loser = match.winnerFighterId === match.fighter1Id ? fighter2 : fighter1;
  }

  // Formater la réponse
  const enrichedMatch = {
    id: match.id,
    matchNumber: match.matchNumber,
    matchDate: match.matchDate,
    startTime: formattedStartTime,
    startTime2: match.startTime2, // NOUVEAU - timestamp ISO complet
    endTime: match.endTime,
    status: match.status,
    matchResult: resultType,
    totalDuration: formattedDuration,
    breakCount: match.breakCount,
    audienceCount: match.audienceCount,
    videoUrl: match.videoUrl,
    liveStreamUrl: match.liveStreamUrl,
    notes: match.notes,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,

    fighters: {
      fighter1,
      fighter2,
    },

    result: winner ? {
      winner,
      loser,
      resultType,
    } : null,

    context: {
      subGroup: {
        id: match.subGroupId,
        name: match.subGroupName,
      },
      group: {
        id: match.groupId,
        name: match.groupName,
      },
      phase: {
        id: match.phaseId,
        name: match.phaseName,
        type: match.phaseType,
      },
      edition: {
        id: match.editionId,
        theme: match.editionTheme,
        year: match.editionYear,
      },
      competition: {
        id: match.competitionId,
        name: match.competitionName,
      }
    },

    allCards: cards,
  };

  return enrichedMatch;
}


async function getCardsForMatch(matchId: number) {
  const sql = `
    SELECT 
      fc.id,
      fc.fighter_id as "fighterId",
      fc.card_type as "cardType",
      fc.card_reason as "cardReason",
      fc.minute_given as "minuteGiven",
      fc.is_cancelled as "isCancelled"
    FROM fighter_cards fc
    WHERE fc.match_id = $1 AND fc.is_cancelled = FALSE
    ORDER BY fc.minute_given
  `;

  return await query(sql, [matchId]);
}

async function calculateFighterStats(fighterId: number) {
  // Compter les matchs
  const matchesSql = `
    SELECT 
      COUNT(*) as "totalMatches",
      SUM(CASE WHEN winner_fighter_id = $1 THEN 1 ELSE 0 END) as "wins",
      SUM(CASE WHEN winner_fighter_id != $1 AND winner_fighter_id IS NOT NULL THEN 1 ELSE 0 END) as "losses"
    FROM matches 
    WHERE (fighter1_id = $1 OR fighter2_id = $1) 
    AND status = 'completed'
  `;

  const matchResult = await query(matchesSql, [fighterId]);
  const matchStats = matchResult[0];

  // Compter les cartons
  const cardsSql = `
    SELECT 
      COUNT(*) as "totalCards",
      SUM(CASE WHEN card_type = 'yellow' THEN 1 ELSE 0 END) as "yellowCards",
      SUM(CASE WHEN card_type = 'red' THEN 1 ELSE 0 END) as "redCards"
    FROM fighter_cards 
    WHERE fighter_id = $1 AND is_cancelled = FALSE
  `;

  const cardsResult = await query(cardsSql, [fighterId]);
  const cardStats = cardsResult[0];

  // Calculer le temps total de combat
  const timeSql = `
    SELECT SUM(EXTRACT(EPOCH FROM total_duration)) as "totalSeconds" 
    FROM matches 
    WHERE (fighter1_id = $1 OR fighter2_id = $1) 
    AND status = 'completed' AND total_duration IS NOT NULL
  `;

  const timeResult = await query(timeSql, [fighterId]);
  const totalSeconds = parseInt(timeResult[0]?.totalSeconds || '0');

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Calculer le ratio de victoires
  const totalMatches = parseInt(matchStats.totalMatches || '0');
  const wins = parseInt(matchStats.wins || '0');
  const winRate = totalMatches > 0 ? (wins / totalMatches * 100) : 0;

  return {
    totalMatches: totalMatches,
    wins: wins,
    losses: parseInt(matchStats.losses || '0'),
    winRate: Math.round(winRate * 10) / 10,
    yellowCards: parseInt(cardStats.yellowCards || '0'),
    redCards: parseInt(cardStats.redCards || '0'),
    totalCards: parseInt(cardStats.totalCards || '0'),
    totalFightTime: {
      hours: hours,
      minutes: minutes,
      totalMinutes: totalMinutes,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    },
    averageFightTime: totalMatches > 0 ? {
      minutes: Math.round(totalMinutes / totalMatches),
      formatted: `${Math.round(totalMinutes / totalMatches)}m`
    } : { minutes: 0, formatted: '0m' }
  };
}

export async function getMobileFighterMatches(fighterId: number, editionId?: number) {
  try {
    // Vérifier que le lutteur existe
    const existsSql = "SELECT id FROM fighters WHERE id = $1 AND is_active = true";
    const existsResult = await query(existsSql, [fighterId]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Lutteur non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer tous les matchs du lutteur
    const matches = await getAllMatchesForFighter(fighterId, editionId);

    // Grouper par statut
    const liveMatches = matches.filter(m => ['live', 'round_break'].includes(m.status));
    const scheduledMatches = matches.filter(m => m.status === 'scheduled');
    const completedMatches = matches.filter(m => m.status === 'completed');
    const otherMatches = matches.filter(m => !['live'].includes(m.status));

    // Grouper par année d'édition
    const matchesByEdition: Record<string, any> = {};
    matches.forEach(match => {
      const editionKey = `${match.context.edition.year} - ${match.context.edition.theme}`;
      if (!matchesByEdition[editionKey]) {
        matchesByEdition[editionKey] = {
          edition: match.context.edition,
          matches: []
        };
      }
      matchesByEdition[editionKey].matches.push(match);
    });

    return {
      success: true,
      data: {
        matches: {
          all: matches,
          grouped: {
            live: liveMatches,
            // scheduled: scheduledMatches,
            // completed: completedMatches,
            ...otherMatches,
            byEdition: Object.values(matchesByEdition)
          }
        },
        summary: {
          total: matches.length,
          live: liveMatches.length,
          scheduled: scheduledMatches.length,
          completed: completedMatches.length,
          other: otherMatches.length,
          wins: matches.filter(m => m.result?.winner?.id === fighterId).length,
          losses: matches.filter(m => m.result?.loser?.id === fighterId).length
        }
      },
      message: 'Matchs du lutteur récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileFighterMatches:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des matchs du lutteur',
        timestamp: new Date().toISOString()
      }
    };
  }
}