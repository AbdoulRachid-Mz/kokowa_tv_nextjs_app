// lib/realtime/builders/match-builder.ts
// Construit le payload minimal d'un match pour Firebase Realtime Database
// SERVER-SIDE ONLY

import { query } from "@/lib/db/neon-client";
import type { RealtimeMatchDocument, MatchStatus } from "@/types/realtime";

export async function buildRealtimeMatchPayload(
  matchId: number
): Promise<{ payload: RealtimeMatchDocument; subGroupId: number }> {
  const matchRows = await query<any>(
    `SELECT 
       m.status,
       m.fighter1_id,
       m.fighter2_id,
       m.winner_fighter_id,
       m.loser_fighter_id,
       m.match_result,
       m.break_count,
       m.audience_count,
       m.video_url,
       m.live_stream_url,
       m.sub_group_id
     FROM matches m
     WHERE m.id = $1`,
    [matchId]
  );

  if (!matchRows.length) {
    throw new Error(`Match ${matchId} introuvable ou inactif`);
  }

  const row = matchRows[0];
  const isLive = row.status === "live";

  const payload: RealtimeMatchDocument = {
    status: row.status as MatchStatus,
    isLive,
    fighter1Id: row.fighter1_id,
    fighter2Id: row.fighter2_id,
    winnerFighterId: row.winner_fighter_id,
    loserFighterId: row.loser_fighter_id,
    matchResult: row.match_result,
    breakCount: row.break_count ?? 0,
    audienceCount: row.audience_count ?? 0,
    videoUrl: row.video_url,
    liveStreamUrl: row.live_stream_url,
    updatedAt: Date.now(),
  };

  return { payload, subGroupId: row.sub_group_id };
}
