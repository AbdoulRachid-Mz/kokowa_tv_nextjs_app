"use server";

import { query } from "@/lib/db/neon-client";
import { formatDateTime, formatDuration } from "@/utils/duration";

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
      
      -- Total des lutteurs invaincus (is_eliminated = false)
      (
        SELECT COUNT(*)
        FROM edition_fighters ef
        WHERE ef.edition_id = e.id
          AND ef.is_eliminated = false
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
    WITH edition_matches AS (
      -- Récupérer tous les matchs de cette édition uniquement
      SELECT 
        m.id,
        m.fighter1_id,
        m.fighter2_id,
        m.winner_fighter_id,
        m.loser_fighter_id,
        m.match_result,
        m.status
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE p.edition_id = $1
        AND m.status = 'completed'
    ),
    fighter_match_stats AS (
      -- Statistiques des matchs par lutteur dans cette édition uniquement
      SELECT 
        fe.fighter_id,
        fe.region_id,
        fe.is_eliminated,
        
        -- Total des matchs
        COUNT(DISTINCT em.id) as total_matches,
        
        -- Victoires
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.winner_fighter_id = fe.fighter_id
        ) as wins,
        
        -- Défaites
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.loser_fighter_id = fe.fighter_id
        ) as losses,
        
        -- Matchs nuls
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.match_result = 'draw' 
            AND (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
        ) as draws,
        
        -- Terraces (victoires)
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.winner_fighter_id = fe.fighter_id
        ) as terraces_given,
        
        -- Terraces subis (défaites)
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.loser_fighter_id = fe.fighter_id
        ) as terraces_taken,
        
        -- Cartons (en s'assurant de ne compter que les cartons des matchs de cette édition)
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
        
      FROM edition_fighters fe
      LEFT JOIN edition_matches em ON 
        (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
      LEFT JOIN fighter_cards fc ON fc.match_id = em.id AND fc.fighter_id = fe.fighter_id
      WHERE fe.edition_id = $1
      GROUP BY fe.fighter_id, fe.region_id, fe.is_eliminated
    ),
    fighter_stats AS (
      SELECT 
        *,
        -- Invaincu = is_eliminated = false
        CASE 
          WHEN is_eliminated = false THEN true
          ELSE false
        END as is_unbeaten
        
      FROM fighter_match_stats
    ),
    region_aggregates AS (
      SELECT 
        fs.region_id,
        COUNT(DISTINCT fs.fighter_id) as total_fighters,
        COUNT(DISTINCT fs.fighter_id) FILTER (WHERE fs.is_eliminated = false) as active_fighters,
        COUNT(DISTINCT fs.fighter_id) FILTER (WHERE fs.is_eliminated = true) as eliminated_fighters,
        COUNT(DISTINCT ef.fighter_id) FILTER (WHERE ef.is_champion = true) as champion_fighters,
        COUNT(DISTINCT fs.fighter_id) FILTER (WHERE fs.is_eliminated = false) as unbeaten_fighters,
        
        -- Stats des matchs
        COALESCE(SUM(fs.wins), 0) as total_wins,
        COALESCE(SUM(fs.losses), 0) as total_losses,
        COALESCE(SUM(fs.draws), 0) as total_draws,
        COALESCE(SUM(fs.terraces_given), 0) as total_terraces,
        COALESCE(SUM(fs.terraces_taken), 0) as total_terraces_taken,
        
        -- Cartons
        COALESCE(SUM(fs.yellow_cards), 0) as total_yellow_cards,
        COALESCE(SUM(fs.red_cards), 0) as total_red_cards
        
      FROM fighter_stats fs
      JOIN edition_fighters ef ON fs.fighter_id = ef.fighter_id 
        AND fs.region_id = ef.region_id 
        AND ef.edition_id = $1
      GROUP BY fs.region_id
    )
    SELECT 
      re.id,
      re.region_id as "regionId",
      r.name as "regionName",
      r.code as "regionCode",
      r.flag_image as "flagImage",
      re.is_eliminated as "isEliminated",
      
      -- Statistiques agrégées
      json_build_object(
        'totalFighters', COALESCE(ra.total_fighters, 0),
        'activeFighters', COALESCE(ra.active_fighters, 0),
        'eliminatedFighters', COALESCE(ra.eliminated_fighters, 0),
        'championFighters', COALESCE(ra.champion_fighters, 0),
        'unbeatenFighters', COALESCE(ra.unbeaten_fighters, 0),
        'totalWins', COALESCE(ra.total_wins, 0),
        'totalLosses', COALESCE(ra.total_losses, 0),
        'totalTerraces', COALESCE(ra.total_terraces, 0),
        'totalBeenTerraced', COALESCE(ra.total_terraces_taken, 0),
        'yellowCards', COALESCE(ra.total_yellow_cards, 0),
        'redCards', COALESCE(ra.total_red_cards, 0),
        'winRate', CASE 
          WHEN COALESCE(ra.total_wins, 0) + COALESCE(ra.total_losses, 0) > 0 
          THEN ROUND((COALESCE(ra.total_wins, 0) * 100.0) / (COALESCE(ra.total_wins, 0) + COALESCE(ra.total_losses, 0)), 1)
          ELSE 0 
        END
      ) as stats,
      
      -- Ratio pour le classement (basé sur is_eliminated = false)
      CASE 
        WHEN COALESCE(ra.total_fighters, 0) > 0 
        THEN ROUND((COALESCE(ra.unbeaten_fighters, 0) * 100.0) / COALESCE(ra.total_fighters, 0), 1)
        ELSE 0 
      END as "unbeatenRatio"
      
    FROM edition_regions re
    JOIN regions r ON re.region_id = r.id
    LEFT JOIN region_aggregates ra ON re.region_id = ra.region_id
    WHERE re.edition_id = $1
    ORDER BY 
      re.is_eliminated ASC,
      re.points DESC,
      COALESCE(ra.unbeaten_fighters, 0) DESC,
      r.name ASC
  `;

  const results = await query(sql, [editionId]);

  // Forcer les types numériques
  return results.map(r => ({
    ...r,
    points: Number(r.points || 0),
    unbeatenRatio: Number(r.unbeatenRatio || 0),
    stats: {
      ...r.stats,
      totalFighters: Number(r.stats?.totalFighters || 0),
      activeFighters: Number(r.stats?.activeFighters || 0),
      eliminatedFighters: Number(r.stats?.eliminatedFighters || 0),
      championFighters: Number(r.stats?.championFighters || 0),
      unbeatenFighters: Number(r.stats?.unbeatenFighters || 0),
      totalMatches: Number(r.stats?.totalMatches || 0),
      totalWins: Number(r.stats?.totalWins || 0),
      totalLosses: Number(r.stats?.totalLosses || 0),
      totalDraws: Number(r.stats?.totalDraws || 0),
      totalTerraces: Number(r.stats?.totalTerraces || 0),
      totalBeenTerraced: Number(r.stats?.totalBeenTerraced || 0),
      yellowCards: Number(r.stats?.yellowCards || 0),
      redCards: Number(r.stats?.redCards || 0),
      winRate: Number(r.stats?.winRate || 0)
    }
  }));
}

async function getFightersForEdition(editionId: number) {
  const sql = `
    WITH edition_matches AS (
      -- Récupérer tous les matchs de cette édition uniquement
      SELECT 
        m.id,
        m.fighter1_id,
        m.fighter2_id,
        m.winner_fighter_id,
        m.loser_fighter_id,
        m.match_result
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE p.edition_id = $1
        AND m.status = 'completed'
    ),
    fighter_match_stats AS (
      -- Statistiques pour chaque lutteur dans cette édition uniquement
      SELECT 
        fe.fighter_id,
        fe.region_id,
        fe.is_eliminated,
        COUNT(DISTINCT em.id) as total_matches,
        
        -- Victoires
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.winner_fighter_id = fe.fighter_id
        ) as wins,
        
        -- Défaites
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.loser_fighter_id = fe.fighter_id
        ) as losses,
        
        -- Matchs nuls
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.match_result = 'draw' 
            AND (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
        ) as draws,
        
        -- Terraces
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.winner_fighter_id = fe.fighter_id
        ) as terraces,
        
        -- Terraces subis
        COUNT(DISTINCT em.id) FILTER (
          WHERE em.loser_fighter_id = fe.fighter_id
        ) as been_terraced,
        
        -- Cartons
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
        
      FROM edition_fighters fe
      LEFT JOIN edition_matches em ON 
        (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
      LEFT JOIN fighter_cards fc ON fc.match_id = em.id AND fc.fighter_id = fe.fighter_id
      WHERE fe.edition_id = $1
      GROUP BY fe.fighter_id, fe.region_id, fe.is_eliminated
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
      fe.region_id as "regionId",
      r.name as "regionName",
      r.color as "regionColor",
      
      -- Utiliser directement is_eliminated de edition_fighters
      fe.is_eliminated as "isEliminated",
      
      fe.is_champion as "isChampion",
      fe.created_at as "createdAt",
      
      -- Statistiques
      COALESCE(stats.total_matches, 0) as "totalMatches",
      COALESCE(stats.wins, 0) as "wins",
      COALESCE(stats.losses, 0) as "losses",
      COALESCE(stats.draws, 0) as "draws",
      COALESCE(stats.terraces, 0) as "terraces",
      COALESCE(stats.been_terraced, 0) as "beenTerraced",
      COALESCE(stats.yellow_cards, 0) as "yellowCards",
      COALESCE(stats.red_cards, 0) as "redCards",
      
      -- Stats dérivées
      CASE 
        WHEN COALESCE(stats.total_matches, 0) > 0 
        THEN ROUND((COALESCE(stats.wins, 0) * 100.0) / COALESCE(stats.total_matches, 0), 1)
        ELSE 0 
      END as "winRate",
      
      -- Invaincu = is_eliminated = false
      CASE 
        WHEN fe.is_eliminated = false THEN true
        ELSE false
      END as "isUnbeaten"

    FROM edition_fighters fe
    JOIN fighters f ON fe.fighter_id = f.id
    JOIN regions r ON fe.region_id = r.id
    LEFT JOIN fighter_match_stats stats ON fe.fighter_id = stats.fighter_id
    WHERE fe.edition_id = $1
    ORDER BY 
      fe.is_champion DESC,
      fe.is_eliminated ASC,  -- Non éliminés d'abord
      COALESCE(stats.wins, 0) DESC,
      COALESCE(stats.total_matches, 0) DESC
  `;

  const fighters = await query(sql, [editionId]);

  // Forcer la conversion en nombres
  return fighters.map(f => ({
    ...f,
    totalMatches: Number(f.totalMatches || 0),
    wins: Number(f.wins || 0),
    losses: Number(f.losses || 0),
    draws: Number(f.draws || 0),
    terraces: Number(f.terraces || 0),
    beenTerraced: Number(f.beenTerraced || 0),
    yellowCards: Number(f.yellowCards || 0),
    redCards: Number(f.redCards || 0),
    winRate: Number(f.winRate || 0),
    isUnbeaten: Boolean(f.isUnbeaten),
    isEliminated: Boolean(f.isEliminated)
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

    // Nombre de lutteurs invaincus (is_eliminated = false)
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

    const match = result[0];

    // Formater les durées et heures
    const formattedDuration = formatDuration(match.totalDuration);
    const formattedStartTime = formatDateTime(match.matchDate, match.startTime);
    const formattedEndTime = formatDateTime(match.matchDate, match.endTime);

    // Structurer les données des fighters
    const fighter1 = {
      id: match.fighter1Id,
      firstName: match.fighter1FirstName,
      lastName: match.fighter1LastName,
      nickname: match.fighter1Nickname,
      profileImage: match.fighter1ProfileImage,
      region: {
        id: match.fighter1RegionId,
        name: match.fighter1RegionName,
        color: match.fighter1RegionColor,
      }
    };

    const fighter2 = {
      id: match.fighter2Id,
      firstName: match.fighter2FirstName,
      lastName: match.fighter2LastName,
      nickname: match.fighter2Nickname,
      profileImage: match.fighter2ProfileImage,
      region: {
        id: match.fighter2RegionId,
        name: match.fighter2RegionName,
        color: match.fighter2RegionColor,
      }
    };

    // Déterminer le vainqueur
    let winner = null;
    if (match.winnerFighterId) {
      winner = match.winnerFighterId === match.fighter1Id ? fighter1 : fighter2;
    }

    // Créer l'objet de réponse formaté
    const formattedMatch = {
      id: match.id,
      matchNumber: match.matchNumber,
      matchDate: match.matchDate,
      startTime: formattedStartTime,
      endTime: match.endTime,
      status: match.status,
      matchResult: match.matchResult,
      totalDuration: formattedDuration,
      breakCount: match.breakCount,
      audienceCount: match.audienceCount,
      videoUrl: match.videoUrl,
      liveStreamUrl: match.liveStreamUrl,
      notes: match.notes,

      fighters: {
        fighter1,
        fighter2,
      },

      result: winner ? {
        winner,
        resultType: match.matchResult,
      } : null,

      context: {
        subGroupName: match.subGroupName,
        groupName: match.groupName,
        phaseName: match.phaseName,
        edition: {
          theme: match.editionTheme,
          year: match.editionYear,
        },
        competition: {
          name: match.competitionName,
        }
      },

      cards: match.cards,
    };

    return {
      success: true,
      data: formattedMatch,
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