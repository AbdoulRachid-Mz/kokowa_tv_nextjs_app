import { z } from 'zod';

// Schema de base pour les régions
export const regionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  code: z.string().min(1, 'Le code est requis').max(10, 'Le code est trop long'),
  description: z.string().optional(),
  flag_image: z.string().url('URL invalide').optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Couleur hexadécimale invalide').optional(),
});

// Schema pour les lutteurs
export const fighterSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  nickname: z.string().max(100, 'Le surnom est trop long').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  birth_place: z.string().max(100, 'Le lieu de naissance est trop long').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  height: z.number().min(0.5, 'Taille invalide').max(3.0, 'Taille invalide').optional(),
  weight: z.number().min(20, 'Poids invalide').max(200, 'Poids invalide').optional(),
  profile_image: z.string().url('URL invalide').optional().or(z.literal('')),
  cover_image: z.string().url('URL invalide').optional().or(z.literal('')),
  bio: z.string().max(1000, 'La biographie est trop longue').optional(),
  fighting_style: z.string().max(500, 'Le style de combat est trop long').optional(),
  debut_year: z.number().int().min(1900, 'Année invalide').max(new Date().getFullYear(), 'Année invalide').optional(),
  ranking: z.number().int().min(0, 'Le classement doit être positif').optional(),
  is_active: z.boolean().default(true),
  is_champion: z.boolean().default(false),
  social_links: z.any().optional(),
});

// Schema pour les palmarès des lutteurs
export const fighterAchievementSchema = z.object({
  fighter_id: z.number().int().positive('Lutteur invalide'),
  region_id: z.number().int().positive('Région invalide'),
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  edition_id: z.number().int().positive('Édition invalide'),
  year: z.number().int().min(1900, 'Année invalide').max(new Date().getFullYear(), 'Année invalide'),
  position: z.enum(['1st', '2nd', '3rd', 'finalist', 'semifinalist', 'quarterfinalist']),
  description: z.string().optional(),
  medal_image: z.string().url('URL invalide').optional().or(z.literal('')),
});

// Schema pour les arbitres
export const refereeSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  nickname: z.string().max(100, 'Le surnom est trop long').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  profile_image: z.string().url('URL invalide').optional().or(z.literal('')),
  license_number: z.string().max(50, 'Le numéro de licence est trop long').optional(),
  certification_level: z.string().max(50, 'Le niveau de certification est trop long').optional(),
  experience_years: z.number().int().min(0, 'Années d\'expérience invalides').optional(),
  is_active: z.boolean().default(true),
  social_links: z.any().optional(),
});

// Schema pour les compétitions
export const competitionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  slug: z.string().min(1, 'Le slug est requis').max(255, 'Le slug est trop long'),
  description: z.string().optional(),
  type: z.enum(['sabre_national', 'coupe_regionale', 'halarou_bakwai', 'aes', 'friendly', 'ministre', 'coupe_airtel', 'other']),
  location: z.string().max(255, 'Le lieu est trop long').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  featured_image: z.string().url('URL invalide').optional().or(z.literal('')),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  max_participants: z.number().int().min(2, 'Minimum 2 participants').optional(),
  prize_pool: z.number().min(0, 'Le prix doit être positif').optional(),
  is_active: z.boolean().default(true),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed']).default('upcoming'),
});

// Schema pour les éditions de compétition
export const competitionEditionSchema = z.object({
  competition_id: z.number().int().positive('Compétition invalide'),
  edition_number: z.number().int().min(1, 'Le numéro d\'édition doit être positif'),
  year: z.number().int().min(1900, 'Année invalide').max(new Date().getFullYear() + 5, 'Année invalide'),
  theme: z.string().max(255, 'Le thème est trop long').optional(),
  is_active: z.boolean().default(false),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  winner_fighter_id: z.number().int().positive('Lutteur gagnant invalide').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  prize_pool: z.number().min(0, 'Le prix doit être positif').optional(),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
});

// Schema pour les phases
export const phaseSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  phase_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  phase_type: z.enum(['qualification', 'group', 'knockout', 'quarterfinal', 'semifinal', 'final']),
  description: z.string().optional(),
  is_active: z.boolean().default(false),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  is_completed: z.boolean().default(false),
});

