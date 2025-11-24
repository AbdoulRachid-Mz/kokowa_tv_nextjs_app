'use server';

import { query } from '@/lib/db/neon-client';
import { Region } from '@/types';

export async function getMobileRegions() {
  try {
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
        created_at as "createdAt"
      FROM regions 
      ORDER BY name
    `;

    const regions = await query<Region>(sql);

    return {
      success: true,
      data: {
        regions,
        count: regions.length,
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

export async function getMobileRegionById(regionId: number) {
  try {
    // Vérifier que la région existe
    const regionInfo = await getRegionInfo(regionId);
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
    const matches = await getRegionMatches(regionId);
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
          liveMatches: matches.filter(m => ['live', 'round_break'].includes(m.status)).length
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

// Fonctions auxiliaires
async function getRegionInfo(regionId: number) {
  const sql = `
    SELECT 
      id,
      name,
      code,
      color,
      stadium_name as "stadiumName",
      description,
      total_champions as "totalChampions"
    FROM regions
    WHERE id = $1
  `;
  
  const result = await query(sql, [regionId]);
  return result[0] || null;
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

async function getRegionMatches(regionId: number) {
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
      f1.id as "fighter1Id",
      f1.nickname as "fighter1Nickname",
      f1.region_id as "fighter1RegionId",
      f1.profile_image as "fighter1ProfileImage",
      r1.name as "fighter1RegionName",
      r1.color as "fighter1RegionColor",
      
      -- Lutteur 2
      f2.id as "fighter2Id",
      f2.nickname as "fighter2Nickname",
      f2.region_id as "fighter2RegionId",
      f2.profile_image as "fighter2ProfileImage",
      r2.name as "fighter2RegionName",
      r2.color as "fighter2RegionColor",
      
      -- Contexte
      sg.name as "subGroupName",
      pg.name as "groupName",
      p.name as "phaseName",
      e.theme as "editionTheme",
      e.year as "editionYear"

    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN competition_editions e ON p.edition_id = e.id
    WHERE f1.region_id = $1 OR f2.region_id = $1
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
  
  return await query(sql, [regionId]);
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
    const editionKey = `${match.editionTheme} ${match.editionYear}`;
    if (!matchesByEdition[editionKey]) {
      matchesByEdition[editionKey] = {
        edition: {
          theme: match.editionTheme,
          year: match.editionYear
        },
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
    if (!match.winnerFighterId) return false;
    // Vérifier si le vainqueur est de cette région
    return fighters.some(fighter => fighter.id === match.winnerFighterId);
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