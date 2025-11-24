'use server';

import { query } from '@/lib/db/neon-client';

export async function getMobileMatchesBySubGroup(subGroupId: number) {
  try {
    // Vérifier que le sous-groupe existe
    const existsSql = "SELECT id FROM sub_groups WHERE id = $1";
    const existsResult = await query(existsSql, [subGroupId]);
    
    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Sous-groupe non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer les informations du sous-groupe
    const subGroupInfo = await getSubGroupInfo(subGroupId);

    // Récupérer tous les matchs du sous-groupe
    const matches = await getAllMatchesForSubGroup(subGroupId);

    // Séparer le match en direct (s'il existe)
    let liveMatch = null;
    const otherMatches = [];

    for (const match of matches) {
      if (['live', 'round_break'].includes(match.status)) {
        liveMatch = match;
      } else {
        otherMatches.push(match);
      }
    }

    // Grouper les matchs par statut
    const groupedMatches = {
      scheduled: otherMatches.filter(m => m.status === 'scheduled'),
      completed: otherMatches.filter(m => m.status === 'completed'),
      cancelled: otherMatches.filter(m => m.status === 'cancelled'),
      postponed: otherMatches.filter(m => m.status === 'postponed')
    };

    return {
      success: true,
      data: {
        subGroup: subGroupInfo,
        liveMatch: liveMatch ? await enrichMatchData(liveMatch) : null,
        matches: {
          all: await Promise.all(otherMatches.map(match => enrichMatchData(match))),
          grouped: {
            scheduled: await Promise.all(groupedMatches.scheduled.map(match => enrichMatchData(match))),
            completed: await Promise.all(groupedMatches.completed.map(match => enrichMatchData(match))),
            cancelled: await Promise.all(groupedMatches.cancelled.map(match => enrichMatchData(match))),
            postponed: await Promise.all(groupedMatches.postponed.map(match => enrichMatchData(match)))
          }
        },
        summary: {
          total: matches.length,
          live: liveMatch ? 1 : 0,
          scheduled: groupedMatches.scheduled.length,
          completed: groupedMatches.completed.length,
          cancelled: groupedMatches.cancelled.length,
          postponed: groupedMatches.postponed.length
        },
        timestamp: new Date().toISOString()
      },
      message: 'Matchs du sous-groupe récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileMatchesBySubGroup:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des matchs',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Fonctions auxiliaires
async function getSubGroupInfo(subGroupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.sub_group_order as "subGroupOrder",
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r2.name as "region2Name",
      r1.color as "region1Color",
      r2.color as "region2Color",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive",
      sg.created_at as "createdAt",
      pg.id as "groupId",
      pg.name as "groupName",
      p.id as "phaseId",
      p.name as "phaseName"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    WHERE sg.id = $1
  `;

  const result = await query(sql, [subGroupId]);
  return result[0];
}

async function getAllMatchesForSubGroup(subGroupId: number) {
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
      
      -- Vainqueur et perdant
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Sous-groupe
      sg.id as "subGroupId",
      sg.name as "subGroupName",
      sg.region1_id as "subGroupRegion1Id",
      sg.region2_id as "subGroupRegion2Id",
      
      -- Groupe et Phase
      pg.id as "groupId",
      pg.name as "groupName",
      p.id as "phaseId",
      p.name as "phaseName",
      p.phase_type as "phaseType"

    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    WHERE m.sub_group_id = $1
    ORDER BY 
      CASE 
        WHEN m.status IN ('live', 'round_break') THEN 0
        WHEN m.status = 'scheduled' THEN 1
        WHEN m.status = 'completed' THEN 2
        ELSE 3
      END,
      m.match_date ASC,
      m.start_time ASC,
      m.match_number ASC
  `;

  return await query(sql, [subGroupId]);
}

async function enrichMatchData(match: any) {
  // Récupérer les cartons pour ce match
  const cards = await getCardsForMatch(match.id);

  // Récupérer les statistiques avancées
  const stats = await getMatchStats(match.id);

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
      code: match.fighter1RegionCode
    },
    cards: cards.filter((card: any) => card.fighterId === match.fighter1Id)
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
      code: match.fighter2RegionCode
    },
    cards: cards.filter((card: any) => card.fighterId === match.fighter2Id)
  };

  // Déterminer le vainqueur et le perdant
  let winner = null;
  let loser = null;

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
    matchResult: match.matchResult,
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
      fighter2
    },
    
    result: winner ? {
      winner,
      loser,
      resultType: match.matchResult
    } : null,
    
    context: {
      subGroup: {
        id: match.subGroupId,
        name: match.subGroupName
      },
      group: {
        id: match.groupId,
        name: match.groupName
      },
      phase: {
        id: match.phaseId,
        name: match.phaseName,
        type: match.phaseType
      }
    },
    
    stats,
    allCards: cards
  };

  // Nettoyer les données redondantes
  cleanMatchData(enrichedMatch);

  return enrichedMatch;
}

async function getCardsForMatch(matchId: number) {
  const sql = `
    SELECT 
      fc.id,
      fc.fighter_id as "fighterId",
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.nickname as "fighterNickname",
      fc.card_type as "cardType",
      fc.card_reason as "cardReason",
      fc.minute_given as "minuteGiven",
      fc.is_cancelled as "isCancelled",
      fc.created_at as "createdAt"
    FROM fighter_cards fc
    JOIN fighters f ON fc.fighter_id = f.id
    WHERE fc.match_id = $1
    ORDER BY fc.minute_given
  `;

  return await query(sql, [matchId]);
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
    breaks
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
  const sql = "SELECT total_duration as \"totalDuration\" FROM matches WHERE id = $1";
  const result = await query(sql, [matchId]);
  return result[0]?.totalDuration || 0;
}

async function getBreakCount(matchId: number) {
  const sql = "SELECT break_count as \"breakCount\" FROM matches WHERE id = $1";
  const result = await query(sql, [matchId]);
  return result[0]?.breakCount || 0;
}

function cleanMatchData(match: any) {
  // Supprimer les données redondantes déjà formatées
  delete match.fighters.fighter1.cards;
  delete match.fighters.fighter2.cards;
}