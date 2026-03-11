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
      ORDER BY ce.year DESC, ce.edition_number DESC
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
      ce.region_id as "regionId",
      r.name as "regionName",
      r.stadium_name as "stadiumName",
      r.stadium_image as "stadiumImage",
      r.color as "regionColor",
      ce.start_date as "startDate",
      ce.end_date as "endDate",
      ce.winner_fighter_id as "winnerFighterId",
      f.first_name as "winnerFirstName",
      f.last_name as "winnerLastName",
      f.nickname as "winnerNickname",
      f.profile_image as "winnerProfileImage",
      ce.winner_region_id as "winnerRegionId",
      wr.name as "winnerRegionName",
      wr.color as "winnerRegionColor",
      ce.is_active as "isActive",
      ce.total_participants as "totalParticipants",
      ce.prize_pool as "prizePool",
      ce.registration_deadline as "registrationDeadline",
      ce.created_at as "createdAt",
      c.id as "competitionId",
      c.name as "competitionName",
      c.slug as "competitionSlug",
      c.description as "competitionDescription",
      c.featured_image as "competitionFeaturedImage",
      c.status as "competitionStatus",
      -- Nouveaux champs de statistiques
      (SELECT COUNT(*) FROM edition_fighters ef WHERE ef.edition_id = ce.id AND ef.is_champion = TRUE) as "championCount",
      (SELECT COUNT(*) FROM edition_regions er WHERE er.edition_id = ce.id AND er.is_eliminated = FALSE) as "activeRegionsCount"
    FROM competition_editions ce
    JOIN competitions c ON ce.competition_id = c.id
    LEFT JOIN regions r ON ce.region_id = r.id
    LEFT JOIN fighters f ON ce.winner_fighter_id = f.id
    LEFT JOIN regions wr ON ce.winner_region_id = wr.id
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
    slug: edition.competitionSlug,
    description: edition.competitionDescription,
    featuredImage: edition.competitionFeaturedImage,
    status: edition.competitionStatus,
  };

  // Structurer les données du vainqueur
  edition.winner = edition.winnerFighterId
    ? {
      fighter: {
        id: edition.winnerFighterId,
        firstName: edition.winnerFirstName,
        lastName: edition.winnerLastName,
        nickname: edition.winnerNickname,
        profileImage: edition.winnerProfileImage,
      },
      region: edition.winnerRegionId
        ? {
          id: edition.winnerRegionId,
          name: edition.winnerRegionName,
          color: edition.winnerRegionColor,
        }
        : null,
    }
    : null;

  // Statistiques de l'édition
  edition.stats = {
    championCount: edition.championCount,
    activeRegionsCount: edition.activeRegionsCount,
    totalParticipants: edition.totalParticipants,
  };

  // Nettoyer les données redondantes
  const fieldsToDelete = [
    "competitionId",
    "competitionName",
    "competitionSlug",
    "competitionDescription",
    "competitionFeaturedImage",
    "competitionStatus",
    "winnerFighterId",
    "winnerFirstName",
    "winnerLastName",
    "winnerNickname",
    "winnerProfileImage",
    "winnerRegionId",
    "winnerRegionName",
    "winnerRegionColor",
    "championCount",
    "activeRegionsCount",
  ];

  fieldsToDelete.forEach((field) => delete edition[field]);

  return edition;
}

async function getPhasesWithGroupsAndSubgroups(editionId: number) {
  // Récupérer les phases
  const phasesSql = `
    SELECT 
      p.id,
      p.name,
      p.phase_order as "phaseOrder",
      p.phase_type as "phaseType",
      p.is_active as "isActive",
      p.description,
      p.start_date as "startDate",
      p.end_date as "endDate",
      p.is_completed as "isCompleted",
      p.created_at as "createdAt"
    FROM phases p
    WHERE p.edition_id = $1
    ORDER BY p.phase_order
  `;

  const phases = await query(phasesSql, [editionId]);

  // Pour chaque phase, récupérer les groupes et sous-groupes
  for (const phase of phases) {
    phase.groups = await getGroupsWithSubgroups(phase.id);
  }

  return phases;
}

async function getGroupsWithSubgroups(phaseId: number) {
  // Fetch groups
  const groupsSql = `
    SELECT 
      pg.id,
      pg.name,
      pg.group_order as "groupOrder",
      pg.is_active as "isActive",
      pg.date as "date",
      pg.description,
      pg.is_completed as "isCompleted",
      pg.created_at as "createdAt"
    FROM phase_groups pg
    WHERE pg.phase_id = $1
    ORDER BY pg.group_order
  `;

  const groups = await query(groupsSql, [phaseId]);

  // For each group, fetch subgroups
  for (const group of groups) {
    group.subGroups = await getSubgroupsForGroup(group.id);
  }

  return groups;
}

