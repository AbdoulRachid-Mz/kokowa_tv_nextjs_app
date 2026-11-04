# PROMPT MAÎTRE — OPTIMISATION API MOBILE & ÉVOLUTION DU SYSTÈME DE COMBATS — KOKOWA TV

Tu interviens sur le projet **Kokowa TV**, une application de gestion et de diffusion de lutte traditionnelle.

Le contexte général de l'application, son architecture et ses technologies sont déjà connus. Il n'est pas nécessaire de refaire une analyse architecturale globale.

Références :
- Repository : https://github.com/AbdoulRachid-Mz/kokowa_tv_nextjs_app
- Application : https://kokowa-tv-nextjs-app.vercel.app/
- Une archive ZIP du projet est également disponible.

**OBJECTIF :** réaliser deux lots de corrections indépendants, en commençant impérativement par l'optimisation des API et de leur système de protection, puis en passant à la gestion des combats et des palmarès.

Ne fais pas de modifications hors périmètre. Réutilise les composants, fonctions, services, types et conventions existants.

---

# LOT 1 — OPTIMISATION DU API HANDLER ET DES API MOBILES

## 1.1. Problème actuel

Les API mobiles qui passent par le système centralisé de protection prennent environ 6 secondes pour répondre.

Les API non mobiles, particulièrement celles qui ne passent pas par `api-handler`, répondent généralement en 1 à 2 secondes.

Cette différence indique qu'une partie importante du délai peut provenir des traitements intermédiaires du handler.

Fichiers prioritaires :
- `lib/server/api-handler.ts`
- `lib/api-handler.ts`
- `lib/server/auth-middleware.ts`
- `lib/server/app-check.ts`
- `lib/server/rate-limit.ts`
- `lib/server/rate-limit-redis.ts`
- `lib/firebase-admin.ts` et les fichiers associés à Firebase Admin.
- `lib/server/auth-utils.ts`

## 1.2. Suppression complète de Firebase App Check

Je souhaite supprimer définitivement App Check de la chaîne de protection des API.

Actions :
- Retirer son import et son exécution du handler central.
- Supprimer les vérifications `verifyAppCheckToken`.
- Supprimer les options `requireAppCheck` devenues inutiles.
- Supprimer l'envoi et la récupération des tokens App Check côté client.
- Retirer le header `X-Firebase-AppCheck` de la configuration CORS.
- Retirer les initialisations App Check inutiles dans les providers.
- Nettoyer les variables d'environnement spécifiques à App Check si elles ne sont plus utilisées ailleurs.
- Adapter les API de test et les appels existants.

Ne laisse aucun mécanisme App Check actif ou susceptible de ralentir une requête.

## 1.3. Conservation et correction de X-App-Id

Le header `X-App-Id` doit rester une vérification obligatoire pour les API mobiles concernées.

Valeurs autorisées existantes :
- `mobile-client`
- `web-client`

Réutiliser la configuration `ALLOWED_APP_IDS`.

Corriger notamment le problème actuel dans `lib/api-handler.ts` où `publicHandler()` et `withAuth()` transmettent `skipAppIdValidation: true`.

Le système doit distinguer correctement les applications mobiles et web, sans imposer arbitrairement les mêmes règles aux routes qui ne sont pas concernées.

Ne considère jamais X-App-Id comme un mécanisme d'authentification : c'est uniquement une identification de l'application cliente.

## 1.4. Optimisation de Firebase Authentication

Conserver intégralement le fonctionnement des API protégées par :

`Authorization: Bearer <Firebase_ID_Token>`

Contraintes :
- Vérifier correctement les Firebase ID Tokens.
- Ne jamais confondre Firebase ID Token et FCM Token.
- Ne jamais accepter un token FCM comme justificatif d'authentification.
- Conserver les réponses 401 et 403 appropriées.
- Conserver les vérifications de rôles et permissions.
- Éviter les vérifications Firebase redondantes.

Analyser particulièrement :

`adminAuth.verifyIdToken(token, true)`

La vérification de révocation peut provoquer des appels supplémentaires à Firebase.

Mettre en place une stratégie de cache sécurisé des résultats d'authentification lorsque cela est pertinent.

