# Kokowa TV — Plateforme Officielle de Lutte Traditionnelle Nigérienne

Kokowa TV est une plateforme moderne de gestion sportive, de couverture médiatique en direct et de diffusion de contenu dédiée à la lutte traditionnelle nigérienne (Kokowa / Sabre National).

L'application combine un portail public grand public, un back-office administratif complet pour la gestion des tournois et des délégations régionales, une synchronisation temps réel pour les scores en direct, ainsi qu'une API REST sécurisée pour l'application mobile Flutter.

---

## 🛠️ Stack Technique

- **Moteur d'Exécution & Gestionnaire de Paquets** : [Bun](https://bun.sh/) (v1.4+)
- **Framework Web** : [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Langage** : TypeScript 5.7 (Mode Strict)
- **Base de Données Relationnelle** : PostgreSQL Serverless hébergé sur [Neon](https://neon.tech/)
- **Accès aux Données** : Client natif optimisé `@neondatabase/serverless` (requêtes paramétrées sécurisées)
- **Authentification & Intégrité** :
  - [Firebase Authentication](https://firebase.google.com/docs/auth) (JWT & Sessions)
  - [Firebase App Check](https://firebase.google.com/docs/app-check) (reCAPTCHA v3 & Google Play Integrity)
- **Scores & Directs Temps Réel** : [Firebase Realtime Database](https://firebase.google.com/docs/database) (latence < 100ms)
- **Stockage de Fichiers & Médias** : [Firebase Cloud Storage](https://firebase.google.com/docs/storage)
- **Rate Limiting & Protection Anti-Abus** : [Upstash Redis](https://upstash.com/) (`@upstash/ratelimit`)
- **Styling & Design System** : Tailwind CSS, Radix UI Primitives, Lucide Icons

---

## 📋 Prérequis

- [Bun](https://bun.sh/) installé sur votre machine (`curl -fsSL https://bun.sh/install | bash` ou `powershell -c "irm bun.sh/install.ps1|iex"`)
- Une instance de base de données PostgreSQL (instance Neon ou Postgres 15+)
- Un projet Firebase configuré avec Authentication, App Check, Cloud Storage et Realtime Database
- Une instance Upstash Redis (pour la limitation de débit en production)

---

## 🚀 Installation & Démarrage

### 1. Cloner le projet et installer les dépendances avec Bun

```bash
git clone https://github.com/votre-compte/kokowa_tv.git
cd kokowa_tv
bun install
```

### 2. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env.local` ou `.env` :

```bash
cp .env.example .env.local
```

Renseignez les variables requises :

```env
# Base de données PostgreSQL (Neon)
DATABASE_URL=postgresql://user:password@ep-sample.eu-central-1.aws.neon.tech/kokowa_db?sslmode=require

# Configuration Firebase Client (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kokowa-tv.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kokowa-tv
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kokowa-tv.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://kokowa-tv-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_APPCHECK_KEY=recaptcha-v3-site-key

# Configuration Firebase Admin SDK (Serveur)
FIREBASE_PROJECT_ID=kokowa-tv
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@kokowa-tv.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."

# Identifiants App Check Mobile autorisés
FIREBASE_ANDROID_APP_ID=1:123456789:android:1234abcd
FIREBASE_IOS_APP_ID=1:123456789:ios:5678efgh

# Sécurité & CORS
CORS_ALLOWED_ORIGINS=https://kokowatv.com,https://admin.kokowatv.com,http://localhost:3000

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://sample.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

### 3. Exécuter les migrations de base de données

```bash
bun run db:migrate
```

### 4. Lancer le serveur de développement

```bash
bun dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponibles

| Commande | Action |
| :--- | :--- |
| `bun dev` | Démarre le serveur Next.js en mode développement avec Turbopack |
| `bun run build` | Compile l'application pour la production |
| `bun run start` | Lance le serveur de production compilé |
| `bun run typecheck` | Vérifie la conformité de tous les types TypeScript (`tsc --noEmit`) |
| `bun run lint` | Analyse la qualité du code avec ESLint |
| `bun run db:migrate` | Applique les migrations SQL sur Neon PostgreSQL |
| `bun run db:seed` | Remplit la base avec un jeu de données initial (régions, compétitions) |
| `bun run db:reset` | Réinitialise et remigre la base de données |

---

## 📂 Architecture du Dépôt

```
kokowa_tv/
├── actions/                  # Server Actions Next.js 16 (logique métier & mutations SQL)
├── app/
│   ├── (admins)/ad/          # Espace d'administration / Back-office du tournoi
│   ├── (auth)/auth/          # Pages d'authentification (connexion, mot de passe)
│   ├── api/                  # Route Handlers REST
│   │   ├── auth/             # Synchronisation de session et compte
│   │   ├── database/         # Diagnostic et maintenance de la base (Admin)
│   │   └── mobile/           # API REST dédiée à l'application mobile Flutter
│   ├── globals.css           # Feuilles de style Tailwind CSS
│   └── layout.tsx            # Layout racine de l'application
├── components/               # Composants React modulaires (UI, Back-office, Partagés)
├── configs/                  # Configurations d'entités, menus et thèmes
├── database/                 # Migrations SQL, schémas Neon et scripts d'initialisation
├── hooks/                    # Custom React Hooks (useEntityList, useAuth, etc.)
├── lib/                      # Utilitaires serveur & client (apiHandler, Firebase Admin, Neon)
├── types/                    # Définitions de types TypeScript stricts
└── validation/               # Schémas de validation (Zod)
```

---

## 🛡️ Sécurité & Bonnes Pratiques

L'application a fait l'objet d'un audit de sécurité rigoureux ayant abouti à la mise en place de :
1. **Contrôle d'accès RBAC obligatoire** sur toutes les Server Actions sensibles (`assertAdmin()`).
2. **Protection stricte contre les injections SQL** par requêtes paramétrées et liste blanche d'identificateurs.
3. **Purge systématique des données sensibles** (`password_hash` masqué sur toutes les sorties).
4. **Vérification cryptographique des requêtes mobiles** (`verifyFirebaseToken` sur les interactions et commentaires).
5. **En-têtes HTTP de sécurité stricts** (`HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `CSP`).

---

## 📚 Documentation Technique Complète

Pour approfondir les détails d'ingénierie et de conception :
- [📋 Cahier des Charges Fonctionnel & Technique](./CAHIER.md)
- [🔍 Rapport d'Audit & Analyse Technique](./ANALYSIS.md)
- [🗺️ Feuille de Route d'Optimisation](./PLAN.md)
- [✅ Registre des Tâches & Suivi d'Avancement](./TASK.md)
- [⚡ Guide des Server Actions](./actions/README.md)
- [🌐 Guide des Routes API Web](./app/api/README.md)
- [📱 Spécifications de l'API Mobile Flutter](./app/api/mobile/README.md)
