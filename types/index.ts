// import { User } from "./auth";

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
  stadium_name?: string,
  stadium_image?: string,
  color?: string;
  total_fighters: number;
  total_champions: number;

  fighters?: Fighter[];
  coach?: Coach[]
}

// Lutteur
export interface Fighter extends BaseEntity {
  first_name: string;
  last_name: string;
  nickname?: string;
  slug: string;
  birth_date?: string;
  birth_place?: string;
  region_id?: number;
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
  achievements?: FighterAchievement[];
  total_matches?: number;
  total_wins?: number;
  total_losses?: number;
}

// Palmarès des lutteurs
export interface FighterAchievement extends BaseEntity {
  fighter_id: number;
  region_id: number;
  title: string;
  edition_id: number;
  year: number;
  position: '1st' | '2nd' | '3rd' | 'finalist' | 'semifinalist' | 'quarterfinalist';
  description?: string;
  medal_image?: string;
  fighter?: Fighter;
  region?: Region;
  edition?: CompetitionEdition;
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

// Ceinture
export interface Belt extends BaseEntity {
  color: string;
  is_active: boolean;
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
  is_active?: boolean;
  
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
  region_id?: number;
  total_participants: number;
  prize_pool?: number;
  registration_deadline?: string;
  is_active?: boolean;
  
  // Relations
  competition?: Competition;
  winner_fighter?: Fighter;
  region?: Region;
  fighters?: EditionFighter[];
  regions?: EditionRegion[];
  phases?: Phase[];
}

// Lutteur participant à une édition
export interface EditionFighter extends BaseEntity {
  edition_id: number;
  fighter_id: number;
  region_id: number;
  registration_date: string;
  status: 'registered' | 'qualified' | 'disqualified' | 'withdrawn';  
  // Relations
  edition?: CompetitionEdition;
  fighter: Fighter;
  region?: Region;
}

// Région participante à une édition
export interface EditionRegion extends BaseEntity {
  edition_id: number;
  region_id: number;
  registration_date: string;
  status: 'registered' | 'approved' | 'rejected';
  
  // Relations
  edition?: CompetitionEdition;
  region: Region;
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
  is_active?: boolean;
  
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
  is_active?: boolean;
  
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
  region1_id?: number;
  region2_id?: number;
  belt_region1?: number;
  belt_region2?: number;
  main_referee_id?: number;
  is_completed: boolean;
  is_active?: boolean;
  
  // Relations
  group?: PhaseGroup;
  region1?: Region;
  region2?: Region;
  belt1?: Belt;
  belt2?: Belt;
  main_referee?: Referee;
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
  
  // Résultat
  winner_fighter_id?: number;
  loser_fighter_id?: number;
  
  // Score
  match_result?: 'fighter1_win' | 'fighter2_win' | 'draw' | 'cancelled' | 'postponed';
  total_duration?: string;
  break_count: number;
  status: 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
  is_active?: boolean;
  
  // Informations supplémentaires
  audience_count?: number;
  video_url?: string;
  live_stream_url?: string;
  notes?: string;
  
  // Relations
  sub_group?: SubGroup;
  fighter1?: Fighter;
  fighter2?: Fighter;
  winner_fighter?: Fighter;
  loser_fighter?: Fighter;
  cards?: FighterCard[];
}

// Carton de match
export interface FighterCard extends BaseEntity {
  fighter_id: number;
  match_id: number;
  card_type: 'yellow' | 'red';
  card_reason?: string;
  minute_given?: string;
  is_cancelled: boolean;
  
  // Relations
  fighter?: Fighter;
  match?: Match;
}

// types/index.ts - Ajouter ces types
export interface FighterTransfer {
  id: number;
  fighter_id: number;
  fighter?: Fighter;
  from_region_id: number;
  from_region?: Region;
  to_region_id: number;
  to_region?: Region;
  transfer_date: string;
  transfer_reason?: string;
  transfer_fee?: number;
  contract_duration?: number; // en mois
  is_permanent: boolean;
  approved_by_user_id?: number;
  approved_by_user?: User;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

// Message
export interface Message extends BaseEntity {
  content: string;
  message_type: 'comment' | 'direct_message' | 'group_message' | 'match_commentary' | 'system_notification';
  entity_type?: 'article' | 'match' | 'fighter' | 'competition' | 'user';
  entity_id?: number;
  author_id: number;
  recipient_id?: number;
  parent_message_id?: number;
  is_read: boolean;
  is_active?: boolean;
  is_deleted: boolean;
  like_count: number;
  images?: string[];
  video_url?: string;
  audio_url?: string;
  
