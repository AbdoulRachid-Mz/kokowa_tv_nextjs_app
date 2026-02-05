"use server"

import { pool, query, queryOne } from '@/lib/db/neon-client';
import { AppSettings, AppSettingFilters, AppSetting } from '@/types';

// CRUD operations for app_settings
export async function getAppSettings(filters?: AppSettingFilters): Promise<AppSetting[]> {
  const where = filters
    ? Object.entries(filters)
        .map(([k, v]) => `${k} = '${v}'`)
        .join(' AND ')
    : '1=1';
  const sql = `SELECT * FROM app_settings WHERE ${where} ORDER BY key ASC`;
  return query<AppSetting>(sql);
}

export async function getAppSettingByKey(key: string): Promise<AppSetting | null> {
  const sql = `SELECT * FROM app_settings WHERE key = $1 LIMIT 1`;
  return queryOne<AppSetting>(sql, [key]);
}

export async function createAppSetting(
  key: string,
  value: string,
  description?: string
): Promise<AppSetting> {
  const sql = `
    INSERT INTO app_settings (key, value, description)
    VALUES ($1, $2, $3)
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
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
    SET value = $2,
        description = COALESCE($3, description),
        updated_at = NOW()
    WHERE key = $1
    RETURNING *`;
  return queryOne<AppSetting>(sql, [key, value, description ?? null]);
}

export async function deleteAppSetting(key: string): Promise<boolean> {
  const sql = `DELETE FROM app_settings WHERE key = $1`;
  const res = await pool.query(sql, [key]);
  return res.rowCount !== null && res.rowCount > 0;
}
