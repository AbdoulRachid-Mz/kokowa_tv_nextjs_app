# Spécification d'API REST Mobile — Kokowa TV (Flutter Client)

Ce document constitue la référence officielle du contrat d'interface (API Contract) entre le backend Kokowa TV et l'application mobile Flutter.

---

## 1. Conventions Générales & En-têtes HTTP

### URL de Base
- **Développement** : `http://<IP_HOTE>:3000/api/mobile`
- **Production** : `https://api.kokowatv.com/api/mobile` (ou `https://kokowatv.com/api/mobile`)

### En-têtes Requis

| En-tête | Requis | Description |
| :--- | :--- | :--- |
| `Content-Type` | Oui (POST/PUT) | `application/json` |
| `Authorization` | Requis pour actions utilisateur | `Bearer <firebase_id_token>` (jeton JWT obtenu via Firebase Auth Flutter) |
| `X-Firebase-AppCheck` | Recommandé en prod | Jeton d'attestation Firebase Play Integrity / DeviceCheck |
| `Accept` | Recommandé | `application/json` |

### Codes de Statut HTTP

- `200 OK` : Requête traitée avec succès.
- `201 Created` : Ressource créée avec succès.
- `400 Bad Request` : Paramètres manquants ou invalides.
- `401 Unauthorized` : Jeton Firebase absent, expiré ou invalide.
- `403 Forbidden` : Privilèges insuffisants pour cette ressource.
- `404 Not Found` : Ressource inexistante.
- `429 Too Many Requests` : Quota de requêtes dépassé (Rate limiting).
- `500 Internal Server Error` : Erreur interne du serveur.

---

## 2. Spécification Détaillée des Endpoints

---

### 2.1 Compétitions (`/competitions`)

#### `GET /api/mobile/competitions`
Récupère la liste de toutes les compétitions disponibles (ex: Sabre National, Tournoi des Maîtres).

- **Query Parameters** :
  - `page` (int, défaut: 1)
  - `limit` (int, défaut: 20)
  - `search` (string, optionnel) : Filtre sur le nom de la compétition.
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sabre National de Lutte Traditionnelle",
      "slug": "sabre-national",
      "description": "Le championnat annuel suprême de lutte traditionnelle au Niger",
      "logo_url": "https://storage.kokowatv.com/competitions/sabre.png",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/mobile/competitions/{competitionId}`
Récupère les détails d'une compétition avec la liste de ses éditions passées et en cours.

---

### 2.2 Éditions (`/editions`)

#### `GET /api/mobile/editions`
Récupère l'ensemble des éditions de tournois (ex: 45ème Édition - Agadez 2024).

- **Query Parameters** :
  - `status` (string, optionnel) : `upcoming` | `ongoing` | `completed`
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 29,
      "name": "45ème Édition du Sabre National",
      "year": 2024,
      "host_city": "Agadez",
      "start_date": "2024-12-22T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "status": "ongoing",
      "banner_url": "https://storage.kokowatv.com/editions/agadez_2024.jpg",
      "is_active": true
    }
  ]
}
```

#### `GET /api/mobile/editions/{editionId}`
Récupère la fiche détaillée d'une édition.

#### `GET /api/mobile/editions/{editionId}/regions`
Récupère les 8 régions participantes avec leurs statistiques d'équipe pour cette édition (combats gagnés, nuls, perdus, points).

---

### 2.3 Régions (`/regions`)

#### `GET /api/mobile/regions`
Récupère la liste des ligues régionales du Niger (Niamey, Zinder, Maradi, Tahoua, Dosso, Tillabéri, Agadez, Diffa).

- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Niamey",
      "code": "NMY",
      "color_hex": "#008751",
      "logo_url": "https://storage.kokowatv.com/regions/niamey.png",
      "titles_count": 8
    }
  ]
}
```

#### `GET /api/mobile/regions/{regionId}`
Détails d'une région, historique des sacres et effectif actuel.

#### `GET /api/mobile/regions/{regionId}/matches`
Matches disputés par une région.
- **Query Parameters** :
  - `editionId` (int, optionnel) : Filtrer par édition spécifique.
  - `all` (boolean, défaut: false) : Si `true`, retourne tout l'historique sans pagination.

---

### 2.4 Lutteurs (`/fighters`)

#### `GET /api/mobile/fighters`
Catalogue complet des lutteurs avec recherche avancée et filtres.

- **Query Parameters** :
  - `page` (int, défaut: 1)
  - `limit` (int, défaut: 20)
  - `search` (string) : Recherche sur le prénom, nom de famille et surnom (`nickname`).
  - `regionId` (int) : Filtre par région d'appartenance.
  - `isActive` (boolean) : Filtre les lutteurs en activité.
  - `isChampion` (boolean) : Filtre les détenteurs du Sabre.
  - `sortBy` (string) : `name` | `victories` | `age` | `recent`
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "first_name": "Issoufou",
      "last_name": "Moussa",
      "nickname": "Mai Gaskiya",
      "region_id": 3,
      "region_name": "Maradi",
      "weight": 115,
      "height": 192,
      "birth_year": 1996,
      "is_active": true,
      "is_champion": true,
      "sabres_won": 1,
      "photo_url": "https://storage.kokowatv.com/fighters/issoufou_moussa.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 80,
    "totalPages": 4
  },
  "stats": {
    "total": 80,
    "active": 76,
    "champions": 4,
    "average_age": 26.4
  }
}
```

#### `GET /api/mobile/fighters/{fighterId}`
Fiche biographique détaillée, palmarès, statistiques de victoires/chutes, et distinction de sabres remportés.

#### `GET /api/mobile/fighters/{fighterId}/matches`
Historique complet des combats disputés par le lutteur.
- **Query Parameters** : `editionId` (optionnel), `limit` (défaut: 20).

---

### 2.5 Matches (`/matches`)

#### `GET /api/mobile/matches`
Liste des matches (programmés, en cours ou terminés).

- **Query Parameters** :
  - `editionId` (int) : Filtrer par édition.
  - `status` (string) : `scheduled` | `live` | `completed` | `cancelled`
  - `phaseType` (string) : `group` | `round_of_16` | `quarter_final` | `semi_final` | `final`
  - `period` (string) : `morning` | `evening`
  - `date` (YYYY-MM-DD) : Date de la confrontation.
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 105,
      "sub_group_id": 12,
      "phase_name": "Quarts de Finale",
      "period": "morning",
      "status": "live",
      "fighter1": {
        "id": 42,
        "name": "Issoufou Moussa",
        "nickname": "Mai Gaskiya",
        "region_id": 3,
        "region_name": "Maradi",
        "photo_url": "https://storage.kokowatv.com/fighters/42.jpg"
      },
      "fighter2": {
        "id": 18,
        "name": "Kadri Abdou",
        "nickname": "Issaka Issaka",
        "region_id": 2,
        "region_name": "Dosso",
        "photo_url": "https://storage.kokowatv.com/fighters/18.jpg"
      },
      "winner_id": null,
      "victory_type": null,
      "duration_seconds": 184,
      "scheduled_time": "2024-12-28T09:30:00.000Z"
    }
  ]
}
```

#### `GET /api/mobile/matches/{matchId}`
Détails d'un match avec composition des arbitres, cartons infligés, chronomètre et liens vidéo.

---

### 2.6 Articles & Actualités (`/articles`)

#### `GET /api/mobile/articles`
Flux d'actualités et revues de presse du Sabre National.

- **Query Parameters** :
  - `page` (int, défaut: 1)
  - `limit` (int, défaut: 15)
  - `search` (string) : Recherche dans le titre, extrait, contenu et nom de l'auteur.
  - `category` (string, optionnel)
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 302,
      "title": "Choc des titans : Issaka Issaka face à Mai Gaskiya",
      "slug": "choc-des-titans-issaka-vs-mai-gaskiya",
      "excerpt": "Les quarts de finale s'annoncent explosifs à l'arène d'Agadez...",
      "featured_image": "https://storage.kokowatv.com/articles/a302.jpg",
      "views_count": 1420,
      "likes_count": 89,
      "published_at": "2024-12-28T07:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 45, "totalPages": 3 }
}
```

#### `GET /api/mobile/articles/{articleId}`
Contenu complet de l'article avec balises HTML / Markdown et métadonnées d'auteur.