Exigences du cache :
- Cache mémoire borné et mutualisé par instance serveur.
- Clé basée sur une empreinte cryptographique du token, jamais sur le token brut.
- Expiration courte et jamais supérieure à l'expiration réelle du token.
- Protection contre l'utilisation d'un token expiré.
- Prise en compte du compromis entre cache et révocation des tokens.
- Ne jamais partager les résultats d'authentification entre utilisateurs.
- Ne pas conserver indéfiniment les permissions ou les rôles.
- Éviter les vérifications répétées lorsqu'un même traitement les a déjà effectuées.

Ne désactive pas arbitrairement la vérification de sécurité des tokens pour gagner en performance.

## 1.5. Optimisation du Rate Limiter et de Redis

Le handler instancie actuellement un nouveau `RateLimiter` et potentiellement un nouveau `RedisStore` à chaque requête.

Optimiser ce mécanisme.

Objectifs :
- Mutualiser les instances lorsque l'environnement serveur le permet.
- Réutiliser le client Upstash Redis.
- Éviter les initialisations répétées.
- Réduire les opérations réseau inutiles.
- Préserver le caractère atomique des compteurs.
- Conserver les limites spécifiques des endpoints.
- Éviter les collisions entre clés de rate limiting.
- Garantir un comportement correct sur Vercel et dans les environnements serverless.

Ne remplace pas Redis par un simple cache mémoire global en production : les instances serverless peuvent être indépendantes.

Ne désactive pas le rate limiting pour obtenir artificiellement de meilleurs résultats.

## 1.6. Ajouter un véritable système de cache API

C'est une priorité de cette optimisation.

Je souhaite un système de cache léger, réutilisable et adapté aux différentes catégories d'API.

Distinguer :

1. Cache des données publiques :
   - Liste des lutteurs.
   - Régions.
   - Compétitions.
   - Éditions.
   - Données de référence peu modifiées.

2. Cache des données dynamiques :
   - Matchs en cours.
   - Scores.
   - Chronomètres.
   - Informations temps réel.

3. Données privées :
   - Profil utilisateur.
   - Données nécessitant une authentification.
   - Informations dépendant des permissions.

Règles :
- Privilégier le cache des données publiques réellement réutilisables.
- Utiliser des clés intégrant les paramètres pertinents de la requête.
- Éviter les collisions entre utilisateurs et entre filtres.
- Mettre en place des TTL raisonnables.
- Prévoir l'invalidation après création, modification et suppression.
- Réutiliser les mécanismes de cache Next.js déjà présents dans le projet lorsqu'ils sont adaptés.
- Ne jamais mettre des réponses privées ou personnalisées dans un cache public partagé.
- Ne pas mettre en cache les données temps réel des combats d'une manière qui pourrait afficher des informations périmées.
- Ne pas ajouter inutilement une nouvelle dépendance.

## 1.7. Alléger le traitement centralisé

Le handler doit être aussi léger que possible.

Examiner :
- Les imports et initialisations inutiles.
- Les imports dynamiques exécutés inutilement.
- Les vérifications répétées.
- Les accès réseau séquentiels qui pourraient être évités.
- Les opérations Redis.
- Les traitements exécutés même lorsque l'API n'en a pas besoin.
- La reconstruction inutile des réponses HTTP.

Conserver :
- La gestion CORS.
- La validation des méthodes.
- X-App-Id pour les routes concernées.
- Le rate limiting.
- L'authentification conditionnelle.
- Les permissions.
- Les réponses d'erreur standardisées.
- Les headers de sécurité.

Ne fais pas exécuter toutes les vérifications sur les API publiques lorsqu'elles ne sont pas nécessaires.

## 1.8. Mesure des performances

Ajouter temporairement des mesures de durée pour les différentes étapes :

- CORS et validation.
- X-App-Id.
- Rate limiting.
- Authentification.
- Permissions.
- Handler métier.
- Temps total.

Les mesures doivent être disponibles dans les logs serveur, sans exposer de token, de données personnelles ou de secrets.

Tester au minimum :
- API mobile publique.
- API mobile authentifiée.
- API web publique.
- API web authentifiée.
- API avec permissions.
- API sans authentification.

Comparer les temps avant et après optimisation.

Ne prétends pas avoir obtenu un gain de performance sans mesures réelles.

---

# LOT 2 — GESTION DES MATCHS ET DES PHASES ÉLIMINATOIRES

## 2.1. Page d'organisation des matchs

