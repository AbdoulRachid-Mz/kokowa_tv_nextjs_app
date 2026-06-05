// components/shared/live-match-tracker.tsx
// Composant temps réel migré vers Firestore
'use client';

import { useRealtimeMatch } from '@/hooks/realtime/use-realtime-match';
import { RealtimeMatchDocument } from '@/types/realtime';
import { useAuthContext } from '@/contexts/auth-context';

interface LiveMatchTrackerProps {
  matchId: number;
  subGroupId: number;
}

export function LiveMatchTracker({ matchId, subGroupId }: LiveMatchTrackerProps) {
  const { data: realtimeMatch, isLoading: isListening } = useRealtimeMatch(
    null,
    subGroupId, matchId
  );
  const { user, signOut } = useAuthContext();

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
            className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
          />
          <span className="text-sm">{isListening ? 'Firestore Live' : 'Connexion...'}</span>
        </div>
      </div>

      {realtimeMatch && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Statut:</span>
            <span className="font-medium">{realtimeMatch.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Résultat:</span>
            <span>{realtimeMatch.matchResult || 'Non défini'}</span>
          </div>
        </div>
      )}
    </div>
  );
}