async function getSubgroupsForGroup(groupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.sub_group_order as "subGroupOrder",
      sg.description,
      sg.period,
      sg.score_region1 as "scoreRegion1",
      sg.score_region2 as "scoreRegion2",
      sg.nulls,
      sg.status,
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r2.name as "region2Name",
      r1.color as "region1Color",
      r2.color as "region2Color",
      r1.flag_image as "region1FlagImage",
      r2.flag_image as "region2FlagImage",
      sg.belt_region1 as "beltRegion1Id",
      sg.belt_region2 as "beltRegion2Id",
      b1.color as "beltRegion1Color",
      b2.color as "beltRegion2Color",
      sg.main_referee_id as "mainRefereeId",
      ref.first_name as "refereeFirstName",
      ref.last_name as "refereeLastName",
      ref.nickname as "refereeNickname",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive",
      sg.created_at as "createdAt"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    LEFT JOIN referees ref ON sg.main_referee_id = ref.id
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

//Add startTime2 field to the SQL query to fetch live match data
async function getLiveMatchForEdition(editionId: number) {
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
      f1.region_id as "fighter1RegionId",
      r1.name as "fighter1RegionName",
      r1.color as "fighter1RegionColor",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      f2.region_id as "fighter2RegionId",
      r2.name as "fighter2RegionName",
      r2.color as "fighter2RegionColor",
      
      -- Vainqueur
      m.winner_fighter_id as "winnerFighterId",
      
      -- Sous-groupe
      sg.id as "subGroupId",
      sg.name as "subGroupName",
      
      -- Phase et Groupe
      pg.id as "groupId",
      pg.name as "groupName",
      p.id as "phaseId",
      p.name as "phaseName",
      pg.date as "date"

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
    ORDER BY m.match_date DESC, m.start_time DESC, m.start_time2 DESC
    LIMIT 1
  `;

  const result = await query(sql, [editionId]);
  const liveMatch = result[0];

  if (liveMatch) {
    // Formater les durées et heures
    const formattedDuration = formatDuration(liveMatch.totalDuration);
    const formattedStartTime = formatDateTime(liveMatch.matchDate, liveMatch.startTime);
    const formattedEndTime = formatDateTime(liveMatch.matchDate, liveMatch.endTime);
    
    // Mettre à jour avec les valeurs formatées
    liveMatch.totalDuration = formattedDuration;
    liveMatch.startTime = formattedStartTime;
    liveMatch.endTime = liveMatch.endTime;
        liveMatch.startTime2 = liveMatch.startTime2; // NOUVEAU - timestamp ISO complet

    
    // Formater les données du match en live
    liveMatch.fighters = {
      fighter1: {
        id: liveMatch.fighter1Id,
        firstName: liveMatch.fighter1FirstName,
        lastName: liveMatch.fighter1LastName,
        nickname: liveMatch.fighter1Nickname,
        profileImage: liveMatch.fighter1ProfileImage,
        region: {
          id: liveMatch.fighter1RegionId,
          name: liveMatch.fighter1RegionName,
          color: liveMatch.fighter1RegionColor,
        },
      },
      fighter2: {
        id: liveMatch.fighter2Id,
        firstName: liveMatch.fighter2FirstName,
        lastName: liveMatch.fighter2LastName,
        nickname: liveMatch.fighter2Nickname,
        profileImage: liveMatch.fighter2ProfileImage,
        region: {
          id: liveMatch.fighter2RegionId,
          name: liveMatch.fighter2RegionName,
          color: liveMatch.fighter2RegionColor,
        },
      },
    };

    // Nettoyer les données redondantes
    delete liveMatch.fighter1Id;
    delete liveMatch.fighter1FirstName;
    delete liveMatch.fighter1LastName;
    delete liveMatch.fighter1Nickname;
    delete liveMatch.fighter1ProfileImage;
    delete liveMatch.fighter1RegionId;
    delete liveMatch.fighter1RegionName;
    delete liveMatch.fighter1RegionColor;
    delete liveMatch.fighter2Id;
    delete liveMatch.fighter2FirstName;
    delete liveMatch.fighter2LastName;
    delete liveMatch.fighter2Nickname;
    delete liveMatch.fighter2ProfileImage;
    delete liveMatch.fighter2RegionId;
    delete liveMatch.fighter2RegionName;
    delete liveMatch.fighter2RegionColor;
  }

  return liveMatch;
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
export async function getParticipatedEditions(id: number, type: 'region' | 'fighter') {
  let sql: string;
  const params: any[] = [id];

  if (type === 'region') {
    sql = `
      SELECT DISTINCT
        ce.id,
        ce.year,
        ce.edition_number as "editionNumber",
        r.name as "regionName"
      FROM competition_editions ce
      JOIN edition_regions er ON er.edition_id = ce.id AND er.region_id = $1
      LEFT JOIN regions r ON er.region_id = r.id
      ORDER BY ce.year DESC, ce.edition_number DESC
    `;
  } else { // fighter
    sql = `
 SELECT DISTINCT
      ce.id,
      ce.year,
      ce.edition_number as "editionNumber",
      r.name as "regionName"
    FROM competition_editions ce
    JOIN edition_fighters ef ON ef.edition_id = ce.id AND ef.fighter_id = $1
    LEFT JOIN regions r ON ce.region_id = r.id
    ORDER BY ce.year DESC, ce.edition_number DESC
    `;
  }

  return await query(sql, params);
}