"use server";

import { query } from "@/lib/db/neon-client";
import { formatDateTime, formatDuration } from "@/utils/duration";

export async function getMobileEditionById(editionId: number) {
  try {
    // Check if edition exists
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

    // Fetch basic edition info
    const editionInfo = await getEditionInfo(editionId);

    // Fetch phases, groups, subgroups
    const phases = await getPhasesWithGroupsAndSubgroups(editionId);

    // Fetch live match
    const liveMatch = await getLiveMatchForEdition(editionId);

    return {
      success: true,
      data: {
        edition: {
          ...editionInfo,
          phases,
          liveMatch,
        },
      },
      message: "Édition récupérée avec succès",
    };
  } catch (error) {
    console.error("Error in getMobileEditionById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération de l'édition",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function getMobileLatestEdition() {
  try {
    // Récupérer la dernière édition active avec les nouveaux champs
    const latestEditionSql = `
      SELECT 
        ce.id,
        ce.edition_number as "editionNumber",
        ce.year,
        ce.theme,
        ce.start_date as "startDate",
        ce.end_date as "endDate",
        ce.is_active as "isActive",
        c.name as "competitionName",
        r.name as "regionName",
        r.stadium_name as "stadiumName",
        -- Statistiques des participants
        (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = ce.id AND ef.is_champion = TRUE) as "championCount",
        (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = ce.id AND ef.is_eliminated = TRUE) as "eliminatedFightersCount",
        (SELECT COUNT(*) FROM edition_regions er WHERE er.edition_id = ce.id AND er.is_eliminated = TRUE) as "eliminatedRegionsCount"
      FROM competition_editions ce
      JOIN competitions c ON ce.competition_id = c.id
      LEFT JOIN regions r ON ce.region_id = r.id
      WHERE ce.is_active = TRUE
      ORDER BY ce.created_at DESC
      LIMIT 1
    `;

    const latestResult = await query(latestEditionSql);

    if (latestResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Aucune édition active trouvée",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const editionId = latestResult[0].id;

    // Utiliser la fonction corrigée pour récupérer les détails
    return await getMobileEditionById(editionId);
  } catch (error) {
    console.error("Error in getMobileLatestEdition:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération de la dernière édition",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Fonctions auxiliaires
async function getEditionInfo(editionId: number) {
  const sql = `
    SELECT 
      ce.id,
      ce.edition_number as "editionNumber",
      ce.year,
      ce.theme,
      r.name as "regionName",
      ce.start_date as "startDate",
      ce.end_date as "endDate",
      ce.winner_fighter_id as "winnerFighterId",
      f.first_name as "winnerFirstName",
      f.last_name as "winnerLastName",
      f.nickname as "winnerNickname",
      c.id as "competitionId",
      c.name as "competitionName"
    FROM competition_editions ce
    JOIN competitions c ON ce.competition_id = c.id
    LEFT JOIN regions r ON ce.region_id = r.id
    LEFT JOIN fighters f ON ce.winner_fighter_id = f.id
    WHERE ce.id = $1
  `;

  const result = await query(sql, [editionId]);
  if (!result || result.length === 0) {
    throw new Error("Edition not found");
  }
  const edition = result[0];

  // Structurer les données de la compétition
  edition.competition = {
    id: edition.competitionId,
    name: edition.competitionName,
  };

  // Structurer les données du vainqueur
  edition.winner = edition.winnerFighterId
    ? {
        id: edition.winnerFighterId,
        firstName: edition.winnerFirstName,
        lastName: edition.winnerLastName,
        nickname: edition.winnerNickname,
      }
    : null;

  // Nettoyer les données redondantes
  const fieldsToDelete = [
    "competitionId",
    "competitionName",
    "winnerFighterId",
    "winnerFirstName",
    "winnerLastName",
    "winnerNickname",
  ];

  fieldsToDelete.forEach((field) => delete edition[field]);

  return edition;
}

// Modifions d'abord la fonction getPhasesWithGroupsAndSubgroups
async function getPhasesWithGroupsAndSubgroups(editionId: number) {
  // Récupérer les phases
  const phasesSql = `
    SELECT 
      p.id,
      p.name,
      p.phase_order as "phaseOrder",
      p.phase_type as "phaseType",
      p.is_active as "isActive",
      p.start_date as "startDate",
      p.end_date as "endDate",
      p.is_completed as "isCompleted"
    FROM phases p
    WHERE p.edition_id = $1
    ORDER BY p.phase_order
  `;

  const phases = await query(phasesSql, [editionId]);

  // Pour chaque phase, récupérer les groupes et sous-groupes
  for (const phase of phases) {
    phase.groups = await getGroupsWithSubgroups(phase.id, phase.phaseType);
  }

  return phases;
}

// Modifions getGroupsWithSubgroups pour passer le phaseType
async function getGroupsWithSubgroups(phaseId: number, phaseType: string) {
  // Fetch groups
  const groupsSql = `
    SELECT 
      pg.id,
      pg.name,
      pg.group_order as "groupOrder",
      pg.is_active as "isActive",
      pg.date as "date",
      pg.is_completed as "isCompleted"
    FROM phase_groups pg
    WHERE pg.phase_id = $1
    ORDER BY pg.group_order
  `;

  const groups = await query(groupsSql, [phaseId]);

  // For each group, fetch subgroups with matches if phase type is not 'group'
  for (const group of groups) {
    if (phaseType !== "group") {
      // Pour les phases knockout, quarterfinal, semifinal, final, qualification
      group.subGroups = await getSubgroupsWithMatchesForGroup(group.id);
    } else {
      // Pour les phases de type 'group', garder le comportement original
      group.subGroups = await getSubgroupsForGroup(group.id);
    }
  }

  return groups;
}

// Nouvelle fonction pour récupérer les sous-groupes avec leurs matches
async function getSubgroupsWithMatchesForGroup(groupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.sub_group_order as "subGroupOrder",
      sg.period,
      sg.score_region1 as "scoreRegion1",
      sg.score_region2 as "scoreRegion2",
      sg.nulls,
      sg.status,
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r2.name as "region2Name",
      r1.flag_image as "region1FlagImage",
      r2.flag_image as "region2FlagImage",
      b1.color as "beltRegion1Color",
      b2.color as "beltRegion2Color",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    WHERE sg.group_id = $1
    ORDER BY sg.sub_group_order
  `;

  const subGroups = await query(sql, [groupId]);

  // Pour chaque sous-groupe, récupérer les matches
  for (const subGroup of subGroups) {
    subGroup.matches = await getMatchesForSubGroup(subGroup.id);

    // Format scores
    subGroup.scores = {
      region1: subGroup.scoreRegion1,
      region2: subGroup.scoreRegion2,
      nulls: subGroup.nulls,
    };
    subGroup.matchStatus = subGroup.status;
  }

  return subGroups;
}

// Fonction pour récupérer les matches d'un sous-groupe (format simplifié comme demandé)
async function getMatchesForSubGroup(subGroupId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time2 as "startTime2",
      m.status,
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      
      -- Fighter 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      m.fighter1_initial_state as "fighter1InitialState",
      r1.name as "fighter1RegionName",
      r1.flag_image as "fighter1RegionFlagImage",
      
      -- Fighter 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      r2.name as "fighter2RegionName",
      r2.flag_image as "fighter2RegionFlagImage",
      m.fighter2_initial_state as "fighter2InitialState",
      
      -- Winner
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Winner fighter details
      wf.first_name as "winnerFirstName",
      wf.last_name as "winnerLastName",
      wf.nickname as "winnerNickname",
      wf.profile_image as "winnerProfileImage",
      wf.region_id as "winnerRegionId",
      wr.name as "winnerRegionName",
      
      -- Loser fighter details
      lf.first_name as "loserFirstName",
      lf.last_name as "loserLastName",
      lf.nickname as "loserNickname",
      lf.profile_image as "loserProfileImage",
      lf.region_id as "loserRegionId",
      lr.name as "loserRegionName",
        
      -- Cards count
      (SELECT COUNT(*) FROM fighter_cards fc WHERE fc.match_id = m.id) as total_cards,
      (SELECT COUNT(*) FROM fighter_cards fc WHERE fc.match_id = m.id AND fc.card_type = 'yellow') as yellow_cards,
      (SELECT COUNT(*) FROM fighter_cards fc WHERE fc.match_id = m.id AND fc.card_type = 'red') as red_cards
      
    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
    LEFT JOIN regions wr ON wf.region_id = wr.id
    LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
    LEFT JOIN regions lr ON lf.region_id = lr.id
    WHERE m.sub_group_id = $1
    ORDER BY m.match_number ASC
  `;

  const matches = await query(sql, [subGroupId]);

  // Formater chaque match selon le modèle demandé
  return matches.map((match) => {
    // Structurer les données des fighters
    const fighter1 = {
      id: match.fighter1Id,
      firstName: match.fighter1FirstName,
      lastName: match.fighter1LastName,
      nickname: match.fighter1Nickname || "",
      profileImage: match.fighter1ProfileImage,
      region: {
        id: match.fighter1RegionId,
        name: match.fighter1RegionName,
      },
      initialState: match.fighter1InitialState,
    };

    const fighter2 = {
      id: match.fighter2Id,
      firstName: match.fighter2FirstName,
      lastName: match.fighter2LastName,
      nickname: match.fighter2Nickname || "",
      profileImage: match.fighter2ProfileImage,
      region: {
        id: match.fighter2RegionId,
        name: match.fighter2RegionName,
      },
      initialState: match.fighter2InitialState,
    };

    // Structurer le résultat
    let winner = null;
    let loser = null;

    if (match.winnerFighterId) {
      winner = {
        id: match.winnerFighterId,
        firstName: match.winnerFirstName,
        lastName: match.winnerLastName,
        nickname: match.winnerNickname || "",
        profileImage: match.winnerProfileImage,
        region: {
          id: match.winnerRegionId,
          name: match.winnerRegionName,
          flagImage: match.winnerRegionFlagImage,
        },
      };
    }

    if (match.loserFighterId) {
      loser = {
        id: match.loserFighterId,
        firstName: match.loserFirstName,
        lastName: match.loserLastName,
        nickname: match.loserNickname || "",
        profileImage: match.loserProfileImage,
        region: {
          id: match.loserRegionId,
          name: match.loserRegionName,
          flagImage: match.loserRegionFlagImage,
        },
      };
    }

    // Formater le match selon le modèle demandé
    const formattedMatch = {
      id: match.id,
      matchNumber: match.matchNumber,
      matchDate: match.matchDate,
      startTime2: match.startTime2,
      status: match.status,
      totalDuration: formatDuration(match.totalDuration),
      breakCount: match.breakCount || 0,
      videoUrl: match.videoUrl,
      liveStreamUrl: match.liveStreamUrl,
      subGroupId: match.subGroupId,
      notes: match.notes,
      fighters: {
        fighter1,
        fighter2,
      },
      result: {
        winner,
        loser,
      },
      // stats: {
      //   totalCards: match.total_cards,
      //   yellowCards: match.yellow_cards,
      //   redCards: match.red_cards,
      //   duration: {},
      //   breaks: match.breakCount,
      // },
      allCards: [], // Les cartes détaillées peuvent être ajoutées dans une requête séparée si nécessaire
    };

    return formattedMatch;
  });
}

async function getSubgroupsForGroup(groupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.sub_group_order as "subGroupOrder",
      sg.period,
      sg.score_region1 as "scoreRegion1",
      sg.score_region2 as "scoreRegion2",
      sg.nulls,
      sg.status,
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r2.name as "region2Name",
      r1.flag_image as "region1FlagImage",
      r2.flag_image as "region2FlagImage",
      b1.color as "beltRegion1Color",
      b2.color as "beltRegion2Color",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    WHERE sg.group_id = $1
    ORDER BY sg.sub_group_order
  `;

  const subGroups = await query(sql, [groupId]);

  // Format subgroups with new fields
  return subGroups.map((sg) => ({
    ...sg,
    scores: {
      region1: sg.scoreRegion1,
      region2: sg.scoreRegion2,
      nulls: sg.nulls,
    },
    matchStatus: sg.status,
  }));
}

async function getLiveMatchForEdition(editionId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.status,
      m.start_time2 as "startTime",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.audience_count as "audienceCount",
      m.video_url as "videoUrl",
      m.notes,
      m.sub_group_id as "subGroupId",
      
      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      r1.name as "fighter1RegionName",
      r1.flag_image as "fighter1RegionFlagImage",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      r2.name as "fighter2RegionName",
      r2.flag_image as "fighter2RegionFlagImage",
      
      -- Vainqueur
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId"

    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    WHERE p.edition_id = $1 
    AND m.status IN ('live', 'round_break', 'reclamation')
    ORDER BY m.match_date DESC, m.start_time2 DESC
    LIMIT 1
  `;

  const result = await query(sql, [editionId]);
  const liveMatch = result[0];

  if (liveMatch) {
    // Formater les données du match en live
    liveMatch.fighters = {
      fighter1: {
        id: liveMatch.fighter1Id,
        firstName: liveMatch.fighter1FirstName,
        lastName: liveMatch.fighter1LastName,
        nickname: liveMatch.fighter1Nickname,
        profileImage: liveMatch.fighter1ProfileImage,
        regionName: liveMatch.fighter1RegionName,
        regionFlagImage: liveMatch.fighter1RegionFlagImage,
        initialState: null,
      },
      fighter2: {
        id: liveMatch.fighter2Id,
        firstName: liveMatch.fighter2FirstName,
        lastName: liveMatch.fighter2LastName,
        nickname: liveMatch.fighter2Nickname,
        profileImage: liveMatch.fighter2ProfileImage,
        regionName: liveMatch.fighter2RegionName,
        regionFlagImage: liveMatch.fighter2RegionFlagImage,
        initialState: null,
      },
    };
    liveMatch.editionId = editionId;

    liveMatch.result = {
      winnerId: liveMatch.winnerFighterId,
      loserId: liveMatch.loserFighterId,
    };

    // Récupérer les cartons pour le match live
    const cardsSql = `
      SELECT id, fighter_id as "fighterId", card_type as "cardType"
      FROM fighter_cards
      WHERE match_id = $1
    `;
    liveMatch.allCards = await query(cardsSql, [liveMatch.id]);

    // Nettoyer les données redondantes
    const fieldsToDelete = [
      "fighter1Id",
      "fighter1FirstName",
      "fighter1LastName",
      "fighter1Nickname",
      "fighter1ProfileImage",
      "fighter1RegionName",
      "fighter1RegionFlagImage",
      "fighter2Id",
      "fighter2FirstName",
      "fighter2LastName",
      "fighter2Nickname",
      "fighter2ProfileImage",
      "fighter2RegionName",
      "fighter2RegionFlagImage",
      "winnerFighterId",
      "loserFighterId",
    ];
    fieldsToDelete.forEach((field) => delete liveMatch[field]);
  }

  return liveMatch ?? null;
}

export async function getEditionStats(editionId: number) {
  const sql = `
    SELECT 
      -- Statistiques des lutteurs
      (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = $1 AND ef.is_champion = TRUE) as champion_count,
      (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = $1 AND ef.is_eliminated = TRUE) as eliminated_fighters,
      (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = $1 AND ef.status = 'qualified') as qualified_fighters,
      
      -- Statistiques des régions
      (SELECT COUNT(*) FROM edition_regions er WHERE er.edition_id = $1 AND er.is_eliminated = TRUE) as eliminated_regions,
      (SELECT COUNT(*) FROM edition_regions er WHERE er.edition_id = $1 AND er.status = 'approved') as approved_regions,
      (SELECT COALESCE(SUM(er.points), 0) FROM edition_regions er WHERE er.edition_id = $1) as total_points,
      
      -- Statistiques des matchs
      (SELECT COUNT(*) FROM matches m 
        JOIN sub_groups sg ON m.sub_group_id = sg.id
        JOIN phase_groups pg ON sg.group_id = pg.id
        JOIN phases p ON pg.phase_id = p.id
        WHERE p.edition_id = $1) as total_matches,
        
      (SELECT COUNT(*) FROM matches m 
        JOIN sub_groups sg ON m.sub_group_id = sg.id
        JOIN phase_groups pg ON sg.group_id = pg.id
        JOIN phases p ON pg.phase_id = p.id
        WHERE p.edition_id = $1 AND m.status = 'completed') as completed_matches,
        
      (SELECT COUNT(*) FROM matches m 
        JOIN sub_groups sg ON m.sub_group_id = sg.id
        JOIN phase_groups pg ON sg.group_id = pg.id
        JOIN phases p ON pg.phase_id = p.id
        WHERE p.edition_id = $1 AND m.status IN ('live', 'round_break', 'reclamation')) as live_matches
  `;

  const result = await query(sql, [editionId]);
  return result[0];
}

// Fonction pour récupérer les champions d'une édition
export async function getEditionChampions(editionId: number) {
  const sql = `
    SELECT 
      ef.id,
      ef.is_champion as "isChampion",
      ef.is_eliminated as "isEliminated",
      ef.status,
      f.id as "fighterId",
      f.first_name as "firstName",
      f.last_name as "lastName",
      f.nickname,
      f.profile_image as "profileImage",
      f.ranking,
      r.id as "regionId",
      r.name as "regionName",
      r.flag_image as "regionFlagImage",
      r.color as "regionColor"
    FROM edition_fighters ef
    JOIN fighters f ON ef.fighter_id = f.id
    LEFT JOIN regions r ON f.region_id = r.id
    WHERE ef.edition_id = $1 
      AND ef.is_champion = TRUE
    ORDER BY f.ranking DESC
  `;

  return await query(sql, [editionId]);
}

// Get editions a region or fighter participated in
export async function getParticipatedEditions(
  id: number,
  type: "region" | "fighter",
) {
  let sql: string;
  const params: any[] = [id];

  if (type === "region") {
    sql = `
      SELECT DISTINCT
        ce.id,
        ce.year,
        ce.edition_number as "editionNumber",
        c.name as "competitionName",
        r.name as "regionName"
      FROM competition_editions ce
      JOIN competitions c ON ce.competition_id = c.id
      JOIN edition_regions er ON er.edition_id = ce.id AND er.region_id = $1
      LEFT JOIN regions r ON er.region_id = r.id
      ORDER BY ce.year DESC, ce.edition_number DESC
    `;
  } else {
    // fighter
    sql = `
 SELECT DISTINCT
      ce.id,
      ce.year,
      ce.edition_number as "editionNumber",
      c.name as "competitionName",
      r.name as "regionName",
      r.flag_image as "regionFlagImage"
    FROM competition_editions ce
    JOIN competitions c ON ce.competition_id = c.id
    JOIN edition_fighters ef ON ef.edition_id = ce.id AND ef.fighter_id = $1
    LEFT JOIN regions r ON ce.region_id = r.id
    ORDER BY ce.year DESC, ce.edition_number DESC
    `;
  }
  return await query(sql, params) ?? null;
}