  // Relations
  author?: User;
  recipient?: User;
  parent_message?: Message;
}

export interface Notification extends BaseEntity {
  user_id: number;
  message: string;
  notification_type: 'match_update' | 'fighter_update' | 'competition_update' | 'system_notification';
  is_read: boolean;
  created_at: string;
  
  // Relations
  user?: User;
}

export interface NotificationFilters extends BaseFilters {
  user_id?: number;
  notification_type?: 'match_update' | 'fighter_update' | 'competition_update' | 'system_notification' | 'achievement' | 'message';
  is_read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  with_user?: boolean;
}

// Article
export interface Article extends BaseEntity {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  language: 'fr' | 'ha' | 'en';
  view_count: number;
  like_count: number;
  share_count: number;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  
  // Relations
  author?: User;
}

// Média
export interface Media extends BaseEntity {
  title: string;
  file_path: string;
  file_type: 'image' | 'video' | 'document' | 'audio';
  mime_type?: string;
  file_size?: number;
  alt_text?: string;
  description?: string;
  uploader_id: number;
  is_featured: boolean;
  entity_type?: string;
  entity_id?: number;
  
  // Relations
  uploader?: User;
}

// Vidéo
export interface Video extends BaseEntity {
  title: string;
  slug: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  type: 'youtube' | 'facebook' | 'tiktok' | 'rtmp' | 'upload' | 'vimeo';
  category: 'match' | 'interview' | 'highlights' | 'training' | 'documentary' | 'ceremony';
  view_count: number;
  like_count: number;
  is_live: boolean;
  is_featured: boolean;
  published_at?: string;
}

// Interaction
export interface Interaction extends BaseEntity {
  user_id: number;
  entity_type: string;
  entity_id: number;
  interaction_type: 'like' | 'view' | 'share' | 'bookmark' | 'follow';
  
  // Relations
  user?: User;
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
  relations?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RegionFilters extends BaseFilters {
  code?: string;
  with_fighters?: boolean;
  with_coach?: boolean;
  with_competitions?: boolean;
  fighter_count_min?: number;
  fighter_count_max?: number;
}

export interface FighterFilters extends BaseFilters {
  region_id?: number;
  is_active?: boolean;
  is_champion?: boolean;
  min_ranking?: number;
  max_ranking?: number;
  with_region?: boolean;
  with_achievements?: boolean;
  with_transfers?: boolean;
}

export interface FighterAchievementFilters extends BaseFilters {
  fighter_id?: number;
  region_id?: number;
  edition_id?: number;
  year?: number;
  position?: string;
  with_fighter?: boolean;
  with_region?: boolean;
  with_edition?: boolean;
}

export interface RefereeFilters extends BaseFilters {
  region_id?: number;
  is_active?: boolean;
  certification_level?: string;
  experience_min?: number;
  with_region?: boolean;
}

// Coach
export interface Coach extends BaseEntity {
  first_name: string;
  last_name: string;
  nickname?: string;
  region_id: number;
  birth_date?: string;
  profile_image?: string;
  license_number?: string;
  certification_level?: string;
  experience_years?: number;
  specialties?: string;
  is_active: boolean;
  social_links?: any;

  // Relations
  region?: Region;
}
export interface CoachFilters extends BaseFilters {
  region_id?: number;
  is_active?: boolean;
  certification_level?: string;
  experience_min?: number;
  with_region?: boolean;
}



export interface BeltFilters extends BaseFilters {
  color?: string;
  is_active?: boolean;
}

export interface CompetitionFilters extends BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed' | string;
  region_id?: number;
  is_active?: boolean;
  
  // NOUVEAUX FILTRES BASÉS SUR COMPETITION_EDITIONS
  edition_year?: number; 

  date_from?: string; // Basé sur c.created_at (ou c.start_date si disponible)
  date_to?: string;
  
