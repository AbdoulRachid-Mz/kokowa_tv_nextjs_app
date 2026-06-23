import { z } from "zod";

// Schema de base pour les régions
export const regionSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(10, "Le code est trop long"),
  description: z.string().optional(),
  flag_image: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Couleur hexadécimale invalide")
    .optional(),
});

export const coachSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis").max(100),
  last_name: z.string().min(1, "Le nom est requis").max(100),
  nickname: z.string().max(100).optional(),
  birth_date: z.string().optional(),
  region_id: z.number().int().positive().optional(),
  profile_image: z.string().url().optional().or(z.literal("")),
  license_number: z.string().min(1, "Le numéro de licence est requis").max(50),
  certification_level: z.string().max(50).optional(),
  experience_years: z.number().int().min(0).max(50).optional(),
  specialties: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});

// Schema pour les lutteurs
export const fighterSchema = z.object({
  first_name: z
    .string()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom est trop long"),
  last_name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom est trop long"),
  nickname: z.string().max(100, "Le surnom est trop long").optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  birth_place: z
    .string()
    .max(100, "Le lieu de naissance est trop long")
    .optional(),
  region_id: z.number().int().positive("Région invalide").optional(),
  height: z
    .number()
    .min(0.5, "Taille invalide")
    .max(3.0, "Taille invalide")
    .optional(),
  weight: z
    .number()
    .min(20, "Poids invalide")
    .max(200, "Poids invalide")
    .optional(),
  profile_image: z.string().url("URL invalide").nullable().optional(),
  cover_image: z.string().nullable().optional(),
  bio: z.string().max(1000, "La biographie est trop longue").optional(),
  fighting_style: z
    .string()
    .max(500, "Le style de combat est trop long")
    .optional(),
  debut_year: z
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(new Date().getFullYear(), "Année invalide")
    .optional(),
  ranking: z
    .number()
    .int()
    .min(0, "Le classement doit être positif")
    .optional(),
  is_active: z.boolean().default(true),
  is_champion: z.boolean().default(false),
  social_links: z.any().optional(),
});

// Schema pour les palmarès des lutteurs
export const fighterAchievementSchema = z.object({
  fighter_id: z.number().int().positive("Lutteur invalide"),
  region_id: z.number().int().positive("Région invalide"),
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre est trop long"),
  edition_id: z.number().int().positive("Édition invalide"),
  year: z
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(new Date().getFullYear(), "Année invalide"),
  position: z.enum([
    "1st",
    "2nd",
    "3rd",
    "finalist",
    "semifinalist",
    "quarterfinalist",
  ]),
  type: z.enum([
    "competition",
    "kirari",
    "fair-play",
    "point",
    "walki",
    "dance",
    "tchali_tchali",
    "once_beat",
    "best_beaten",
    "other",
  ]),
  description: z.string().optional(),
  medal_image: z.string().nullable().optional(),
});

// Schema pour les arbitres
export const refereeSchema = z.object({
  first_name: z
    .string()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom est trop long"),
  last_name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom est trop long"),
  nickname: z.string().max(100, "Le surnom est trop long").optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  region_id: z.number().int().positive("Région invalide").optional(),
  profile_image: z.string().url("URL invalide").nullable().optional(),
  license_number: z
    .string()
    .max(50, "Le numéro de licence est trop long")
    .optional(),
  certification_level: z
    .string()
    .max(50, "Le niveau de certification est trop long")
    .optional(),
  experience_years: z
    .number()
    .int()
    .min(0, "Années d'expérience invalides")
    .optional(),
  is_active: z.boolean().default(true),
  social_links: z.any().optional(),
});

export const competitionSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum(["upcoming", "ongoing", "completed", "cancelled", "postponed"])
    .default("upcoming"),
  featured_image: z.string().optional(),
  is_active: z
    .union([z.boolean(), z.string()])
    .transform((val) => (typeof val === "string" ? val === "true" : val))
    .default(true),
});

