// lib/firestore/builders/match-builder.ts
// Construit un document RealtimeMatchDocument depuis PostgreSQL
// SERVER-SIDE ONLY

import { query } from "@/lib/db/neon-client";
import type {
  RealtimeMatchDocument,
  RealtimeFighterData,
  RealtimeRegionData,
  RealtimeCard,
  RealtimeSubGroupMatchDocument,
} from "@/types/realtime";

// Types internes pour les lignes PostgreSQL
interface MatchRow {
  id: number;
  match_number: number | null;
  match_date: string | null;
  start_time: string | null;
  start_time2: string | null;
  end_time: string | null;
  total_duration: string | null;
  status: string;
  match_result: string | null;
  winner_fighter_id: number | null;
  loser_fighter_id: number | null;
  fighter1_id: number | null;
  fighter2_id: number | null;
  break_count: number | null;
  audience_count: number | null;
  video_url: string | null;
  live_stream_url: string | null;
  notes: string | null;
  // SubGroup
  sg_id: number;
  sg_name: string;
  sg_status: string;
  sg_is_completed: boolean;
  sg_score_region1: number | null;
  sg_score_region2: number | null;
  sg_nulls: number | null;
  sg_region1_id: number | null;
  sg_region2_id: number | null;
  // Edition
  edition_id: number;
  edition_number: number;
  edition_theme: string | null;
}

interface FighterRow {
  id: number;
  first_name: string;
  last_name: string;
  region_id: number | null;
  profile_image: string | null;
  weight: number | null;
}

interface RegionRow {
  id: number;
  name: string;
  code: string | null;
  flag_image: string | null;
}

interface CardRow {
  id: number;
  fighter_id: number | null;
  card_type: "yellow" | "red";
  card_reason: string | null;
  minute_given: string | null;
}

/**
 * Récupère toutes les données nécessaires depuis PostgreSQL
 * et assemble un document RealtimeMatchDocument complet,
 * prêt à être écrit dans Firestore.
 *
 * Note: la fonction `query` de neon-client retourne T[] directement (pas { rows }).
 */
