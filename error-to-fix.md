🚨 1. GROS PROBLÈME : tu as encore 2 serveurs ❌

👉 Tu as corrigé server.ts ✅ (très bien)

MAIS tu as encore :

/server/websocket-server.ts

👉 ça = ❌ serveur fantôme inutile

⚠️ Pourquoi c’est dangereux
double initialisation Firebase
double wsManager
confusion possible si lancé par erreur
bug en prod difficile à debug
✅ Solution

👉 SUPPRIME complètement :

/server/websocket-server.ts

👉 ton seul serveur doit être :

server.ts
🚨 2. BUG CRITIQUE (tu vas crash en prod)

Dans ton code :

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ msg: 'Unhandled Rejection at:', promise, 'reason:': reason });
});

👉 ❌ ERREUR JS :

'reason:': reason

👉 ça va crash silencieusement ou log mal

✅ Fix
logger.error({
  msg: 'Unhandled Rejection',
  promise,
  reason
});
⚠️ 3. Détail Railway important

Dans server.ts :

const HOST = process.env.HOST || '0.0.0.0';

👉 ⚠️ Railway s’en fout du HOST, mais c’est OK

✅ 4. Ton client WebSocket → PARFAIT
return `${protocol}//${host}/ws`;

👉 ✔️ exact
👉 ✔️ compatible Railway
👉 ✔️ pas besoin de .env

⚠️ 5. Script package.json (petite amélioration)

Actuellement :

"dev": "node --experimental-strip-types server.ts"

👉 ça marche, MAIS tu perds le hot reload Next

✅ Version recommandée
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node --experimental-strip-types server.ts"
  }
}

👉 et pour dev WS + Next ensemble :

"dev:full": "concurrently \"next dev\" \"node --experimental-strip-types server.ts\""
⚠️ 6. Redis (TRÈS important en prod)

Tu as :

REDIS_WS_URL=""

👉 ❌ donc :

si Railway scale → ça casse ton temps réel
✅ Fix

Utilise un vrai Redis TCP :

Upstash Redis (TCP, pas REST)
ou Railway Redis
🧠 7. Architecture finale (VALIDÉE)

Tu es maintenant dans ce modèle 👇

Railway container
│
├── Next.js (App Router)
├── WebSocket (ws)
│   └── même serveur HTTP
│
└── PORT unique ✔️

👉 C’est EXACTEMENT ce qu’il faut avec Next.js

🎯 Verdict final

✅ Très bon refactor
✅ Compatible Railway
✅ WebSocket stable
⚠️ Juste quelques nettoyages critiques

✅ Checklist finale (à faire maintenant)
 supprimer /server/websocket-server.ts
 corriger unhandledRejection
 vérifier que seul server.ts est lancé
 ajouter Redis si scaling
 tester /ws en prod