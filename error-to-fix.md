Contexte Actuel
Tu as implémenté une architecture WebSocket robuste avec :

Serveur WebSocket personnalisé sur Next.js (server.ts)

Gestionnaire de connexions avec support Redis pub/sub (ws-connection-manager.ts)

Client WebSocket avec reconnexion automatique (realtime-client.ts)

Hook React useRealtime pour la gestion des abonnements

Server Actions pour l'émission d'événements (realtime.ts)

Problème identifié : La connexion WebSocket s'établit correctement ("Temps réel actif" s'affiche), mais les composants ne réagissent pas aux mises à jour lorsqu'une action est effectuée (lancement d'un match, ajout de carton, etc.).

Objectif
Refactoriser l'intégration WebSocket pour garantir que tous les composants (web et mobile) réagissent instantanément aux changements d'état des matchs, sous-groupes, et autres entités.

Tâches à accomplir
1. Correction des Server Actions (Backend)
Fichiers concernés :

@/actions/matches-2.ts

@/actions/sub-groups.ts

@/actions/editions.ts

@/actions/fighters.ts

À faire : Ajouter les appels aux fonctions d'émission WebSocket dans TOUTES les mutations.

typescript
// Exemple de pattern à suivre
import { emitMatchEvent, emitSubGroupEvent, emitEditionEvent, emitFighterEvent } from './realtime';

export async function updateMatch(matchId: number, updates: MatchUpdate) {
  try {
    // 1. Mise à jour DB
    const result = await db.update(...);
    
    // 2. 🔥 ÉMISSION WS (CRITICAL)
    await emitMatchEvent(matchId, 'match_updated', result, result.sub_group_id);
    
    // 3. Revalidation
    revalidatePath(`/ad/sub-groups/${result.sub_group_id}/matches/${matchId}`);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateSubGroup(subGroupId: number, data: FormData) {
  try {
    const result = await db.update(...);
    
    // 🔥 Émettre l'événement
    await emitSubGroupEvent(subGroupId, 'subgroup_updated', result);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
Actions à vérifier :

updateMatch - ajouter emitMatchEvent

addFighterCard - ajouter emitMatchEvent

completeSubGroup - ajouter emitSubGroupEvent

updateSubGroup - ajouter emitSubGroupEvent

Toute autre mutation affectant l'état d'un match ou sous-groupe

2. Correction de la gestion React Query (Frontend)
Fichier : app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx

Problème : Invalidation des query keys avec types incompatibles (String vs Number)

Solution : Modifier le onMessage du useRealtime

typescript
// AVANT (problématique)
onMessage: (msg) => {
  if (msg.type === 'update') {
    if (entityType === 'match' && entityId == parsedMatchId) {
      queryClient.invalidateQueries({ queryKey: ['match', parsedMatchId] });
    }
  }
}

// APRÈS (corrigé)
onMessage: (msg) => {
  if (msg.type === 'update') {
    const { entityType, entityId, event } = msg.data;
    console.log(`📨 Realtime event: ${event} for ${entityType}:${entityId}`);

    // ✅ Invalider TOUTES les requêtes du type concerné
    if (entityType === 'match') {
      queryClient.invalidateQueries({ queryKey: ['match'] });
      queryClient.refetchQueries({ queryKey: ['match', parsedMatchId] });
    }

    if (entityType === 'subGroup') {
      queryClient.invalidateQueries({ queryKey: ['sub-group'] });
      queryClient.refetchQueries({ queryKey: ['sub-group', parsedSubGroupId] });
    }

    if (entityType === 'fighter') {
      queryClient.invalidateQueries({ queryKey: ['fighter'] });
    }

    if (entityType === 'edition') {
      queryClient.invalidateQueries({ queryKey: ['edition'] });
    }
  }
}
3. Suppression des souscriptions redondantes
Fichier : app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx

Problème : Double souscription (dans onConnect et dans useEffect)

Solution : Garder UN SEUL mécanisme de souscription

typescript
// ❌ À SUPPRIMER dans useRealtime
const { ... } = useRealtime({
  autoConnect: true,
  onConnect: () => {
    // Supprimer les subscribe() d'ici
  },
  // ...
});

// ✅ GARDER SEULEMENT CE useEffect
useEffect(() => {
  if (!isConnected) return;

  console.log('🔄 Subscribing to match and sub-group...');
  
  if (!isNaN(parsedMatchId)) {
    subscribeToMatch(parsedMatchId);
  }
  if (!isNaN(parsedSubGroupId)) {
    subscribe('subGroup', parsedSubGroupId);
  }

  if (user?.userDocument?.id) {
    auth(user.userDocument.id.toString(), user.userDocument.fcm_token || 'dummy_token');
  }

  return () => {
    if (!isNaN(parsedMatchId)) {
      unsubscribe('match', parsedMatchId);
    }
    if (!isNaN(parsedSubGroupId)) {
      unsubscribe('subGroup', parsedSubGroupId);
    }
  };
}, [isConnected, parsedMatchId, parsedSubGroupId, subscribeToMatch, subscribe, unsubscribe, user, auth]);
4. Synchronisation du timer dans useMatchController
Fichier : hooks/use-match-controller.ts

Problème : Le timer local (useMatchTimer) n'est pas synchronisé avec les données du serveur

Solution : Ajouter un effet de synchronisation

typescript
// Dans useMatchController

// ✅ Ajouter un polling de secours
const [pollingInterval, setPollingInterval] = useState<number | false>(false);

const { data: match, isLoading, refetch } = useQuery({
  queryKey: ['match', matchId],
  queryFn: () => getMatchById(matchId),
  enabled: !!matchId,
  refetchInterval: pollingInterval,
  refetchOnWindowFocus: true,
  staleTime: 0, // Toujours stale pour les matchs live
});

// Activer le polling seulement quand le match est en cours
useEffect(() => {
  if (match?.status === 'live' || match?.status === 'round_break') {
    setPollingInterval(2000);
  } else {
    setPollingInterval(false);
  }
}, [match?.status]);

// ✅ Synchroniser le timer avec les données serveur
useEffect(() => {
  if (!match) return;

  const durationInSeconds = parseDurationToSeconds(match.total_duration ?? "00:00:00");
  const currentDuration = timer.getDuration();
  const durationDiff = Math.abs(currentDuration - durationInSeconds);
  
  if (durationDiff > 2) {
    console.log(`🔄 Syncing timer: ${currentDuration}s -> ${durationInSeconds}s`);
    timer.setTime(durationInSeconds);
  }

  // Synchroniser le statut
  if (match.status === "live" && !timer.isRunning) {
    timer.start();
  } else if (match.status === "round_break" && timer.isRunning) {
    timer.pause();
  } else if (match.status === "completed") {
    timer.stop();
  } else if (match.status === "reclamation" && timer.isRunning) {
    timer.pause();
  }
}, [match?.total_duration, match?.status, timer]);
5. Amélioration des logs de debug
Fichiers :

hooks/use-realtime.ts

server/ws-connection-manager.ts

lib/realtime-client.ts

À faire : Ajouter des logs plus explicites

typescript
// Dans use-realtime.ts - onMessage
onMessage: (msg) => {
  console.log('📨 [WS] Message received:', JSON.stringify(msg, null, 2));
  
  if (msg.type === 'update') {
    console.log(`🔄 [WS] Update for ${msg.data.entityType}:${msg.data.entityId} - ${msg.data.event}`);
  }
  
  if (msg.type === 'auth_success') {
    console.log('🔐 [WS] Authentication successful');
  }
  
  if (msg.type === 'error') {
    console.error('❌ [WS] Error:', msg.data);
  }
  
  setLastMessage(msg);
  optionsRef.current.onMessage?.(msg);
},
typescript
// Dans ws-connection-manager.ts - broadcastToEntity
async broadcastToEntity(payload: RealtimeUpdatePayload) {
  const { entityType, entityId, event, data } = payload;
  
  console.log(`📡 [WS Server] Broadcasting to ${entityType}:${entityId} - ${event}`);
  
  const roomKey = this.getRoomKey(entityType, entityId);
  const clientsInRoom = this.rooms.get(roomKey);
  
  console.log(`  → Clients in room: ${clientsInRoom?.size || 0}`);
  
  // Broadcast local
  let localSent = 0;
  if (clientsInRoom) {
    for (const client of clientsInRoom) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: 'update', data: payload }));
        localSent++;
      }
    }
    console.log(`  → Local broadcast: ${localSent} clients notified`);
  }
  
  // Broadcast via Redis
  if (this.redisPublisher && this.redisSubscriber) {
    await this.redisPublisher.publish(`ws:${roomKey}`, JSON.stringify(payload));
    console.log(`  → Redis broadcast: published to ws:${roomKey}`);
  }
}
6. Composant de debug temporaire
Fichier : app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx

