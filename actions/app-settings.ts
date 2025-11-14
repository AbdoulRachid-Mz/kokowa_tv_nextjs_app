// lib/actions/app-settings.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { appSettingSchema, appSettingUpdateSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { AppSetting, AppSettingFilters, PaginatedResponse, AppSettings } from '@/types';

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
      limit = 100, // Plus de limite par défaut pour les settings
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtres de base
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

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM app_settings
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(500, limit)); // Limite plus haute pour les settings
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Requête principale
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

    // Convertir les valeurs selon leur type
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
    
    // Convertir la valeur selon son type
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
    
    // Convertir les valeurs selon leur type
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
    
    // Convertir les valeurs selon leur type
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
  try {
    const sql = 'SELECT * FROM app_settings ORDER BY category, setting_key';
    const result = await query<AppSetting>(sql);
    
    // Convertir en objet typé
    const settings: Partial<AppSettings> = {};
    
    result.forEach(setting => {
      const key = setting.setting_key as keyof AppSettings;
      settings[key] = parseSettingValue(setting.setting_value, setting.setting_type);
    });
    
    return settings as AppSettings;
  } catch (error) {
    console.error('Error in getAllAppSettings:', error);
    throw new Error('Erreur lors de la récupération de tous les paramètres');
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

// Fonctions utilitaires pour les valeurs
function parseSettingValue(value: string, type: string): any {
  try {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        return JSON.parse(value);
      case 'array':
        return JSON.parse(value);
      default:
        return value;
    }
  } catch (error) {
    console.error('Error parsing setting value:', error);
    return value;
  }
}

function stringifySettingValue(value: any, type: string): string {
  try {
    switch (type) {
      case 'number':
      case 'boolean':
        return String(value);
      case 'json':
      case 'array':
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
    return setting.setting_value as { [key: string]: string };
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