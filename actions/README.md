# Actions (Server Actions)

Ce dossier contient les Server Actions de l'application, qui encapsulent la logique métier et l'accès à la base de données.

## Structure

- `mobile/`: Actions spécifiques à l'application mobile
  - `editions.ts`: Gestion des éditions
  - `getEditionRegions.ts`: Récupération des régions pour une édition
  - `regions.ts`: Gestion des régions
  - `fighters.ts`: Gestion des lutteurs
  - `matches.ts`: Gestion des matchs
  - `articles.ts`: Gestion des articles
  - `referees.ts`: Gestion des arbitres
- `users.ts`: Gestion des utilisateurs

## Utilitaires partagés

- `@/utils/match-utils.ts`: Fonctions partagées pour l'enrichissement des données de matchs (utilisées par plusieurs actions)

## Fonctionnalités

### Mobile

- **Éditions**: Récupération des éditions de compétitions
- **Régions**: Gestion des régions et leurs matches
- **Lutteurs**: Profil des lutteurs, statistiques, matchs
- **Matchs**: Liste des matchs par édition, région ou lutteur
- **Articles**: Articles de presse et actualités
- **Arbitres**: Profil des arbitres et leurs statistiques

## Format de réponse des actions

Les actions renvoient généralement un objet avec:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```
