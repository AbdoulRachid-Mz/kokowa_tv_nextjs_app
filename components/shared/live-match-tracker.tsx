// components/LiveMatchTracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { Match } from '@/types';

interface LiveMatchTrackerProps {
  matchId: number;
  editionId: number;
}

export function LiveMatchTracker({ matchId, editionId }: LiveMatchTrackerProps) {
  const { isConnected, events, subscribeToMatch, subscribeToEdition } = useRealtime();
  const [matchData, setMatchData] = useState<Match | null>(null);
  console.log(matchData);


  useEffect(() => {
    if (isConnected) {
      subscribeToMatch(matchId);
      subscribeToEdition(editionId);
    }
  }, [isConnected, matchId, editionId, subscribeToMatch, subscribeToEdition]);

  useEffect(() => {
    // Traiter les événements en temps réel
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'match_updated':
      case 'match_status_changed':
      case 'match_live_update':
        setMatchData(lastEvent.data.match);
        break;
      case 'new_message':
        // Mettre à jour les commentaires
        console.log('Nouveau message:', lastEvent.data.message);
        break;
    }
  }, [events]);

  if (!isConnected) {
    return <div className="text-yellow-600">Connexion en cours...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Match en direct</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
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