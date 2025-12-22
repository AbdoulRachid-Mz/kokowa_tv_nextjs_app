// hooks/use-app-settings.ts
'use client';

import { useAppSettings } from '@/contexts/app-settings-context';

export function useAppSettingsHook() {
  const { 
    settings, 
    loading, 
    getSetting,
    isMaintenanceMode,
    isRegistrationEnabled 
  } = useAppSettings();

  return {
    settings,
    loading,
    isMaintenanceMode,
    isRegistrationEnabled,
    appName: getSetting('app_name', 'Lutte Traditionnelle'),
    appDescription: getSetting('app_description', 'Plateforme de gestion des compétitions de lutte traditionnelle'),
    appVersion: getSetting('app_version', '1.0.0'),
    contactEmail: getSetting('contact_email', 'contact@lutte-traditionnelle.com'),
    socialLinks: getSetting('social_links', {}),
    defaultLanguage: getSetting('default_language', 'fr'),
    supportedLanguages: getSetting('supported_languages', ['fr', 'ha', 'en']),
    matchDuration: getSetting('match_duration', 300),
    maxBreaksPerMatch: getSetting('max_breaks_per_match', 3),
    getSetting,
  };
}