  with_region?: boolean;
  with_editions?: boolean;
  with_phases?: boolean;
  with_matches?: boolean;
}

export interface EditionFilters extends BaseFilters {
  competition_id?: number;
  year?: number;
  with_competition?: boolean;
  is_active?: boolean;
  with_fighters?: boolean;
  with_regions?: boolean;
  with_phases?: boolean;
  region_id?: number;
  offset?: number;
  with_groups?: boolean;
with_subGroups?: boolean;
with_matches?: boolean;
}

export interface PhaseFilters extends BaseFilters {
  edition_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
  phase_type?: 'qualification' | 'group' | 'knockout' | 'quarterfinal' | 'semifinal' | 'final';
  is_completed?: boolean;
  with_edition?: boolean;
  with_groups?: boolean;
  with_subGroups?: boolean;
  with_matches?: boolean;
}

export interface PhaseGroupFilters extends BaseFilters {
  phase_id?: number;
  is_completed?: boolean;
  is_active?: boolean;
  with_phase?: boolean;
  with_subGroups?: boolean;
  with_matches?: boolean;
}

export interface SubGroupFilters extends BaseFilters {
  group_id?: number;
  region1_id?: number;
  region2_id?: number;
  belt_region1?: number;
  belt_region2?: number;
  main_referee_id?: number;
  is_completed?: boolean;
  is_active?: boolean;
  with_group?: boolean;
  with_matches?: boolean;
  with_regions?: boolean;
  with_belts?: boolean;
  with_referee?: boolean;
}

export interface MatchFilters extends BaseFilters {
  sub_group_id?: number;
  edition_id?: number;
  phase_id?: number;
  group_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  is_active?: boolean;
  with_sub_group?: boolean;
  with_fighters?: boolean;
  with_winner?: boolean;
}

export interface EditionFighterFilters extends BaseFilters {
  edition_id?: number;
  fighter_id?: number;
  region_id?: number;
  status?: string;
  with_fighter: boolean;
  with_region?: boolean;
  with_edition?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EditionRegionFilters extends BaseFilters {
  edition_id?: number;
  region_id?: number;
  status?: string;
  with_region: boolean;
  with_edition?: boolean;
}

export interface FighterCardFilters extends BaseFilters {
  fighter_id?: number;
  match_id?: number;
  card_type?: string;
  is_cancelled?: boolean;
  with_fighter?: boolean;
  with_match?: boolean;
}

export interface FighterTransferFilters {
  fighter_id?: number;
  from_region_id?: number;
  to_region_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  with_fighter?: boolean;
  with_regions?: boolean;
  with_approver?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Archive types
export interface ArchiveFighterAchievement extends BaseEntity {
  fighter_id: number;
  region_id: number;
  title: string;
  edition_id: number;
  year: number;
  position: '1st' | '2nd' | '3rd' | 'finalist' | 'semifinalist' | 'quarterfinalist';
  description?: string;
  medal_image?: string;
  archived_at: string;
  archive_reason?: string;
  original_id: number;
}

export interface ArchiveFighterAchievementFilters extends BaseFilters {
  fighter_id?: number;
  region_id?: number;
  edition_id?: number;
  year?: number;
  position?: string;
  archive_reason?: string;
  date_from?: string;
  date_to?: string;
  with_fighter?: boolean;
  with_region?: boolean;
  with_edition?: boolean;
}



export interface MessageFilters extends BaseFilters {
  message_type?: string;
  entity_type?: string;
  entity_id?: number;
  author_id?: number;
  recipient_id?: number;
  is_read?: boolean;
  is_active?: boolean;
  is_deleted?: boolean;
  with_author?: boolean;
  with_recipient?: boolean;
  with_parent?: boolean;
  parent_message_id?: number;
}

export interface ArticleFilters extends BaseFilters {
  author_id?: number;
  status?: 'draft' | 'published' | 'archived';
  language?: 'fr' | 'ha' | 'en';
  with_author?: boolean;
}

export interface MediaFilters extends BaseFilters {
  file_type?: 'image' | 'video' | 'document' | 'audio';
  uploader_id?: number;
  entity_type?: string;
  entity_id?: number;
  is_featured?: boolean;
  with_uploader?: boolean;
}

export interface VideoFilters extends BaseFilters {
  type?: 'youtube' | 'facebook' | 'tiktok' | 'rtmp' | 'upload' | 'vimeo';
  category?: 'match' | 'interview' | 'highlights' | 'training' | 'documentary' | 'ceremony';
  is_live?: boolean;
  is_featured?: boolean;
  with_duration?: boolean;
}

export interface InteractionFilters extends BaseFilters {
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
  interaction_type?: string;
  with_user?: boolean;
}

// types/index.ts - Ajouter ces types
export interface StatsFilters {
  entity?: string;
  statId?: string;
  date_from?: string;
  date_to?: string;
  region_id?: number;
  edition_id?: number;
  competition_id?: number;
  year?: number;
  group_by?: 'day' | 'week' | 'month' | 'year' | 'region' | 'status';
  limit?: number;
}

export interface StatsResponse {
  entity: string;
  statId?: string;
  period?: {
    date_from?: string;
    date_to?: string;
  };
  data: any;
  metadata?: {
    total: number;
    average?: number;
    min?: number;
    max?: number;
    grouped_by?: string;
  };
}

export interface GlobalStats {
  summary: {
    total_fighters: number;
    total_regions: number;
    total_coaches: number;
    total_referees: number;
    total_competitions: number;
    total_matches: number;
    total_transfers: number;
    total_users: number;
  };
  recent_activity: {
    new_fighters: number;
    new_matches: number;
    new_transfers: number;
    active_competitions: number;
  };
  regions_stats: {
    most_fighters: { region_id: number; region_name: string; count: number }[];
    most_champions: { region_id: number; region_name: string; count: number }[];
  };
}

// App Settings
export interface AppSetting extends BaseEntity {
  setting_key: string;
  setting_value: string | number | boolean | any;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  is_public: boolean;
  is_editable: boolean;
}

export interface AppSettingFilters extends BaseFilters {
  category?: string;
  is_public?: boolean;
  is_editable?: boolean;
}

// Types pour les valeurs des settings avec typage fort
export interface AppSettings {
  // General
  app_name: string;
  app_description: string;
  app_version: string;
  