Fichier principal :

`app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx`

Composants :
- `elimination-match-creator.tsx`
- `elimination-bulk-match-creator.tsx`

Action serveur :

`actions/matches.ts` → `createEliminationMatch()`

### A. Autoriser la création d'un match avec un seul lutteur

Actuellement, le système exige deux lutteurs.

Supprimer cette restriction de manière cohérente dans :
- Les composants de création simple.
- Les composants de création multiple.
- Les validations frontend.
- L'action serveur.
- Les types et les payloads concernés.

Autoriser :
- Un match avec deux lutteurs différents.
- Un match avec uniquement un premier lutteur.
- Un match avec uniquement un deuxième lutteur.

Interdire :
- Un match sans aucun lutteur.
- Un même lutteur sélectionné des deux côtés.

Attention : ne transforme pas automatiquement un match à un seul lutteur en victoire officielle. Conserver un fonctionnement cohérent avec le cycle de vie des matchs et permettre à l'administrateur de valider le résultat selon les règles existantes.

### B. Ajouter une création exceptionnelle de match

Le système actuel exclut les lutteurs déjà engagés dans un match et les lutteurs éliminés.

Ce comportement est souhaitable pour les éliminatoires classiques.

Cependant, il empêche la création des matchs de classement pour la troisième place.

Je souhaite conserver le fonctionnement normal et ajouter un bouton :

**« Ajouter un match exceptionnel »**

Ce bouton doit permettre de sélectionner des lutteurs déjà éliminés ou ayant déjà participé à un combat dans le groupe.

Comportement attendu :
- Le mode normal conserve les restrictions actuelles.
- Le mode exceptionnel permet de sélectionner les lutteurs précédemment engagés.
- Les validations serveur doivent reconnaître explicitement le caractère exceptionnel du match.
- Ne pas désactiver globalement les vérifications de participation.
- Éviter les doublons accidentels.
- Conserver les protections contre les associations incohérentes entre éditions et groupes.

Le mode exceptionnel doit notamment faciliter l'organisation de la petite finale.

Prévoir une identification explicite du type de match afin de distinguer les combats ordinaires, les finales et les matchs de troisième place.

## 2.2. Ajouter le choix de l'arbitre pendant la création

Dans les deux composants :
- `elimination-match-creator.tsx`
- `elimination-bulk-match-creator.tsx`

Ajouter un sélecteur d'arbitre, similaire au sélecteur de période existant.

Réutiliser :
- `actions/referees.ts`
- Les types `Referee` existants.
- Les composants Select déjà utilisés dans le projet.

Le sélecteur doit proposer les arbitres actifs et afficher leurs noms de manière claire.

Dans la création multiple, chaque ligne de match doit pouvoir avoir son propre arbitre.

L'arbitre doit être facultatif si les règles actuelles permettent de créer un match sans arbitre.

## 2.2. Gestion des arbitres au niveau des sous-groupes

**IMPORTANT : NE PAS MODIFIER L'ARCHITECTURE ACTUELLE DE L'AFFECTATION DES ARBITRES.**

Dans Kokowa TV, l'arbitre est affecté au niveau du sous-groupe (`sub_groups.main_referee_id`), et non individuellement à chaque match.

Cette architecture correspond à la réalité de l'organisation de la lutte traditionnelle au Niger.

Un sous-groupe représente une rencontre entre deux régions ou deux entités. Plusieurs lutteurs peuvent s'affronter au cours de cette rencontre, mais ils sont généralement encadrés par le même arbitre.

Exemple :

Tahoua vs Niamey :
- Match 1 : Lutteur A vs Lutteur B.
- Match 2 : Lutteur C vs Lutteur D.
- Match 3 : Lutteur E vs Lutteur F.

Les trois matchs appartiennent au même sous-groupe et utilisent son arbitre principal.

### A. Conserver le modèle de données existant

- Conserver `sub_groups.main_referee_id`.
- Ne pas ajouter `referee_id` dans la table `matches`.
- Ne créer aucune migration visant à déplacer l'affectation de l'arbitre.
- Ne pas dupliquer inutilement les relations entre arbitres et matchs.
- Conserver les relations et fonctions existantes.

Cette architecture doit rester compatible avec les deux modèles de compétition :
1. Ancien modèle : compétitions inter-régions avec groupes et sous-groupes.
2. Nouveau modèle : phases éliminatoires où les régions peuvent avoir moins d'importance.

