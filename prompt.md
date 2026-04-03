Je veux corriger mon architecture WebSocket + Next.js pour un déploiement sur Railway.
Contexte :
J’utilise Next.js (App Router)
J’ai un serveur WebSocket custom avec "ws"
Actuellement j’ai aussi une API route /api/ws (à supprimer)
Mon WebSocket fonctionne en local mais pas en production sur Railway
Railway impose un seul port (process.env.PORT)
Objectifs :
Supprimer complètement l’utilisation des API routes pour WebSocket
Utiliser uniquement un serveur Node custom (http + ws)
Faire tourner Next.js + WebSocket sur le même serveur et même port
Assurer compatibilité Railway (PORT dynamique)
Garder mon système actuel :
wsManager
Redis (optionnel)
auth Firebase
rooms / subscriptions
Je veux que tu :
modifies mon serveur pour intégrer Next.js dedans (custom server)
ajustes les scripts package.json pour Railway
proposes un script start unique (production-ready)
supprimes toute dépendance au port 3001
garantis que le WebSocket fonctionne via /ws
vérifies que le client WebSocket (useRealtime) fonctionne sans changement majeur
Contraintes :
Node.js 18+ ou 20+
compatible Railway
pas de serverless
code propre, production-ready
Bonus :
proposer une version scalable (séparer WS et Next en 2 services Railway)
vérifier si Redis est correctement utilisé pour multi-instance
Donne :
nouveau fichier server.ts complet
package.json corrigé
instructions de déploiement Railway
pièges à éviter ⚡ Petit aperçu de la correction attendue

Ton package.json devrait ressembler à ça 👇

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "ws:dev": "node --experimental-strip-types server/websocket-server.ts"
  }
}

👉 plus de concurrently en prod
👉 un seul process