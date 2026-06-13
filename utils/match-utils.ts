'use server';

import { query } from '@/lib/db/neon-client';

export async function getCardsForMatch(matchId: number) {
  const sql = `
    SELECT 
      fc.id,
      fc.fighter_id as "fighterId",
      fc.card_type as "cardType",
      fc.minute_given as "minuteGiven"
    FROM fighter_cards fc
    WHERE fc.match_id = $1
    ORDER BY fc.minute_given
  `;

  return await query(sql, [matchId]);
}

export async function enrichMatchData(match: any) {
  // Retrieve all cards for this match
  const cards = await getCardsForMatch(match.id);

  // Format totalDuration (handles INTERVAL objects, strings, and numeric values)
  let formattedDuration = "00:00:00";
  if (match.totalDuration || match.total_duration) {
    const duration = match.totalDuration || match.total_duration;
    if (typeof duration === "object") {
      const hours = String(duration.hours || 0).padStart(2, "0");
      const minutes = String(duration.minutes || 0).padStart(2, "0");
      const seconds = String(duration.seconds || 0).padStart(2, "0");
      formattedDuration = `${hours}:${minutes}:${seconds}`;
    } else if (typeof duration === "string") {
      const match_interval = duration.match(/(\d+):(\d+):(\d+)/);
      if (match_interval) {
        formattedDuration = match_interval[0];
      } else {
        formattedDuration = duration;
      }
    } else if (typeof duration === "number") {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      formattedDuration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }

  // Format start time into a complete ISO timestamp
  let formattedStartTime = match.startTime || match.startTime2 || match.start_time2;
  const dateStr = match.matchDate || match.match_date
    ? new Date(match.matchDate || match.match_date).toISOString().split("T")[0]
    : null;

  if (dateStr && (match.startTime2 || match.start_time2)) {
    formattedStartTime = new Date(match.startTime2 || match.start_time2).toISOString();
  } else if (
    dateStr &&
    (match.startTime || match.start_time) &&
    typeof (match.startTime || match.start_time) === "string"
  ) {
    const timeStr = (match.startTime || match.start_time).includes("T")
      ? (match.startTime || match.start_time).split("T")[1]
      : (match.startTime || match.start_time);
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
    breakCount: match.breakCount || match.break_count || 0,
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
