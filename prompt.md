#refonte total: firestore vers realtime db.
# CONTEXTE PROJET

Nous développons une plateforme web + mobile de lutte traditionnelle :

- Frontend Web : Next.js App Router + React + TypeScript
- Mobile : Flutter
- Backend/API : Next.js Server Actions + API Routes
- Base principale (source de vérité) : PostgreSQL (Neon)
- Temps réel : migration de Firestore vers Firebase Realtime Database (RTDB)
- Firebase utilisé UNIQUEMENT comme couche realtime ultra légère
- Les données métiers et historiques restent exclusivement dans PostgreSQL

Architecture cible :

PostgreSQL = source de vérité  
RTDB = diffusion temps réel minimaliste  
Frontend = fetch initial PostgreSQL + écoute RTDB

Le trafic attendu :

- 2k → 10k+ utilisateurs simultanés pendant les compétitions live
- 5 à 10 compétitions/an
- pics temporaires de 10 à 20 jours
- très forte fan-out realtime

OBJECTIF PRINCIPAL :

Réduire MASSIVEMENT :
- coût Firebase
- bande passante
- payloads realtime
- nombre de listeners
- nombre d’écritures

IMPORTANT :
Nous ABANDONNONS Firestore.
Nous migrons complètement vers Firebase Realtime Database (RTDB).

---

# PHILOSOPHIE ARCHITECTURE

Le frontend ne doit JAMAIS dépendre entièrement de Firebase.

Flux normal :

1. Chargement initial via API PostgreSQL
2. RTDB sert uniquement à écouter les changements dynamiques
3. Quand un event realtime arrive :
   - soit on patch localement le state
   - soit on refetch uniquement la ressource concernée

Firebase ne doit PAS contenir :
- gros documents
- relations complètes
- historique
- données rarement modifiées
- payloads dupliqués

Firebase doit contenir UNIQUEMENT :
- états live
- changements fréquents
- IDs
- compteurs
- statuts
- timestamps
- mini payloads ultra optimisés

---

# OBJECTIF TECHNIQUE

Refondre complètement l’architecture realtime actuelle.

Actuellement :
- gros documents Firestore
- duplication massive de données
- collection realtime_matches
- collection realtime_subgroups
- duplication des matchs dans plusieurs endroits
- fighters/régions complets dans Firebase

Nouvelle cible :
- RTDB ultra léger
- aucune duplication inutile
- synchronisation ciblée
- listeners très précis
- payloads minimaux

---

# STRUCTURE RTDB CIBLE

IMPORTANT :
Nous voulons CENTRALISER les matches sous les sous-groupes.

Nous NE voulons PAS :
- une collection globale matches
- + une duplication dans subgroups

Nous voulons UNE SEULE source realtime pour les matches.

Structure RTDB cible :