// Schema pour les éditions de compétition (mis à jour)
export const competitionEditionSchema = z.object({
  competition_id: z.number().int().positive("Compétition invalide"),
  edition_number: z
    .number()
    .int()
    .min(1, "Le numéro d'édition doit être positif"),
  year: z
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(new Date().getFullYear() + 5, "Année invalide"),
  theme: z.string().max(255, "Le thème est trop long").optional(),
  is_active: z.boolean().default(true),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  winner_fighter_id: z
    .number()
    .int()
    .positive("Lutteur gagnant invalide")
    .optional(),
  winner_region_id: z
    .number()
    .int()
    .positive("Région gagnante invalide")
    .optional(),
  region_id: z.number().int().positive("Région invalide").optional(),
  prize_pool: z.number().min(0, "Le prix doit être positif").optional(),
  registration_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  total_participants: z
    .number()
    .int()
    .min(0, "Nombre de participants invalide")
    .default(0),
});

// Schema pour les phases (mis à jour - phase_order est UNIQUE)
export const phaseSchema = z.object({
  edition_id: z.number().int().positive("Édition invalide"),
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  phase_order: z.number().int().min(1, "L'ordre doit être positif"),
  phase_type: z.enum([
    "qualification",
    "group",
    "knockout",
    "quarterfinal",
    "semifinal",
    "final",
  ]),
  description: z.string().optional(),
  is_active: z.boolean().default(false),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  is_completed: z.boolean().default(false),
});

// Schema pour les groupes de phase (mis à jour - ajout de date)
export const phaseGroupSchema = z.object({
  phase_id: z.number().int().positive("Phase invalide"),
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  group_order: z.number().int().min(1, "L'ordre doit être positif"),
  description: z.string().optional(),
  is_completed: z.boolean().default(false),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  is_active: z.boolean().default(true),
});

// Schema pour les sous-groupes
export const subGroupSchema = z.object({
  group_id: z.number().int().positive("Groupe invalide"),
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  sub_group_order: z.number().int().min(1, "L'ordre doit être positif"),
  description: z.string().optional(),
  period: z.enum(["matin", "soir"]).default("matin"),
  score_region1: z.number().int().min(0, "Score invalide").optional(),
  score_region2: z.number().int().min(0, "Score invalide").optional(),
  nulls: z.number().int().min(0, "Nombre de nulls invalide").optional(),
  video_url: z.string().url("URL de la vidéo invalide").optional(),
  status: z
    .enum(["upcoming", "ongoing", "completed", "cancelled", "postponed"])
    .default("upcoming"),
  region1_id: z.number().int().positive("Région 1 invalide").optional(),
  region2_id: z.number().int().positive("Région 2 invalide").optional(),
  belt_region1: z
    .number()
    .int()
    .positive("Ceinture région 1 invalide")
    .optional(),
  belt_region2: z
    .number()
    .int()
    .positive("Ceinture région 2 invalide")
    .optional(),
  main_referee_id: z
    .number()
    .int()
    .positive("Arbitre principal invalide")
    .optional(),
  is_completed: z.boolean().default(false),
  is_active: z.boolean().default(false),
});

// Schema pour les ceintures
export const beltSchema = z.object({
  color: z
    .string()
    .min(1, "La couleur est requise")
    .max(20, "La couleur est trop longue"),
  is_active: z.boolean().default(true),
});

