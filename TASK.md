# FEUILLE DE ROUTE DES TÂCHES (TASK.md)

## Statut Global du Projet
- [ ] **Phase 1 : Migration vers Bun & Nettoyage Environnement**
- [ ] **Phase 2 : Page Détail Match Autonome (`/ad/matches/[matchId]`)**
- [ ] **Phase 3 : Nouvelle Page Matchmaking Élimination Directe (`/ad/phase-groups/[groupId]/organisation`)**
- [ ] **Phase 4 : Optimisation Base de Données & Indexation**
- [ ] **Phase 5 : Unification des Actions et Nettoyage du Code**

---

## Tâches Détaillées

### Phase 1 : Configuration Bun
- [x] **TASK-1.1** : Mettre à jour `package.json` pour remplacer les scripts `npm run`/`pnpm` par `bun run` et nettoyer les faux packages (`child_process`, `dgram`).
- [x] **TASK-1.2** : Configurer `"packageManager": "bun@1.4.3"` dans `package.json`.
- [x] **TASK-1.3** : Mettre à jour `railway.json` (`startCommand: "bun run build && bun run start"`).
- [ ] **TASK-1.4** : Valider l'exécution de `bun` en local sur les scripts critiques.

### Phase 2 : Implémentation de `/ad/matches/[matchId]`
- [x] **TASK-2.1** : Créer le répertoire `app/(admins)/ad/matches/[matchId]`.
- [x] **TASK-2.2** : Copier les sous-composants nécessaires :
  - `fighter-control.tsx`
  - `floating-match-score.tsx`
  - `match-controls.tsx`
  - `match-timer.tsx`
  - `media-manager.tsx`
- [x] **TASK-2.3** : Adapter `page.tsx` dans `app/(admins)/ad/matches/[matchId]` :
  - Extraire uniquement `matchId` depuis `useParams()`.
  - Charger le match complet via `getMatchById(matchId, { with_relations: true })`.
  - Déduire `subGroupId` et `editionId` depuis les relations du match.
  - Adapter la navigation précédente/suivante vers `/ad/matches/[id]` et le bouton retour vers `/ad/matches`.

### Phase 3 : Organisation Matchmaking Élimination Directe
- [x] **TASK-3.1** : Mettre à jour `app/(admins)/ad/phase-groups/[groupId]/page.tsx` pour conditionner et mettre en avant le bouton "Organiser les Matchs" lorsque `group.phase?.phase_type !== 'group'`.
- [x] **TASK-3.2** : Créer le Server Action `createEliminationMatch` dans `actions/matches.ts` (ou action dédiée) :
  - Trouver ou créer automatiquement le `sub_group` pour le couple `(region1_id, region2_id)` dans le groupe.
  - Valider que les deux combattants ne sont pas déjà éliminés (`is_eliminated === false`) et n'ont pas encore combattu dans ce groupe.
  - Créer le match associé dans PostgreSQL et déclencher la synchronisation.
- [x] **TASK-3.3** : Créer la page `app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx` :
  - Récupération des données du groupe, phase et édition.
  - Récupération de tous les combattants non éliminés (`is_eliminated === false`).
  - Exclusion automatique des combattants ayant déjà un match dans ce groupe.
- [x] **TASK-3.4** : Implémenter la création multiple de combats d'élimination (`elimination-bulk-match-creator.tsx`) avec appariement automatique, validation et bascule mode simple/multiple.
- [x] **TASK-3.5** : Corriger le filtrage par région dans les sélecteurs de combattants (comparaison robuste string/number et fallback `f.region?.id`).
- [x] **TASK-3.6** : Ajouter la sélection de la période de sous-groupe (Matin / Soir) dans `elimination-match-creator.tsx` et `elimination-bulk-match-creator.tsx`, et prise en compte dans `createEliminationMatch`.
- [x] **TASK-3.7** : Affichage des Matchs de la Phase dans `organisation/page.tsx` via `EntityList` avec limite, filtres (statut, période), recherche, pagination, mode Carrousel (`viewMode: "carousel"`) et prop `customHeader`.
- [x] **TASK-2.4** : Dans `/ad/matches/[matchId]`, charger tous les matches du phase-group entier si `phase_type !== 'group'` pour que le carrousel permette la navigation entre tous les combats éliminatoires.
- [x] **TASK-6.1** : Mettre à jour `hooks/use-entity-list.ts` pour supporter `apiPath`, intégrer les `filters` et `searchTerm` dans l'URL, mettre à jour le `queryKey`, et réagir au changement de `defaultFilters`. Adapter le rendu dans `app/(admins)/ad/editions/[editionId]/page.tsx`.
- [x] **TASK-6.2** : Création du type partagé `ViewMode` dans `@/types/index.ts` (`"grid" | "list" | "compact" | "carousel"`) et harmonisation dans `hooks/use-entity-list.ts`, `components/shared/entity-list.tsx`, `components/entities/entity-cards.tsx`, et toutes les pages d'administration. Résolution complète des 131 erreurs TypeScript (`bunx tsc --noEmit` -> code 0).

### Phase 4 : Optimisation Base de Données
- [x] **TASK-4.1** : Ajouter le filtre `is_eliminated` dans `getEditionFighters` (`actions/editions.ts`) pour optimiser la sélection SQL directe.
- [ ] **TASK-4.2** : Créer une migration SQL pour ajouter des index sur :
  - `edition_fighters(edition_id, is_eliminated)`
  - `matches(sub_group_id, status)`
  - `sub_groups(group_id)`

### Phase 5 : Nettoyage & Unification
- [ ] **TASK-5.1** : Harmoniser les imports de `actions/matches-2.ts` vers `actions/matches.ts`.
- [ ] **TASK-5.2** : Supprimer les dépendances obsolètes (`framer-motion` vs `motion`, `ioredis` vs `redis`).
