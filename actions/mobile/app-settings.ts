"use server"

import { pool, query, queryOne } from '@/lib/db/neon-client';
import { AppSettings, AppSettingFilters, AppSetting } from '@/types';

// CRUD operations for app_settings
const ALLOWED_SETTING_FILTERS = new Set([
  "setting_key",
  "category",
  "is_public",
  "is_editable",
]);

export async function getAppSettings(filters?: AppSettingFilters): Promise<AppSetting[]> {
  // Liste blanche stricte des colonnes filtrables + requêtes paramétrées :
  // aucune interpolation de nom de colonne ni de valeur utilisateur.
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      if (!ALLOWED_SETTING_FILTERS.has(key)) continue;
      conditions.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }

  const where = conditions.length ? conditions.join(" AND ") : "1=1";
  const sql = `SELECT * FROM app_settings WHERE ${where} ORDER BY setting_key ASC`;
  return query<AppSetting>(sql, params);
}

export async function getAppSettingByKey(key: string): Promise<AppSetting | null> {
  const sql = `SELECT * FROM app_settings WHERE setting_key = $1 LIMIT 1`;
  return queryOne<AppSetting>(sql, [key]);
}

export async function createAppSetting(
  key: string,
  value: string,
  description?: string
): Promise<AppSetting> {
  const sql = `
    INSERT INTO app_settings (setting_key, setting_value, description)
    VALUES ($1, $2, $3)
    ON CONFLICT (setting_key) DO UPDATE
      SET setting_value = EXCLUDED.setting_value,
          description = EXCLUDED.description,
          updated_at = NOW()
    RETURNING *`;
  const result = await queryOne<AppSetting>(sql, [key, value, description || '']);
  if (!result) {
    throw new Error(`Failed to create or update app_setting with key: ${key}`);
  }
  return result;
}

export async function updateAppSetting(
  key: string,
  value: string,
  description?: string
): Promise<AppSetting | null> {
  const sql = `
    UPDATE app_settings
    SET setting_value = $2,
        description = COALESCE($3, description),
        updated_at = NOW()
    WHERE setting_key = $1
    RETURNING *`;
  return queryOne<AppSetting>(sql, [key, value, description ?? null]);
}

export async function deleteAppSetting(key: string): Promise<boolean> {
  const sql = `DELETE FROM app_settings WHERE setting_key = $1`;
  const res = await pool.query(sql, [key]);
  return res.rowCount !== null && res.rowCount > 0;
}
