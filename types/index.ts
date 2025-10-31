// Types de base avec timestamps
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at?: string;
}

// Région
export interface Region extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  flag_image?: string;
  color?: string;
  total_fighters: number;
  total_champions: number;
}

// Ville
export interface City extends BaseEntity {
  name: string;
  region_id: number;
  description?: string;
  region?: Region;
}

// Lutteur
export interface Fighter extends BaseEntity {
  first_name: string;
  last_name: string;
  nickname?: string;
  birth_date?: string;
  birth_place?: string;
  region_id?: number;
  city_id?: number;
  height?: number;
  weight?: number;
  profile_image?: string;
  cover_image?: string;
  bio?: string;
  fighting_style?: string;
  debut_year?: number;
  ranking: number;
  is_active: boolean;
  is_champion: boolean;
  social_links?: any;
  
  // Relations
  region?: Region;
  city?: City;
  achievements?: FighterAchievement[];
}

// Palmarès des lutteurs
export interface FighterAchievement extends BaseEntity {
  fighter_id: number;
  title: string;
  competition: string;
  year: number;
  position: '1st' | '2nd' | '3rd' | 'finalist' | 'semifinalist' | 'quarterfinalist';
  description?: string;
  medal_image?: string;
  fighter?: Fighter;
}

// Arbitre
export interface Referee extends BaseEntity {
  first_name: string;
  last_name: string;
  nickname?: string;
  birth_date?: string;
  region_id?: number;
  profile_image?: string;
  license_number?: string;
  certification_level?: string;
  experience_years?: number;
  is_active: boolean;
  social_links?: any;
  
  // Relations
  region?: Region;
}

// Compétition
export interface Competition extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  type: 'sabre_national' | 'coupe_regionale' | 'halarou_bakwai' | 'aes' | 'friendly' | 'ministre' | 'coupe_airtel' | 'other';
  location?: string;
  region_id?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  featured_image?: string;
  registration_deadline?: string;
  max_participants?: number;
  prize_pool?: number;
  
  // Relations
  region?: Region;
  editions?: CompetitionEdition[];
}

// Édition de compétition
export interface CompetitionEdition extends BaseEntity {
  competition_id: number;
  edition_number: number;
  year: number;
  theme?: string;
  start_date?: string;
  end_date?: string;
  winner_fighter_id?: number;
  total_participants: number;
  
  // Relations
  competition?: Competition;
  winner_fighter?: Fighter;
  fighters?: EditionFighter[];
  regions?: EditionRegion[];
  phases?: Phase[];
}

// Lutteur participant à une édition
export interface EditionFighter extends BaseEntity {
  edition_id: number;
  fighter_id: number;
  registration_date: string;
  status: 'registered' | 'qualified' | 'disqualified' | 'withdrawn';
  notes?: string;
  
  // Relations
  edition?: CompetitionEdition;
  fighter?: Fighter;
}

// Région participante à une édition
export interface EditionRegion extends BaseEntity {
  edition_id: number;
  region_id: number;
  registration_date: string;
  status: 'registered' | 'approved' | 'rejected';
  notes?: string;
  
  // Relations
  edition?: CompetitionEdition;
  region?: Region;
}

// Phase de compétition
export interface Phase extends BaseEntity {
  edition_id: number;
  name: string;
  phase_order: number;
  phase_type: 'qualification' | 'group' | 'knockout' | 'quarterfinal' | 'semifinal' | 'final';
  description?: string;
  start_date?: string;
  end_date?: string;
  is_completed: boolean;
  
  // Relations
  edition?: CompetitionEdition;
  groups?: PhaseGroup[];
}

// Groupe de phase
export interface PhaseGroup extends BaseEntity {
  phase_id: number;
  name: string;
  group_order: number;
  description?: string;
  is_completed: boolean;
  
  // Relations
  phase?: Phase;
  sub_groups?: SubGroup[];
}

// Sous-groupe
export interface SubGroup extends BaseEntity {
  group_id: number;
  name: string;
  sub_group_order: number;
  description?: string;
  belt1_fighter_id?: number;
  belt2_fighter_id?: number;
  belt1_region_id?: number;
  belt2_region_id?: number;
  is_completed: boolean;
  
