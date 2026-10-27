# Documentation des Routes API — Kokowa TV

Ce dossier regroupe l'ensemble des points d'accès HTTP REST (Route Handlers Next.js 16) de l'application Kokowa TV, desservant à la fois le back-office web, les pages publiques et l'application mobile Flutter.

---

## 1. Architecture & Middleware Unifié (`apiHandler`)

Toutes les routes API s'appuient sur le gestionnaire unifié `@/lib/server/api-handler` (ou son adaptateur `@/lib/api-handler`).

```
                    Requête HTTP entrante
                              │
                              ▼
                   ┌───────────────────────┐
                   │   Preflight OPTIONS   │ ──► Headers CORS 200 OK
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │   Validation Méthode  │ ──► 405 Method Not Allowed
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ Firebase App Check    │ ──► 401 Invalid App Check
                   │ (si requireAppCheck)  │
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ Firebase Bearer Auth  │ ──► 401 Unauthorized / Token expiré
                   │  (si requireAuth)     │
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ Vérification des rôles│ ──► 403 Forbidden
                   │ (si requiredRoles)    │
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │   Rate Limiter        │ ──► 429 Too Many Requests
                   │ (Sliding Window IP)   │
                   └───────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ Exécution du Handler  │ ──► 200/201 JSON avec Security Headers
                   └───────────────────────┘
```

### Fonctionnalités Clés du Middleware

1. **Sécurité CORS Dynamique** :
   - Autorise uniquement les origines légitimes configurées dans `CORS_ALLOWED_ORIGINS` (ex: `https://kokowatv.com`, `http://localhost:3000`).
   - Gère les requêtes préliminaires `OPTIONS` avec les en-têtes `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, et `Access-Control-Max-Age: 86400`.

2. **Attestation d'Intégrité Firebase App Check** :
   - En-tête requis : `X-Firebase-AppCheck: <app_check_token>`.
   - Valide cryptographiquement que la requête provient d'un client légitime (Web reCAPTCHA v3 / Enterprise ou Mobile Google Play Integrity).

3. **Authentification & Contrôle d'Accès RBAC** :
   - En-tête requis : `Authorization: Bearer <firebase_id_token>`.
   - Valide le JWT auprès de Firebase Admin SDK et synchronise avec la table `users`.
   - Vérifie la conformité avec les rôles requis (`admin`, `editor`, `moderator`, `fighter_manager`, `user`).

4. **Limitation de Fréquence (Rate Limiting)** :
   - Protection contre le brute-force et le DoS par fenêtre glissante (ex: 60 requêtes / minute pour les données, 10 requêtes / minute pour les actions d'écriture).
   - En-têtes HTTP de monitoring renvoyés : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

5. **En-têtes de Sécurité HTTP Automatiques** :
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 2. Format des Échanges HTTP

### Format de Succès Unifié
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "totalPages": 5
  },
  "stats": {
    "total": 85,
    "active": 72
  }
}
```

### Format d'Erreur Unifié
```json
{
  "success": false,
  "error": {
    "code": 401,
    "message": "Token d'authentification invalide ou expiré",
    "timestamp": "2026-10-22T10:15:00.000Z"
  }
}
```

---

## 3. Cartographie des Espaces d'API

### 3.1 Espace Mobile (`/api/mobile/*`)
Dédié aux applications mobiles (Flutter). Pour le contrat détaillé, les paramètres de requêtes et les schémas JSON, consulter la [Documentation Spécifique Mobile](./mobile/README.md).

### 3.2 Espace Authentification & Session (`/api/auth/*`)
- `POST /api/auth/sign-in` : Authentification et émission de cookie de session.
- `POST /api/auth/sign-up` : Création de compte utilisateur.
- `POST /api/auth/sign-out` : Révocation de session et purge des cookies HTTP.
- `GET /api/auth/session` : Vérification de la session active courante.
- `GET /api/auth/me` : Détails du profil connecté.
- `POST /api/auth/sync` : Synchronisation du profil Firebase vers Neon PostgreSQL.
- `POST /api/auth/forget-password` / `reset-password` : Procédure de réinitialisation sécurisée.

### 3.3 Espace Administration & Système (`/api/admin/*`, `/api/database/*`)
- `GET /api/database` : Métadonnées et statut de la base de données (protégé `withAdminAuth`).
- `GET/POST /api/admin/users` : Gestion centralisée des utilisateurs du back-office.
- `GET/PUT /api/app-settings` : Lecture et modification des drapeaux de configuration globale.

### 3.4 Espace Données de Compétition & Gestion Sportive
- `/api/competitions` & `[competitionId]` : Gestion des compétitions.
- `/api/editions` & `[editionId]` : Éditions du Sabre National.
  - `/api/editions/[editionId]/fighters/list` : Liste des lutteurs de l'édition avec pagination et filtres.
  - `/api/editions/[editionId]/regions/list` : Délégations engagées dans l'édition.
  - `/api/editions/[editionId]/stats` : Statistiques globales de l'édition.
- `/api/phases` & `[phaseId]` : Phases de tournoi.
- `/api/phase-groups` & `[groupId]` : Groupes / poules de phase.
- `/api/sub-groups` & `[subGroupId]` : Rencontres opposant 2 régions ou duels individuels.
- `/api/matches` & `[matchId]` : Combats, programmation, arbitres, et résultats.
- `/api/fighters` & `[fighterId]` : Fiches des lutteurs, palmarès, état physique.
- `/api/fighter-cards` : Sanctions (cartons jaunes / rouges).
- `/api/transfers` : Mutations régionales des athlètes.
- `/api/coaches` & `/api/referees` : Encadrement technique et corps arbitral.
- `/api/regions` & `[regionId]` : Ligues régionales (Niamey, Zinder, Maradi, Tahoua, Dosso, Tillabéri, Agadez, Diffa).

### 3.5 Espace Contenus & Réseaux Sociaux
- `/api/articles` & `[articleId]` : Articles d'actualité, recherche textuelle et incrémentation de vues (`view`).
- `/api/videos` & `[videoId]` : Replays des combats et flux streaming (`view`, `like`).
- `/api/advertisements` & `[id]` : Bannières et campagnes sponsorisées.
- `/api/archives` : Historique des éditions passées depuis 1975.
- `/api/interactions` : Gestion des réactions utilisateur (likes, favoris).
- `/api/messages` : Tchat en direct et commentaires d'articles / matchs.
- `/api/media` : Gestion des assets et téléversements de médias.
