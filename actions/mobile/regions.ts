'use server';

import { query } from '@/lib/db/neon-client';
import { Region } from '@/types';

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
    const total = parseInt(countResult[0]?.total || '0');

    const sql = `
      SELECT 
        id,
        name,
        stadium_name as "stadiumName",
        code,
        description,
        flag_image as "flagImage",
        stadium_image as "stadiumImage",
        color,
        total_fighters as "totalFighters",
        total_champions as "totalChampions",
        created_at as "createdAt",
        
        -- Compter le nombre de likes
        COALESCE((
          SELECT COUNT(*)
          FROM interactions i
          WHERE i.entity_type = 'region'
            AND i.entity_id = regions.id
            AND i.interaction_type = 'like'
        ), 0) as "likes",
        
        -- Vérifier si l'utilisateur a liké cette région
        ${userId ? `
        EXISTS(
          SELECT 1
          FROM interactions i
          WHERE i.entity_type = 'region'
            AND i.entity_id = regions.id
            AND i.interaction_type = 'like'
            AND i.user_id = $1
        ) as "isMyFavorite"
        ` : 'FALSE as "isMyFavorite"' }
        
      FROM regions 
      ORDER BY name
      LIMIT ${userId ? '$2' : '$1'} OFFSET ${userId ? '$3' : '$2'}
    `;

    const params = userId ? [userId, limit, offset] : [limit, offset];
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
        timestamp: new Date().toISOString()
      },
      message: 'Régions récupérées avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileRegions:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des régions',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Mettre à jour la fonction getMobileRegionById pour accepter editionId