// validation/schemas.ts - CORRECTION
export const matchSchema = z.object({
  sub_group_id: z.number().int().positive("Sous-groupe invalide"),
  match_number: z
    .number()
    .int()
    .min(1, "Le numéro de match doit être positif")
    .optional()
    .or(z.literal("")),
  match_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .default(() => new Date().toISOString().split("T")[0]),
  start_time: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Format d'heure invalide (HH:MM ou HH:MM:SS)",
    )
    .optional()
    .or(z.literal("")),
  start_time2: z
    .string() // NOUVEAU
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Format d'heure invalide (HH:MM ou HH:MM:SS)",
    )
    .optional()
    .or(z.literal("")),
  end_time: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Format d'heure invalide (HH:MM ou HH:MM:SS)",
    )
    .optional()
    .or(z.literal("")),

  // Participants
  fighter1_id: z
    .number()
    .int()
    .positive("Lutteur 1 invalide")
    .optional()
    .or(z.literal("")),
  fighter2_id: z
    .number()
    .int()
    .positive("Lutteur 2 invalide")
    .optional()
    .or(z.literal("")),

  fighter1_initial_state: z.enum(["eliminated", "not_eliminated"]).optional(),
  fighter2_initial_state: z.enum(["eliminated", "not_eliminated"]).optional(),
  initial_state: z.record(z.string(), z.string()).default({}),
  // Résultats
  winner_fighter_id: z
    .number()
    .int()
    .positive("Lutteur gagnant invalide")
    .optional()
    .or(z.literal("")),
  loser_fighter_id: z
    .number()
    .int()
    .positive("Lutteur perdant invalide")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),

  // Résultat du match
  match_result: z
    .enum(["fighter1_win", "fighter2_win", "draw", "cancelled", "postponed"])
    .optional(),

  // Durée et statut
  total_duration: z.string().optional().or(z.literal("")),
  break_count: z.number().int().min(0, "Nombre de pauses invalide").default(0),
  status: z
    .enum([
      "scheduled",
      "live",
      "round_break",
      "completed",
      "cancelled",
      "postponed",
      "reclamation",
    ])
    .default("scheduled"),

  // Informations supplémentaires
  audience_count: z
    .number()
    .int()
    .min(0, "Nombre de spectateurs invalide")
    .optional()
    .or(z.literal("")),
  video_url: z.string().url("URL vidéo invalide").optional().or(z.literal("")),
  live_stream_url: z
    .string()
    .url("URL stream invalide")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

// Schema pour l'inscription des lutteurs à une édition (mis à jour)
export const editionFighterSchema = z.object({
  edition_id: z.number().int().positive("Édition invalide"),
  fighter_id: z.number().int().positive("Lutteur invalide"),
  region_id: z.number().int().positive("Région invalide"),
  is_champion: z.boolean().default(false),
  is_eliminated: z.boolean().default(false),
  status: z
    .enum(["registered", "qualified", "disqualified", "withdrawn"])
    .default("registered"),
});

// Schema pour l'inscription des régions à une édition (mis à jour)
export const editionRegionSchema = z.object({
  edition_id: z.number().int().positive("Édition invalide"),
  region_id: z.number().int().positive("Région invalide"),
  is_eliminated: z.boolean().default(false),
  points: z.number().int().min(0, "Points invalides").default(0),
  status: z.enum(["registered", "approved", "rejected"]).default("registered"),
});

// Schema pour les cartons de match
export const fighterCardSchema = z.object({
  fighter_id: z.number().int().positive("Lutteur invalide"),
  match_id: z.number().int().positive("Match invalide"),
  card_type: z.enum(["yellow", "red"]),
  card_reason: z.string().optional(),
  minute_given: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM:SS)")
    .optional(),
  is_cancelled: z.boolean().default(false),
});

// Schema pour les transferts
// validation/schemas.ts - Ajouter ce schéma
export const fighterTransferSchema = z.object({
  fighter_id: z.number().int().positive("L'ID du lutteur est requis"),
  from_region_id: z.number().int().positive("La région d'origine est requise"),
  to_region_id: z
    .number()
    .int()
    .positive("La région de destination est requise"),
  transfer_date: z.string().min(1, "La date de transfert est requise"),
  transfer_reason: z.string().max(500).optional(),
  transfer_fee: z.number().min(0).optional(),
  contract_duration: z.number().int().min(1).max(240).optional(), // 1-240 mois (20 ans)
  is_permanent: z.boolean().default(true),
  status: z
    .enum(["pending", "approved", "rejected", "completed"])
    .default("pending"),
});

