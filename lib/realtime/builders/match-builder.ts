// lib/realtime/builders/match-builder.ts
import { query } from "@/lib/db/neon-client";
import type { RealtimeMatchDocument, MatchStatus } from "@/types/realtime";

export async function buildRealtimeMatchPayload(
  matchId: number
): Promise<{ payload: RealtimeMatchDocument; editionId: number; subGroupId: number }> {
  const rows = await query<any>(
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
       m.sub_group_id,
       ce.id AS edition_id,
       m.start_time2
     FROM matches m
     JOIN sub_groups sg ON sg.id = m.sub_group_id
     JOIN phase_groups pg ON pg.id = sg.group_id
     JOIN phases p ON p.id = pg.phase_id
     JOIN competition_editions ce ON ce.id = p.edition_id
     WHERE m.id = $1`,
    [matchId]
  );

  if (!rows.length) {
    throw new Error(`Match ${matchId} introuvable ou inactif`);
  }

  const row = rows[0];
  const isLive = row.status === "live";

  // Récupérer les cartons actifs (uniquement les champs nécessaires)
  const cardsRows = await query<any>(
    `SELECT id, fighter_id, card_type, minute_given
     FROM fighter_cards
     WHERE match_id = $1 AND is_cancelled = false
     ORDER BY minute_given ASC`,
    [matchId]
  );

  const cards = cardsRows.map(card => ({
    id: card.id,
    fighterId: card.fighter_id,
    cardType: card.card_type,   // 'yellow' ou 'red'
    minuteGiven: card.minute_given,   // TIME → string (ex: "00:02:35")
  }));

  const payload: RealtimeMatchDocument = {
    status: row.status as MatchStatus,
    isLive,
    fighter1Id: row.fighter1_id,
    fighter2Id: row.fighter2_id,
    winnerId: row.winner_fighter_id,
    loserId: row.loser_fighter_id,
    matchResult: row.match_result,
    breakCount: row.break_count ?? 0,
    audienceCount: row.audience_count ?? 0,
    videoUrl: row.video_url,
    liveStreamUrl: row.live_stream_url,
    updatedAt: Date.now(),
    startTime: row.start_time2 || null,
    cards,
  };

  return {
    payload,
    editionId: row.edition_id,
    subGroupId: row.sub_group_id,
  };
}