Il ne faut pas modifier la structure hiérarchique existante pour adapter artificiellement le nouveau modèle.

### B. Sélection de l'arbitre pendant l'organisation

Dans la page :

`app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx`

Ajouter un sélecteur d'arbitre au niveau de chaque sous-groupe, similaire au sélecteur de période.

Réutiliser :
- `actions/referees.ts`.
- Les types existants.
- Les composants Select existants.

L'administrateur doit pouvoir affecter ou modifier l'arbitre principal de chaque sous-groupe.

Dans la création des matchs, l'interface doit afficher clairement l'arbitre déjà affecté au sous-groupe concerné.

Ne pas demander un arbitre différent pour chaque match.

### C. Gestion de l'arbitre dans la page individuelle d'un match

Page :

`app/(admins)/ad/matches/[matchId]/page.tsx`

Ajouter une fonctionnalité permettant de consulter et de modifier l'arbitre responsable du match.

ATTENTION : cette modification doit agir sur l'arbitre principal du sous-groupe auquel appartient le match.

Comportement attendu :
- Récupérer le sous-groupe du match.
- Récupérer son `main_referee_id`.
- Afficher l'arbitre actuellement affecté.
- Permettre de sélectionner un autre arbitre.
- Enregistrer la modification dans `sub_groups.main_referee_id`.
- Actualiser les informations de tous les matchs du sous-groupe concernés.

Afficher une indication claire précisant que la modification de l'arbitre concerne l'ensemble de la rencontre et donc tous les matchs du sous-groupe.

Ne pas modifier la relation de manière isolée pour un seul match.

### D. Cohérence des données

Vérifier que :
- Chaque match conserve sa relation avec son sous-groupe.
- L'arbitre affiché provient du sous-groupe.
- Les API mobiles exposant les informations des matchs continuent de retourner le bon arbitre.
- Les anciens matchs restent compatibles.
- Les changements d'arbitre sont correctement synchronisés dans l'application.

**Aucune migration de la table `matches` n'est nécessaire pour cette fonctionnalité.**
---

# LOT 3 — AUTOMATISATION DES PALMARÈS

## 3.1. Objectif métier

Je souhaite que Kokowa TV puisse attribuer automatiquement des palmarès aux lutteurs et aux régions après les matchs officiels de classement.

Trois positions doivent être gérées :

- 1ère place.
- 2ème place.
- 3ème place.

Correspondance :

| Type de match | Résultat | Position |
|---|---|---|
| Finale | Vainqueur | 1st |
| Finale | Perdant | 2nd |
| Match de troisième place | Vainqueur | 3rd |

Les mêmes distinctions doivent être attribuées aux régions respectives.

## 3.2. Palmarès des lutteurs

Réutiliser la table existante :

`fighter_achievements`

Elle contient déjà les champs nécessaires, notamment :
- fighter_id
- region_id
- edition_id
- year
- position
- type
- title
- description

Réutiliser les valeurs existantes :
- `1st`
- `2nd`
- `3rd`

Ne pas créer un second système de palmarès individuels.

Les titres et descriptions doivent être générés de manière cohérente avec les conventions déjà présentes dans `lib/achievements.ts`.

## 3.3. Palmarès des régions

Le schéma SQL fourni ne comporte pas de table indépendante `region_achievements`.

Prévoir une migration SQL pour créer une structure dédiée aux palmarès des régions.

Elle devra au minimum permettre de stocker :
- Identifiant du palmarès.
- Identifiant de la région.
- Identifiant de l'édition.
- Année.
- Position.
- Type de distinction.
- Titre.
- Description.
- Match source.
- Date de création.

Prévoir les relations SQL et les contraintes d'intégrité adaptées.

Ne détourne pas `team_achievements` pour enregistrer les distinctions des régions.

## 3.4. Déclenchement automatique

Identifier précisément les actions serveur qui enregistrent les résultats officiels des matchs.

Centraliser l'attribution des palmarès dans une fonction métier réutilisable.

Déclencher les attributions uniquement lorsque :
- Le match est officiellement terminé.
- Le vainqueur est connu.
- Le type du match est identifié comme finale ou troisième place.
- Les participants et leur édition sont cohérents.