  // Relations
  group?: PhaseGroup;
  belt1_fighter?: Fighter;
  belt2_fighter?: Fighter;
  belt1_region?: Region;
  belt2_region?: Region;
  matches?: Match[];
}

// Match
export interface Match extends BaseEntity {
  sub_group_id: number;
  match_number?: number;
  match_date: string;
  start_time?: string;
  end_time?: string;
  
  // Participants
  fighter1_id?: number;
  fighter2_id?: number;
  region1_id?: number;
  region2_id?: number;
  
  // Résultat
  winner_fighter_id?: number;
  winner_region_id?: number;
  loser_fighter_id?: number;
  loser_region_id?: number;
  
  // Score
  score_fighter1: number;
  score_fighter2: number;
  rounds: number;
  
  match_result?: 'fighter1_win' | 'fighter2_win' | 'region1_win' | 'region2_win' | 'draw' | 'cancelled' | 'postponed' | 'technical_win_fighter1' | 'technical_win_fighter2';
  total_duration?: string;
  break_count: number;
  status: 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
  main_referee_id?: number;
  audience_count?: number;
  video_url?: string;
  live_stream_url?: string;
  venue?: string;
  notes?: string;
  
  // Relations
  sub_group?: SubGroup;
  fighter1?: Fighter;
  fighter2?: Fighter;
  region1?: Region;
  region2?: Region;
  winner_fighter?: Fighter;
  winner_region?: Region;
  loser_fighter?: Fighter;
  loser_region?: Region;
  main_referee?: Referee;
  referee_assignments?: RefereeAssignment[];
  cards?: FighterCard[];
}

// Assignation d'arbitre
export interface RefereeAssignment extends BaseEntity {
  referee_id: number;
  match_id: number;
  role: 'main_referee' | 'assistant_referee' | 'time_keeper' | 'jury';
  assigned_at: string;
  
  // Relations
  referee?: Referee;
  match?: Match;
}

// Carton de match
export interface FighterCard extends BaseEntity {
  fighter_id: number;
  match_id: number;
  card_type: 'yellow' | 'red' | 'white';
  card_reason?: string;
  minute_given?: number;
  is_cancelled: boolean;
  given_by?: string;
  
  // Relations
  fighter?: Fighter;
  match?: Match;
}

// Transfert de lutteur
export interface FighterTransfer extends BaseEntity {
  fighter_id: number;
  from_region_id: number;
  to_region_id: number;
  transfer_date: string;
  transfer_reason?: string;
  transfer_fee?: number;
  contract_duration?: number;
  is_permanent: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approved_by_user_id?: number;
  
  // Relations
  fighter?: Fighter;
  from_region?: Region;
  to_region?: Region;
  approved_by?: User;
}

// Utilisateur
export interface User extends BaseEntity {
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'user' | 'moderator' | 'fighter_manager';
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  bio?: string;
  phone_number?: string;
  country?: string;
  city?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
}

// Types pour les réponses paginées
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les filtres
export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface RegionFilters extends BaseFilters {
  code?: string;
  with_fighters?: boolean;
  with_cities?: boolean;
  with_competitions?: boolean;
  fighter_count_min?: number;
  fighter_count_max?: number;
}

export interface CityFilters extends BaseFilters {
  region_id?: number;
  with_region?: boolean;
}

export interface FighterFilters extends BaseFilters {
  region_id?: number;
  city_id?: number;
  is_active?: boolean;
  is_champion?: boolean;
  min_ranking?: number;
  max_ranking?: number;
  with_region?: boolean;
  with_city?: boolean;
  with_achievements?: boolean;
  with_transfers?: boolean;
}

export interface CompetitionFilters extends BaseFilters {
  type?: string;
  status?: string;
  region_id?: number;
}

export interface EditionFilters extends BaseFilters {
  competition_id?: number;
  year?: number;
  status?: string;
}

export interface MatchFilters extends BaseFilters {
  edition_id?: number;
  phase_id?: number;
  group_id?: number;
  sub_group_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}