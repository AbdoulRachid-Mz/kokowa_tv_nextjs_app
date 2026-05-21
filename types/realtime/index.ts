// types/realtime/index.ts
// Types partagés pour le système Firebase Realtime Database (RTDB)
// Compatible Next.js (web) et Flutter (mobile)

export type EntityType =
  | "edition"
  | "subGroup"
  | "match"
  | "fighter"
  | "region"
  | "admin";

// ─── Payload de sync ──────────────

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

// ─── Données score ───────────────────────────────────────────────────────────

export interface RealtimeScore {
  region1: number;
  region2: number;
  nulls: number;
}

// ─── Match RTDB Cible ────────────────────────────────────────────────────────

/**
 * Représente un match stocké sous `subGroups/{subGroupId}/matches/{matchId}`
 */
export interface RealtimeMatchDocument {
  status: MatchStatus;
  isLive: boolean;

  fighter1Id: number | null;
  fighter2Id: number | null;

  winnerFighterId: number | null;
  loserFighterId: number | null;

  matchResult: string | null;

  breakCount: number;
  audienceCount: number;

  videoUrl: string | null;
  liveStreamUrl: string | null;

  updatedAt: number;
}

// ─── Sous-groupe RTDB Cible ──────────────────────────────────────────────────

/**
 * Représente un sous-groupe stocké sous `subGroups/{subGroupId}`
 */
export interface RealtimeSubGroupDocument {
  status: string;
  score: RealtimeScore;

  summary: {
    total: number;
    completed: number;
    live: number;
  };

  updatedAt: number;

  /** 
   * Collection de matchs indexée par leur ID PostgreSQL 
   */
  matches?: Record<string, RealtimeMatchDocument>;
}

// ─── Édition RTDB Cible ──────────────────────────────────────────────────────

/**
 * Représente une édition stockée sous `editions/{editionId}`
 */
export interface RealtimeEditionDocument {
  status: string;
  liveMatch: {
    subGroupId: number | null;
    matchId: number | null;
  } | null;
  updatedAt: number;
}

// ─── Nœuds RTDB Cibles ───────────────────────────────────────────────────────

export const REALTIME_NODES = {
  EDITIONS: "editions",
  SUBGROUPS: "subGroups",
} as const;
