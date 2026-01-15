"use server";

import { query } from "@/lib/db/neon-client";
import { NextRequest, NextResponse } from "next/server";

export async function getEditionRegions(editionId: number) {
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

    // Récupérer les informations de base de l'édition
    const editionInfo = await getEditionInfo(editionId);

    // Récupérer les régions participantes
    const regions = await getRegionsForEdition(editionId);

    // Récupérer les lutteurs de l'édition avec leurs statistiques
    const fighters = await getFightersForEdition(editionId);

    // Calculer les statistiques pour chaque région
    const regionsWithStats = calculateRegionStats(regions, fighters);

    // Organiser les lutteurs invaincus
    const unbeatenFighters = getUnbeatenFighters(fighters);

    // Calculer le classement des régions
    const rankedRegions = rankRegions(regionsWithStats);

    return {
      success: true,
      data: {
        edition: editionInfo,
        regions: rankedRegions,
        fighters,
        unbeatenFighters,
        summary: {
          totalRegions: regions.length,
          totalFighters: fighters.length,
          unbeatenFighters: unbeatenFighters.length,
          eliminatedRegions: regionsWithStats.filter((r: any) => r.isEliminated)
            .length,
          activeRegions: regionsWithStats.filter((r: any) => !r.isEliminated)
            .length,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Données de l'édition récupérées avec succès",
    };
  } catch (error) {
    console.error("Error in getEditionRegions:", error);
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
      c.name as "competitionName"
    FROM competition_editions e
    JOIN competitions c ON e.competition_id = c.id
    WHERE e.id = $1
  `;

  const result = await query(sql, [editionId]);
  return result[0] || null;
}

async function getRegionsForEdition(editionId: number) {
  const sql = `
    SELECT 
      re.id,
      re.region_id as "regionId",
      r.name as "regionName",
      r.code as "regionCode",
      r.color as "regionColor",
      r.stadium_name as "stadiumName",
      re.points,
      re.is_eliminated as "isEliminated",
      re.created_at as "createdAt"
    FROM edition_regions re
    JOIN regions r ON re.region_id = r.id
    WHERE re.edition_id = $1
    ORDER BY re.points DESC, r.name ASC
  `;

  return await query(sql, [editionId]);
}

async function getFightersForEdition(editionId: number) {
  const sql = `
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
      f.region_id as "regionId",
      r.name as "regionName",
      r.color as "regionColor",
      fe.is_eliminated as "isEliminated",
      fe.is_champion as "isChampion",
      fe.created_at as "createdAt",
      
      -- Statistiques du lutteur dans cette édition
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
      (COALESCE(stats.total_matches, 0) - COALESCE(stats.losses, 0)) as "unbeatenMatches"

    FROM edition_fighters fe
    JOIN fighters f ON fe.fighter_id = f.id
    JOIN regions r ON f.region_id = r.id
    LEFT JOIN (
      SELECT 
          m.fighter1_id as fighter_id,
          COUNT(*) as total_matches,
          SUM(CASE WHEN m.winner_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id AND m.match_result = 'terrace' THEN 1 ELSE 0 END) as terraces,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as been_terraced,
          SUM(CASE WHEN EXISTS (
              SELECT 1 FROM fighter_cards fc 
              WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter1_id AND fc.card_type = 'yellow'
          ) THEN 1 ELSE 0 END) as yellow_cards,
          SUM(CASE WHEN EXISTS (
              SELECT 1 FROM fighter_cards fc 
              WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter1_id AND fc.card_type = 'red'
          ) THEN 1 ELSE 0 END) as red_cards
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE p.edition_id = $1
      GROUP BY m.fighter1_id
      
      UNION ALL
      
      SELECT 
          m.fighter2_id as fighter_id,
          COUNT(*) as total_matches,
          SUM(CASE WHEN m.winner_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id AND m.match_result = 'terrace' THEN 1 ELSE 0 END) as terraces,
          SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as been_terraced,
          SUM(CASE WHEN EXISTS (
              SELECT 1 FROM fighter_cards fc 
              WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter2_id AND fc.card_type = 'yellow'
          ) THEN 1 ELSE 0 END) as yellow_cards,
          SUM(CASE WHEN EXISTS (
              SELECT 1 FROM fighter_cards fc 
              WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter2_id AND fc.card_type = 'red'
          ) THEN 1 ELSE 0 END) as red_cards
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE p.edition_id = $1
      GROUP BY m.fighter2_id
    ) stats ON fe.fighter_id = stats.fighter_id
    WHERE fe.edition_id = $1
    ORDER BY 
      fe.is_champion DESC,
      fe.is_eliminated ASC,
      stats.wins DESC,
      stats.total_matches DESC
  `;

  return await query(sql, [editionId]);
}

function calculateRegionStats(regions: any[], fighters: any[]) {
  return regions.map((region) => {
    const regionId = region.regionId;

    // Filtrer les lutteurs de cette région
    const regionFighters = fighters.filter((f) => f.regionId === regionId);

    // Calculer les statistiques
    const totalFighters = regionFighters.length;
    const unbeatenFighters = regionFighters.filter(
      (f) => f.losses === 0
    ).length;
    const eliminatedFighters = regionFighters.filter(
      (f) => f.isEliminated
    ).length;
    const championFighters = regionFighters.filter((f) => f.isChampion).length;

    const totalWins = regionFighters.reduce((sum, f) => sum + f.wins, 0);
    const totalLosses = regionFighters.reduce((sum, f) => sum + f.losses, 0);
    const totalTerraces = regionFighters.reduce(
      (sum, f) => sum + f.terraces,
      0
    );
    const totalBeenTerraced = regionFighters.reduce(
      (sum, f) => sum + f.beenTerraced,
      0
    );

    // Ajouter les statistiques calculées
    region.stats = {
      totalFighters,
      unbeatenFighters,
      eliminatedFighters,
      championFighters,
      totalWins,
      totalLosses,
      totalTerraces,
      totalBeenTerraced,
      winRate:
        totalWins + totalLosses > 0
          ? Math.round(((totalWins * 100) / (totalWins + totalLosses)) * 10) /
            10
          : 0,
    };

    // Calculer le ratio de lutteurs invaincus
    region.unbeatenRatio =
      totalFighters > 0
        ? Math.round(((unbeatenFighters * 100) / totalFighters) * 10) / 10
        : 0;

    return region;
  });
}

function getUnbeatenFighters(fighters: any[]) {
  const unbeaten = fighters.filter((f) => f.losses === 0);

  // Trier par nombre de terraces (x0 à x7)
  unbeaten.sort((a, b) => {
    // Priorité: champion > nombre de terraces > nombre de matchs > win rate
    if (a.isChampion !== b.isChampion) return b.isChampion - a.isChampion;
    if (a.terraces !== b.terraces) return b.terraces - a.terraces;
    if (a.totalMatches !== b.totalMatches)
      return b.totalMatches - a.totalMatches;
    return b.winRate - a.winRate;
  });

  return unbeaten;
}

function rankRegions(regions: any[]) {
  // Trier les régions selon plusieurs critères
  regions.sort((a, b) => {
    // Priorité: éliminé ou non
    if (a.isEliminated !== b.isEliminated)
      return (a.isEliminated ? 1 : 0) - (b.isEliminated ? 1 : 0); // Non éliminé d'abord

    // Points totaux
    if (a.points !== b.points) return b.points - a.points;

    // Nombre de lutteurs invaincus
    if (a.stats.unbeatenFighters !== b.stats.unbeatenFighters)
      return b.stats.unbeatenFighters - a.stats.unbeatenFighters;

    // Ratio de lutteurs invaincus
    if (a.unbeatenRatio !== b.unbeatenRatio)
      return b.unbeatenRatio - a.unbeatenRatio;

    // Nombre de victoires total
    if (a.stats.totalWins !== b.stats.totalWins)
      return b.stats.totalWins - a.stats.totalWins;

    // Nombre de terraces
    if (a.stats.totalTerraces !== b.stats.totalTerraces)
      return b.stats.totalTerraces - a.stats.totalTerraces;

    // Nombre de champions
    return b.stats.championFighters - a.stats.championFighters;
  });

  // Ajouter le rang
  regions.forEach((region, index) => {
    region.rank = index + 1;
  });

  return regions;
}
