# Kokowa TV

Kokowa TV est une plateforme de gestion et de diffusion de contenu pour les compétitions de lutte.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Base de données**: PostgreSQL (via Neon)
- **Authentification**: Firebase Auth + Firebase App Check
- **Gestion de fichiers**: Firebase Storage
- **Rate Limiting**: Redis (via Upstash)
- **Styling**: Tailwind CSS

## Prérequis

- Node.js 18+
- npm, yarn, pnpm ou bun
- Un projet Firebase configuré
- Une base de données PostgreSQL (ou compte Neon)
- Un compte Upstash (pour Redis)

## Installation

1. Cloner le dépôt
2. Installer les dépendances:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Configurer les variables d'environnement (copier `.env.example` en `.env` et remplir les valeurs):

```bash
cp .env.example .env
```

4. Démarrer le serveur de développement:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

## Structure du Projet

- `app/`: Pages et routes API
- `actions/`: Server Actions
- `components/`: Composants React
- `lib/`: Utilitaires et bibliothèques
  - `db/`: Configuration et requêtes pour la base de données
  - `server/`: Utilitaires côté serveur (apiHandler, auth-middleware, etc.)
  - `client/`: Utilitaires côté client (api, firebase-app-check, etc.)
  - `firebase-admin.ts`: Configuration Firebase Admin
- `hooks/`: Custom Hooks React
- `contexts/`: Contextes React
- `configs/`: Fichiers de configuration
- `types/`: Définitions de types TypeScript

## Authentification

L'authentification utilise Firebase Auth avec Firebase App Check pour la sécurité.

- `/api/auth/sign-up`: Inscription
- `/api/auth/sign-in`: Connexion
- `/api/auth/sign-out`: Déconnexion
- `/api/auth/me`: Récupérer le profil utilisateur (lecture seule)
- `/api/auth/sync`: Synchroniser l'utilisateur Firebase avec la base de données (créer si absent, mettre à jour last_login)
- `/api/auth/forgot-password`: Demander un email de réinitialisation de mot de passe
- `/api/auth/reset-password`: Réinitialiser le mot de passe

## Documentation Additionnelle

- [API](./app/api/README.md)
- [Actions](./actions/README.md)
- [API Mobile](./app/api/mobile/README.md)
- [Admin](./app/(admins)/README.md)

## Learn More

Pour en savoir plus sur Next.js:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Déploiement

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
