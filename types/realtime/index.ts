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

export interface RealtimeCard {
  id: number;
  fighterId: number;
  cardType: "yellow" | "red";
  minuteGiven: string;    // au format "MM:SS"
}

/**
 * Représente un match stocké sous `editions/{editionId}/subGroups/{subGroupId}/matches/{matchId}`
 */
export interface RealtimeMatchDocument {
  status: MatchStatus;
  isLive: boolean;

  fighter1Id: number | null;
  fighter2Id: number | null;

  winnerId: number | null;
  loserId: number | null;

  matchResult: string | null;

  breakCount: number;
  audienceCount: number;

  videoUrl: string | null;
  liveStreamUrl: string | null;
  
  startTime: string | null;

   cards?: RealtimeCard[]; 

  updatedAt: number;
}

export interface RealtimeLiveMatchInfo {
  subGroupId: number;
  matchId: number;
  status: MatchStatus; // "live" | "round_break" | "reclamation"
  fighter1Id: number | null;
  fighter2Id: number | null;
  startTime: string | null;
}

// ─── Sous-groupe RTDB Cible ──────────────────────────────────────────────────

/**
 * Représente un sous-groupe stocké sous `editions/{editionId}/subGroups/{subGroupId}`
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
  liveMatch: RealtimeLiveMatchInfo | null;
  updatedAt: number;
  
  /** 
   * Collection de sous-groupes indexée par leur ID PostgreSQL 
   */
  subGroups?: Record<string, RealtimeSubGroupDocument>;
}

// ─── Nœuds RTDB Cibles ───────────────────────────────────────────────────────

export const REALTIME_NODES = {
  EDITIONS: "editions",
} as const;
