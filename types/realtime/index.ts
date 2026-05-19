// types/realtime/index.ts
// Types partagés pour le système Firestore Realtime
// Compatible Next.js (web) et Flutter (mobile)

export type EntityType =
  | "edition"
  | "subGroup"
  | "match"
  | "fighter"
  | "region"
  | "admin";

// ─── Payload de sync (remplace RealtimeUpdatePayload WebSocket) ──────────────

export interface RealtimeSyncPayload {
  entityType: EntityType;
  entityId: string | number;
  event: string;
  data?: any;
  timestamp: number;
}

// ─── État live d'un match ────────────────────────────────────────────────────

export type MatchStatus =
  | "scheduled"
  | "live"
  | "round_break"
  | "completed"
  | "cancelled"
  | "postponed"
  | "reclamation";

export interface RealtimeLiveState {
  isLive: boolean;
  status: MatchStatus;
  currentPhase?: string;
  breakCount?: number;
  audienceCount?: number;
}

// ─── Données fighter dans Firestore ─────────────────────────────────────────

export interface RealtimeFighterData {
  id: number | null;
  first_name?: string;
  last_name?: string;
  region_id?: number | null;
  profile_image?: string | null;
  weight?: number | null;
  is_eliminated?: boolean;
}

// ─── Données région dans Firestore ───────────────────────────────────────────

export interface RealtimeRegionData {
  id: number | null;
  name?: string;
  code?: string | null;
  flag_image?: string | null;
}

// ─── Données score ───────────────────────────────────────────────────────────

export interface RealtimeScore {
  score_region1: number;
  score_region2: number;
  nulls: number;
}

// ─── Données carton ──────────────────────────────────────────────────────────

export interface RealtimeCard {
  id: number;
  fighter_id: number | null;
  card_type: "yellow" | "red";
  card_reason?: string;
  minute_given?: string;
}

// ─── Document principal match ────────────────────────────────────────────────

export interface RealtimeMatchDocument {
  /** Identifiant PostgreSQL du match */
  id: number;

  entityType: "match";

  /** Timestamp Unix ms */
  updatedAt: number;
  createdAt: number;

  /** État live : ce qui change souvent */
  liveState: RealtimeLiveState;

  /** Métadonnées temps réel */
  realtime: {
    lastEvent?: string;
    lastEventAt?: number;
  };

  /** Données complètes du match nécessaires au rendu frontend */
  match: {
    id: number;
    match_number?: number | null;
    match_date?: string | null;
    start_time?: string | null;
    start_time2?: string | null;
    end_time?: string | null;
    total_duration?: string | null;
    match_result?: string | null;
    winner_fighter_id?: number | null;
    loser_fighter_id?: number | null;
    video_url?: string | null;
    live_stream_url?: string | null;
    notes?: string | null;
  };

  /** Fighters du match */
  fighters: {
    fighter1: RealtimeFighterData;
    fighter2: RealtimeFighterData;
  };

  /** Régions opposées */
  regions: {
    region1: RealtimeRegionData;
    region2: RealtimeRegionData;
  };

  /** Scores actuels du sous-groupe */
  score: RealtimeScore;

  /** Données du sous-groupe (pour le contexte) */
  subGroup: {
    id: number;
    name?: string;
    status?: string;
    is_completed?: boolean;
    region1_id?: number | null;
    region2_id?: number | null;
  };

  /** Données de l'édition */
  edition: {
    id: number;
    edition_number?: number;
    edition_theme?: string | null;
  };

  /** Cartons du match */
  cards: RealtimeCard[];

  /** Métadonnées de sync */
  metadata: {
    source: "postgres";
    syncVersion: number;
  };
}

// ─── Document match léger (sous-collection d'un subGroup) ───────────────────

/**
 * Document léger d'un match stocké dans la sous-collection
 * `realtime_subgroups/{subGroupId}/matches/{matchId}`.
 *
 * Ne contient que les données essentielles au rendu temps réel.
 * Le mobile écoute toute la sous-collection pour recevoir tous les
 * matches d'une rencontre en un seul listener.
 */
export interface RealtimeSubGroupMatchDocument {
  id: number;
  match_number?: number | null;
  status: string;
  match_result?: string | null;

  fighter1_id?: number | null;
  fighter2_id?: number | null;
  winner_fighter_id?: number | null;
  loser_fighter_id?: number | null;

  fighters: {
    fighter1: RealtimeFighterData;
    fighter2: RealtimeFighterData;
  };

  cards: RealtimeCard[];

  liveState: RealtimeLiveState;

  updatedAt: number;
}

// ─── Document sous-groupe ────────────────────────────────────────────────────

export interface RealtimeSubGroupDocument {
  id: number;
  entityType: "subGroup";
  updatedAt: number;
  createdAt: number;

  subGroup: {
    id: number;
    name?: string;
    status?: string;
    is_completed?: boolean;
    score_region1?: number;
    score_region2?: number;
    nulls?: number;
    region1_id?: number | null;
    region2_id?: number | null;
  };

  regions: {
    region1: RealtimeRegionData;
    region2: RealtimeRegionData;
  };

  /** Résumé des matchs du sous-groupe */
  matchesSummary: {
    total: number;
    completed: number;
    live: number;
  };

  edition: {
    id: number;
    edition_number?: number;
  };

  realtime: {
    lastEvent?: string;
    lastEventAt?: number;
  };

  metadata: {
    source: "postgres";
    syncVersion: number;
  };
}

// ─── Document édition ────────────────────────────────────────────────────────

export interface RealtimeEditionDocument {
  id: number;
  entityType: "edition";
  updatedAt: number;
  createdAt: number;

  edition: {
    id: number;
    edition_number?: number;
    name?: string | null;
    status?: string;
  };

  liveMatch?: {
    matchId: number | null;
    subGroupId: number | null;
  };

  realtime: {
    lastEvent?: string;
    lastEventAt?: number;
  };

  metadata: {
    source: "postgres";
    syncVersion: number;
  };
}

// ─── Collections Firestore ───────────────────────────────────────────────────

export const REALTIME_COLLECTIONS = {
  MATCHES: "realtime_matches",
  SUBGROUPS: "realtime_subgroups",
  EDITIONS: "realtime_editions",
} as const;

/** Nom de la sous-collection matches dans un document subGroup */
export const SUBGROUP_MATCHES_SUBCOLLECTION = "matches" as const;

export type RealtimeCollection =
  (typeof REALTIME_COLLECTIONS)[keyof typeof REALTIME_COLLECTIONS];