// Schema pour les groupes de phase
export const phaseGroupSchema = z.object({
  phase_id: z.number().int().positive('Phase invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  is_active: z.boolean().default(false),
  group_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  description: z.string().optional(),
  is_completed: z.boolean().default(false),
});

// Schema pour les sous-groupes
export const subGroupSchema = z.object({
  group_id: z.number().int().positive('Groupe invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  sub_group_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  description: z.string().optional(),
  is_active: z.boolean().default(false),
  region1_id: z.number().int().positive('Région 1 invalide').optional(),
  region2_id: z.number().int().positive('Région 2 invalide').optional(),
  belt_region1: z.number().int().positive('Ceinture région 1 invalide').optional(),
  belt_region2: z.number().int().positive('Ceinture région 2 invalide').optional(),
  main_referee_id: z.number().int().positive('Arbitre principal invalide').optional(),
  is_completed: z.boolean().default(false),
});

// Schema pour les ceintures
export const beltSchema = z.object({
  color: z.string().min(1, 'La couleur est requise').max(20, 'La couleur est trop longue'),
  is_active: z.boolean().default(true),
});

// Schema pour les matchs
export const matchSchema = z.object({
  sub_group_id: z.number().int().positive('Sous-groupe invalide'),
  match_number: z.number().int().min(1, 'Le numéro de match doit être positif').optional(),
  match_date: z.string().datetime('Format de date/heure invalide'),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM:SS)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM:SS)').optional(),

  // Participants
  fighter1_id: z.number().int().positive('Lutteur 1 invalide').optional(),
  fighter2_id: z.number().int().positive('Lutteur 2 invalide').optional(),

  // Résultats
  winner_fighter_id: z.number().int().positive('Lutteur gagnant invalide').optional(),
  loser_fighter_id: z.number().int().positive('Lutteur perdant invalide').optional(),
  is_active: z.boolean().default(true),

  // Résultat du match
  match_result: z.enum([
    'fighter1_win',
    'fighter2_win',
    'draw',
    'cancelled',
    'postponed'
  ]).optional(),

  // Durée et statut
  total_duration: z.string().optional(),
  break_count: z.number().int().min(0, 'Nombre de pauses invalide').default(0),
  status: z.enum([
    'scheduled',
    'live',
    'round_break',
    'completed',
    'cancelled',
    'postponed',
    'reclamation'
  ]).default('scheduled'),

  // Informations supplémentaires
  audience_count: z.number().int().min(0, 'Nombre de spectateurs invalide').optional(),
  video_url: z.string().url('URL vidéo invalide').optional().or(z.literal('')),
  live_stream_url: z.string().url('URL stream invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
});

// Schema pour l'inscription des lutteurs à une édition
export const editionFighterSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  fighter_id: z.number().int().positive('Lutteur invalide'),
  region_id: z.number().int().positive('Région invalide'),
  status: z.enum(['registered', 'qualified', 'disqualified', 'withdrawn']).default('registered'),
});

// Schema pour l'inscription des régions à une édition
export const editionRegionSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  region_id: z.number().int().positive('Région invalide'),
  status: z.enum(['registered', 'approved', 'rejected']).default('registered'),
});

// Schema pour les cartons de match
export const fighterCardSchema = z.object({
  fighter_id: z.number().int().positive('Lutteur invalide'),
  match_id: z.number().int().positive('Match invalide'),
  card_type: z.enum(['yellow', 'red']),
  card_reason: z.string().optional(),
  minute_given: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM:SS)').optional(),
  is_cancelled: z.boolean().default(false),
});

// Schema pour les transferts
export const fighterTransferSchema = z.object({
  fighter_id: z.number().int().positive('Lutteur invalide'),
  from_region_id: z.number().int().positive('Région d\'origine invalide'),
  to_region_id: z.number().int().positive('Région de destination invalide'),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  transfer_reason: z.string().optional(),
  transfer_fee: z.number().min(0, 'Frais de transfert invalides').optional(),
  contract_duration: z.number().int().min(1, 'Durée de contrat invalide').optional(),
  is_permanent: z.boolean().default(true),
  approved_by_user_id: z.number().int().positive('Utilisateur approuvant invalide').optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']).default('pending'),
});

// Schema pour les utilisateurs
export const userSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis').max(50, 'Le nom d\'utilisateur est trop long'),
  email: z.string().email('Email invalide').max(100, 'L\'email est trop long'),
  password_hash: z.string().min(1, 'Le hash du mot de passe est requis').max(255, 'Le hash est trop long'),
  role: z.enum(['admin', 'editor', 'user', 'moderator', 'fighter_manager']).default('user'),
  first_name: z.string().max(50, 'Le prénom est trop long').optional(),
  last_name: z.string().max(50, 'Le nom est trop long').optional(),
  profile_picture: z.string().url('URL invalide').optional().or(z.literal('')),
  bio: z.string().optional(),
  phone_number: z.string().max(20, 'Le numéro de téléphone est trop long').optional(),
  country: z.string().max(100, 'Le pays est trop long').optional(),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
});

