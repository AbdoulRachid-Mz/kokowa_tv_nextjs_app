"use server";

import { query } from "@/lib/db/neon-client";

export async function getMobileEditionRegions(editionId: number) {
  try {
    // Vérifier que l'édition existe
    const existsSql = "SELECT id FROM competition_editions WHERE id = $1";
    const existsResult = await query(existsSql, [editionId]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Édition non trouvée",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Récupérer les informations de base de l'édition avec les totaux
    const editionInfo = await getEditionInfo(editionId);

    // Récupérer les régions participantes avec leurs statistiques calculées en SQL
    const regions = await getRegionsWithStats(editionId);

    // Récupérer les lutteurs de l'édition avec leurs statistiques
    const fighters = await getFightersForEdition(editionId);

    // Classer les régions
    const rankedRegions = rankRegions(regions);

    return {
      success: true,
      data: {
        edition: editionInfo,
        regions: rankedRegions,
        fighters,
        summary: {
          totalRegions: editionInfo.totalRegions,
          totalFighters: editionInfo.totalFighters,
          totalUnbeatenFighters: editionInfo.totalUnbeatenFighters,
          eliminatedRegions: regions.filter((r: any) => r.isEliminated).length,
          activeRegions: regions.filter((r: any) => !r.isEliminated).length,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Données de l'édition récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileEditionRegions:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des données de l'édition",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

async function getEditionInfo(editionId: number) {
  const sql = `
    SELECT 
      e.id,
      e.theme,
      e.year,
      e.start_date as "startDate",
      e.end_date as "endDate",
      e.is_active as "isActive",
      c.name as "competitionName",
      c.id as "competitionId",
      
      -- Total des régions participantes
      (
        SELECT COUNT(*) 
        FROM edition_regions er 
        WHERE er.edition_id = e.id
      ) as "totalRegions",
      
      -- Total des lutteurs participants
      (
        SELECT COUNT(*) 
        FROM edition_fighters ef 
        WHERE ef.edition_id = e.id
      ) as "totalFighters",
      
      -- Total des lutteurs invaincus (qui n'ont jamais perdu)
      (
        SELECT COUNT(DISTINCT ef.fighter_id)
        FROM edition_fighters ef
        WHERE ef.edition_id = e.id
          AND NOT EXISTS (
            SELECT 1
            FROM matches m
            JOIN sub_groups sg ON m.sub_group_id = sg.id
            JOIN phase_groups pg ON sg.group_id = pg.id
            JOIN phases p ON pg.phase_id = p.id
            WHERE p.edition_id = e.id
              AND m.loser_fighter_id = ef.fighter_id
              AND m.status = 'completed'
          )
      ) as "totalUnbeatenFighters"
      
    FROM competition_editions e
    JOIN competitions c ON e.competition_id = c.id
    WHERE e.id = $1
  `;

  const result = await query(sql, [editionId]);
  return result[0] || null;
}

async function getRegionsWithStats(editionId: number) {
  const sql = `
    WITH fighter_stats AS (
      -- Statistiques des lutteurs par région dans cette édition
      SELECT 
        fe.region_id,
        COUNT(DISTINCT fe.fighter_id) as total_fighters,
        COUNT(DISTINCT fe.fighter_id) FILTER (WHERE fe.is_eliminated = false) as active_fighters,
        COUNT(DISTINCT fe.fighter_id) FILTER (WHERE fe.is_eliminated = true) as eliminated_fighters,
        COUNT(DISTINCT fe.fighter_id) FILTER (WHERE fe.is_champion = true) as champion_fighters,
        
        -- Statistiques des matchs
        COUNT(DISTINCT m.id) FILTER (WHERE m.winner_fighter_id = fe.fighter_id) as wins,
        COUNT(DISTINCT m.id) FILTER (WHERE m.loser_fighter_id = fe.fighter_id) as losses,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.winner_fighter_id = fe.fighter_id
        ) as terraces_given,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.loser_fighter_id = fe.fighter_id
        ) as terraces_taken,
        
        -- Cartons
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
        
      FROM edition_fighters fe
      LEFT JOIN matches m ON 
        (m.fighter1_id = fe.fighter_id OR m.fighter2_id = fe.fighter_id)
        AND m.status = 'completed'
      LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
      LEFT JOIN phase_groups pg ON sg.group_id = pg.id
      LEFT JOIN phases p ON pg.phase_id = p.id AND p.edition_id = fe.edition_id
      LEFT JOIN fighter_cards fc ON fc.match_id = m.id AND fc.fighter_id = fe.fighter_id
      WHERE fe.edition_id = $1
      GROUP BY fe.region_id
    ),
    region_unbeaten AS (
      -- Lutteurs invaincus par région
      SELECT 
        fe.region_id,
        COUNT(DISTINCT fe.fighter_id) as unbeaten_fighters
      FROM edition_fighters fe
      WHERE fe.edition_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM matches m
          JOIN sub_groups sg ON m.sub_group_id = sg.id
          JOIN phase_groups pg ON sg.group_id = pg.id
          JOIN phases p ON pg.phase_id = p.id
          WHERE p.edition_id = $1
            AND m.loser_fighter_id = fe.fighter_id
            AND m.status = 'completed'
        )
      GROUP BY fe.region_id
    )
    SELECT 
      re.id,
      re.region_id as "regionId",
      r.name as "regionName",
      r.code as "regionCode",
      r.color as "regionColor",
      r.flag_image as "flagImage",
      r.stadium_name as "stadiumName",
      r.stadium_image as "stadiumImage",
      re.points,
      re.is_eliminated as "isEliminated",
      re.created_at as "createdAt",
      
      -- Statistiques agrégées
      json_build_object(
        'totalFighters', COALESCE(fs.total_fighters, 0),
        'activeFighters', COALESCE(fs.active_fighters, 0),
        'eliminatedFighters', COALESCE(fs.eliminated_fighters, 0),
        'championFighters', COALESCE(fs.champion_fighters, 0),
        'unbeatenFighters', COALESCE(ru.unbeaten_fighters, 0),
        'totalWins', COALESCE(fs.wins, 0),
        'totalLosses', COALESCE(fs.losses, 0),
        'totalTerraces', COALESCE(fs.terraces_given, 0),
        'totalBeenTerraced', COALESCE(fs.terraces_taken, 0),
        'yellowCards', COALESCE(fs.yellow_cards, 0),
        'redCards', COALESCE(fs.red_cards, 0),
        'winRate', CASE 
          WHEN COALESCE(fs.wins, 0) + COALESCE(fs.losses, 0) > 0 
          THEN ROUND((COALESCE(fs.wins, 0) * 100.0) / (COALESCE(fs.wins, 0) + COALESCE(fs.losses, 0)), 1)
          ELSE 0 
        END
      ) as stats,
      
      -- Ratio pour le classement
      CASE 
        WHEN COALESCE(fs.total_fighters, 0) > 0 
        THEN ROUND((COALESCE(ru.unbeaten_fighters, 0) * 100.0) / COALESCE(fs.total_fighters, 0), 1)
        ELSE 0 
      END as "unbeatenRatio"
      
    FROM edition_regions re
    JOIN regions r ON re.region_id = r.id
    LEFT JOIN fighter_stats fs ON re.region_id = fs.region_id
    LEFT JOIN region_unbeaten ru ON re.region_id = ru.region_id
    WHERE re.edition_id = $1
    ORDER BY re.points DESC, r.name ASC
  `;

  return await query(sql, [editionId]);
}

async function getFightersForEdition(editionId: number) {
  const sql = `
    WITH fighter_match_stats AS (
      -- Statistiques pour chaque lutteur dans cette édition
      SELECT 
        m.fighter1_id as fighter_id,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT m.id) FILTER (WHERE m.winner_fighter_id = m.fighter1_id) as wins,
        COUNT(DISTINCT m.id) FILTER (WHERE m.loser_fighter_id = m.fighter1_id) as losses,
        COUNT(DISTINCT m.id) FILTER (WHERE m.winner_fighter_id = m.fighter1_id) as terraces,
        COUNT(DISTINCT m.id) FILTER (WHERE m.loser_fighter_id = m.fighter1_id) as been_terraced,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      LEFT JOIN fighter_cards fc ON fc.match_id = m.id AND fc.fighter_id = m.fighter1_id
      WHERE p.edition_id = $1 AND m.status = 'completed'
      GROUP BY m.fighter1_id
      
      UNION ALL
      
      SELECT 
        m.fighter2_id as fighter_id,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT m.id) FILTER (WHERE m.winner_fighter_id = m.fighter2_id) as wins,
        COUNT(DISTINCT m.id) FILTER (WHERE m.loser_fighter_id = m.fighter2_id) as losses,
        COUNT(DISTINCT m.id) FILTER (WHERE m.winner_fighter_id = m.fighter2_id) as terraces,
        COUNT(DISTINCT m.id) FILTER (WHERE m.loser_fighter_id = m.fighter2_id) as been_terraced,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      LEFT JOIN fighter_cards fc ON fc.match_id = m.id AND fc.fighter_id = m.fighter2_id
      WHERE p.edition_id = $1 AND m.status = 'completed'
      GROUP BY m.fighter2_id
    ),
    aggregated_stats AS (
      SELECT 
        fighter_id,
        SUM(COALESCE(total_matches, 0)) as total_matches,
        SUM(COALESCE(wins, 0)) as wins,
        SUM(COALESCE(losses, 0)) as losses,
        SUM(COALESCE(terraces, 0)) as terraces,
        SUM(COALESCE(been_terraced, 0)) as been_terraced,
        SUM(COALESCE(yellow_cards, 0)) as yellow_cards,
        SUM(COALESCE(red_cards, 0)) as red_cards
      FROM fighter_match_stats
      GROUP BY fighter_id
    )
    SELECT 
      fe.id,
      fe.fighter_id as "fighterId",
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.profile_image as "profileImage",
      f.height,
      f.weight,
      f.fighting_style as "fightingStyle",
      f.ranking,
      fe.region_id as "regionId",  -- Utiliser la région de l'édition, pas celle du lutteur
      r.name as "regionName",
      r.color as "regionColor",
      fe.is_eliminated as "isEliminated",
      fe.is_champion as "isChampion",
      fe.created_at as "createdAt",
      
      -- Statistiques du lutteur dans cette édition (forcer le Number en JS)
      COALESCE(stats.total_matches, 0) as "totalMatches",
      COALESCE(stats.wins, 0) as "wins",
      COALESCE(stats.losses, 0) as "losses",
      COALESCE(stats.terraces, 0) as "terraces",
      COALESCE(stats.been_terraced, 0) as "beenTerraced",
      COALESCE(stats.yellow_cards, 0) as "yellowCards",
      COALESCE(stats.red_cards, 0) as "redCards",
      
      -- Calcul des stats dérivées
      CASE 
          WHEN COALESCE(stats.total_matches, 0) > 0 
          THEN ROUND((COALESCE(stats.wins, 0) * 100.0) / COALESCE(stats.total_matches, 0), 1)
          ELSE 0 
      END as "winRate",
      
      -- Nombre de matchs sans défaite (invaincu)
      COALESCE(stats.total_matches, 0) - COALESCE(stats.losses, 0) as "unbeatenMatches"

    FROM edition_fighters fe
    JOIN fighters f ON fe.fighter_id = f.id
    JOIN regions r ON fe.region_id = r.id  -- JOINTURE avec la région de l'édition
    LEFT JOIN aggregated_stats stats ON fe.fighter_id = stats.fighter_id
    WHERE fe.edition_id = $1
    ORDER BY 
      fe.is_champion DESC,
      fe.is_eliminated ASC,
      stats.wins DESC NULLS LAST,
      stats.total_matches DESC NULLS LAST
  `;

  const fighters = await query(sql, [editionId]);
  
  // Forcer la conversion en nombres pour éviter les concaténations de strings
  return fighters.map(f => ({
    ...f,
    totalMatches: Number(f.totalMatches || 0),
    wins: Number(f.wins || 0),
    losses: Number(f.losses || 0),
    terraces: Number(f.terraces || 0),
    beenTerraced: Number(f.beenTerraced || 0),
    yellowCards: Number(f.yellowCards || 0),
    redCards: Number(f.redCards || 0),
    winRate: Number(f.winRate || 0),
    unbeatenMatches: Number(f.unbeatenMatches || 0)
  }));
}

function rankRegions(regions: any[]) {
  // S'assurer que toutes les valeurs numériques sont des nombres
  const regionsWithNumbers = regions.map(region => ({
    ...region,
    points: Number(region.points || 0),
    unbeatenRatio: Number(region.unbeatenRatio || 0),
    stats: {
      ...region.stats,
      totalFighters: Number(region.stats?.totalFighters || 0),
      unbeatenFighters: Number(region.stats?.unbeatenFighters || 0),
      totalWins: Number(region.stats?.totalWins || 0),
      totalTerraces: Number(region.stats?.totalTerraces || 0),
      championFighters: Number(region.stats?.championFighters || 0)
    }
  }));

  // Trier les régions selon plusieurs critères
  regionsWithNumbers.sort((a, b) => {
    // Priorité: éliminé ou non (non éliminé d'abord)
    if (a.isEliminated !== b.isEliminated)
      return (a.isEliminated ? 1 : 0) - (b.isEliminated ? 1 : 0);

    // Points totaux
    if (a.points !== b.points) 
      return b.points - a.points;

    // Nombre de lutteurs invaincus
    if (a.stats.unbeatenFighters !== b.stats.unbeatenFighters)
      return b.stats.unbeatenFighters - a.stats.unbeatenFighters;

    // Ratio de lutteurs invaincus
    if (a.unbeatenRatio !== b.unbeatenRatio)
      return b.unbeatenRatio - a.unbeatenRatio;

    // Nombre de victoires total
    if (a.stats.totalWins !== b.stats.totalWins)
      return b.stats.totalWins - a.stats.totalWins;

    // Nombre de terraces infligés
    if (a.stats.totalTerraces !== b.stats.totalTerraces)
      return b.stats.totalTerraces - a.stats.totalTerraces;

    // Nombre de champions
    return b.stats.championFighters - a.stats.championFighters;
  });

  // Ajouter le rang
  regionsWithNumbers.forEach((region, index) => {
    region.rank = index + 1;
  });

  return regionsWithNumbers;
}

// Fonction pour obtenir les détails d'un match
export async function getMobileEditionMatchDetails(matchId: number) {
  try {
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
        
        -- Fighter 1
        m.fighter1_id as "fighter1Id",
        f1.first_name as "fighter1FirstName",
        f1.last_name as "fighter1LastName",
        f1.nickname as "fighter1Nickname",
        f1.profile_image as "fighter1ProfileImage",
        fe1.region_id as "fighter1RegionId",
        r1.name as "fighter1RegionName",
        r1.color as "fighter1RegionColor",
        
        -- Fighter 2
        m.fighter2_id as "fighter2Id",
        f2.first_name as "fighter2FirstName",
        f2.last_name as "fighter2LastName",
        f2.nickname as "fighter2Nickname",
        f2.profile_image as "fighter2ProfileImage",
        fe2.region_id as "fighter2RegionId",
        r2.name as "fighter2RegionName",
        r2.color as "fighter2RegionColor",
        
        -- Résultat
        m.winner_fighter_id as "winnerFighterId",
        m.loser_fighter_id as "loserFighterId",
        
        -- Contexte
        sg.name as "subGroupName",
        pg.name as "groupName",
        p.name as "phaseName",
        ce.theme as "editionTheme",
        ce.year as "editionYear",
        c.name as "competitionName",
        
        -- Cartons
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', fc.id,
              'fighterId', fc.fighter_id,
              'cardType', fc.card_type,
              'cardReason', fc.card_reason,
              'minuteGiven', fc.minute_given
            )
          ) FILTER (WHERE fc.id IS NOT NULL), '[]'
        ) as "cards"
        
      FROM matches m
      JOIN fighters f1 ON m.fighter1_id = f1.id
      JOIN fighters f2 ON m.fighter2_id = f2.id
      JOIN edition_fighters fe1 ON fe1.fighter_id = f1.id AND fe1.edition_id = (
        SELECT p.edition_id FROM phases p 
        JOIN phase_groups pg ON p.id = pg.phase_id
        JOIN sub_groups sg ON pg.id = sg.group_id
        WHERE sg.id = m.sub_group_id
      )
      JOIN edition_fighters fe2 ON fe2.fighter_id = f2.id AND fe2.edition_id = (
        SELECT p.edition_id FROM phases p 
        JOIN phase_groups pg ON p.id = pg.phase_id
        JOIN sub_groups sg ON pg.id = sg.group_id
        WHERE sg.id = m.sub_group_id
      )
      JOIN regions r1 ON fe1.region_id = r1.id
      JOIN regions r2 ON fe2.region_id = r2.id
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      JOIN competitions c ON ce.competition_id = c.id
      LEFT JOIN fighter_cards fc ON fc.match_id = m.id
      WHERE m.id = $1
      GROUP BY 
        m.id, f1.id, f2.id, fe1.region_id, fe2.region_id, r1.id, r2.id,
        sg.id, pg.id, p.id, ce.id, c.id
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

    return {
      success: true,
      data: result[0],
      message: "Détails du match récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileEditionMatchDetails:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des détails du match",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Fonction pour obtenir les phases d'une édition
export async function getMobileEditionPhases(editionId: number) {
  try {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.phase_order as "phaseOrder",
        p.phase_type as "phaseType",
        p.description,
        p.start_date as "startDate",
        p.end_date as "endDate",
        p.is_completed as "isCompleted",
        p.is_active as "isActive",
        
        -- Nombre de groupes dans cette phase
        COUNT(DISTINCT pg.id) as "groupCount",
        
        -- Nombre de matchs dans cette phase
        (
          SELECT COUNT(*)
          FROM matches m
          JOIN sub_groups sg ON m.sub_group_id = sg.id
          JOIN phase_groups pg2 ON sg.group_id = pg2.id
          WHERE pg2.phase_id = p.id
        ) as "matchCount"
        
      FROM phases p
      LEFT JOIN phase_groups pg ON p.id = pg.phase_id
      WHERE p.edition_id = $1
      GROUP BY p.id
      ORDER BY p.phase_order ASC
    `;

    const phases = await query(sql, [editionId]);

    return {
      success: true,
      data: phases,
      message: "Phases de l'édition récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileEditionPhases:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des phases",
        timestamp: new Date().toISOString(),
      },
    };
  }
}