```json
{
  "editions": {
    "{editionId}": {
      "status": "ongoing",
      "liveMatch": {
        "subGroupId": 12,
        "matchId": 44
      },
      "updatedAt": 123456789
    }
  },

  "subGroups": {
    "{subGroupId}": {
      "status": "ongoing",
      "score": {
        "region1": 3,
        "region2": 1,
        "nulls": 0
      },

      "summary": {
        "total": 10,
        "completed": 4,
        "live": 1
      },

      "updatedAt": 123456789,

      "matches": {
        "{matchId}": {
          "status": "live",
          "isLive": true,

          "fighter1Id": 1,
          "fighter2Id": 2,

          "winnerFighterId": null,
          "loserFighterId": null,

          "matchResult": null,

          "breakCount": 2,
          "audienceCount": 2000,

          "videoUrl": null,
          "liveStreamUrl": null,

          "updatedAt": 123456789
        }
      }
    }
  }
}
RÈGLES IMPORTANTES
1. AUCUNE DONNÉE STATIQUE DANS RTDB

NE PAS stocker :

first_name
last_name
profile_image
région complète
édition complète
notes
historique
tableaux complets
données SQL déjà connues

Le frontend récupère ça depuis PostgreSQL/API.

RTDB ne contient QUE :

ids
statuts
compteurs
états live
2. ÉCOUTES ULTRA CIBLÉES

Cas d’usage :

Écran liste des sous-groupes

écoute :

subGroups/{subGroupId}
Écran match live

écoute :

subGroups/{subGroupId}/matches/{matchId}
Widget match live global

écoute :

editions/{editionId}/liveMatch

IMPORTANT :
NE JAMAIS écouter toute la base.

3. PATCHES CIBLÉS

Ne jamais réécrire un document entier.

Utiliser update() ciblé :

await ref.update({
  status: "live",
  breakCount: 2,
  updatedAt: ServerValue.TIMESTAMP
});

PAS de overwrite complet.

4. SYNCHRONISATION APRÈS COMMIT SQL UNIQUEMENT

Flux obligatoire :

transaction PostgreSQL
COMMIT réussi
sync RTDB

RTDB ne doit jamais être source de vérité.

5. OPTIMISATION COÛTS

Nous voulons :

payloads minuscules
listeners minimaux
update ciblés
pas de duplication
pas de gros snapshots
pas de documents géants
éviter les fan-outs inutiles
TÂCHES À EFFECTUER

Refondre complètement :

1. TYPES REALTIME

Refactor :

RealtimeMatchDocument
RealtimeSubGroupDocument
RealtimeEditionDocument

pour les rendre MINIMALISTES.

2. SUPPRIMER FIRESTORE

Supprimer :

firestore imports
collections Firestore
builders Firestore lourds
logique snapshot Firestore

Migrer vers :

firebase-admin/database
RTDB refs
update()
onValue()
3. NOUVEAU SERVICE RTDB

Créer :

lib/realtime/rtdb-admin.ts
lib/realtime/rtdb-sync.ts

Le service doit :

être singleton
réutilisable
optimisé
server-only
4. REFAIRE LES HOOKS FRONTEND

Migrer :

useRealtimeMatch
useRealtimeSubGroup
useLiveMatches

vers RTDB :

ref()
onValue()
off()

Avec cleanup parfait.

5. REFAIRE LA SYNCHRONISATION

Créer :

syncMatchRealtime()
syncSubGroupRealtime()
syncEditionRealtime()

version RTDB.

Les updates doivent être ciblés.

6. AJOUTER STRATÉGIE DE CACHE FRONTEND

Le frontend doit :

fetch PostgreSQL une seule fois
écouter RTDB ensuite
patch localement les données live

IMPORTANT :
éviter les refetch complets fréquents.

7. OPTIMISATION MOBILE FLUTTER

Prévoir :

listeners annulés au dispose
streams ciblés
cache local
mode offline RTDB
reconnexion automatique
8. AJOUTER SÉCURITÉ RTDB

Préparer des règles RTDB :

lecture publique
écriture admin uniquement
validations minimales
IMPORTANT

Le résultat final doit être :

scalable
ultra économique
optimisé pour 10k+ utilisateurs simultanés
adapté aux pics temporaires
faible bande passante
minimaliste
production-ready
pensé mobile-first
pensé fan-out massif
CE QUE NOUS VOULONS À LA FIN

Une architecture hybride :

PostgreSQL :

vérité
relations
historique
données complètes

RTDB :

realtime pur
états live
mini updates
diffusion massive

Frontend :

fetch initial API
sync temps réel ultra légère
IMPORTANT FINAL

Avant de coder :

analyser l’architecture actuelle
identifier toutes les duplications
proposer la meilleure structure RTDB finale
optimiser les listeners
optimiser les coûts
optimiser les payloads
optimiser les writes
optimiser la fan-out
garantir la cohérence PostgreSQL ↔ RTDB
préparer autant Next.js que Flutter