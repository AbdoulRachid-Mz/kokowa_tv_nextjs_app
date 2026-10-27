// lib/actions/app-settings.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { appSettingSchema, appSettingUpdateSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { AppSetting, AppSettingFilters, PaginatedResponse, AppSettings } from '@/types';

// Cache mémoire serveur pour éliminer la latence sur les lectures répétitives
let cachedSettings: AppSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function invalidateAppSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

export async function getAppSettings(
  filters: AppSettingFilters = {}
): Promise<PaginatedResponse<AppSetting>> {
  try {
    const {
      category,
      is_public,
      is_editable,
      search = '',
      page = 1,
      limit = 100,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      whereClause += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (is_public !== undefined) {
      whereClause += ` AND is_public = $${params.length + 1}`;
      params.push(is_public);
    }

    if (is_editable !== undefined) {
      whereClause += ` AND is_editable = $${params.length + 1}`;
      params.push(is_editable);
    }

    if (search) {
      whereClause += ` AND (
        setting_key ILIKE $${params.length + 1} 
        OR description ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM app_settings
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(500, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    const dataSql = `
      SELECT *
      FROM app_settings
      ${whereClause}
      ORDER BY category, setting_key
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<AppSetting>(
      dataSql,
      [...params, validatedLimit, offset]
    );

    // Convertir les valeurs selon leur type avec gestion des erreurs
    const processedData = data.map(setting => ({
      ...setting,
      setting_value: parseSettingValue(setting.setting_value, setting.setting_type)
    }));

    return {
      data: processedData,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getAppSettings:', error);
    throw new Error('Erreur lors de la récupération des paramètres');
  }
}

export async function getAppSettingByKey(key: string) {
  try {
    const sql = 'SELECT * FROM app_settings WHERE setting_key = $1';
    const result = await queryOne<AppSetting>(sql, [key]);

    if (!result) {
      throw new Error('Paramètre non trouvé');
    }

    // Convertir la valeur selon son type avec gestion des erreurs
    return {
      ...result,
      setting_value: parseSettingValue(result.setting_value, result.setting_type)
    };
  } catch (error) {
    console.error('Error in getAppSettingByKey:', error);
    throw error;
  }
}

export async function getAppSettingsByCategory(category: string) {
  try {
    const sql = 'SELECT * FROM app_settings WHERE category = $1 ORDER BY setting_key';
    const result = await query<AppSetting>(sql, [category]);

    // Convertir les valeurs selon leur type avec gestion des erreurs
    return result.map(setting => ({
      ...setting,
      setting_value: parseSettingValue(setting.setting_value, setting.setting_type)
    }));
  } catch (error) {
    console.error('Error in getAppSettingsByCategory:', error);
    throw error;
  }
}

export async function getPublicAppSettings() {
  try {
    const sql = 'SELECT * FROM app_settings WHERE is_public = true ORDER BY category, setting_key';
    const result = await query<AppSetting>(sql);

    // Convertir les valeurs selon leur type avec gestion des erreurs
    return result.map(setting => ({
      ...setting,
      setting_value: parseSettingValue(setting.setting_value, setting.setting_type)
    }));
  } catch (error) {
    console.error('Error in getPublicAppSettings:', error);
    throw error;
  }
}


export async function getAllAppSettings(): Promise<AppSettings> {
  // Vérifier le cache mémoire serveur
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }
  try {
    const sql = 'SELECT * FROM app_settings ORDER BY category, setting_key';
    const result = await query<AppSetting>(sql);

    // Build a complete AppSettings object with safe fallbacks
    const settings: Partial<AppSettings> = {};

    result.forEach(setting => {
      const key = setting.setting_key as keyof AppSettings;
      try {
        // ✅ Vérifier que setting.setting_value existe et n'est pas null
        const rawValue = setting.setting_value ?? '';
        (settings as any)[key] = parseSettingValue(rawValue, setting.setting_type);
      } catch (error) {
        console.error(`Error parsing setting ${key}:`, error);
        // ✅ Valeurs par défaut selon le type déclaré dans AppSettings
        switch (setting.setting_type) {
          case 'json':
          case 'array':
            (settings as any)[key] = {};
            break;
          case 'number':
            (settings as any)[key] = 0;
            break;
          case 'boolean':
            (settings as any)[key] = false;
            break;
          default:
            (settings as any)[key] = '';
        }
      }
    });

    // ✅ S'assurer que toutes les clés de AppSettings existent avec des valeurs par défaut
    const defaultSettings: AppSettings = {
      app_name: 'Lutte Traditionnelle',
      app_description: 'Plateforme de gestion des compétitions de lutte traditionnelle',
      app_version: '1.0.0',
      maintenance_mode: false,
      registration_enabled: true,
      max_file_size: 10485760,
      allowed_file_types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      default_language: 'fr',
      supported_languages: ['fr', 'ha', 'en'],
      match_duration: 300,
      max_breaks_per_match: 3,
      ranking_points_win: 3,
      ranking_points_draw: 1,
      social_links: {},
      contact_email: '',
      analytics_tracking_id: '',
    };

    // ✅ Fusionner avec les valeurs par défaut
    const finalSettings = { ...defaultSettings, ...settings };
    cachedSettings = finalSettings;
    cacheTimestamp = Date.now();
    return finalSettings;
  } catch (error) {
    console.error('Error in getAllAppSettings:', error);
    // ✅ Retourner des valeurs par défaut en cas d'erreur grave
    return {
      app_name: 'Lutte Traditionnelle',
      app_description: 'Plateforme de gestion des compétitions de lutte traditionnelle',
      app_version: '1.0.0',
      maintenance_mode: false,
      registration_enabled: true,
      max_file_size: 10485760,
      allowed_file_types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      default_language: 'fr',
      supported_languages: ['fr', 'ha', 'en'],
      match_duration: 300,
      max_breaks_per_match: 3,
      ranking_points_win: 3,
      ranking_points_draw: 1,
      social_links: {},
      contact_email: '',
      analytics_tracking_id: '',
    };
  }
}

export async function createAppSetting(formData: FormData) {
  try {
    const rawData = {
      setting_key: formData.get('setting_key'),
      setting_value: formData.get('setting_value'),
      setting_type: formData.get('setting_type'),
      category: formData.get('category'),
      description: formData.get('description'),
      is_public: formData.get('is_public'),
      is_editable: formData.get('is_editable'),
    };

    const cleanedData = {
      setting_key: rawData.setting_key as string,
      setting_value: rawData.setting_value as string,
      setting_type: (rawData.setting_type as 'string' | 'number' | 'boolean' | 'json' | 'array') || 'string',
      category: rawData.category as string || 'general',
      description: rawData.description as string || undefined,
      is_public: rawData.is_public === 'true',
      is_editable: rawData.is_editable === 'true',
    };

    const validatedData = appSettingSchema.parse(cleanedData);

    const sql = `
      INSERT INTO app_settings (
        setting_key, setting_value, setting_type, category,
        description, is_public, is_editable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.setting_key,
      stringifySettingValue(validatedData.setting_value, validatedData.setting_type),
      validatedData.setting_type,
      validatedData.category,
      validatedData.description || null,
      validatedData.is_public,
      validatedData.is_editable,
    ]);

    await invalidateAppSettingsCache();
    revalidatePath('/admin/settings');
    return {
      success: true,
      id: result[0].id,
      message: 'Paramètre créé avec succès'
    };
  } catch (error) {
    console.error('Error in createAppSetting:', error);
    throw new Error('Erreur lors de la création du paramètre');
  }
}

export async function updateAppSetting(key: string, formData: FormData) {
  try {
    const existing = await getAppSettingByKey(key);
    if (!existing) {
      throw new Error('Paramètre non trouvé');
    }

    if (!existing.is_editable) {
      throw new Error('Ce paramètre n\'est pas modifiable');
    }

    const rawData = {
      setting_value: formData.get('setting_value'),
    };

    const cleanedData = {
      setting_value: rawData.setting_value as string,
    };

    const validatedData = appSettingUpdateSchema.parse(cleanedData);

    const sql = `
      UPDATE app_settings 
      SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = $2
    `;

    await query(sql, [
      stringifySettingValue(validatedData.setting_value ?? '', existing.setting_type),
      key,
    ]);

    await invalidateAppSettingsCache();
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return {
      success: true,
      message: 'Paramètre modifié avec succès'
    };
  } catch (error) {
    console.error('Error in updateAppSetting:', error);
    throw error;
  }
}

export async function deleteAppSetting(key: string) {
  try {
    const existing = await getAppSettingByKey(key);
    if (!existing) {
      throw new Error('Paramètre non trouvé');
    }

    if (!existing.is_editable) {
      throw new Error('Ce paramètre n\'est pas supprimable');
    }

    const sql = 'DELETE FROM app_settings WHERE setting_key = $1';
    await query(sql, [key]);

    await invalidateAppSettingsCache();
    revalidatePath('/admin/settings');
    return {
      success: true,
      message: 'Paramètre supprimé avec succès'
    };
  } catch (error) {
    console.error('Error in deleteAppSetting:', error);
    throw new Error('Erreur lors de la suppression du paramètre');
  }
}

// ✅ FONCTION UTILITAIRE CORRIGÉE - Gère les chaînes vides
function parseSettingValue(value: string, type: string): any {
  try {
    // Si la valeur est vide ou null
    if (value === null || value === undefined || value === '') {
      switch (type) {
        case 'json':
        case 'array':
          return {}; // Retourner un objet vide au lieu de throw
        case 'number':
          return 0;
        case 'boolean':
          return false;
        default:
          return '';
      }
    }

    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        // Tenter de parser, si échec retourner objet vide
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn(`Invalid JSON for setting, returning empty object: ${value}`);
          return {};
        }
      case 'array':
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn(`Invalid array for setting, returning empty array: ${value}`);
          return [];
        }
      default:
        return value;
    }
  } catch (error) {
    console.error('Error parsing setting value:', error);
    // Retourner une valeur par défaut sûre selon le type
    switch (type) {
      case 'json':
      case 'array':
        return {};
      case 'number':
        return 0;
      case 'boolean':
        return false;
      default:
        return value;
    }
  }
}

function stringifySettingValue(value: any, type: string): string {
  try {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'number':
      case 'boolean':
        return String(value);
      case 'json':
      case 'array':
        // Si c'est déjà une chaîne, la retourner
        if (typeof value === 'string') {
          // Vérifier si c'est du JSON valide
          try {
            JSON.parse(value);
            return value;
          } catch {
            // Ce n'est pas du JSON valide, on le transforme
            return JSON.stringify(value);
          }
        }
        return JSON.stringify(value);
      default:
        return String(value);
    }
  } catch (error) {
    console.error('Error stringifying setting value:', error);
    return String(value);
  }
}

// Fonctions spécifiques pour les settings courants
export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await getAppSettingByKey('maintenance_mode');
    return setting.setting_value as boolean;
  } catch (error) {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean) {
  const formData = new FormData();
  formData.append('setting_value', enabled.toString());
  return updateAppSetting('maintenance_mode', formData);
}

export async function getAppVersion(): Promise<string> {
  try {
    const setting = await getAppSettingByKey('app_version');
    return setting.setting_value as string;
  } catch (error) {
    return '1.0.0';
  }
}

export async function getSocialLinks() {
  try {
    const setting = await getAppSettingByKey('social_links');
    const value = setting.setting_value;
    // Si c'est un objet vide ou une chaîne vide, retourner objet vide
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
      return {};
    }
    return value as { [key: string]: string };
  } catch (error) {
    return {};
  }
}

export async function isRegistrationEnabled(): Promise<boolean> {
  try {
    const setting = await getAppSettingByKey('registration_enabled');
    return setting.setting_value as boolean;
  } catch (error) {
    return true;
  }
}