  // System
  maintenance_mode: boolean;
  
  // Auth
  registration_enabled: boolean;
  
  // Media
  max_file_size: number;
  allowed_file_types: string[];
  
  // Localization
  default_language: string;
  supported_languages: string[];
  
  // Matches
  match_duration: number;
  max_breaks_per_match: number;
  
  // Ranking
  ranking_points_win: number;
  ranking_points_draw: number;
  
  // Social
  social_links: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  
  // Contact
  contact_email: string;
  
  // Analytics
  analytics_tracking_id: string;
}

// types/index.ts - Ajouter ces types

export interface User extends BaseEntity {
  auth_id: string;
  fcm_token?: string;
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
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  
  // Relations
  permissions?: string[];
  interactions?: Interaction[];
  messages?: Message[];
}

export interface UserFilters extends BaseFilters {
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  country?: string;
  date_from?: string;
  date_to?: string;
  with_profile?: boolean;
  with_permissions?: boolean;
  with_interactions?: Boolean;
  with_messages?: Boolean;
}

export interface CreateUserData {
  auth_id: string;
  username: string;
  email: string;
  password_hash: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  bio?: string;
  phone_number?: string;
  country?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  bio?: string;
  phone_number?: string;
  country?: string;
  is_active?: boolean;
  is_verified?: boolean;
}
// types/index.ts – User-centric statistics types

// 1. Global user counters
export interface UserGlobalStats {
  totalUsers: number;
  totalActive: number;
  totalVerified: number;
  totalByRole: Record<User['role'], number>;
}

// 2. Daily / monthly registration trend
export interface UserRegistrationTrend {
  date: string; // YYYY-MM-DD
  newUsers: number;
  cumulative: number;
}

// 3. User activity snapshot
export interface UserActivityStats {
  lastDayActive: number;
  last7DaysActive: number;
  last30DaysActive: number;
  neverLoggedIn: number;
}

// 4. Country distribution
export interface UserCountryStats {
  country: string;
  userCount: number;
  percentage: number;
}

// 5. Content produced by users
export interface UserContentStats {
  totalArticles: number;
  totalMedia: number;
  totalVideos: number;
  totalMessages: number;
}

// 6. Interaction breakdown
export interface UserInteractionStats {
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  totalBookmarks: number;
  totalFollows: number;
}

// 7. Notification funnel
export interface UserNotificationStats {
  totalSent: number;
  totalRead: number;
  readRate: number; // 0-100
  byType: Record<Notification['notification_type'], { sent: number; read: number }>;
}

// 8. Transfer approvals (fighter_manager activity)
export interface UserTransferStats {
  totalTransfersApproved: number;
  totalTransfersRejected: number;
  totalPending: number;
}

// 9. Role-specific KPIs
export interface RoleKPI {
  role: User['role'];
  userCount: number;
  avgContentPerUser: number;
  avgInteractionsPerUser: number;
}

// 10. Top contributors
export interface TopUserContributor {
  user: User;
  articlesCount: number;
  mediaCount: number;
  interactionsCount: number;
}

// 11. Filters dedicated to user stats
export interface UserStatsFilters {
  dateFrom?: string;
  dateTo?: string;
  role?: User['role'];
  country?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year' | 'role' | 'country';
}

// 12. Wrapper for API response
export interface UserStatsResponse {
  global: UserGlobalStats;
  registrationTrend: UserRegistrationTrend[];
  activity: UserActivityStats;
  countries: UserCountryStats[];
  content: UserContentStats;
  interactions: UserInteractionStats;
  notifications: UserNotificationStats;
  transfers: UserTransferStats;
  roleKPIs: RoleKPI[];
  topContributors: TopUserContributor[];
  generatedAt: string;
}

