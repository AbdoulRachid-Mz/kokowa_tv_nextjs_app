# ANALYSE APPROFONDIE DE L'APPLICATION KOKOWA TV

## 1. Vue d'Ensemble du Projet

**Kokowa TV** est une plateforme complète dédiée à la gestion, à l'organisation sportive, à l'administration et à la diffusion en direct des compétitions du Sabre National de lutte traditionnelle nigérienne (Kokowa). 

### Stack Technique Principale
- **Framework Web / SSR** : Next.js 16.2.7 (App Router), React 19.2.7, TypeScript 5.
- **Base de Données Principale** : PostgreSQL hébergé sur Neon Serverless, interrogé via le client `pg` (Pool avec gestion de reconnexion et retries automatiques).
- **Couche Temps Réel & Live** : Firebase Realtime Database (RTDB) pour la synchronisation instantanée des chronomètres, des scores et des statuts de match, complété par Firebase Admin SDK côté serveur.
- **Authentification & Sécurité** : Firebase Authentication, Firebase App Check, sessions basées sur des tokens JWT, et Rate Limiting distribué avec Redis (Upstash).
- **State Management & Data Fetching** : TanStack Query v5 côté client (avec invalidation ciblée des caches), Server Actions Next.js (`'use server'`) côté backend.
- **Design & UI** : Tailwind CSS v4, composants UI basés sur Radix UI primitives, Lucide Icons, Framer Motion / Motion.
- **Gestionnaire de Paquets** : Transition de `pnpm` vers `bun` (Bun 1.4.3+).

---

## 2. Structure et Organisation des Fichiers

```
kokowa_tv/
├── actions/             # Server Actions Next.js (CRUD, mutations DB, synchronisation RTDB)
│   ├── matches.ts       # Actions générales de gestion des matches
│   ├── matches-2.ts     # Actions spécialisées (timer, calculs d'état, Postgres casting)
│   ├── editions.ts      # Gestion des éditions, participants, régions et statistiques
│   ├── sub-groups.ts    # Gestion des rencontres (sous-groupes)
│   ├── phase-groups.ts  # Gestion des journées/groupes de phases
│   ├── phases.ts        # Gestion des phases (groupes vs élimination directe)
│   ├── fighters.ts      # Gestion des fiches lutteurs et transferts
│   └── realtime.ts      # Déclencheurs d'événements RTDB et WebSocket
├── app/                 # Next.js App Router
│   ├── (admins)/ad/     # Module d'administration du tournoi
│   │   ├── competitions/# Gestion des championnats
│   │   ├── editions/    # Gestion des éditions annuelles du Sabre National
│   │   ├── phases/      # Phases de poules et tours à élimination directe
│   │   ├── phase-groups/# Groupes et journées de combat
│   │   ├── sub-groups/  # Rencontres régionales et organisation des combats
│   │   ├── matches/     # Liste globale des matchs et supervision
│   │   └── fighters/    # Base des lutteurs inscrits
│   ├── api/             # Routes d'API REST (Auth, Webhook, Mobile, Endpoints CRUD)
│   └── (public)/        # Interfaces publiques, pages d'actualités et live viewer
├── components/          # Composants UI partagés, modals, fiches entités (EntityCards)
├── configs/             # Configurations Firebase, règles d'internationalisation
├── contexts/            # Contextes React (AuthContext, AppSettingsContext)
├── database/            # Schémas DDL PostgreSQL (database.sql), migrations, données seeds
├── hooks/               # Custom Hooks (useMatchController, useEntities, useRealtimeMatch)
├── lib/                 # Utilitaires serveur, services métier, connecteur Neon DB
│   ├── db/              # Client Neon Pool (neon-client.ts)
│   ├── realtime/        # Sync builders pour Firebase RTDB (rtdb-sync.ts)
│   └── services/        # Services complexes (match-update.service.ts, edition-recompute.service.ts)
├── types/               # Déclarations TypeScript (entités, filtres, événements RTDB)
├── utils/               # Formateurs de dates, calculs de durée, couleurs de ceintures
└── validation/          # Schémas de validation Zod (schemas.ts)
```

---

## 3. Analyse Détaillée des Modules Principaux

### 3.1. Base de Données (`database/` & `lib/db/neon-client.ts`)
- **Modèle Hiérarchique du Tournoi** :
  ```mermaid
  erDiagram
      COMPETITIONS ||--o{ COMPETITION_EDITIONS : "organise"
      COMPETITION_EDITIONS ||--o{ EDITION_FIGHTERS : "enregistre"
      COMPETITION_EDITIONS ||--o{ EDITION_REGIONS : "engage"
      COMPETITION_EDITIONS ||--o{ PHASES : "découpe"
      PHASES ||--o{ PHASE_GROUPS : "contient"
      PHASE_GROUPS ||--o{ SUB_GROUPS : "structure"
      SUB_GROUPS ||--o{ MATCHES : "comprend"
      MATCHES ||--o{ FIGHTER_CARDS : "sanctionne"
  ```
