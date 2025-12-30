// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-state.tsx
"use client";

import { create } from 'zustand';

export interface MatchState {
  time: number;
  breakCount: number;
  isRunning: boolean;
  status: string;
  audienceCount: number;
  
  // Actions
  setTime: (time: number) => void;
  setBreakCount: (count: number) => void;
  setIsRunning: (running: boolean) => void;
  setStatus: (status: string) => void;
  setAudienceCount: (count: number) => void;
  initialize: (data: Partial<MatchState>) => void;
  reset: () => void;
}

export const useMatchState = create<MatchState>((set) => ({
  time: 0,
  breakCount: 0,
  isRunning: false,
  status: 'scheduled',
  audienceCount: 0,
  
  setTime: (time) => set({ time }),
  setBreakCount: (count) => set({ breakCount: count }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setStatus: (status) => set({ status }),
  setAudienceCount: (audienceCount) => set({ audienceCount }),
  
  initialize: (data) => set((state) => ({
    ...state,
    time: data.time ?? state.time,
    breakCount: data.breakCount ?? state.breakCount,
    isRunning: data.isRunning ?? state.isRunning,
    status: data.status ?? state.status,
    audienceCount: data.audienceCount ?? state.audienceCount
  })),
  
  reset: () => set({
    time: 0,
    breakCount: 0,
    isRunning: false,
    status: 'scheduled',
    audienceCount: 0
  })
}));