// Schema pour les utilisateurs
export const userSchema = z.object({
  username: z
    .string()
    .min(1, "Le nom d'utilisateur est requis")
    .max(50, "Le nom d'utilisateur est trop long"),
  email: z.string().email("Email invalide").max(100, "L'email est trop long"),
  auth_id: z.string().max(255).optional(),
  fcm_token: z.string().optional(),
  password_hash: z
    .string()
    .min(1, "Le hash du mot de passe est requis")
    .max(255, "Le hash est trop long"),
  role: z
    .enum(["admin", "editor", "user", "moderator", "fighter_manager"])
    .default("user"),
  first_name: z.string().max(50, "Le prénom est trop long").optional(),
  last_name: z.string().max(50, "Le nom est trop long").optional(),
  profile_picture: z.string().url("URL invalide").optional().or(z.literal("")),
  bio: z.string().optional(),
  phone_number: z
    .string()
    .max(20, "Le numéro de téléphone est trop long")
    .optional(),
  country: z.string().max(100, "Le pays est trop long").optional(),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Contenu requis"),
  message_type: z
    .enum([
      "comment",
      "direct_message",
      "group_message",
      "match_commentary",
      "system_notification",
    ])
    .default("comment"),
  entity_type: z
    .enum(["article", "match", "fighter", "competition", "user"])
    .optional(),
  entity_id: z.number().int().positive("ID d'entité invalide").optional(),
  author_id: z.number().int().positive("Auteur invalide"),
  recipient_id: z.number().int().positive("Destinataire invalide").optional(),
  parent_message_id: z
    .number()
    .int()
    .positive("ID message parent invalide")
    .optional(),
  is_read: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_deleted: z.boolean().default(false),
  like_count: z.number().int().nonnegative().default(0),
  images: z.array(z.string()).optional(),
  video_url: z.string().url("URL vidéo invalide").optional(),
  audio_url: z.string().url("URL audio invalide").optional(),
});

// Schema pour les articles
export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),

  type: z.enum([
    "news",
    "event",
    "announcement",
    "highlight",
    "interview",
    "analyse",
  ]),

  excerpt: z.string().optional(),

  content: z.string().min(1),

  featured_image: z
    .union([z.string().url(), z.instanceof(File), z.literal("")])
    .optional(),

  author_id: z.number().int().positive(),

  status: z.enum(["draft", "published", "archived"]),

  language: z.enum(["fr", "ha", "en"]),

  view_count: z.number().int().min(0).default(0),
  like_count: z.number().int().min(0).default(0),
  share_count: z.number().int().min(0).default(0),

  meta_title: z.string().max(255).optional(),
  meta_description: z.string().optional(),
  published_at: z.string().datetime().optional(),
});

// Schema pour les médias
export const mediaSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  file_path: z.string().min(1, "Le chemin du fichier est requis").max(255),
  file_type: z.enum(["image", "video", "document", "audio"]),

  mime_type: z.string().max(100).optional(),
  file_size: z.number().int().min(0).optional(),
  alt_text: z.string().max(255).optional(),
  description: z.string().optional(),

  uploader_id: z.number().int().positive(),

  // Important : retirer default()
  is_featured: z.boolean().optional(),

  entity_type: z.string().max(50).optional(),
  entity_id: z.number().int().positive().optional(),
});

export const videoSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),

  video_url: z.string().url().or(z.literal("")),

  thumbnail_url: z.string().url().or(z.literal("")).optional(),

  duration: z.coerce.number().int().nonnegative().optional(),

  type: z.enum(["youtube", "facebook", "tiktok", "rtmp", "upload", "vimeo"]),
  category: z.enum([
    "match",
    "interview",
    "highlights",
    "training",
    "documentary",
    "ceremony",
  ]),

  view_count: z.number().int().nonnegative().default(0),
  like_count: z.number().int().nonnegative().default(0),

  is_live: z.boolean().default(false),
  is_featured: z.boolean().default(false),

  published_at: z.string().datetime().optional(),
});

// Schema pour les publicités
export const advertisementSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre est trop long"),
  description: z.string().optional(),
  media: z.string().max(255).optional(),
  media_type: z.enum(["image", "video", "html"]).default("image"),
  price: z.number().min(0, "Le prix doit être positif").default(0.0),
  link_url: z.string().url("URL invalide").max(255).optional(),
  cta_text: z.string().max(255).optional(),
  position: z
    .enum([
      "header",
      "sidebar",
      "footer",
      "in_content",
      "popup",
      "banner_top",
      "banner_bottom",
      "mobile_sticky",
    ])
    .default("banner_top"),
  priority: z.number().int().min(0).default(0),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
  click_count: z.number().int().min(0).default(0),
  impression_count: z.number().int().min(0).default(0),
  target_audience: z.string().max(50).optional(),
  advertiser_name: z.string().max(255).optional(),
  advertiser_contact: z.string().max(255).optional(),
});

