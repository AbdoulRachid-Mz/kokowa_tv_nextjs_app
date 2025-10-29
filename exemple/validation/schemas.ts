import { z } from 'zod';

export const regionSchema = z.object({
  name: z.string().min(1, "Le nom de la région est requis"),
  code: z.string().optional(),
});

export const lutteurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  surnom: z.string().optional(),
  date_naissance: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_date,
          message: "Date invalide",
        });
        return z.NEVER;
      }
      return date;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        message: "Date invalide",
      });
      return z.NEVER;
    }
  }),
  region_id: z.number().optional(),
  poids: z.number().min(0).optional(),
  actif: z.boolean().default(true),
  photo_url: z.string().url("URL invalide").optional().or(z.literal('')).nullable().default(''),
});

export const competitionSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre ne doit pas dépasser 255 caractères"),
  description: z.string().optional(),
  lieu: z
    .string()
    .min(1, "Le lieu est requis")
    .max(255, "Le lieu ne doit pas dépasser 255 caractères"),
  date: z
    .string()
    .min(1, "La date est requise")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Format de date invalide",
    }), // vérifie simplement que c’est une date valide
});

export const phaseSchema = z.object({
  competition_id: z.number().min(1, "La compétition est requise"),
  name: z.string().min(1, "Le nom de la phase est requis"),
  position: z.number().int().min(1, "La position doit être un entier positif"),
});

export const matchSchema = z.object({
  phase_id: z.number().min(1, "La phase est requise"),
  lutteur_a: z.number().min(1, "Le lutteur A est requis"),
  lutteur_b: z.number().min(1, "Le lutteur B est requis"),
  score_a: z.number().min(0).default(0),
  score_b: z.number().min(0).default(0),
  statut: z.enum(['SCHEDULED', 'FINISHED', 'CANCELLED']).default('SCHEDULED'),
  scheduled_at: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const transfertSchema = z.object({
  lutteur_id: z.number().min(1, "Le lutteur est requis"),
  from_region: z.number().optional(),
  to_region: z.number().optional(),
  date_transfert: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional(),
});

export const palmaresSchema = z.object({
  lutteur_id: z.number().min(1, "Le lutteur est requis"),
  competition_id: z.number().min(1, "La compétition est requise"),
  year: z.number().int().min(1900, "L'année doit être valide"),
  position: z.string().min(1, "La position est requise"),
});

export const userSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  password_hash: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(['ADMIN', 'MODERATOR', 'USER']).default('USER'),
});