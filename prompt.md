# REFACTORING COMPLET : Migration WebSocket/Redis → Firestore Realtime (Architecture Hybride Optimisée)

## CONTEXTE GLOBAL

L’application actuelle utilise :

* Next.js 16 custom server
* WebSocket natif (`ws`)
* Redis Pub/Sub
* PostgreSQL
* Firebase Auth
* Railway pour hébergement
* système de rooms/subscriptions
* hooks realtime custom
* broadcasting via wsManager

L’objectif est de :

* SUPPRIMER complètement le système WebSocket/Redis
* SUPPRIMER la dépendance à Railway spécifique au websocket
* CONSERVER toute l’architecture métier actuelle
* CONSERVER PostgreSQL comme source de vérité principale
* UTILISER Firestore uniquement comme couche realtime ultra optimisée
* ÉVITER les refetchs PostgreSQL à chaque événement live
* RENDRE l’application scalable serverless
* GARDER les mêmes concepts d’entités (`match`, `subGroup`, `edition`, etc.)
* GARDER les mêmes logiques métiers et événements temps réel
* RÉUTILISER le maximum de code existant
* NE PAS créer de complexité inutile
* NE PAS réinventer toute l’architecture

---

# OBJECTIF ARCHITECTURE FINAL

## NOUVELLE PHILOSOPHIE

PostgreSQL reste :

* la source officielle
* la base transactionnelle
* la logique métier
* les calculs
* les relations complexes

Firestore devient :

* la couche realtime
* la couche de diffusion live
* la couche d’écoute instantanée
* le cache live distribué

Le frontend NE doit PLUS écouter des événements websocket.

Le frontend doit :

* écouter directement Firestore via `onSnapshot`
* recevoir les données complètes realtime
* éviter les refetch API
* recevoir instantanément les changements

---

# ARCHITECTURE CIBLE

## COLLECTIONS FIRESTORE

Créer une architecture Firestore propre :

```txt
realtime/
   matches/
      {matchId}
   subGroups/
      {subGroupId}
   editions/
      {editionId}
   fighters/
      {fighterId}
   regions/
      {regionId}
```

OU structure alternative acceptable :

```txt
realtime_matches/{matchId}
realtime_subgroups/{subGroupId}
realtime_editions/{editionId}
```

Choisir la structure la plus scalable et maintenable.

---

# STRUCTURE DOCUMENT MATCH

Le document realtime d’un match doit contenir :

```ts
interface RealtimeMatchDocument {
   id: number;

   entityType: 'match';

   updatedAt: number;
   createdAt: number;

   liveState: {
      isLive: boolean;
      status: string;
      currentPhase?: string;
      breakCount?: number;
      audienceCount?: number;
   };

   realtime: {
      lastEvent?: string;
      lastEventAt?: number;
   };

   match: {
      // DONNÉES COMPLÈTES DU MATCH
      // nécessaires à l’UI
   };

   fighters: {
      fighter1: {};
      fighter2: {};
   };

   regions: {};

   score: {};

   subGroup: {};

   edition: {};

   metadata: {
      source: 'postgres';
      syncVersion: number;
   };
}
```

IMPORTANT :

Le frontend doit pouvoir afficher la page match ENTIÈREMENT depuis Firestore sans refetch API.

---

# STRATÉGIE HYBRIDE OBLIGATOIRE

IMPORTANT :

NE PAS mettre inutilement toutes les données statiques dans Firestore si elles ne changent jamais.

Faire une architecture HYBRIDE INTELLIGENTE :

## PostgreSQL

Conserve :

* historique
* statistiques lourdes
* relations complexes
* archives
* données rarement modifiées

## Firestore

Contient :

* état live du match
* score
* fighters courants
* statut
* timers
* audience
* événements live
* données nécessaires au rendu live immédiat

Le document Firestore doit être optimisé pour lecture frontend directe.

---

# COMPORTEMENT ATTENDU