// Schema pour les messages
export const messageSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis'),
  message_type: z.enum(['comment', 'direct_message', 'group_message', 'match_commentary', 'system_notification']).default('comment'),
  entity_type: z.enum(['article', 'match', 'fighter', 'competition', 'user']).optional(),
  entity_id: z.number().int().positive('ID d\'entité invalide').optional(),
  author_id: z.number().int().positive('Auteur invalide'),
  recipient_id: z.number().int().positive('Destinataire invalide').optional(),
  parent_message_id: z.number().int().positive('Message parent invalide').optional(),
  is_read: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_deleted: z.boolean().default(false),
  like_count: z.number().int().min(0, 'Nombre de likes invalide').default(0),
  images: z.array(z.string()).optional(),
  video_url: z.string().url('URL vidéo invalide').optional().or(z.literal('')),
  audio_url: z.string().url('URL audio invalide').optional().or(z.literal('')),
});

// Schema pour les articles
export const articleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  slug: z.string().min(1, 'Le slug est requis').max(255, 'Le slug est trop long'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Le contenu est requis'),
  featured_image: z.string().url('URL invalide').optional().or(z.literal('')),
  author_id: z.number().int().positive('Auteur invalide'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  language: z.enum(['fr', 'ha', 'en']).default('fr'),
  view_count: z.number().int().min(0, 'Nombre de vues invalide').default(0),
  like_count: z.number().int().min(0, 'Nombre de likes invalide').default(0),
  share_count: z.number().int().min(0, 'Nombre de partages invalide').default(0),
  meta_title: z.string().max(255, 'Le meta titre est trop long').optional(),
  meta_description: z.string().optional(),
  published_at: z.string().datetime('Format de date/heure invalide').optional(),
});

// Schema pour les médias
export const mediaSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  file_path: z.string().min(1, 'Le chemin du fichier est requis').max(255, 'Le chemin est trop long'),
  file_type: z.enum(['image', 'video', 'document', 'audio']),
  mime_type: z.string().max(100, 'Le type MIME est trop long').optional(),
  file_size: z.number().int().min(0, 'La taille du fichier est invalide').optional(),
  alt_text: z.string().max(255, 'Le texte alternatif est trop long').optional(),
  description: z.string().optional(),
  uploader_id: z.number().int().positive('Uploader invalide'),
  is_featured: z.boolean().default(false),
  entity_type: z.string().max(50, 'Le type d\'entité est trop long').optional(),
  entity_id: z.number().int().positive('ID d\'entité invalide').optional(),
});

// Schema pour les vidéos
export const videoSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  slug: z.string().min(1, 'Le slug est requis').max(255, 'Le slug est trop long'),
  description: z.string().optional(),
  video_url: z.string().url('URL vidéo invalide').min(1, 'L\'URL de la vidéo est requise'),
  thumbnail_url: z.string().url('URL de miniature invalide').optional().or(z.literal('')),
  duration: z.number().int().min(0, 'Durée invalide').optional(),
  type: z.enum(['youtube', 'facebook', 'tiktok', 'rtmp', 'upload', 'vimeo']),
  category: z.enum(['match', 'interview', 'highlights', 'training', 'documentary', 'ceremony']),
  view_count: z.number().int().min(0, 'Nombre de vues invalide').default(0),
  like_count: z.number().int().min(0, 'Nombre de likes invalide').default(0),
  is_live: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  published_at: z.string().datetime('Format de date/heure invalide').optional(),
});

// Schema pour les interactions
export const interactionSchema = z.object({
  user_id: z.number().int().positive('Utilisateur invalide'),
  entity_type: z.string().min(1, 'Le type d\'entité est requis').max(50, 'Le type d\'entité est trop long'),
  entity_id: z.number().int().positive('ID d\'entité invalide'),
  interaction_type: z.enum(['like', 'view', 'share', 'bookmark', 'follow']),
});

// Types dérivés des schemas
export type RegionInput = z.infer<typeof regionSchema>;
export type FighterInput = z.infer<typeof fighterSchema>;
export type FighterAchievementInput = z.infer<typeof fighterAchievementSchema>;
export type RefereeInput = z.infer<typeof refereeSchema>;
export type CompetitionInput = z.infer<typeof competitionSchema>;
export type CompetitionEditionInput = z.infer<typeof competitionEditionSchema>;
export type PhaseInput = z.infer<typeof phaseSchema>;
export type PhaseGroupInput = z.infer<typeof phaseGroupSchema>;
export type SubGroupInput = z.infer<typeof subGroupSchema>;
export type BeltInput = z.infer<typeof beltSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type EditionFighterInput = z.infer<typeof editionFighterSchema>;
export type EditionRegionInput = z.infer<typeof editionRegionSchema>;
export type FighterCardInput = z.infer<typeof fighterCardSchema>;
export type FighterTransferInput = z.infer<typeof fighterTransferSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type MediaInput = z.infer<typeof mediaSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
export type InteractionInput = z.infer<typeof interactionSchema>;