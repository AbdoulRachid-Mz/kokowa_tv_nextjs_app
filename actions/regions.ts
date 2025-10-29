'use server';

import { query, queryOne } from '@/lib/db/connection';
import { regionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Region } from '@/types';

export async function getRegions() {
  try {
    const sql = 'SELECT * FROM region ORDER BY name ASC';
    return await query<Region>(sql);
  } catch (error) {
    console.error('Error in getRegions:', error);
    throw new Error('Erreur lors de la récupération des régions');
  }
}

export async function getRegionById(id: number) {
  try {
    const sql = 'SELECT * FROM region WHERE id = $1';
    const result = await queryOne<Region>(sql, [id]);
    
    if (!result) {
      throw new Error('Région non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getRegionById:', error);
    throw error;
  }
}

export async function createRegion(input: { name: string; code?: string }) {
  try {
    const validatedData = regionSchema.parse(input);

    const sql = `
      INSERT INTO region (name, code)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await query<Region>(sql, [
      validatedData.name,
      validatedData.code || null,
    ]);

    revalidatePath('/regions');
    return { 
      success: true, 
      data: result[0],
      message: 'Région créée avec succès'
    };
  } catch (error) {
    console.error('Error in createRegion:', error);
    throw new Error('Erreur lors de la création de la région');
  }
}

export async function updateRegion(id: number, name: string, code?: string) {
  try {
    const existing = await getRegionById(id);
    if (!existing) {
      throw new Error('Région non trouvée');
    }

    const validatedData = regionSchema.parse({ name, code });

    const sql = `
      UPDATE region 
      SET name = $1, code = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await query<Region>(sql, [
      validatedData.name,
      validatedData.code || null,
      id,
    ]);

    revalidatePath('/regions');
    return { 
      success: true, 
      data: result[0],
      message: 'Région modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateRegion:', error);
    throw error;
  }
}

export async function deleteRegion(id: number) {
  try {
    const existing = await getRegionById(id);
    if (!existing) {
      throw new Error('Région non trouvée');
    }

    const sql = 'DELETE FROM region WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/regions');
    return { 
      success: true, 
      message: 'Région supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteRegion:', error);
    throw new Error('Erreur lors de la suppression de la région');
  }
}

export async function getRegionsCount() {
  try {
    const sql = 'SELECT COUNT(*) as total FROM region';
    const result = await query<{ total: string }>(sql);
    return parseInt(result[0]?.total ?? '0');
  } catch (error) {
    console.error('Error in getRegionsCount:', error);
    return 0;
  }
}