export async function getMobileRegionById(regionId: number, userId?: number, editionId?: number) {
  try {
    // Récupérer les informations de la région avec likes et favoris
    const regionInfo = await getRegionInfo(regionId, userId);
    if (!regionInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Région non trouvée',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer toutes les données de la région
    const fighters = await getRegionFighters(regionId);
    const matches = await getRegionMatches(regionId, editionId);
    const transfers = await getRegionTransfers(regionId);
    const achievements = await getRegionAchievements(regionId);
    const stats = calculateRegionStats(fighters, matches, achievements);

    return {
      success: true,
      data: {
        region: regionInfo,
        fighters: fighters,
        matches: organizeMatches(matches),
        transfers: transfers,
        achievements: organizeAchievements(achievements),
        stats: stats,
        summary: {
          totalFighters: fighters.length,
          totalMatches: matches.length,
          totalTransfers: transfers.length,
          totalAchievements: achievements.length,
          liveMatches: matches.filter((m: any) => ['live', 'round_break'].includes(m.status)).length,
          wins: matches.filter((m: any) => m.regionContext.isWinner).length,
          losses: matches.filter((m: any) => m.regionContext.isInvolved && !m.regionContext.isWinner && m.result).length
        },
        timestamp: new Date().toISOString()
      },
      message: 'Données de la région récupérées avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileRegionById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des données de la région',
        timestamp: new Date().toISOString()
      }
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
      fc.card_reason as "cardReason",
      fc.minute_given as "minuteGiven",
      fc.is_cancelled as "isCancelled"
    FROM fighter_cards fc
    WHERE fc.match_id = $1 AND fc.is_cancelled = FALSE
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
      r.color,
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
      ${userId ? `
      EXISTS(
        SELECT 1
        FROM interactions i
        WHERE i.entity_type = 'region'
          AND i.entity_id = r.id
          AND i.interaction_type = 'like'
          AND i.user_id = $2
      ) as "isMyFavorite"
      ` : 'FALSE as "isMyFavorite"' },
      
      -- Récupérer les informations du coach
      c.id as "coachId",
      c.first_name as "coachFirstName",
      c.last_name as "coachLastName",
      c.nickname as "coachNickname",
      c.profile_image as "coachProfileImage",
      c.license_number as "coachLicenseNumber",
      c.certification_level as "coachCertificationLevel",
      c.experience_years as "coachExperienceYears",
      c.specialties as "coachSpecialties"
      
    FROM regions r
    LEFT JOIN coaches c ON r.id = c.region_id AND c.is_active = TRUE
    WHERE r.id = $1
  `;
  
  const params = userId ? [regionId, userId] : [regionId];
  const result = await query(sql, params);
  const raw = result[0] || null;
  
  if (!raw) return null;
  
  // Formater les données du coach
  const coach = raw.coachId ? {
    id: raw.coachId,
    firstName: raw.coachFirstName,
    lastName: raw.coachLastName,
    nickname: raw.coachNickname,
    profileImage: raw.coachProfileImage,
    licenseNumber: raw.coachLicenseNumber,
    certificationLevel: raw.coachCertificationLevel,
    experienceYears: raw.coachExperienceYears,
    specialties: raw.coachSpecialties
  } : null;
  
  // Retourner les données de la région sans les champs bruts du coach
  const { coachId, coachFirstName, coachLastName, coachNickname, coachProfileImage, coachLicenseNumber, coachCertificationLevel, coachExperienceYears, coachSpecialties, ...region } = raw;
  
  return {
    ...region,
    coach
  };
}


async function getRegionFighters(regionId: number) {
  const sql = `
    SELECT 
      f.id,
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.profile_image as "profileImage",
      f.birth_date as "birthDate",
      f.height,
      f.weight,
      f.fighting_style as "fightingStyle",
      f.ranking,
      f.is_champion as "isChampion",
      f.is_active as "isActive",
      f.created_at as "createdAt",
      r.name as "regionName",
      r.color as "regionColor"
    FROM fighters f
    JOIN regions r ON f.region_id = r.id
    WHERE f.region_id = $1
    ORDER BY f.ranking ASC, f.nickname ASC
  `;
  
  return await query(sql, [regionId]);
}

async function getRegionMatches(regionId: number, editionId?: number) {
  let whereClause = "(f1.region_id = $1 OR f2.region_id = $1)";
  const params: any[] = [regionId];
  
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
      m.end_time as "endTime",
      m.status,
      m.match_result as "matchResult",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
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
      
      -- Contexte
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
    JOIN competition_editions ce ON p.edition_id = ce.id  -- CORRECTION ICI: ce.id au lieu de e.id
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
      m.start_time DESC
  `;
  
  const matches = await query(sql, params);
  
  // Enrichir les données des matchs
  return Promise.all(matches.map(match => enrichRegionMatchData(match, regionId)));
}

async function enrichRegionMatchData(match: any, regionId: number) {
  // Récupérer les cartons pour ce match
  const cards = await getCardsForMatch(match.id);

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

  // Déterminer si la région est impliquée et si elle a gagné
  const isRegionInvolved = match.fighter1RegionId === regionId || match.fighter2RegionId === regionId;
  const isRegionWinner = match.winnerFighterId && (
    (match.fighter1RegionId === regionId && match.winnerFighterId === match.fighter1Id) ||
    (match.fighter2RegionId === regionId && match.winnerFighterId === match.fighter2Id)
  );

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
    startTime: match.startTime,
    endTime: match.endTime,
    status: match.status,
    matchResult: resultType,
    totalDuration: match.totalDuration,
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

    regionContext: {
      isInvolved: isRegionInvolved,
      isWinner: isRegionWinner,
      regionRole: match.fighter1RegionId === regionId ? 'fighter1' : 
                 match.fighter2RegionId === regionId ? 'fighter2' : 'none'
    },

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
      r1.color as "fromRegionColor",
      r1.code as "fromRegionCode",
      ft.to_region_id as "toRegionId",
      r2.name as "toRegionName",
      r2.color as "toRegionColor",
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
  const liveMatches = matches.filter(m => ['live', 'round_break'].includes(m.status));
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');
  
  // Grouper par édition
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
    live: liveMatches,
    scheduled: scheduledMatches,
    completed: completedMatches,
    byEdition: Object.values(matchesByEdition)
  };
}

function organizeAchievements(achievements: any[]) {
  // Grouper par compétition/édition
  const byCompetition: Record<string, any> = {};
  achievements.forEach(achievement => {
    const key = `${achievement.editionTheme} ${achievement.editionYear}`;
    if (!byCompetition[key]) {
      byCompetition[key] = {
        edition: {
          theme: achievement.editionTheme,
          year: achievement.editionYear
        },
        achievements: []
      };
    }
    byCompetition[key].achievements.push(achievement);
  });

  return {
    all: achievements,
    byCompetition: Object.values(byCompetition)
  };
}

function calculateRegionStats(fighters: any[], matches: any[], achievements: any[]) {
  const totalMatches = matches.length;
  const wins = matches.filter(match => {
    // Correction: utiliser le résultat du match
    if (!match.result) return false;
    // Vérifier si le vainqueur est de cette région
    return fighters.some(fighter => fighter.id === match.result?.winner?.id);
  }).length;

  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100 * 10) / 10 : 0;

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    totalFighters: fighters.length,
    champions: fighters.filter(f => f.isChampion).length,
    totalAchievements: achievements.length
  };
}