À ajouter : Un bouton de debug flottant

tsx
import { Bug } from 'lucide-react';

// Ajouter dans le return, en bas de la page
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 z-50">
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        console.log('🔍 [DEBUG] WebSocket State:');
        console.log('  isConnected:', isConnected);
        console.log('  match status:', match?.status);
        console.log('  match data:', match);
        console.log('  subGroup data:', subGroup);
        console.log('  query cache match:', queryClient.getQueryData(['match', parsedMatchId]));
        console.log('  query cache subGroup:', queryClient.getQueryData(['sub-group', parsedSubGroupId]));
        
        toast.info(`WS: ${isConnected ? '✅ Connecté' : '❌ Déconnecté'} | Match: ${match?.status}`);
      }}
    >
      <Bug className="h-4 w-4 mr-2" />
      Debug WS
    </Button>
  </div>
)}
7. Vérification des types WebSocket
Fichier : server/ws-types.ts

À vérifier : Les types sont cohérents entre client et serveur

typescript
// S'assurer que EntityType est défini
export type EntityType = 'edition' | 'subGroup' | 'match' | 'fighter' | 'region';

export interface RealtimeUpdatePayload {
  entityType: EntityType;
  entityId: number | string;
  event: string;
  data: any;
  timestamp: number;
}

export interface WSMessage {
  type: 'update' | 'auth' | 'auth_success' | 'auth_error' | 'subscribe' | 'unsubscribe' | 'subscribed' | 'unsubscribed' | 'error' | 'rate_limit_exceeded';
  data: any;
}
Ordre de priorité des corrections
CRITICAL : Ajouter les emitXxxEvent dans toutes les Server Actions

CRITICAL : Corriger l'invalidation des query keys

HIGH : Supprimer les doubles souscriptions

HIGH : Synchroniser le timer dans useMatchController

MEDIUM : Ajouter les logs de debug

LOW : Ajouter le composant de debug

Test de validation
Après la refactorisation, tu dois vérifier que :

✅ Quand tu cliques sur "Démarrer le match" :

Le timer se lance

Le statut devient "live"

Tous les clients connectés voient le changement

✅ Quand tu ajoutes un carton jaune :

Le compteur de carton s'affiche

L'événement apparaît dans les logs temps réel

✅ Quand tu termines un match :

Le vainqueur est affiché

Le sous-groupe met à jour ses scores

La navigation entre matchs fonctionne

✅ Les logs montrent :

📨 [WS] Message received quand un événement arrive

📡 [WS Server] Broadcasting quand un événement est émis

Les query keys sont correctement invalidées