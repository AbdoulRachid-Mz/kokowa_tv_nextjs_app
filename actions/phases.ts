'use server';

import { query, queryOne } from '@/lib/db/connection';
import { phaseSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Phase } from '@/types/entities';

export interface PhaseFilters {
  competition_id?: number;
}

export async function getPhases(filters: PhaseFilters = {}) {
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.competition_id) {
      whereClause += ' AND competition_id = ?';
      params.push(filters.competition_id);
    }

    const sql = `
      SELECT p.*, c.title as competition_title
      FROM phase p
      LEFT JOIN competition c ON p.competition_id = c.id
      ${whereClause}
      ORDER BY p.position ASC
    `;

    return await query<Phase & { competition_title?: string }>(sql, params);
  } catch (error) {
    console.error('Error in getPhases:', error);
    throw new Error('Erreur lors de la récupération des phases');
  }
}

export async function getPhaseById(id: number) {
  try {
    const sql = `
      SELECT p.*, c.title as competition_title
      FROM phase p
      LEFT JOIN competition c ON p.competition_id = c.id
      WHERE p.id = ?
    `;
    const result = await queryOne<Phase & { competition_title?: string }>(sql, [id]);
    
    if (!result) {
      throw new Error('Phase non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getPhaseById:', error);
    throw error;
  }
}

export async function createPhase(formData: FormData) {
  try {
    const rawData = {
      competition_id: formData.get('competition_id'),
      name: formData.get('name'),
      position: formData.get('position'),
    };

    const validatedData = phaseSchema.parse({
      competition_id: Number(rawData.competition_id),
      name: rawData.name,
      position: Number(rawData.position),
    });

    const sql = `
      INSERT INTO phase (competition_id, name, position)
      VALUES (?, ?, ?)
    `;
    
    const result = await query<{ insertId: number }>(sql, [
      validatedData.competition_id,
      validatedData.name,
      validatedData.position,
    ]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${validatedData.competition_id}`);
    return { 
      success: true, 
      id: result[0].insertId,
      message: 'Phase créée avec succès'
    };
  } catch (error) {
    console.error('Error in createPhase:', error);
    throw new Error('Erreur lors de la création de la phase');
  }
}

export async function updatePhase(id: number, formData: FormData) {
  try {
    const existing = await getPhaseById(id);
    if (!existing) {
      throw new Error('Phase non trouvée');
    }

    const rawData = {
      competition_id: formData.get('competition_id'),
      name: formData.get('name'),
      position: formData.get('position'),
    };

    const validatedData = phaseSchema.parse({
      competition_id: Number(rawData.competition_id),
      name: rawData.name,
      position: Number(rawData.position),
    });

    const sql = `
      UPDATE phase 
      SET competition_id = ?, name = ?, position = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      validatedData.competition_id,
      validatedData.name,
      validatedData.position,
      id,
    ]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${validatedData.competition_id}`);
    return { 
      success: true, 
      message: 'Phase modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updatePhase:', error);
    throw error;
  }
}

export async function deletePhase(id: number) {
  try {
    const existing = await getPhaseById(id);
    if (!existing) {
      throw new Error('Phase non trouvée');
    }

    const sql = 'DELETE FROM phase WHERE id = ?';
    await query(sql, [id]);
    
    revalidatePath('/competitions');
    revalidatePath(`/competitions/${existing.competition_id}`);
    return { 
      success: true, 
      message: 'Phase supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deletePhase:', error);
    throw new Error('Erreur lors de la suppression de la phase');
  }
}