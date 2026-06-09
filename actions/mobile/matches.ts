"use server";

import { query } from "@/lib/db/neon-client";

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
          message: "Sous-groupe non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Récupérer les informations du sous-groupe (corrigé)
    const subGroupInfo = await getSubGroupInfo(subGroupId);

    // Récupérer tous les matchs du sous-groupe
    const matches = await getAllMatchesForSubGroup(subGroupId);

    // Séparer le match en direct (s'il existe)
    let liveMatch = null;
    const otherMatches = [];

    for (const match of matches) {
      if (["live", "round_break"].includes(match.status)) {
        liveMatch = match;
      } else {
        otherMatches.push(match);
      }
    }

    // Grouper les matchs par statut
    const groupedMatches = {
      scheduled: otherMatches.filter((m) => m.status === "scheduled"),
      completed: otherMatches.filter((m) => m.status === "completed"),
      cancelled: otherMatches.filter((m) => m.status === "cancelled"),
      postponed: otherMatches.filter((m) => m.status === "postponed"),
      reclamation: otherMatches.filter((m) => m.status === "reclamation"), // NOUVEAU
    };

    return {
      success: true,
      data: {
        subGroup: subGroupInfo,
        liveMatch: liveMatch ? await enrichMatchData(liveMatch) : null,
        matches: {
          all: groupedMatches,
        },
        summary: {
          total: matches.length,
          live: liveMatch ? 1 : 0,
          scheduled: groupedMatches.scheduled.length,
          completed: groupedMatches.completed.length,
          cancelled: groupedMatches.cancelled.length,
          postponed: groupedMatches.postponed.length,
          reclamation: groupedMatches.reclamation.length, // NOUVEAU
        },
        timestamp: new Date().toISOString(),
      },
      message: "Matchs du sous-groupe récupérés avec succès",
    };
  } catch (error: any) {
    console.error("Error in getMobileMatchesBySubGroup:", error);
    // Return a safe fallback instead of re-throwing
    return {
      success: false,
      error: {
        code: 500,
        message: error.message || "Erreur lors de la récupération des matchs",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function getMobileMatchById(matchId: number) {
  try {
    // Vérifier que le match existe
    const existsSql =
      "SELECT id FROM matches WHERE id = $1 AND is_active = true";
    const existsResult = await query(existsSql, [matchId]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Match non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Récupérer les détails du match
    const match = await getMatchDetails(matchId);

    if (!match) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Match non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Enrichir les données du match
    const enrichedMatch = await enrichMatchData(match);

    return {
      success: true,
      data: {
        match: enrichedMatch,
        timestamp: new Date().toISOString(),
      },
      message: "Match récupéré avec succès",
    };
  } catch (error: any) {
    console.error("Error in getMobileMatchById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: error.message || "Erreur lors de la récupération du match",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Récupérer les détails d'un match spécifique
async function getMatchDetails(matchId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.match_date as "matchDate",
      m.start_time2 as "startTime",
      m.end_time as "endTime",
      m.status,
      m.match_result as "matchResult",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
      m.video_url as "videoUrl",
      m.live_stream_url as "liveStreamUrl",
      m.notes,
      m.sub_group_id as "subGroupId",
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId",
      
      -- Sous-groupe
      sg.name as "subGroupName",
      sg.period as "subGroupPeriod",
      sg.status as "subGroupStatus",
      sg.is_completed as "subGroupIsCompleted",
      sg.score_region1 as "subGroupScoreRegion1",
      sg.score_region2 as "subGroupScoreRegion2",
      sg.nulls as "subGroupNulls",
      
      -- Région 1 (du sous-groupe)
      sg.region1_id as "region1Id",
      r1.name as "region1Name",
      r1.flag_image as "region1FlagImage",
      r1.color as "region1Color",
      
      -- Région 2 (du sous-groupe)
      sg.region2_id as "region2Id",
      r2.name as "region2Name",
      r2.flag_image as "region2FlagImage",
      r2.color as "region2Color",
      
      -- Ceintures
      b1.color as "belt1Color",
      b2.color as "belt2Color",
      
      -- Arbitre
      ref.id as "refereeId",
      ref.first_name as "refereeFirstName",
      ref.last_name as "refereeLastName",
      ref.profile_image as "refereeProfileImage",
      
      -- Lutteur 1
      m.fighter1_id as "fighter1Id",
      f1.first_name as "fighter1FirstName",
      f1.last_name as "fighter1LastName",
      f1.nickname as "fighter1Nickname",
      f1.profile_image as "fighter1ProfileImage",
      f1r.name as "fighter1RegionName",
      f1r.flag_image as "fighter1RegionFlagImage",
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      f2r.name as "fighter2RegionName",
      f2r.flag_image as "fighter2RegionFlagImage",
      
      -- Contexte de l'édition
      ce.id as "editionId",
      ce.theme as "editionTheme",
      ce.year as "editionYear",
      ce.edition_number as "editionNumber",
      c.name as "competitionName"

    FROM matches m
    LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    LEFT JOIN referees ref ON sg.main_referee_id = ref.id
    LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
    LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
    LEFT JOIN regions f1r ON f1.region_id = f1r.id
    LEFT JOIN regions f2r ON f2.region_id = f2r.id
    LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
    LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
    LEFT JOIN phase_groups pg ON sg.group_id = pg.id
    LEFT JOIN phases p ON pg.phase_id = p.id
    LEFT JOIN competition_editions ce ON p.edition_id = ce.id
    LEFT JOIN competitions c ON ce.competition_id = c.id
    WHERE m.id = $1
  `;

  const result = await query(sql, [matchId]);
  return result[0] || null;
}

// Fonctions auxiliaires
async function getSubGroupInfo(subGroupId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.period,
      sg.status,
      sg.video_url as "videoUrl",
      sg.score_region1 as "scoreRegion1",
      sg.score_region2 as "scoreRegion2",
      sg.nulls,
      sg.region1_id as "region1Id",
      sg.region2_id as "region2Id",
      r1.name as "region1Name",
      r1.flag_image as "region1FlagImage",
      r2.name as "region2Name",
      r2.flag_image as "region2FlagImage",
      sg.belt_region1 as "beltRegion1Id",
      sg.belt_region2 as "beltRegion2Id",
      b1.color as "beltRegion1Color",
      b2.color as "beltRegion2Color",
      sg.main_referee_id as "mainRefereeId",
      ref.first_name as "refereeFirstName",
      ref.last_name as "refereeLastName",
      sg.is_completed as "isCompleted",
      sg.is_active as "isActive"
    FROM sub_groups sg
    LEFT JOIN regions r1 ON sg.region1_id = r1.id
    LEFT JOIN regions r2 ON sg.region2_id = r2.id
    LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
    LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
    LEFT JOIN referees ref ON sg.main_referee_id = ref.id
    WHERE sg.id = $1
  `;

  const result = await query(sql, [subGroupId]);
  const subGroup = result[0];

  if (subGroup) {
    // Formater les données du sous-groupe
    subGroup.scores = {
      region1: subGroup.scoreRegion1,
      region2: subGroup.scoreRegion2,
      nulls: subGroup.nulls,
    };

    subGroup.belts = {
      region1: subGroup.beltRegion1Id
        ? {
            id: subGroup.beltRegion1Id,
            color: subGroup.beltRegion1Color,
          }
        : null,
      region2: subGroup.beltRegion2Id
        ? {
            id: subGroup.beltRegion2Id,
            color: subGroup.beltRegion2Color,
          }
        : null,
    };

    subGroup.referee = subGroup.mainRefereeId
      ? {
          id: subGroup.mainRefereeId,
          firstName: subGroup.refereeFirstName,
          lastName: subGroup.refereeLastName,
        }
      : null;

    // Nettoyer les données redondantes
    const fieldsToDelete = [
      "scoreRegion1",
      "scoreRegion2",
      "nulls",
      "beltRegion1Id",
      "beltRegion2Id",
      "beltRegion1Color",
      "beltRegion2Color",
      "mainRefereeId",
      "refereeFirstName",
      "refereeLastName",
    ];

    fieldsToDelete.forEach((field) => delete subGroup[field]);
  }

  return subGroup;
}

async function getAllMatchesForSubGroup(subGroupId: number) {
  const sql = `
    SELECT 
      m.id,
      m.match_number as "matchNumber",
      m.status,
      m.start_time2 as "startTime",
      m.total_duration as "totalDuration",
      m.break_count as "breakCount",
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
      
      -- Lutteur 2
      m.fighter2_id as "fighter2Id",
      f2.first_name as "fighter2FirstName",
      f2.last_name as "fighter2LastName",
      f2.nickname as "fighter2Nickname",
      f2.profile_image as "fighter2ProfileImage",
      r2.name as "fighter2RegionName",
      
      -- Vainqueur et perdant
      m.winner_fighter_id as "winnerFighterId",
      m.loser_fighter_id as "loserFighterId"

    FROM matches m
    JOIN fighters f1 ON m.fighter1_id = f1.id
    JOIN fighters f2 ON m.fighter2_id = f2.id
    JOIN regions r1 ON f1.region_id = r1.id
    JOIN regions r2 ON f2.region_id = r2.id
    WHERE m.sub_group_id = $1
    ORDER BY 
      CASE 
        WHEN m.status IN ('live', 'round_break') THEN 0
        ELSE 1
      END,
      m.match_number ASC
  `;

  return await query(sql, [subGroupId]);
}

// Dans matches.ts, fonction enrichMatchData()

async function enrichMatchData(match: any) {
  // Récupérer les cartons pour ce match
  const cards = await getCardsForMatch(match.id);

  // Récupérer les statistiques avancées
  const stats = await getMatchStats(match.id);

  // Formater totalDuration (INTERVAL -> HH:MM:SS)
  let formattedDuration = "00:00:00";
  if (match.totalDuration) {
    // Si c'est un objet PostgreSQL
    if (typeof match.totalDuration === "object") {
      const hours = String(match.totalDuration.hours || 0).padStart(2, "0");
      const minutes = String(match.totalDuration.minutes || 0).padStart(2, "0");
      const seconds = String(match.totalDuration.seconds || 0).padStart(2, "0");
      formattedDuration = `${hours}:${minutes}:${seconds}`;
    }
    // Si c'est une chaîne
    else if (typeof match.totalDuration === "string") {
      const match_interval = match.totalDuration.match(/(\d+):(\d+):(\d+)/);
      if (match_interval) {
        formattedDuration = match_interval[0];
      } else {
        formattedDuration = match.totalDuration;
      }
    }
    // Si c'est un nombre (secondes)
    else if (typeof match.totalDuration === "number") {
      const hours = Math.floor(match.totalDuration / 3600);
      const minutes = Math.floor((match.totalDuration % 3600) / 60);
      const seconds = match.totalDuration % 60;
      formattedDuration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }

  // Formater startTime en timestamp ISO complet
  let formattedStartTime = match.startTime;
  let formattedEndTime = match.endTime;

  // Fonction utilitaire pour extraire la date sous forme de chaîne YYYY-MM-DD
  const getDateString = (date: any): string => {
    if (!date) return "";

    // Si c'est un objet Date
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    // Si c'est une chaîne
    else if (typeof date === "string") {
      return date.split("T")[0];
    }
    // Si c'est un timestamp
    else if (typeof date === "number") {
      return new Date(date).toISOString().split("T")[0];
    }
    return "";
  };

  const dateStr = getDateString(match.matchDate);

  if (dateStr && match.startTime) {
    // Si startTime est une chaîne HH:MM:SS
    if (typeof match.startTime === "string") {
      const timeStr = match.startTime.includes("T")
        ? match.startTime.split("T")[1]
        : match.startTime;

      const dateTimeStr = `${dateStr}T${timeStr}`;
      const timestamp = new Date(dateTimeStr);
      if (!isNaN(timestamp.getTime())) {
        formattedStartTime = timestamp.toISOString();
      }
    }
    // Si startTime est un objet Date
    else if (match.startTime instanceof Date) {
      formattedStartTime = match.startTime.toISOString();
    }
  }

  // Même chose pour endTime
  if (dateStr && match.endTime) {
    if (typeof match.endTime === "string") {
      const timeStr = match.endTime.includes("T")
        ? match.endTime.split("T")[1]
        : match.endTime;

      const dateTimeStr = `${dateStr}T${timeStr}`;
      const timestamp = new Date(dateTimeStr);
      if (!isNaN(timestamp.getTime())) {
        formattedEndTime = timestamp.toISOString();
      }
    } else if (match.endTime instanceof Date) {
      formattedEndTime = match.endTime.toISOString();
    }
  }

  // Formater les données des lutteurs
  const fighter1 = {
    id: match.fighter1Id,
    firstName: match.fighter1FirstName,
    lastName: match.fighter1LastName,
    nickname: match.fighter1Nickname,
    profileImage: match.fighter1ProfileImage,
    regionName: match.fighter1RegionName,
    initialState: null,
  };

  const fighter2 = {
    id: match.fighter2Id,
    firstName: match.fighter2FirstName,
    lastName: match.fighter2LastName,
    nickname: match.fighter2Nickname,
    profileImage: match.fighter2ProfileImage,
    regionName: match.fighter2RegionName,
    initialState: null,
  };

  // Formater la réponse avec les champs formatés
  const enrichedMatch = {
    id: match.id,
    matchNumber: match.matchNumber,
    status: match.status,
    startTime: match.startTime,
    totalDuration: formattedDuration,
    videoUrl: match.videoUrl,
    notes: match.notes,
    ...((match.status === "live" ||
      match.status === "round_break" ||
      match.status === "reclamation") && {
      subGroupId: match.subGroupId,
    }),

    fighters: {
      fighter1,
      fighter2,
    },

    result: {
      winnerId: match.winnerFighterId,
      loserId: match.loserFighterId,
    },

    allCards: cards.map((card: any) => ({
      fighterId: card.fighterId,
      minuteGiven: card.minuteGiven,
    })),
  };

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
    breaks,
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
  const sql =
    'SELECT total_duration as "totalDuration" FROM matches WHERE id = $1';
  const result = await query(sql, [matchId]);
  return result[0]?.totalDuration || 0;
}

async function getBreakCount(matchId: number) {
  const sql = 'SELECT break_count as "breakCount" FROM matches WHERE id = $1';
  const result = await query(sql, [matchId]);
  return result[0]?.breakCount || 0;
}
