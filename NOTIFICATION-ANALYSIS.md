# Analyse : notifications push (client vs serveur)

## 1. Architecture actuelle (côté serveur)

Le déclenchement des notifications push a été déplacé du client vers le serveur :

- **Avant (côté client)** : dans `hooks/use-match-controller.ts`, `startMatch()` appelait
  `sendMatchPush(matchId, ...)` immédiatement après `persist({...})`, sans l'attendre.
  Le push partait donc en parallèle de la mise à jour DB, dès le clic.
- **Maintenant (côté serveur)** : `lib/services/match-update.service.ts` (`updateMatchAndRecompute`)
  déclenche `sendMatchPush(...)` dans des tâches post-commit (fire-and-forget),
  après `COMMIT` PostgreSQL et en parallèle des syncs RTDB.

## 2. Pourquoi le déplacement

1. **Cohérence d'état** : côté client, le push pouvait partir alors que la transaction DB
   échouait ou n'était pas encore commitée → notification "match démarré" alors que la DB
   disait encore "scheduled". Côté serveur, le push ne part qu'après un COMMIT réussi.
2. **Source de vérité unique** : le statut effectif est celui de PostgreSQL ; seul le serveur
   connaît le statut réellement persisté (y compris les transitions déclenchées par
   `ensureUniqueLiveStates` qui arrête les autres matchs live).
3. **Sécurité** : un client malveillant pouvait appeler `sendMatchPush` directement
   (Server Action publique) sans qu'aucun match ne change d'état. Côté serveur, le push est
   lié à une transition de statut validée.
4. **Anti-spam / déduplication** : côté serveur, on peut déduire start vs reprise
   (statut précédent `round_break`/`reclamation`) ; côté client, cette info n'est pas fiable.

## 3. Mesures de latence (logs de production/dev)

| Étape | Durée observée |
|---|---|
| `updateMatch` (DB commit) | 559 ms – 6 320 ms (selon charge/locks) |
| `sendMatchPush` (FCM send) | 1 048 ms – 1 510 ms (credentials valides) |
| Sync RTDB post-commit | 200 ms – 700 ms |
| Livraison FCM au mobile | ~1 s – 2 s (réseau) |

- **Approche serveur actuelle** : clic → DB commit (~0.5 s) → push send (~1 s) → livraison FCM (~1-2 s)
  ≈ **2.5 – 4.5 s** de clic à réception mobile.
- **Approche client (ancienne)** : clic → push send immédiat (~1 s) → livraison FCM (~1-2 s)
  ≈ **1 – 3 s** de clic à réception mobile.

→ Gain potentiel côté client : **~1 à 1.5 s**.

## 4. Goulots d'étranglement

1. **FCM `admin.messaging().send()`** : ~1 s à 1.5 s (réseau Google). Incompressible des deux côtés.
2. **DB commit** : ~0.5 s en nominal, jusqu'à plusieurs secondes sous contention de verrous.
3. **RTDB sync** : ~0.2-0.7 s, mais le push actuel ne l'attend pas (fire-and-forget), donc non bloquant pour le push.
4. **Côté client historique** : le push partait *avant* le commit, masquant les échecs DB.

## 5. Comparaison

| Critère | Client (ancien) | Serveur (actuel) |
|---|---|---|
| Latence clic→réception | ~1-3 s (plus rapide) | ~2.5-4.5 s |
| Cohérence état DB/notif | Risque (notif avant commit) | Garantie (post-commit) |
| Sécurité | Faible (action publique) | Forte (lié au COMMIT) |
| Déduplication start/reprise | Non fiable | Fiable (statut précédent connu) |
| Spam si multi-admin | Possible | Évité (transition unique) |
| Complexité | Simple (onClick) | Modérée (post-commit tasks) |

## 6. Recommandation

**Garder l'approche serveur** (cohérence + sécurité), mais optimiser la latence :

1. Le push est déjà fire-and-forget (`Promise.allSettled` des tâches post-commit, et
   `sendMatchPush(...).catch(() => {})`), donc le temps de réponse HTTP n'attend pas FCM.
   → Aucun changement de contrat API nécessaire.
2. **Déplacer le push plus tôt** : lancer `sendMatchPush` immédiatement après `COMMIT`,
   en parallèle (et non après) des syncs RTDB, car il n'en dépend pas. Gain estimé : 0.
   (déjà le cas dans l'implémentation actuelle : les tâches sont poussées dans
   `postCommitTasks` puis `Promise.allSettled`.)
3. **Réduire le temps DB** : les verrous `pg_advisory_xact_lock` et `FOR UPDATE NOWAIT`
   sont déjà en place ; surveiller les requêtes lentes (`SELECT fighter_cards` ~545 ms)
   via les index et le pooler.
4. **Ne pas revenir au client** : le gain de ~1 s ne justifie pas la perte de cohérence
   ni le risque de sécurité. Si la latence est critique, préférer une notification
   "optimiste" côté client *en plus* du push serveur confirmé, avec déduplication par
   `matchId + status`.

## 7. Conclusion

Le déplacement côté serveur est justifié par la cohérence et la sécurité. Le coût en
latence (~1-1.5 s) est acceptable et peut être réduit par l'optimisation DB et la
parallélisation déjà en place. Un retour au client n'est pas recommandé.
