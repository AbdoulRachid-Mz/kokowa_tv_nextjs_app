# Répertoire des Server Actions — Kokowa TV

Ce dossier regroupe l'ensemble des **Server Actions** Next.js 16 (`'use server'`) assurant la couche logique métier, l'orchestration des requêtes SQL vers Neon PostgreSQL (`sql` de `@/database/neon`), les vérifications d'habilitation RBAC, et l'invalidation des caches de rendu Next.js (`revalidatePath`).

---

## 1. Architecture & Principes Fondamentaux

### Modèle d'Exécution
Les Server Actions sont compilées en endpoints RPC POST par Next.js. Tout client HTTP ou navigateur peut invoquer ces actions s'il connaît leur signature. Par conséquent :
- **Ne jamais faire confiance aux paramètres clients** : tous les identifiants et charges utiles sont typés et validés.
- **Contrôle d'accès explicite** : Les opérations destructives ou sensibles (`DELETE`, `UPDATE`, modifications de rôles, administration de la base) appellent obligatoirement `assertAdmin()` ou `getCurrentUser()` côté serveur.
- **Assainissement des données** : Les attributs confidentiels (notamment `password_hash` dans `users.ts`) sont purgés avant tout renvoi au client.

### Format de Réponse Standardisé
Les Server Actions retournent un format structuré unifié :