## LORSQU’UN MATCH PASSE EN LIVE

Le système doit :

1. Vérifier si document Firestore existe
2. Sinon :

   * récupérer toutes les données PostgreSQL nécessaires
   * construire document realtime complet
   * créer document Firestore
3. Sinon :

   * mettre à jour uniquement les champs modifiés

---

# IMPORTANT : PLUS DE SIGNALS WEBSOCKET

Ancien comportement :

```txt
WS Event → Frontend reçoit signal → refetch API
```

NOUVEAU comportement :

```txt
PostgreSQL update
→ Sync Firestore
→ Frontend reçoit directement données finales via Firestore
→ aucun refetch
```

---

# SUPPRESSION COMPLÈTE WEBSOCKET

Supprimer :

* ws
* redis pub/sub
* wsManager
* realtime-client
* hooks websocket
* server.ts websocket
* routes ws
* subscriptions
* rooms
* ping/pong
* reconnect websocket
* rate limiting websocket
* redis broadcast
* ws types inutiles

Supprimer dépendances :

```json
"ws"
"redis"
"ioredis"
"@upstash/redis"
"@types/ws"
```

Supprimer :

```ts
/server/ws-*
/lib/realtime-client.ts
/hooks/use-realtime.ts
```

Supprimer logique :

* subscribe/unsubscribe
* auth websocket
* broadcast websocket
* ws rooms

---

# MAIS CONSERVER LES TYPES EXISTANTS

Réutiliser :

```ts
EntityType
RealtimeUpdatePayload
```

Les adapter au nouveau système Firestore.

Exemple :

```ts
export interface RealtimeSyncPayload {
   entityType: EntityType;
   entityId: string | number;
   event: string;
   data: any;
   timestamp: number;
}
```

---

# CRÉER NOUVEAU SERVICE FIRESTORE REALTIME

Créer :

```txt
/lib/firestore/realtime-sync.ts
```

Responsabilités :

* createRealtimeDocument
* updateRealtimeDocument
* deleteRealtimeDocument
* ensureRealtimeDocument
* syncMatchRealtime
* syncSubGroupRealtime
* syncEditionRealtime

---

# IMPORTANT : UTILISER FIREBASE ADMIN EXISTANT

Réutiliser :

```ts
firebase-admin
```

NE PAS créer nouvelle initialisation Firebase inutile.

Réutiliser :

```ts
initializeApp
getApps
cert
```

---

# NOUVEAU FLOW TEMPS RÉEL

## Dashboard Admin

Quand admin :

* démarre match
* pause
* ajoute carton
* change score
* termine match

Le flow devient :

```txt
1. PostgreSQL transaction
2. updateMatchAndRecompute()
3. sync Firestore document
4. Frontend reçoit instantanément snapshot
```

---

# INTÉGRATION DANS updateMatchAndRecompute()

IMPORTANT :

NE PAS casser logique métier existante.

Simplement ajouter :

```ts
await syncMatchRealtime(matchId);
```

APRÈS COMMIT transaction PostgreSQL.

Jamais avant.

---

# CRÉER REPOSITORY DE CONSTRUCTION DES DOCUMENTS

Créer :

```txt
/lib/firestore/builders/
```

Exemple :

```txt
buildRealtimeMatchDocument()
buildRealtimeSubGroupDocument()
```

Ces builders doivent :

* récupérer données PostgreSQL
* assembler données frontend-ready
* normaliser structure
* éviter logique dupliquée

---

# OPTIMISATION FIRESTORE

IMPORTANT :

Utiliser :

```ts
setDoc(docRef, data, { merge: true })
```

pour éviter overwrite complet inutile.

---

# OPTIMISATION FRONTEND

Créer nouveaux hooks :

```txt
/hooks/firestore/
```

Exemple :

```ts
useRealtimeMatch(matchId)
useRealtimeSubGroup(subGroupId)
```

Utiliser :

```ts
onSnapshot()
```

Le hook doit :

