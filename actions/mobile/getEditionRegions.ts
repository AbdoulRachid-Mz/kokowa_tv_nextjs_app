"use server";

import { query } from "@/lib/db/neon-client";
import { formatDateTime, formatDuration } from "@/utils/duration";
import { enrichMatchData, getCardsForMatch } from "@/utils/match-utils";

export async function getMobileEditionRegions(editionId: number) {
  try {
    // Les informations de l'édition servent aussi d'existence check.
    const editionInfo = await getEditionInfo(editionId);

    if (!editionInfo) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Édition non trouvée",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Régions et lutteurs sont indépendants : une seule vague.
    const [regions, fighters] = await Promise.all([
      getRegionsWithStats(editionId),
      getFightersForEdition(editionId),
    ]);

    // Classer les régions
    const rankedRegions = rankRegions(regions);

    // Nettoyer les données des régions pour ne garder que les champs essentiels
    const cleanedRegions = rankedRegions.map((region) => ({
      regionId: region.regionId,
      regionName: region.regionName,
      regionCode: region.regionCode,
      flagImage: region.flagImage,
      isEliminated: region.isEliminated,
      stats: {
        totalFighters: region.stats?.totalFighters || 0,
        championFighters: region.stats?.championFighters || 0,
        unbeatenFighters: region.stats?.unbeatenFighters || 0,
        totalWins: region.stats?.totalWins || 0,
        totalLosses: region.stats?.totalLosses || 0,
        winRate: region.stats?.winRate || 0,
        totalDraws: region.stats?.totalDraws || 0,
      },
      unbeatenRatio: region.unbeatenRatio,
      rank: region.rank,
    }));

    // Nettoyer les données des lutteurs pour ne garder que les champs essentiels
    const cleanedFighters = fighters.map((fighter) => ({
      fighterId: fighter.fighterId,
      firstName: fighter.firstName,
      lastName: fighter.lastName,
      nickname: fighter.nickname || "",
      profileImage: fighter.profileImage,
      regionId: fighter.regionId,
      regionName: fighter.regionName,
      isChampion: fighter.isChampion,
      totalMatches: fighter.totalMatches,
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      yellowCards: fighter.yellowCards,
      redCards: fighter.redCards,
      winRate: fighter.winRate,
    }));

    return {
      success: true,
      data: {
        edition: editionInfo,
        regions: cleanedRegions,
        fighters: cleanedFighters,
        summary: {
          totalRegions: editionInfo.totalRegions,
          totalFighters: editionInfo.totalFighters,
          totalUnbeatenFighters: editionInfo.totalUnbeatenFighters,
          eliminatedRegions: cleanedRegions.filter((r: any) => r.isEliminated)
            .length,
          activeRegions: cleanedRegions.filter((r: any) => !r.isEliminated)
            .length,
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
        ) as draws
        
      FROM edition_fighters fe
      LEFT JOIN edition_matches em ON 
        (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
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
        COUNT(DISTINCT fs.fighter_id) FILTER (WHERE fs.is_eliminated = false) as unbeaten_fighters,
        COUNT(DISTINCT ef.fighter_id) FILTER (WHERE ef.is_champion = true) as champion_fighters,
        
        -- Stats des matchs
        COALESCE(SUM(fs.wins), 0) as total_wins,
        COALESCE(SUM(fs.losses), 0) as total_losses,
        COALESCE(SUM(fs.draws), 0) as total_draws
        
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
        'championFighters', COALESCE(ra.champion_fighters, 0),
        'unbeatenFighters', COALESCE(ra.unbeaten_fighters, 0),
        'totalWins', COALESCE(ra.total_wins, 0),
        'totalLosses', COALESCE(ra.total_losses, 0),
        'totalDraws', COALESCE(ra.total_draws, 0),
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
  return results.map((r) => ({
    ...r,
    points: Number(r.points || 0),
    unbeatenRatio: Number(r.unbeatenRatio || 0),
    stats: {
      ...r.stats,
      totalFighters: Number(r.stats?.totalFighters || 0),
      championFighters: Number(r.stats?.championFighters || 0),
      unbeatenFighters: Number(r.stats?.unbeatenFighters || 0),
      totalWins: Number(r.stats?.totalWins || 0),
      totalLosses: Number(r.stats?.totalLosses || 0),
      totalDraws: Number(r.stats?.totalDraws || 0),
      winRate: Number(r.stats?.winRate || 0),
    },
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
        
        -- Cartons
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'yellow') as yellow_cards,
        COUNT(DISTINCT fc.id) FILTER (WHERE fc.card_type = 'red') as red_cards
        
      FROM edition_fighters fe
      LEFT JOIN edition_matches em ON 
        (em.fighter1_id = fe.fighter_id OR em.fighter2_id = fe.fighter_id)
      LEFT JOIN fighter_cards fc ON fc.match_id = em.id AND fc.fighter_id = fe.fighter_id
      WHERE fe.edition_id = $1
      GROUP BY fe.fighter_id, fe.region_id
    )
    SELECT 
      fe.fighter_id as "fighterId",
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.profile_image as "profileImage",
      fe.region_id as "regionId",
      r.name as "regionName",
      fe.is_champion as "isChampion",
      
      -- Statistiques
      COALESCE(stats.total_matches, 0) as "totalMatches",
      COALESCE(stats.wins, 0) as "wins",
      COALESCE(stats.losses, 0) as "losses",
      COALESCE(stats.draws, 0) as "draws",
      COALESCE(stats.yellow_cards, 0) as "yellowCards",
      COALESCE(stats.red_cards, 0) as "redCards",
      
      -- Stats dérivées
      CASE 
        WHEN COALESCE(stats.total_matches, 0) > 0 
        THEN ROUND((COALESCE(stats.wins, 0) * 100.0) / COALESCE(stats.total_matches, 0), 1)
        ELSE 0 
      END as "winRate"

    FROM edition_fighters fe
    JOIN fighters f ON fe.fighter_id = f.id
    JOIN regions r ON fe.region_id = r.id
    LEFT JOIN fighter_match_stats stats ON fe.fighter_id = stats.fighter_id
    WHERE fe.edition_id = $1
    ORDER BY 
      fe.is_champion DESC,
      fe.is_eliminated ASC,
      COALESCE(stats.wins, 0) DESC,
      COALESCE(stats.total_matches, 0) DESC
  `;

  const fighters = await query(sql, [editionId]);

  // Forcer la conversion en nombres
  return fighters.map((f) => ({
    ...f,
    totalMatches: Number(f.totalMatches || 0),
    wins: Number(f.wins || 0),
    losses: Number(f.losses || 0),
    draws: Number(f.draws || 0),
    yellowCards: Number(f.yellowCards || 0),
    redCards: Number(f.redCards || 0),
    winRate: Number(f.winRate || 0),
    isChampion: Boolean(f.isChampion),
  }));
}

function rankRegions(regions: any[]) {
  // S'assurer que toutes les valeurs numériques sont des nombres
  const regionsWithNumbers = regions.map((region) => ({
    ...region,
    points: Number(region.points || 0),
    unbeatenRatio: Number(region.unbeatenRatio || 0),
    stats: {
      ...region.stats,
      totalFighters: Number(region.stats?.totalFighters || 0),
      unbeatenFighters: Number(region.stats?.unbeatenFighters || 0),
      totalWins: Number(region.stats?.totalWins || 0),
      championFighters: Number(region.stats?.championFighters || 0),
    },
  }));

  // Trier les régions selon plusieurs critères
  regionsWithNumbers.sort((a, b) => {
    // Priorité: éliminé ou non (non éliminé d'abord)
    if (a.isEliminated !== b.isEliminated)
      return (a.isEliminated ? 1 : 0) - (b.isEliminated ? 1 : 0);

    // Points totaux
    if (a.points !== b.points) return b.points - a.points;

    // Nombre de lutteurs invaincus (is_eliminated = false)
    if (a.stats.unbeatenFighters !== b.stats.unbeatenFighters)
      return b.stats.unbeatenFighters - a.stats.unbeatenFighters;

    // Ratio de lutteurs invaincus
    if (a.unbeatenRatio !== b.unbeatenRatio)
      return b.unbeatenRatio - a.unbeatenRatio;

    // Nombre de victoires total
    if (a.stats.totalWins !== b.stats.totalWins)
      return b.stats.totalWins - a.stats.totalWins;

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
        m.sub_group_id as "subGroupId",
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
        (SELECT p.edition_id FROM phases p 
         JOIN phase_groups pg ON p.id = pg.phase_id
         JOIN sub_groups sg ON pg.id = sg.group_id
         WHERE sg.id = m.sub_group_id) as "editionId",
        
        -- Fighter 1
        m.fighter1_id as "fighter1Id",
        f1.first_name as "fighter1FirstName",
        f1.last_name as "fighter1LastName",
        f1.nickname as "fighter1Nickname",
        f1.profile_image as "fighter1ProfileImage",
        r1.name as "fighter1RegionName",
        
        -- Fighter 2
        m.fighter2_id as "fighter2Id",
        f2.first_name as "fighter2FirstName",
        f2.last_name as "fighter2LastName",
        f2.nickname as "fighter2Nickname",
        f2.profile_image as "fighter2ProfileImage",
        r2.name as "fighter2RegionName",
        
        -- Result
        m.winner_fighter_id as "winnerFighterId",
        m.loser_fighter_id as "loserFighterId"
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
      WHERE m.id = $1
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

    const rawMatch = result[0];
    const formattedMatch = await enrichMatchData(rawMatch);

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