---

### 2.7 Arbitres (`/referees`)

#### `GET /api/mobile/referees`
Liste des arbitres officiels certifiés par la FENILUTTE.
- **Query Parameters** :
  - `sortBy` : `experience` | `matches` | `name`
  - `sortOrder` : `asc` | `desc`

#### `GET /api/mobile/referees/{id}`
Fiche individuelle de l'arbitre avec nombre de combats officiés et statistiques disciplinaires (cartons distribués).

---

### 2.8 Interactions Utilisateurs (Likes & Favoris) (`/interactions`)

#### `POST /api/mobile/interactions`
Ajoute ou retire un like ou un favori (fonctionnement en toggle).

- **Authentification requise** : `Authorization: Bearer <token>`
- **Corps de la requête (`application/json`)** :
```json
{
  "entityType": "match",
  "entityId": 105,
  "type": "like"
}
```
*Types supportés* : `like`, `favorite`, `dislike`  
*Entités supportées* : `match`, `fighter`, `article`, `video`

- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": {
    "action": "added",
    "entityType": "match",
    "entityId": 105,
    "likesCount": 90
  }
}
```

#### `GET /api/mobile/interactions/user/{userId}`
Récupère les interactions effectuées par un utilisateur donné (liste de ses favoris / likes).

---

### 2.9 Commentaires & Tchat en Direct (`/messages`)

#### `GET /api/mobile/messages`
Récupère les commentaires associés à une entité.

- **Query Parameters** :
  - `entityType` (ex: `match`, `article`)
  - `entityId` (int)
  - `page` (défaut: 1), `limit` (défaut: 50)
- **Exemple de Réponse (`200 OK`)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 841,
      "user_name": "Amadou Moussa",
      "user_avatar": "https://storage.kokowatv.com/avatars/user1.jpg",
      "content": "Superbe esquive de Dosso au début de la confrontation !",
      "created_at": "2024-12-28T09:34:10.000Z"
    }
  ]
}
```

#### `POST /api/mobile/messages`
Publie un nouveau commentaire ou message de direct.

- **Authentification requise** : `Authorization: Bearer <token>`
- **Corps de la requête (`application/json`)** :
```json
{
  "entityType": "match",
  "entityId": 105,
  "content": "Quel combat formidable ! Maradi tient bon !"
}
```
- **Exemple de Réponse (`201 Created`)** :
```json
{
  "success": true,
  "data": {
    "id": 842,
    "content": "Quel combat formidable ! Maradi tient bon !",
    "created_at": "2024-12-28T09:35:00.000Z"
  }
}
```

---

### 2.10 Bannières Publicitaires & Partenaires (`/pubs`)

#### `GET /api/mobile/pubs`
Récupère les bannières publicitaires et vidéos sponsorisées actives pour affichage dans l'application mobile.
- **Attributs retournés** : `title`, `image_url`, `link_url`, `position` (`home_banner`, `match_interstitial`, `footer`), `start_date`, `end_date`.

---

### 2.11 Paramètres Système (`/settings`)

#### `GET /api/mobile/settings`
Récupère la configuration globale de l'application : version minimale requise (`min_app_version`), statut du mode maintenance (`maintenance_mode`), liens des réseaux sociaux et contacts du support.

---

## 3. Synchronisation Temps Réel (Firebase RTDB)

Pour l'affichage des scores en direct (live ticker), le client Flutter **ne doit pas faire de polling HTTP intensif** sur `/api/mobile/matches`.

Il doit s'abonner directement aux nœuds Firebase Realtime Database :
- Référence : `https://kokowa-tv-default-rtdb.firebaseio.com/live_matches/{matchId}`
- Structure du nœud :
```json
{
  "status": "live",
  "timer": {
    "current_seconds": 184,
    "is_running": true
  },
  "warnings": {
    "fighter1_warnings": 1,
    "fighter2_warnings": 0
  },
  "scores": {
    "fighter1_points": 0,
    "fighter2_points": 0
  },
  "last_event": "Avertissement verbal pour le lutteur rouge",
  "timestamp": 1735378450000
}
```
L'écouteur `onValue` Flutter synchronise l'arène visuelle en temps réel avec un délai inférieur à 100ms.
