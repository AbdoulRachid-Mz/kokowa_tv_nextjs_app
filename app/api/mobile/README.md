# API Mobile

Ce dossier contient les routes API spécifiques à l'application mobile.

## Endpoints

### `/mobile/editions`
- `GET`: Récupérer toutes les éditions
- `GET /[editionId]`: Récupérer une édition par ID
- `GET /[editionId]/regions`: Récupérer les régions d'une édition

### `/mobile/regions`
- `GET`: Récupérer toutes les régions
- `GET /[regionId]`: Récupérer une région par ID
- `GET /[regionId]/matches`: Récupérer les matches d'une région
  - Query params: `all` (boolean), `editionId` (string)

### `/mobile/fighters`
- `GET`: Récupérer tous les lutteurs
  - Query params: `page`, `limit`, `search`, `regionId`, `isActive`, `isChampion`, `achievementFilter`
  - Retourne des statistiques globales (total, actifs, champions, âge moyen)
- `GET /[fighterId]`: Récupérer un lutteur par ID
- `GET /[fighterId]/matches`: Récupérer les matches d'un lutteur
  - Query params: `all` (boolean), `editionId` (string)

### `/mobile/matches`
- `GET`: Récupérer tous les matches
- `GET /[matchId]`: Récupérer un match par ID

### `/mobile/articles`
- `GET`: Récupérer tous les articles
  - Query params: `search` (recherche dans le titre, extrait, contenu, et champs de l'auteur)
- `GET /[articleId]`: Récupérer un article par ID

### `/mobile/referees`
- `GET`: Récupérer tous les arbitres
  - Query params: `sortBy` (experience|matches|name), `sortOrder` (asc|desc)
- `GET /[id]`: Récupérer un arbitre par ID

### Autres endpoints
- `/mobile/competitions`: Gestion des compétitions
- `/mobile/interactions`: Gestion des interactions (likes, etc.)
- `/mobile/messages`: Gestion des messages
- `/mobile/pubs`: Gestion des pubs
- `/mobile/settings`: Paramètres
- `/mobile/teams`: Équipes
- `/mobile/transfers`: Transferts

## Paramètres de requête courants

- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 20)
- `search`: Terme de recherche
- `regionId`: Filtrer par région
- `isActive`: Filtrer par statut actif
- `isChampion`: Filtrer par statut de champion
- `sortBy`: Champ de tri
- `sortOrder`: Ordre de tri (asc|desc)