export async function buildRealtimeMatchDocument(
  matchId: number
): Promise<RealtimeMatchDocument> {
  // ─── 1. Requête principale : match + subgroup + edition ─────────────────
  const matchRows = await query<MatchRow>(
    `SELECT 
       m.id,
       m.match_number,
       m.match_date,
       m.start_time,
       m.start_time2,
       m.end_time,
       m.total_duration,
       m.status,
       m.match_result,
       m.winner_fighter_id,
       m.loser_fighter_id,
       m.fighter1_id,
       m.fighter2_id,
       m.break_count,
       m.audience_count,
       m.video_url,
       m.live_stream_url,
       m.notes,

       sg.id            AS sg_id,
       sg.name          AS sg_name,
       sg.status        AS sg_status,
       sg.is_completed  AS sg_is_completed,
       sg.score_region1 AS sg_score_region1,
       sg.score_region2 AS sg_score_region2,
       sg.nulls         AS sg_nulls,
       sg.region1_id    AS sg_region1_id,
       sg.region2_id    AS sg_region2_id,

       ed.id              AS edition_id,
       ed.edition_number  AS edition_number,
       ed.theme            AS edition_theme

     FROM matches m
     JOIN sub_groups sg    ON m.sub_group_id = sg.id
     JOIN phase_groups pg  ON sg.group_id = pg.id
     JOIN phases ph        ON pg.phase_id = ph.id
     JOIN competition_editions ed      ON ph.edition_id = ed.id
     WHERE m.id = $1 AND m.is_active = true`,
    [matchId]
  );

  if (!matchRows.length) {
    throw new Error(`Match ${matchId} introuvable ou inactif`);
  }

  const row = matchRows[0];

  // ─── 2. Fighters ────────────────────────────────────────────────────────
  const fighterIds = [row.fighter1_id, row.fighter2_id].filter(
    (id): id is number => id !== null
  );
  let fighter1Data: RealtimeFighterData = { id: row.fighter1_id };
  let fighter2Data: RealtimeFighterData = { id: row.fighter2_id };

  if (fighterIds.length > 0) {
    const fighters = await query<FighterRow>(
      `SELECT id, first_name, last_name, region_id, profile_image, weight
       FROM fighters
       WHERE id = ANY($1) AND is_active = true`,
      [fighterIds]
    );

    for (const f of fighters) {
      const fData: RealtimeFighterData = {
        id: f.id,
        first_name: f.first_name,
        last_name: f.last_name,
        region_id: f.region_id,
        profile_image: f.profile_image,
        weight: f.weight,
      };
      if (f.id === row.fighter1_id) fighter1Data = fData;
      if (f.id === row.fighter2_id) fighter2Data = fData;
    }
  }

  // ─── 3. Régions ─────────────────────────────────────────────────────────
  const regionIds = [row.sg_region1_id, row.sg_region2_id].filter(
    (id): id is number => id !== null
  );
  let region1Data: RealtimeRegionData = { id: row.sg_region1_id };
  let region2Data: RealtimeRegionData = { id: row.sg_region2_id };

  if (regionIds.length > 0) {
    const regions = await query<RegionRow>(
      `SELECT id, name, code, flag_image FROM regions WHERE id = ANY($1)`,
      [regionIds]
    );

    for (const r of regions) {
      const rData: RealtimeRegionData = {
        id: r.id,
        name: r.name,
        code: r.code,
        flag_image: r.flag_image,
      };
      if (r.id === row.sg_region1_id) region1Data = rData;
      if (r.id === row.sg_region2_id) region2Data = rData;
    }
  }

  // ─── 4. Cartons ──────────────────────────────────────────────────────────
  const cardRows = await query<CardRow>(
    `SELECT id, fighter_id, card_type, card_reason, minute_given
     FROM fighter_cards
     WHERE match_id = $1
     ORDER BY id ASC`,
    [matchId]
  );

  const cards: RealtimeCard[] = cardRows.map((c) => ({
    id: c.id,
    fighter_id: c.fighter_id,
    card_type: c.card_type,
    card_reason: c.card_reason ?? undefined,
    minute_given: c.minute_given ?? undefined,
  }));

  // ─── 5. Assemblage du document ───────────────────────────────────────────
  const now = Date.now();
  const isLive = row.status === "live";

  const doc: RealtimeMatchDocument = {
    id: row.id,
    entityType: "match",
    updatedAt: now,
    createdAt: now,

    liveState: {
      isLive,
      status: row.status as RealtimeMatchDocument["liveState"]["status"],
      breakCount: row.break_count ?? 0,
      audienceCount: row.audience_count ?? 0,
    },

    realtime: {},

    match: {
      id: row.id,
      match_number: row.match_number,
      match_date: row.match_date
        ? new Date(row.match_date).toISOString()
        : null,
      start_time: row.start_time,
      start_time2: row.start_time2,
      end_time: row.end_time,
      total_duration: row.total_duration,
      match_result: row.match_result,
      winner_fighter_id: row.winner_fighter_id,
      loser_fighter_id: row.loser_fighter_id,
      video_url: row.video_url,
      live_stream_url: row.live_stream_url,
      notes: row.notes,
    },

    fighters: {
      fighter1: fighter1Data,
      fighter2: fighter2Data,
    },

    regions: {
      region1: region1Data,
      region2: region2Data,
    },

    score: {
      score_region1: row.sg_score_region1 ?? 0,
      score_region2: row.sg_score_region2 ?? 0,
      nulls: row.sg_nulls ?? 0,
    },

    subGroup: {
      id: row.sg_id,
      name: row.sg_name,
      status: row.sg_status,
      is_completed: row.sg_is_completed,
      region1_id: row.sg_region1_id,
      region2_id: row.sg_region2_id,
    },

    edition: {
      id: row.edition_id,
      edition_number: row.edition_number,
      edition_theme: row.edition_theme,
    },

    cards,

    metadata: {
      source: "postgres",
      syncVersion: 1,
    },
  };

  return doc;
}

/**
 * Construit un document RealtimeSubGroupMatchDocument léger à partir du
 * document complet pour être stocké dans la sous-collection `matches` d'un subgroup.
 */
export async function buildRealtimeSubGroupMatchDocument(
  matchId: number
): Promise<RealtimeSubGroupMatchDocument> {
  const doc = await buildRealtimeMatchDocument(matchId);
  return {
    id: doc.id,
    match_number: doc.match.match_number,
    status: doc.liveState.status,
    match_result: doc.match.match_result,
    fighter1_id: doc.fighters.fighter1.id,
    fighter2_id: doc.fighters.fighter2.id,
    winner_fighter_id: doc.match.winner_fighter_id,
    loser_fighter_id: doc.match.loser_fighter_id,
    fighters: doc.fighters,
    cards: doc.cards,
    liveState: doc.liveState,
    updatedAt: doc.updatedAt,
  };
}