export type AdvertisementInput = z.input<typeof advertisementSchema>;

// Schema pour les interactions
export const interactionSchema = z.object({
  user_id: z.number().int().positive("ID utilisateur invalide"),
  entity_type: z.string().min(1, "Type d'entité requis"),
  entity_id: z.number().int().positive("ID d'entité invalide"),
  interaction_type: z.enum(["like", "view", "share", "bookmark", "follow"]),
});

// Schema pour les notifications
export const notificationSchema = z.object({
  user_id: z.number().int().positive("ID utilisateur invalide"),
  title: z.string().min(1, "Titre requis").max(255, "Titre trop long"),
  message: z.string().min(1, "Message requis"),
  notification_type: z.enum([
    "match_update",
    "fighter_update",
    "competition_update",
    "system_notification",
    "achievement",
    "message",
  ]),
  entity_type: z
    .enum(["article", "match", "fighter", "competition", "user", "message"])
    .optional(),
  entity_id: z.number().int().positive("ID d'entité invalide").optional(),
  is_read: z.boolean().default(false),
  action_url: z.string().url("URL d'action invalide").optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  expires_at: z.string().datetime("Date d'expiration invalide").optional(),
});

// Schema pour les paramètres d'application
export const appSettingSchema = z.object({
  setting_key: z.string().min(1, "Clé requise").max(100, "Clé trop longue"),
  setting_value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), z.any()),
  ]),
  setting_type: z
    .enum(["string", "number", "boolean", "json", "array"])
    .default("string"),
  category: z.string().max(50, "Catégorie trop longue").default("general"),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
  is_editable: z.boolean().default(true),
});

// Schema pour les membres de l'équipe
export const teamMemberSchema = z.object({
  first_name: z
    .string()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom est trop long"),
  last_name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom est trop long"),
  nickname: z.string().max(100, "Le surnom est trop long").optional(),
  email: z
    .string()
    .email("Email invalide")
    .min(1, "L'email est requis")
    .max(255, "L'email est trop long"),
  phone: z.string().max(50, "Le numéro de téléphone est trop long").optional(),
  role: z
    .string()
    .min(1, "Le rôle est requis")
    .max(100, "Le rôle est trop long"),
  department: z.string().max(100, "Le département est trop long").optional(),
  specialization: z
    .string()
    .max(255, "La spécialisation est trop longue")
    .optional(),
  position_order: z.number().int().default(0),
  is_lead: z.boolean().default(false),
  is_active: z.boolean().default(true),
  profile_image: z
    .string()
    .max(255, "L'URL de l'image de profil est trop longue")
    .optional(),
  cover_image: z
    .string()
    .max(255, "L'URL de l'image de couverture est trop longue")
    .optional(),
  bio: z.string().optional(),
  quote: z.string().optional(),
  expertise: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  social_links: z.record(z.string(), z.string()).optional().default({}),
  projects_count: z.number().int().nonnegative().default(0),
  years_experience: z.number().int().nonnegative().default(0),
  contributions_count: z.number().int().nonnegative().default(0),
  badges: z.array(z.string()).optional().default([]),
  availability: z
    .enum(["full-time", "part-time", "contract", "freelance"])
    .default("full-time"),
  joined_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
last_active: z.coerce.date().optional(),
});

// Schema pour les accomplissements d'équipe
export const teamAchievementSchema = z.object({
  team_member_id: z.number().int().positive("Membre d'équipe invalide"),
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().optional(),
  achievement_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),
  category: z.string().max(100).optional(),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
});

// Schema pour la mise à jour des settings
export const appSettingUpdateSchema = z.object({
  setting_value: z
    .union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.any())])
    .optional(),
});

// Types dérivés des schemas
export type RegionInput = z.infer<typeof regionSchema>;
export type CoachInput = z.infer<typeof coachSchema>;
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
export type ArticleInput = z.input<typeof articleSchema>;
export type Article = z.output<typeof articleSchema>;
export type MediaInput = z.infer<typeof mediaSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
export type InteractionInput = z.infer<typeof interactionSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type AppSettingInput = z.infer<typeof appSettingSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type TeamAchievementInput = z.infer<typeof teamAchievementSchema>;