* écouter Firestore
* retourner données live
* gérer loading
* gérer fallback
* gérer unsubscribe automatique

---

# IMPORTANT : FALLBACK AUTOMATIQUE

Si document realtime n’existe pas :

Le frontend doit :

1. fallback API PostgreSQL
2. créer document realtime si nécessaire
3. continuer écoute Firestore

---

# GESTION DES MATCHES LIVE UNIQUES

Conserver logique actuelle :

* un seul match live
* un seul subgroup ongoing

Mais synchroniser Firestore aussi.

Quand un match passe live :

* mettre ancien match Firestore en non-live
* mettre nouveau en live

---

# INDEXATION FIRESTORE

Prévoir requêtes :

```ts
where("liveState.isLive", "==", true)
orderBy("updatedAt", "desc")
```

Créer structure optimisée pour :

* liste live matches
* page match
* widgets live
* mobile app
* Flutter

---

# COMPATIBILITÉ FLUTTER

La structure Firestore doit être :

* frontend agnostic
* compatible Flutter
* compatible web
* compatible mobile

---

# CRÉER TYPES FIRESTORE DÉDIÉS

Créer :

```txt
/types/realtime/
```

Exemple :

```ts
RealtimeMatchDocument
RealtimeSubGroupDocument
RealtimeEditionDocument
```

---

# GESTION DES COÛTS FIRESTORE

IMPORTANT :

Optimiser lectures/écritures.

Éviter :

* writes inutiles
* documents géants
* nested objects inutiles
* snapshots multiples

Préférer :

* documents ciblés
* structure stable
* partial updates

---

# IMPORTANT : PAS DE REFETCH API

Objectif principal :

Quand Firestore change :

* UI déjà synchronisée
* aucune requête API supplémentaire
* aucune invalidation React Query obligatoire

---

# REACT QUERY

Conserver React Query uniquement pour :

* données non realtime
* pagination
* archives
* statistiques

PAS pour match live.

---

# SERVER.TS

Supprimer complètement :

```ts
WebSocketServer
```

Le server custom doit redevenir simple Next.js HTTP server.

OU supprimer totalement `server.ts` si inutile.

---

# DEPLOYMENT FINAL

Le projet final doit pouvoir être hébergé sur :

* Vercel
* Render
* VPS
* Coolify
* Dokploy
* Railway (sans websocket)
* Firebase App Hosting

sans dépendance websocket sticky session.

---

# IMPORTANT : CLEAN ARCHITECTURE

Le résultat final doit :

* réduire complexité
* réduire coût infra
* améliorer stabilité
* améliorer scalabilité
* conserver logique métier
* conserver architecture actuelle
* minimiser refactor destructif

---

# CE QUI EST STRICTEMENT INTERDIT

* Réécrire toute l’application
* Changer PostgreSQL
* Remplacer logique métier existante
* Ajouter architecture event sourcing complexe
* Ajouter Kafka/NATS/etc
* Ajouter Redux inutile
* Ajouter duplication massive
* Ajouter polling
* Ajouter Cloud Functions obligatoires

---

# OBJECTIF FINAL

Architecture simple :

```txt
Admin Dashboard
    ↓
PostgreSQL Transaction
    ↓
Firestore Sync
    ↓
Frontend onSnapshot()
    ↓
UI instantanément synchronisée
```

SANS :

* websocket
* redis
* refetch API
* rooms
* subscriptions server
* infrastructure temps réel custom

---

# TÂCHES À EFFECTUER

1. Supprimer système websocket
2. Supprimer redis realtime
3. Refactor hooks realtime
4. Ajouter couche Firestore realtime
5. Créer builders realtime
6. Créer services sync realtime
7. Adapter frontend
8. Adapter dashboard admin
9. Adapter match live pages
10. Optimiser lectures Firestore
11. Garder logique métier existante
12. Minimiser breaking changes
13. Réutiliser maximum du code existant

Produire le code final complet et propre.
