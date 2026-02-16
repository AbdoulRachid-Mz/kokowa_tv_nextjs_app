// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-state.tsx
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MatchState {
  // État local
  time: number;
  breakCount: number;
  isRunning: boolean;
  status: string;
  audienceCount: number;
  fighter1Cards: number;
  fighter2Cards: number;
  
  // État de synchronisation
  lastSyncTime: number;
  isDirty: boolean;
  
  // Actions
  setTime: (time: number) => void;
  setBreakCount: (count: number) => void;
  setIsRunning: (running: boolean) => void;
  setStatus: (status: string) => void;
  setAudienceCount: (count: number) => void;
  setFighter1Cards: (count: number) => void;
  setFighter2Cards: (count: number) => void;
  incrementFighter1Cards: () => void;
  incrementFighter2Cards: () => void;
  
  initialize: (data: Partial<MatchState>) => void;
  sync: (data: Partial<MatchState>) => void;
  reset: () => void;
  markSynced: () => void;
}

export const useMatchState = create<MatchState>()(
  persist(
    (set) => ({
      time: 0,
      breakCount: 0,
      isRunning: false,
      status: 'scheduled',
      audienceCount: 0,
      fighter1Cards: 0,
      fighter2Cards: 0,
      lastSyncTime: Date.now(),
      isDirty: false,
      
      setTime: (time) => set({ time, isDirty: true }),
      setBreakCount: (count) => set({ breakCount: count, isDirty: true }),
      setIsRunning: (isRunning) => set({ isRunning, isDirty: true }),
      setStatus: (status) => set({ status, isDirty: true }),
      setAudienceCount: (audienceCount) => set({ audienceCount, isDirty: true }),
      setFighter1Cards: (fighter1Cards) => set({ fighter1Cards }),
      setFighter2Cards: (fighter2Cards) => set({ fighter2Cards }),
      incrementFighter1Cards: () => set((state) => ({ 
        fighter1Cards: state.fighter1Cards + 1 
      })),
      incrementFighter2Cards: () => set((state) => ({ 
        fighter2Cards: state.fighter2Cards + 1 
      })),
      
      initialize: (data) => set((state) => ({
        ...state,
        time: data.time ?? state.time,
        breakCount: data.breakCount ?? state.breakCount,
        isRunning: data.isRunning ?? state.isRunning,
        status: data.status ?? state.status,
        audienceCount: data.audienceCount ?? state.audienceCount,
        lastSyncTime: Date.now(),
        isDirty: false
      })),
      
      sync: (data) => set((state) => {
        // Ne synchroniser que si les données sont plus récentes
        if (data.lastSyncTime && data.lastSyncTime > state.lastSyncTime) {
          return {
            ...state,
            time: data.time ?? state.time,
            breakCount: data.breakCount ?? state.breakCount,
            isRunning: data.isRunning ?? state.isRunning,
            status: data.status ?? state.status,
            audienceCount: data.audienceCount ?? state.audienceCount,
            lastSyncTime: data.lastSyncTime,
            isDirty: false
          };
        }
        return state;
      }),
      
      markSynced: () => set({ 
        lastSyncTime: Date.now(), 
        isDirty: false 
      }),
      
      reset: () => set({
        time: 0,
        breakCount: 0,
        isRunning: false,
        status: 'scheduled',
        audienceCount: 0,
        fighter1Cards: 0,
        fighter2Cards: 0,
        lastSyncTime: Date.now(),
        isDirty: false
      })
    }),
    {
      name: 'match-storage',
      partialize: (state) => ({
        time: state.time,
        breakCount: state.breakCount,
        audienceCount: state.audienceCount
      })
    }
  )
);