- **Tables Clés** :
  - `edition_fighters` : Association lutteur - édition - région. Contient le champ crucial `is_eliminated` (booléen indiquant si le lutteur a été terrassé/éliminé de la compétition individuelle).
  - `phases` : Possède l'attribut discriminant `phase_type` (`'group'`, `'qualification'`, `'knockout'`, `'quarterfinal'`, `'semifinal'`, `'final'`, `'third_place'`).
  - `sub_groups` : Représente une confrontation (`region1_id`, `region2_id`, arbitre principal, ceintures en jeu, score par région).
  - `matches` : Détail de chaque combat (`fighter1_id`, `fighter2_id`, chronomètre, `total_duration`, statut, carton, vainqueur, perdant).

### 3.2. Logique Métier & Moteur de Tournoi
1. **Phase de Poule (`phase_type === 'group'`)** :
   - Oppose deux régions de 10 lutteurs chacune dans un `sub_group`.
   - Les lutteurs s'affrontent 1 contre 1 jusqu'à concurrence des 10 combats.
   - Les victoires individuelles incrémentent le score de la région (`score_region1`, `score_region2`).
   - Les lutteurs invaincus continuent vers les phases finales.
2. **Phases d'Élimination Directe (`phase_type !== 'group'`)** :
   - Regroupe les 1/8, 1/4, 1/2, 3ème place et la Grande Finale pour le Sabre National.
   - Les combats sont individuels : Lutteur A vs Lutteur B.
   - **Règle absolue** : Les lutteurs ayant `is_eliminated = true` dans `edition_fighters` ne peuvent plus disputer de combat pour le Sabre.
   - Tout match d'élimination nécessite quand même d'être rattaché à un `sub_group` dans la base de données actuelle (`matches.sub_group_id NOT NULL`), d'où la nécessité de créer/réutiliser automatiquement un `sub_group` avec les régions des deux lutteurs.

### 3.3. Module Server Actions (`actions/`)
- `actions/matches.ts` : Fonctions génériques de filtrage (`getMatches`), création (`createMatch`), et mise à jour.
- `actions/matches-2.ts` : Implémentation alternative et enrichie avec typages PostgreSQL stricts, casting JSONB pour les sous-groupes, et appels au service `updateMatchAndRecompute`.
- `actions/editions.ts` : Gestion complète de l'édition avec des requêtes SQL très volumineuses (subqueries avec `JSON_AGG` sur 4 niveaux d'imbrication).
- `actions/realtime.ts` : Dispatcher événementiel vers Firebase RTDB et WebSocket.

### 3.4. Module Temps Réel (`lib/realtime/` & `hooks/realtime/`)
- Utilisation de Firebase RTDB sous les chemins :
  - `editions/{editionId}/subGroups/{subGroupId}/matches/{matchId}`
  - `editions/{editionId}/liveMatch`
- `useRealtimeMatch` et `useRealtimeSubGroup` écoutent en direct les nœuds Firebase côté client pour synchroniser instantanément l'horloge, les pauses, les réclamations et le vainqueur.

### 3.5. Module Authentification & API (`lib/server/`, `contexts/auth-context.tsx`, `app/api/`)
- Double couche d'authentification :
  - Client : Firebase Web SDK (`onAuthStateChanged`), génération de tokens d'App Check.
  - Serveur : Firebase Admin SDK (`verifyIdToken`), middleware d'autorisation (`authMiddleware`), synchronisation en base (`/api/auth/sync`).
- Rate limiting basé sur Upstash Redis dans `lib/server/rate-limit-redis.ts`.

---

## 4. Analyse Comparative : Page Match Détail
- **Route existante** : `app/(admins)/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx`
  - Dépend fortement de la présence de `subGroupId` dans les paramètres d'URL.
  - Fait deux requêtes séparées (`getSubGroupById` et `getMatchById`).
  - Navigation Précédent/Suivant restreinte au tableau `subGroup.matches`.
- **Nouvelle route requise** : `app/(admins)/ad/matches/[matchId]/page.tsx`
  - Doit fonctionner de manière autonome à partir de `matchId` uniquement.
  - Résout le sous-groupe, le groupe de phase et l'édition directement depuis les relations du match.
  - Permet une navigation fluide depuis la liste générale des matches (`/ad/matches`).

---

## 5. Nouvelle Fonctionnalité : Appariement Élimination Directe
- **Emplacement** : `app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx`
- **Bouton d'accès** : Sur `app/(admins)/ad/phase-groups/[groupId]/page.tsx`, visible lorsque `group.phase.phase_type !== 'group'`.
- **Spécifications Fonctionnelles** :
  1. Récupération des lutteurs de l'édition non éliminés (`is_eliminated === false`).
  2. Exclusion des lutteurs ayant déjà un combat (en cours, programmé ou terminé) dans ce groupe de phase.
  3. Sélecteur de combat avec recherche dynamique (nom, prénom, surnom) et filtrage par région.
  4. Création en un clic : génération/mise à jour automatique du `sub_group` sous-jacent avec les `region1_id` et `region2_id` correspondants, puis insertion du combat.
