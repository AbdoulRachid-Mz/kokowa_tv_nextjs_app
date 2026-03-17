// components/LiveMatchTracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { Match } from '@/types';
import { useAuthContext } from '@/contexts/auth-context';

interface LiveMatchTrackerProps {
  matchId: number;
  editionId: number;
}

export function LiveMatchTracker({ matchId, editionId }: LiveMatchTrackerProps) {
  const { isConnected, subscribeToMatch, subscribeToEdition, lastMessage } = useRealtime();
  const [matchData, setMatchData] = useState<Match | null>(null);
  const { user, loading, isAdmin, signOut } = useAuthContext();

  useEffect(() => {
    if (isConnected) {
      subscribeToMatch(matchId);
      subscribeToEdition(editionId);
    }
  }, [isConnected, matchId, editionId, subscribeToMatch, subscribeToEdition]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'update') {
      const payload = lastMessage.data as import('@/server/ws-types').RealtimeUpdatePayload;
      if (payload.entityType === 'match' && payload.entityId === matchId) {
        switch (payload.event) {
          case 'match_updated':
          case 'match_status_changed':
          case 'match_live_update':
            setMatchData(payload.data.match);
            break;
          case 'new_message':
            // Update comments
            console.log('Nouveau message:', payload.data.message);
            break;
        }
      }
    }
  }, [lastMessage, matchId]);

  if (!isConnected) {
    return <div className="text-yellow-600">Connexion en cours...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      {user ? (
        <div className="">
          {user?.displayName + '' + user?.email}{' '}
          <button onClick={async () => await signOut()}>Deconnexion</button>
        </div>
      ) : (
        ''
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Match en direct</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm">{isConnected ? 'En direct' : 'Hors ligne'}</span>
        </div>
      </div>

      {matchData && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Statut:</span>
            <span className="font-medium">{matchData.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Score:</span>
            <span>{matchData.match_result || 'En cours'}</span>
          </div>
          {/* Autres informations du match */}
        </div>
      )}
    </div>
  );
}