"use server";

import { query } from "@/lib/db/neon-client";
import { formatDateTime, formatDuration } from "@/utils/duration";
import { getCardsForMatches } from "@/utils/match-utils";

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

// Récupère phases -> groupes -> sous-groupes -> matchs -> cartons en un nombre
// constant de requêtes (au lieu d'une requête par nœud).
async function getPhasesWithGroupsAndSubgroups(editionId: number) {
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
  if (!phases.length) return phases;

  const phaseIds = phases.map((phase: any) => phase.id);
  const phaseTypeById = new Map<number, string>(
    phases.map((phase: any) => [Number(phase.id), String(phase.phaseType)]),
  );

  const groupsSql = `
    SELECT 
      pg.id,
      pg.phase_id as "phaseId",
      pg.name,
      pg.group_order as "groupOrder",
      pg.is_active as "isActive",
      pg.date as "date",
      pg.is_completed as "isCompleted"
    FROM phase_groups pg
    WHERE pg.phase_id = ANY($1::int[])
    ORDER BY pg.phase_id, pg.group_order
  `;

  const groups = await query(groupsSql, [phaseIds]);

  const groupsByPhase = new Map<number, any[]>();
  const groupIdToPhaseId = new Map<number, number>();

  for (const group of groups) {
    const phaseId = Number(group.phaseId);
    groupIdToPhaseId.set(Number(group.id), phaseId);
    delete group.phaseId;
    const list = groupsByPhase.get(phaseId);
    if (list) {
      list.push(group);
    } else {
      groupsByPhase.set(phaseId, [group]);
    }
  }

  for (const phase of phases) {
    (phase as any).groups = groupsByPhase.get(Number(phase.id)) ?? [];
  }

  if (!groups.length) return phases;

  const groupIds = groups.map((group: any) => group.id);

  const subgroupsSql = `
    SELECT 
      sg.id,
      sg.group_id as "groupId",
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
    WHERE sg.group_id = ANY($1::int[])
    ORDER BY sg.group_id, sg.sub_group_order
  `;

  const subgroups = await query(subgroupsSql, [groupIds]);

  const subgroupsByGroup = new Map<number, any[]>();
  const subgroupsWithMatches: any[] = [];

  for (const subGroup of subgroups) {
    const groupId = Number(subGroup.groupId);
    const phaseId = groupIdToPhaseId.get(groupId);
    const phaseType = phaseId ? phaseTypeById.get(phaseId) : undefined;
    const isGroupPhase = phaseType === "group";

    // Propriété interne retirée avant la réponse (contrat inchangé).
    delete subGroup.groupId;

    if (!isGroupPhase) {
      subgroupsWithMatches.push(subGroup);
    }

    const list = subgroupsByGroup.get(groupId);
    if (list) {
      list.push(subGroup);
    } else {
      subgroupsByGroup.set(groupId, [subGroup]);
    }
  }

  let matchesBySubGroup = new Map<number, any[]>();
  let cardsByMatch = new Map<number, any[]>();

  if (subgroupsWithMatches.length) {
    const subGroupIds = subgroupsWithMatches.map((sg) => sg.id);
    const matchesSql = `
      SELECT 
        m.id,
        m.sub_group_id as "subGroupId",
        m.match_number as "matchNumber",
        m.match_date as "matchDate",
        m.start_time2 as "startTime",
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
        m.loser_fighter_id as "loserFighterId"
      FROM matches m
      JOIN fighters f1 ON m.fighter1_id = f1.id
      JOIN fighters f2 ON m.fighter2_id = f2.id
      JOIN regions r1 ON f1.region_id = r1.id
      JOIN regions r2 ON f2.region_id = r2.id
      WHERE m.sub_group_id = ANY($1::int[])
      ORDER BY m.sub_group_id, m.match_number ASC
    `;

    const matches = await query(matchesSql, [subGroupIds]);

    for (const match of matches) {
      const subGroupId = Number(match.subGroupId);
      delete match.subGroupId;
      const list = matchesBySubGroup.get(subGroupId);
      if (list) {
        list.push(match);
      } else {
        matchesBySubGroup.set(subGroupId, [match]);
      }
    }

    if (matches.length) {
      cardsByMatch = await getCardsForMatches(matches.map((match) => match.id));
    }
  } else {
    matchesBySubGroup = new Map();
  }

  for (const group of groups) {
    const phaseId = groupIdToPhaseId.get(Number(group.id));
    const phaseType = phaseId ? phaseTypeById.get(phaseId) : undefined;
    const groupSubGroups = subgroupsByGroup.get(Number(group.id)) ?? [];

    if (phaseType === "group") {
      group.subGroups = groupSubGroups.map((sg) => ({
        ...sg,
        scores: {
          region1: sg.scoreRegion1,
          region2: sg.scoreRegion2,
          nulls: sg.nulls,
        },
        matchStatus: sg.status,
      }));
    } else {
      group.subGroups = groupSubGroups.map((sg) => {
        const matches = matchesBySubGroup.get(Number(sg.id)) ?? [];
        return {
          ...sg,
          matches: matches.map((match) => enrichMatchData(match, cardsByMatch)),
          scores: {
            region1: sg.scoreRegion1,
            region2: sg.scoreRegion2,
            nulls: sg.nulls,
          },
          matchStatus: sg.status,
        };
      });
    }
  }

  return phases;
}

