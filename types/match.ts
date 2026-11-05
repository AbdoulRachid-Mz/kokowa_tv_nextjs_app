import { Fighter, SubGroup, Referee } from ".";

// types/match.ts
export type MatchStatus = 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
export type MatchResult = 'fighter1_win' | 'fighter2_win' | 'draw' | null;
export type CardType = 'yellow' | 'red';

export interface Match {
  id: number;
  sub_group_id: number;
  match_number: number;
  match_date: string | null;
  start_time: string | null;
  end_time: string | null;
  
  fighter1_id: number | null;
  fighter2_id: number | null;
  fighter1_initial_state?: 'eliminated' | 'not_eliminated';
  fighter2_initial_state?: 'eliminated' | 'not_eliminated';
  referee_id?: number | null;
  
  winner_fighter_id: number | null;
  loser_fighter_id: number | null;
  match_result: MatchResult;
  
  total_duration: string | null; // Format: HH:MM:SS
  break_count: number;
  status: MatchStatus;
  
  audience_count: number | null;
  video_url: string | null;
  live_stream_url: string | null;
  notes: string | null;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations (optionnelles)
  fighter1?: Fighter;
  fighter2?: Fighter;
  winner_fighter?: Fighter;
  loser_fighter?: Fighter;
  cards?: FighterCard[];
  sub_group?: SubGroup;
  referee?: Referee;
}

export interface FighterCard {
  id: number;
  match_id: number;
  fighter_id: number;
  card_type: CardType;
  card_reason: string | null;
  minute_given: string | null; // Format: MM:SS
  is_cancelled: boolean;
  created_at: string;
  fighter?: Fighter;
}

export interface MatchUpdate {
  fighter1_id?: number | null;
  fighter2_id?: number | null;
  winner_fighter_id?: number | null;
  loser_fighter_id?: number | null;
  match_result?: MatchResult;
  status?: MatchStatus;
  total_duration?: string | null;
  break_count?: number;
  audience_count?: number | null;
  video_url?: string | null;
  live_stream_url?: string | null;
  notes?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  fighter1_initial_state?: 'eliminated' | 'not_eliminated';
  fighter2_initial_state?: 'eliminated' | 'not_eliminated';
  initial_state?: JSON | null;
}