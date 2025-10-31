import { z } from 'zod';

// Schema de base pour les régions
export const regionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  code: z.string().min(1, 'Le code est requis').max(10, 'Le code est trop long'),
  description: z.string().optional(),
  flag_image: z.string().url('URL invalide').optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Couleur hexadécimale invalide').optional(),
});

// Schema pour les villes
export const citySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  region_id: z.number().int().positive('Région invalide'),
  description: z.string().optional(),
});

// Schema pour les lutteurs
export const fighterSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  nickname: z.string().max(100, 'Le surnom est trop long').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  birth_place: z.string().max(100, 'Le lieu de naissance est trop long').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  city_id: z.number().int().positive('Ville invalide').optional(),
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
});

// Schema pour les arbitres
export const refereeSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  nickname: z.string().max(100, 'Le surnom est trop long').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  license_number: z.string().max(50, 'Le numéro de licence est trop long').optional(),
  certification_level: z.string().max(50, 'Le niveau de certification est trop long').optional(),
  experience_years: z.number().int().min(0, 'Années d\'expérience invalides').optional(),
  is_active: z.boolean().default(true),
});

// Schema pour les compétitions
export const competitionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  description: z.string().optional(),
  type: z.enum(['sabre_national', 'coupe_regionale', 'halarou_bakwai', 'aes', 'friendly', 'ministre', 'coupe_airtel', 'other']),
  location: z.string().max(255, 'Le lieu est trop long').optional(),
  region_id: z.number().int().positive('Région invalide').optional(),
  featured_image: z.string().url('URL invalide').optional().or(z.literal('')),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  max_participants: z.number().int().min(2, 'Minimum 2 participants').optional(),
  prize_pool: z.number().min(0, 'Le prix doit être positif').optional(),
});

// Schema pour les éditions de compétition
export const competitionEditionSchema = z.object({
  competition_id: z.number().int().positive('Compétition invalide'),
  edition_number: z.number().int().min(1, 'Le numéro d\'édition doit être positif'),
  year: z.number().int().min(1900, 'Année invalide').max(new Date().getFullYear() + 5, 'Année invalide'),
  theme: z.string().max(255, 'Le thème est trop long').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
});

// Schema pour les phases
export const phaseSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  phase_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  phase_type: z.enum(['qualification', 'group', 'knockout', 'quarterfinal', 'semifinal', 'final']),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
});

// Schema pour les groupes de phase
export const phaseGroupSchema = z.object({
  phase_id: z.number().int().positive('Phase invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  group_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  description: z.string().optional(),
});

// Schema pour les sous-groupes
export const subGroupSchema = z.object({
  group_id: z.number().int().positive('Groupe invalide'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  sub_group_order: z.number().int().min(1, 'L\'ordre doit être positif'),
  description: z.string().optional(),
  belt1_fighter_id: z.number().int().positive('Lutteur ceinture 1 invalide').optional(),
  belt2_fighter_id: z.number().int().positive('Lutteur ceinture 2 invalide').optional(),
  belt1_region_id: z.number().int().positive('Région ceinture 1 invalide').optional(),
  belt2_region_id: z.number().int().positive('Région ceinture 2 invalide').optional(),
});

// Schema pour les matchs
export const matchSchema = z.object({
  sub_group_id: z.number().int().positive('Sous-groupe invalide'),
  match_number: z.number().int().min(1, 'Le numéro de match doit être positif').optional(),
  match_date: z.string().datetime('Format de date/heure invalide'),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM:SS)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM:SS)').optional(),

  // Participants (lutteurs OU régions)
  fighter1_id: z.number().int().positive('Lutteur 1 invalide').optional(),
  fighter2_id: z.number().int().positive('Lutteur 2 invalide').optional(),
  region1_id: z.number().int().positive('Région 1 invalide').optional(),
  region2_id: z.number().int().positive('Région 2 invalide').optional(),

  // Résultats
  winner_fighter_id: z.number().int().positive('Lutteur gagnant invalide').optional(),
  winner_region_id: z.number().int().positive('Région gagnante invalide').optional(),
  loser_fighter_id: z.number().int().positive('Lutteur perdant invalide').optional(),
  loser_region_id: z.number().int().positive('Région perdante invalide').optional(),

  // Score
  score_fighter1: z.number().int().min(0, 'Score invalide').default(0),
  score_fighter2: z.number().int().min(0, 'Score invalide').default(0),
  rounds: z.number().int().min(1, 'Nombre de rounds invalide').default(1),

  // Résultat du match
  match_result: z.enum([
    'fighter1_win',
    'fighter2_win',
    'region1_win',
    'region2_win',
    'draw',
    'cancelled',
    'postponed',
    'technical_win_fighter1',
    'technical_win_fighter2'
  ]).optional(),

  // Durée et statut
  total_duration: z.string().optional(), // INTERVAL as string
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
  main_referee_id: z.number().int().positive('Arbitre principal invalide').optional(),
  audience_count: z.number().int().min(0, 'Nombre de spectateurs invalide').optional(),
  video_url: z.string().url('URL vidéo invalide').optional().or(z.literal('')),
  live_stream_url: z.string().url('URL stream invalide').optional().or(z.literal('')),
  venue: z.string().max(255, 'Lieu trop long').optional(),
  notes: z.string().optional(),

  // Validation: soit lutteurs, soit régions
}).refine(
  (data) =>
    (data.fighter1_id && data.fighter2_id && !data.region1_id && !data.region2_id) ||
    (data.region1_id && data.region2_id && !data.fighter1_id && !data.fighter2_id),
  {
    message: "Le match doit avoir soit deux lutteurs, soit deux régions",
    path: ["fighter1_id"]
  }
);

// Schema pour l'inscription des lutteurs à une édition
export const editionFighterSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  fighter_id: z.number().int().positive('Lutteur invalide'),
  status: z.enum(['registered', 'qualified', 'disqualified', 'withdrawn']).default('registered'),
  notes: z.string().optional(),
});

// Schema pour l'inscription des régions à une édition
export const editionRegionSchema = z.object({
  edition_id: z.number().int().positive('Édition invalide'),
  region_id: z.number().int().positive('Région invalide'),
  status: z.enum(['registered', 'approved', 'rejected']).default('registered'),
  notes: z.string().optional(),
});

// Types dérivés des schemas
export type RegionInput = z.infer<typeof regionSchema>;
export type CityInput = z.infer<typeof citySchema>;
export type FighterInput = z.infer<typeof fighterSchema>;
export type RefereeInput = z.infer<typeof refereeSchema>;
export type CompetitionInput = z.infer<typeof competitionSchema>;
export type CompetitionEditionInput = z.infer<typeof competitionEditionSchema>;
export type PhaseInput = z.infer<typeof phaseSchema>;
export type PhaseGroupInput = z.infer<typeof phaseGroupSchema>;
export type SubGroupInput = z.infer<typeof subGroupSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type EditionFighterInput = z.infer<typeof editionFighterSchema>;
export type EditionRegionInput = z.infer<typeof editionRegionSchema>;