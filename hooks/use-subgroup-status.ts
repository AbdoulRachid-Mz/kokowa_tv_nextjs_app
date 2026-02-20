// hooks/use-subgroup-status.ts
'use client';

import { useEffect } from 'react';
import { Match } from '@/types';

interface UseSubgroupStatusProps {
  matches: Match[];
  subgroupId: number;
  onStatusChange?: (status: 'upcoming' | 'ongoing' | 'completed') => void;
  onFirstMatchStart?: () => void;
  onAllMatchesComplete?: () => void;
}

export function useSubgroupStatus({
  matches,
  subgroupId,
  onStatusChange,
  onFirstMatchStart,
  onAllMatchesComplete
}: UseSubgroupStatusProps) {
  useEffect(() => {
    if (!matches.length) return;

    // Vérifier si c'est le dernier match
    const allMatchesCompleted = matches.every(m => m.status === 'completed');
    
    // Vérifier si c'est le premier match qui commence
    const hasLiveMatch = matches.some(m => m.status === 'live' || m.status === 'round_break');
    const hasCompletedMatch = matches.some(m => m.status === 'completed');
    
    let newStatus: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
    
    if (allMatchesCompleted) {
      newStatus = 'completed';
      onAllMatchesComplete?.();
    } else if (hasLiveMatch) {
      newStatus = 'ongoing';
      onFirstMatchStart?.();
    }
    
    onStatusChange?.(newStatus);
    
  }, [matches, subgroupId, onStatusChange, onFirstMatchStart, onAllMatchesComplete]);
}