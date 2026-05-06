// @/types/mini-entities.ts

// Mini Competition
export interface MiniCompetition {
  id: number;
  name: string;
  slug: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  featured_image?: string;
}

// Mini CompetitionEdition
export interface MiniCompetitionEdition {
  id: number;
  competition_id: number;
  edition_number: number;
  year: number;
  theme?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  
  // Stats
  phases_count?: number;
  fighters_count?: number;
  regions_count?: number;
  matches_count?: number;
}

// Mini Region
export interface MiniRegion {
  id: number;
  name: string;
  code: string;
  flag_image?: string;
  stadium_name?: string;
  stadium_image?: string;
  color?: string;
  
  // Stats
  total_fighters?: number;
  total_champions?: number;
}

// Mini Fighter
export interface MiniFighter {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  slug: string;
  profile_image?: string;
  region_id?: number;
  ranking: number;
  is_active: boolean;
  is_champion: boolean;
}

// Mini Referee
export interface MiniReferee {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  profile_image?: string;
  region_id?: number;
  is_active: boolean;
}

// Mini Coach
export interface MiniCoach {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  profile_image?: string;
  region_id: number;
  is_active: boolean;
}

// Mini Belt
export interface MiniBelt {
  id: number;
  color: string;
  is_active: boolean;
}

// Mini Phase
export interface MiniPhase {
  id: number;
  edition_id: number;
  name: string;
  phase_order: number;
  phase_type: 'qualification' | 'group' | 'knockout' | 'quarterfinal' | 'semifinal' | 'final';
  is_completed: boolean;
  is_active?: boolean;

  // Stats
  groups_count?: number;
  groups_completed_count?: number;
  sub_groups_count?: number;
  matches_count?: number;
}

// Mini PhaseGroup
export interface MiniPhaseGroup {
  id: number;
  phase_id: number;
  name: string;
  group_order: number;
  is_completed: boolean;
  is_active?: boolean;
  date?: string;

  // Stats
  sub_groups_count?: number;
  sub_groups_completed_count?: number;
  matches_count?: number;
}

// Mini SubGroup
export interface MiniSubGroup {
  id: number;
  group_id: number;
  name: string;
  sub_group_order: number;
  region1_id?: number;
  region2_id?: number;
  belt_region1?: number;
  belt_region2?: number;
  main_referee_id?: number;
  is_completed: boolean;
  is_active?: boolean;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';

  // Stats
  matches_count?: number;
  matches_completed_count?: number;
  fighters_count?: number;
}

// Mini Match
export interface MiniMatch {
  id: number;
  sub_group_id: number;
  match_date: string;
  fighter1_id?: number;
  fighter2_id?: number;
  winner_fighter_id?: number;
  match_result?: 'fighter1_win' | 'fighter2_win' | 'draw' | 'cancelled' | 'postponed';
  status: 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
  is_active?: boolean;
}

// Mini EditionFighter
export interface MiniEditionFighter {
  id: number;
  edition_id: number;
  fighter_id: number;
  region_id: number;
  is_champion?: boolean;
  is_eliminated?: boolean;
  status: 'registered' | 'qualified' | 'disqualified' | 'withdrawn';
}

// Mini EditionRegion
export interface MiniEditionRegion {
  id: number;
  edition_id: number;
  region_id: number;
  is_eliminated?: boolean;
  points?: number;
  status: 'registered' | 'approved' | 'rejected';
}

// Mini FighterAchievement
export interface MiniFighterAchievement {
  id: number;
  fighter_id: number;
  region_id: number;
  edition_id: number;
  year: number;
  position: '1st' | '2nd' | '3rd' | 'finalist' | 'semifinalist' | 'quarterfinalist';
  title: string;
}

// Mini FighterCard
export interface MiniFighterCard {
  id: number;
  fighter_id: number;
  match_id: number;
  card_type: 'yellow' | 'red';
  is_cancelled: boolean;
}

// Mini FighterTransfer
export interface MiniFighterTransfer {
  id: number;
  fighter_id: number;
  from_region_id: number;
  to_region_id: number;
  transfer_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  is_permanent: boolean;
}

// Mini Article
export interface MiniArticle {
  id: number;
  title: string;
  slug: string;
  type: 'news' | 'event' | 'announcement' | 'highlight' | 'interview' | 'analyse';
  featured_image?: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
}

// Mini Media
export interface MiniMedia {
  id: number;
  title: string;
  file_path: string;
  file_type: 'image' | 'video' | 'document' | 'audio';
  uploader_id: number;
  is_featured: boolean;
  entity_type?: string;
  entity_id?: number;
}

// Mini Video
export interface MiniVideo {
  id: number;
  title: string;
  slug: string;
  thumbnail_url?: string;
  type: 'youtube' | 'facebook' | 'tiktok' | 'rtmp' | 'upload' | 'vimeo';
  category: 'match' | 'interview' | 'highlights' | 'training' | 'documentary' | 'ceremony';
  is_featured: boolean;
  published_at?: string;
}

// Mini Message
export interface MiniMessage {
  id: number;
  content: string;
  message_type: 'comment' | 'direct_message' | 'group_message' | 'match_commentary' | 'system_notification';
  entity_type?: 'article' | 'match' | 'fighter' | 'competition' | 'user';
  entity_id?: number;
  author_id: number;
  is_read: boolean;
  is_deleted: boolean;
  like_count: number;
}

// Mini Notification
export interface MiniNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'match_update' | 'fighter_update' | 'competition_update' | 'system_notification' | 'achievement' | 'message';
  entity_type?: 'article' | 'match' | 'fighter' | 'competition' | 'user' | 'message';
  entity_id?: number;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
}