```typescript
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Pour les listes paginées et filtrées (via `useEntityList`) :
```typescript
export interface EntityListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, any>;
  error?: string;
}
```

---

## 2. Matrice Globale des 31 Modules Server Actions

| Fichier | Domaine Fonctionnel | Fonctions Clés | Rôles Requis | Tables Impactées |
| :--- | :--- | :--- | :--- | :--- |
| [`database.ts`](./database.ts) | Administration DB | `resetDatabase`, `deleteAllTables`, `exportTableData`, `importTableData` | `admin` | Toutes les tables |
| [`users.ts`](./users.ts) | Utilisateurs & Auth | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `changeUserRole` | `admin` (mutations sensibles), Lecteur auth | `users` |
| [`app-settings.ts`](./app-settings.ts) | Configuration Système | `getAppSettings`, `updateAppSettings` | `admin` | `app_settings` |
| [`cache-utils.ts`](./cache-utils.ts) | Gestion du Cache | `revalidateCachePaths` | Public / Interne | N/A (Next.js Cache) |
| [`cookies.ts`](./cookies.ts) | Session Client | `setSessionCookie`, `deleteSessionCookie` | Public | Cookies HTTP |
| [`competitions.ts`](./competitions.ts) | Compétitions | `getCompetitions`, `getCompetitionById`, `createCompetition`, `updateCompetition`, `deleteCompetition` | `admin`, `editor` | `competitions` |
| [`editions.ts`](./editions.ts) | Éditions annuelles | `getEditions`, `getEditionById`, `createEdition`, `updateEdition`, `deleteEdition`, `getEditionFighters`, `getEditionRegions` | `admin`, `editor`, `fighter_manager` | `editions`, `edition_fighters`, `edition_regions` |
| [`phases.ts`](./phases.ts) | Phases de tournoi | `getPhases`, `getPhaseById`, `createPhase`, `updatePhase`, `deletePhase` | `admin`, `editor` | `phases` |
| [`phase-groups.ts`](./phase-groups.ts) | Groupes de phases | `getPhaseGroups`, `getPhaseGroupById`, `createPhaseGroup`, `updatePhaseGroup`, `deletePhaseGroup` | `admin`, `editor` | `phase_groups` |
| [`sub-groups.ts`](./sub-groups.ts) | Sous-groupes (rencontres) | `getSubGroups`, `getSubGroupById`, `createSubGroup`, `updateSubGroup`, `deleteSubGroup` | `admin`, `editor` | `sub_groups`, `sub_group_fighters` |
| [`matches.ts`](./matches.ts) | Combats & Résultats | `getMatches`, `getMatchById`, `createMatch`, `updateMatch`, `updateMatchResult`, `deleteMatch` | `admin`, `editor`, `moderator` | `matches`, `fighter_cards` |
| [`matches-2.ts`](./matches-2.ts) | Gestion avancée des matchs | `getMatchesAdvanced`, `batchCreateMatches` | `admin`, `editor` | `matches`, `sub_groups` |
| [`fighters.ts`](./fighters.ts) | Lutteurs | `getFighters`, `getFighterById`, `createFighter`, `updateFighter`, `deleteFighter` | `admin`, `fighter_manager` | `fighters`, `edition_fighters` |
| [`fighter-cards.ts`](./fighter-cards.ts) | Cartons & Sanctions | `getFighterCards`, `addFighterCard`, `removeFighterCard` | `admin`, `moderator` | `fighter_cards` |
| [`fighter-transfers.ts`](./fighter-transfers.ts) | Mutations de région | `getTransfers`, `createTransfer`, `processTransfer` | `admin` | `fighter_transfers`, `fighters` |
| [`coaches.ts`](./coaches.ts) | Entraîneurs | `getCoaches`, `getCoachById`, `createCoach`, `updateCoach`, `deleteCoach` | `admin`, `fighter_manager` | `coaches` |
| [`referees.ts`](./referees.ts) | Arbitres | `getReferees`, `getRefereeById`, `createReferee`, `updateReferee`, `deleteReferee` | `admin`, `editor` | `referees` |
| [`regions.ts`](./regions.ts) | Régions administratives | `getRegions`, `getRegionById`, `createRegion`, `updateRegion`, `deleteRegion` | `admin` | `regions` |
| [`teams.ts`](./teams.ts) | Équipes régionales | `getTeams`, `getTeamById`, `createTeam`, `updateTeam`, `deleteTeam` | `admin`, `fighter_manager` | `teams` |
| [`belts.ts`](./belts.ts) | Titres & Ceintures | `getBelts`, `getBeltById`, `awardBelt`, `revokeBelt` | `admin` | `belts`, `fighters` |
| [`articles.ts`](./articles.ts) | Actualités & Presse | `getArticles`, `getArticleById`, `createArticle`, `updateArticle`, `deleteArticle` | `admin`, `editor` | `articles` |
| [`videos.ts`](./videos.ts) | Replays & Lives | `getVideos`, `getVideoById`, `createVideo`, `updateVideo`, `deleteVideo` | `admin`, `editor` | `videos` |
| [`media.ts`](./media.ts) | Gestionnaire de médias | `uploadMedia`, `deleteMedia`, `getMediaList` | `admin`, `editor` | `media` |
| [`advertisements.ts`](./advertisements.ts) | Campagnes Pubs | `getAdvertisements`, `createAdvertisement`, `updateAdvertisement`, `deleteAdvertisement` | `admin` | `advertisements` |
| [`archives.ts`](./archives.ts) | Palmarès & Archives | `getArchives`, `getArchiveById`, `createArchive` | `admin`, `editor` | `archives` |
| [`interactions.ts`](./interactions.ts) | Likes & Favoris | `toggleInteraction`, `getInteractionsCount`, `getUserInteractions` | Utilisateur authentifié | `interactions` |
| [`messages.ts`](./messages.ts) | Commentaires & Tchat | `getMessages`, `postMessage`, `deleteMessage`, `reportMessage` | Utilisateur authentifié | `messages` |
| [`notifications.ts`](./notifications.ts) | Notifications Push/In-App | `sendNotification`, `getNotifications`, `markAsRead` | `admin`, Utilisateur cible | `notifications` |
| [`realtime.ts`](./realtime.ts) | Firebase RTDB Sync | `syncMatchToRealtime`, `syncScoreToRealtime`, `publishLiveState` | `admin`, `moderator` | Firebase RTDB |
| [`stats.ts`](./stats.ts) | Métriques & KPI | `getDashboardStats`, `getFighterStats`, `getRegionStats` | Authentifié / Public | Vues & jointures SQL |
| [`entities.ts`](./entities.ts) | CRUD générique entités | `getEntityList`, `deleteEntityGeneric` | Selon entité | Multiples |

---

## 3. Détail par Domaine Fonctionnel

### 3.1 Administration & Sécurité

#### [`database.ts`](./database.ts)
- **Sécurité renforcée (SEC-01 & SEC-02)** :
  - `assertAdmin()` est exécuté en précondition stricte de chaque fonction.
  - `importTableData` applique un filtrage strict par liste blanche (`/^[a-zA-Z0-9_]+$/`) sur le nom de la table et chaque colonne pour neutraliser tout risque d'injection SQL.
- **Fonctions** :
  - `resetDatabase()` : Réinitialise et purge la base de données.
  - `deleteAllTables()` : Vide toutes les tables tout en préservant le schéma.
  - `exportTableData(tableName)` : Extrait le contenu d'une table en JSON.
  - `importTableData(tableName, data)` : Restaure les données dans une table avec requêtes paramétrées.

#### [`users.ts`](./users.ts)
- **Sécurité renforcée (SEC-03 & SEC-06)** :
  - `sanitizeUser()` retire systématiquement le champ `password_hash`.
  - Protection contre l'auto-élévation de privilèges : `createUser` et `updateUser` interdisent l'attribution d'un rôle supérieur sans être administrateur connecté.
  - `deleteUser` et `changeUserRole` exigent `assertAdmin()`.
- **Fonctions** :
  - `getUsers(options)` : Liste paginée des utilisateurs sans empreintes de mot de passe.
  - `getUserById(id)` / `getUserByAuthId(authId)` : Récupération du profil assaini.
  - `createUser(payload)` : Inscription sécurisée.
  - `updateUser(id, payload)` : Mise à jour du profil.
  - `changeUserRole(userId, newRole)` : Modification de rôle protégée RBAC.

---

### 3.2 Compétitions & Moteur de Tournoi

#### [`editions.ts`](./editions.ts)
- Gère le cycle de vie d'une édition du Sabre National (ex: 45ème Édition).
- `getEditionFighters(editionId, filters)` : Renvoie les lutteurs engagés dans une édition spécifique, avec état d'élimination (`is_eliminated`) et statistiques associées.
- `getEditionRegions(editionId)` : Renvoie les délégations régionales engagées.

#### [`phase-groups.ts`](./phase-groups.ts) & [`sub-groups.ts`](./sub-groups.ts)
- **Logique d'organisation des éliminatoires** :
  - Permet la génération automatique de sous-groupes (rencontres par équipe ou duels individuels) pour les phases de poules (`group`) ou éliminatoires directes (`quarter_final`, `semi_final`, `final`).
  - Gère les créneaux horaires (`morning` / `evening`).

#### [`matches.ts`](./matches.ts) & [`matches-2.ts`](./matches-2.ts)
- **Cycle de vie du match** :
  - États : `scheduled` ➔ `live` ➔ `completed` (ou `cancelled`, `interrupted`).
  - `updateMatchResult` met à jour le vainqueur, le type de victoire (`fall`, `points`, `disqualification`, `forfeit`), la durée du combat, et synchronise instantanément le live score vers Firebase Realtime Database via [`realtime.ts`](./realtime.ts).

---

### 3.3 Acteurs & Gestion Sportive

#### [`fighters.ts`](./fighters.ts)
- Gestion complète des profils de lutteurs nigériens : biographie, poids, taille, région d'origine, région représentée, palmarès et ceintures remportées.
- Synchronisation avec `edition_fighters` pour le statut dans chaque compétition.

#### [`fighter-transfers.ts`](./fighter-transfers.ts)
- Enregistrement des mutations de région entre deux éditions du Sabre National.
- Validation administrative obligatoire avant prise d'effet.

#### [`fighter-cards.ts`](./fighter-cards.ts)
- Gestion des cartons jaunes et rouges infligés par le corps arbitral au cours d'un match.
- Déclenche automatiquement des points de pénalité pour l'écurie régionale.

---

### 3.4 Contenus, Médias & Interaction

#### [`articles.ts`](./articles.ts) & [`videos.ts`](./videos.ts)
- Publication des comptes-rendus de journée, analyses techniques, interviews et replays vidéo.
- Optimisation des requêtes avec préchargement des compteurs de likes et commentaires.

#### [`interactions.ts`](./interactions.ts) & [`messages.ts`](./messages.ts)
- Enregistrement des likes, favoris et commentaires des utilisateurs authentifiés (Web & Mobile Flutter).
- Validation de non-redondance des likes et modération des messages.

#### [`realtime.ts`](./realtime.ts)
- Pont entre Neon PostgreSQL et Firebase Realtime Database.
- Publie les données chaudes (`/live_matches/{id}`) pour offrir une latence < 100ms aux applications Flutter et interfaces de streaming.

---

## 4. Guide des Bonnes Pratiques pour les Développeurs

1. **Toujours valider les permissions en début d'action** :
   ```typescript
   import { assertAdmin } from "@/actions/users";
   
   export async function myAdminAction(...) {
     await assertAdmin();
     // Logique métier
   }
   ```
2. **Utiliser des requêtes paramétrées avec `sql`** :
   Ne jamais concaténer de chaînes dans les requêtes `sql`. Utiliser systématiquement les littéraux de gabarit Neon :
   ```typescript
   const result = await sql`SELECT * FROM fighters WHERE id = ${id}`;
   ```
3. **Invalider le cache Next.js après mutation** :
   ```typescript
   import { revalidatePath } from "next/cache";
   // Après un ajout ou modification :
   revalidatePath("/ad/matches");
   revalidatePath(`/ad/matches/${matchId}`);
   ```
4. **Gérer proprement les exceptions** :
   Toujours envelopper les requêtes dans un bloc `try / catch` et retourner un objet `{ success: false, error: error.message }` plutôt que de laisser fuiter une stack trace vers le client.
