// contexts/app-settings-context.tsx
"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { getAllAppSettings } from "@/actions/app-settings";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AppSettings {
  sub_group_default_period?: string;
  latest_app_version?: string;
  points_per_draw?: number;
  points_per_win?: number;
  is_under_maintenance?: boolean;
  is_update_required?: boolean;
  test_mode?: boolean;
  send_match_push?: boolean;
  app_update_url?: string;
  [key: string]: any;
}

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
  isMaintenanceMode: boolean;
  isRegistrationEnabled: boolean;
  getSetting: <T = any>(key: string, defaultValue?: T) => T;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined
);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAllAppSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
  };

  const getSetting = <T = any,>(key: string, defaultValue?: T): T => {
    if (!settings) return defaultValue as T;
    try {
      const value = (settings as Record<string, any>)[key];
      // ✅ Si la valeur est undefined, null, ou un objet vide, retourner defaultValue
      if (value === undefined || value === null) {
        return defaultValue as T;
      }
      // ✅ Pour les objets, vérifier s'ils sont vides
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        return defaultValue as T;
      }
      return value !== undefined ? value : defaultValue as T;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue as T;
    }
  };
  const value: AppSettingsContextType = {
    settings: settings || null,
    loading: isLoading,
    error: error as Error | null,
    refreshSettings,
    isMaintenanceMode: getSetting("maintenance_mode", false),
    isRegistrationEnabled: getSetting("registration_enabled", true),
    getSetting,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useAppSettings must be used within an AppSettingsProvider"
    );
  }
  return context;
};
