'use server';

import { query } from '@/lib/db/connection';
import { regionSchema } from '@/validation/schemas';

export async function getRegions(limit?: number, offset?: number) {
  let sql = 'SELECT * FROM region ORDER BY name ASC';
  const params: any[] = [];

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(limit);

    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }

  return query(sql, params);
}

export async function createRegion(input: { name: string; code?: string }) {
  const parsed = regionSchema.parse(input);
  const sql = 'INSERT INTO region (name, code) VALUES (?, ?) RETURNING *';
  return query(sql, [parsed.name, parsed.code ?? null]);
}

export async function getRegionById(id: number) {
  const sql = 'SELECT * FROM region WHERE id = ?';
  return query(sql, [id]);
}

export async function deleteRegion(id: number) {
  const sql = 'DELETE FROM region WHERE id = ?';
  return query(sql, [id]);
}

export async function updateRegion(id: number, name: string) {
  const sql = 'UPDATE region SET name = ? WHERE id = ?';
  return query(sql, [name, id]);
}