// Match data enrichment function following the required format
function enrichMatchData(
  match: any,
  cardsByMatch?: Map<number, any[]>,
) {
  // Retrieve all cards for this match (or reuse the batch preloaded by the caller).
  const cards = cardsByMatch
    ? (cardsByMatch.get(Number(match.id)) ?? [])
    : [];

  // Format totalDuration (handles INTERVAL objects, strings, and numeric values)
  let formattedDuration = "00:00:00";
  if (match.totalDuration) {
    if (typeof match.totalDuration === "object") {
      const hours = String(match.totalDuration.hours || 0).padStart(2, "0");
      const minutes = String(match.totalDuration.minutes || 0).padStart(2, "0");
      const seconds = String(match.totalDuration.seconds || 0).padStart(2, "0");
      formattedDuration = `${hours}:${minutes}:${seconds}`;
    } else if (typeof match.totalDuration === "string") {
      const match_interval = match.totalDuration.match(/(\d+):(\d+):(\d+)/);
      if (match_interval) {
        formattedDuration = match_interval[0];
      } else {
        formattedDuration = match.totalDuration;
      }
    } else if (typeof match.totalDuration === "number") {
      const hours = Math.floor(match.totalDuration / 3600);
      const minutes = Math.floor((match.totalDuration % 3600) / 60);
      const seconds = match.totalDuration % 60;
      formattedDuration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }

  // Format start time into a complete ISO timestamp
  let formattedStartTime = match.startTime;
  const dateStr = match.matchDate
    ? new Date(match.matchDate).toISOString().split("T")[0]
    : null;

  if (dateStr && match.startTime) {
    formattedStartTime = new Date(match.startTime).toISOString();
  } else if (
    dateStr &&
    match.startTime &&
    typeof match.startTime === "string"
  ) {
    const timeStr = match.startTime.includes("T")
      ? match.startTime.split("T")[1]
      : match.startTime;
    formattedStartTime = new Date(`${dateStr}T${timeStr}`).toISOString();
  }

  // Structure fighter 1 data
  const fighter1 = {
    id: match.fighter1Id || match.fighter1_id,
    firstName: match.fighter1FirstName || match.fighter1_first_name,
    lastName: match.fighter1LastName || match.fighter1_last_name,
    nickname: match.fighter1Nickname || match.fighter1_nickname || "",
    profileImage: match.fighter1ProfileImage || match.fighter1_profile_image,
    regionName: match.fighter1RegionName || match.fighter1_region_name,
    initialState:
      match.fighter1InitialState || match.fighter1_initial_state || null,
  };

  // Structure fighter 2 data
  const fighter2 = {
    id: match.fighter2Id || match.fighter2_id,
    firstName: match.fighter2FirstName || match.fighter2_first_name,
    lastName: match.fighter2LastName || match.fighter2_last_name,
    nickname: match.fighter2Nickname || match.fighter2_nickname || "",
    profileImage: match.fighter2ProfileImage || match.fighter2_profile_image,
    regionName: match.fighter2RegionName || match.fighter2_region_name,
    initialState:
      match.fighter2InitialState || match.fighter2_initial_state || null,
  };

  // Build and return the formatted match object
  return {
    id: match.id,
    matchNumber: match.matchNumber || match.match_number,
    status: match.status,
    startTime: formattedStartTime,
    totalDuration: formattedDuration,
    videoUrl: match.videoUrl || match.video_url || null,
    breakCount: match.breakCount || 0,
    notes: match.notes || null,
    subGroupId: match.subGroupId || match.sub_group_id,
    editionId: match.editionId || match.edition_id,

    fighters: {
      fighter1,
      fighter2,
    },

    result: {
      winnerId: match.winnerFighterId || match.winner_fighter_id || null,
      loserId: match.loserFighterId || match.loser_fighter_id || null,
    },

    allCards: cards.map((card: any) => ({
      fighterId: card.fighterId,
      minuteGiven: card.minuteGiven,
    })),
  };
}

// Fonction pour récupérer les matches d'un sous-groupe (format simplifié comme demandé)
async function getMatchesForSubGroup(subGroupId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time2 as "startTime",
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
      m.loser_fighter_id as "loserFighterId"
    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    WHERE m.sub_group_id = $1
    ORDER BY m.match_number ASC
  `;

  const matches = await query(sql, [subGroupId]);
  const enrichedMatches = await Promise.all(
    matches.map((match) => enrichMatchData(match)),
  );
  return enrichedMatches;
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
  return (await query(sql, params)) ?? null;
}