Ne pas attribuer de palmarès sur un match ordinaire.

Ne pas attribuer une première ou deuxième place simplement parce qu'un match se trouve en dernière position dans la liste.

Le type du match doit être une information explicite et fiable.

## 3.5. Fiabilité et idempotence

Cette fonctionnalité est particulièrement importante.

Éviter :
- Les palmarès dupliqués.
- Les attributions multiples lors des synchronisations temps réel.
- Les attributions sur des matchs annulés.
- Les attributions à un mauvais lutteur ou à une mauvaise région.
- Les incohérences après modification du vainqueur.

Prévoir des contraintes d'unicité appropriées et une logique d'upsert ou de réconciliation.

Utiliser une transaction SQL lorsque cela est possible pour garantir la cohérence entre l'enregistrement du résultat et l'attribution des palmarès.

Si le résultat d'une finale ou d'un match de troisième place est corrigé, les distinctions associées doivent pouvoir être réconciliées sans conserver les anciens résultats incorrects.

La synchronisation Firebase Realtime Database ne doit pas provoquer une seconde attribution.

---

# LOT 4 — MIGRATIONS, COMPATIBILITÉ ET TESTS

Toutes les évolutions de structure doivent passer par des migrations SQL versionnées.

Ne pas modifier directement la base de production sans migration.

Préserver :
- Les données historiques.
- Les anciens matchs.
- Les affectations générales des arbitres.
- Les palmarès existants.
- Les API mobiles actuellement consommées par Flutter.
- Les contrats de réponse existants, sauf évolution nécessaire et compatible.

Tester les cas suivants :

### API
- App ID absent.
- App ID non autorisé.
- App ID autorisé.
- Bearer absent.
- Bearer invalide.
- Bearer expiré.
- Utilisateur sans permission.
- Utilisateur autorisé.
- Appel public.
- Appel répété avec cache.
- Expiration et invalidation du cache.

### Matchs
- Match classique avec deux lutteurs.
- Match avec un seul lutteur.
- Match avec deux lutteurs déjà engagés en mode exceptionnel.
- Match de troisième place.
- Sélection d'un arbitre.
- Modification de l'arbitre.
- Création multiple avec des arbitres différents.
- Match sans arbitre.
- Tentative de création d'un match incohérent.

### Palmarès
- Finale remportée.
- Finale perdue.
- Troisième place remportée.
- Match ordinaire terminé.
- Match annulé.
- Double déclenchement.
- Correction du vainqueur.
- Vérification des palmarès des lutteurs et des régions.

---

# CONSIGNES D'EXÉCUTION

1. Commencer par inspecter les fichiers réellement utilisés et les dépendances entre les routes, handlers, actions, services et composants.
2. Identifier les points d'entrée réels avant toute modification.
3. Éviter de dupliquer les fonctions métier.
4. Ne pas créer une nouvelle architecture parallèle.
5. Ne pas remplacer des bibliothèques existantes sans justification.
6. Préserver les conventions et la structure actuelles du projet.
7. Effectuer les modifications par lots logiques.
8. Exécuter les migrations, vérifications TypeScript, lint et tests pertinents.
9. Corriger les régressions introduites.
10. Ne pas masquer les erreurs avec des `try/catch` qui retournent artificiellement des succès.
11. Ne pas déclarer une fonctionnalité terminée sans avoir vérifié son fonctionnement.

**ORDRE OBLIGATOIRE :**

- Phase 1 : audit ciblé et instrumentation des API.
- Phase 2 : suppression App Check et correction de X-App-Id.
- Phase 3 : optimisation Auth, Redis, Rate Limiter et cache.
- Phase 4 : tests et validation des performances API.
- Phase 5 : matchs à un seul lutteur et création exceptionnelle.
- Phase 6 : affectation individuelle des arbitres.
- Phase 7 : automatisation des palmarès.
- Phase 8 : migrations, tests de régression et rapport final.

À la fin, fournir un rapport concis indiquant :
- Les fichiers modifiés.
- Les migrations créées.
- Les problèmes corrigés.
- Les mesures de performance avant/après.
- Les tests réellement exécutés.
- Les éventuels problèmes restants.

**PRIORITÉ ABSOLUE :** préserver la stabilité de Kokowa TV et ses fonctionnalités existantes. Toute modification doit être ciblée, cohérente et vérifiable.