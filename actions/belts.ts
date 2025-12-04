'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { beltSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Belt, PaginatedResponse } from '@/types';
import z from 'zod';

// Types
export interface BeltFilters {
  search?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
  color?: string;
  sort_by?: 'color' | 'created_at' | 'id';
  sort_order?: 'asc' | 'desc';
}

// Récupérer toutes les ceintures
export async function getBelts(
  filters: BeltFilters = {}
): Promise<PaginatedResponse<Belt>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      is_active,
      color,
      sort_by = 'color',
      sort_order = 'asc'
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND color ILIKE $${params.length}`;
    }

    // Filtre par couleur exacte
    if (color) {
      params.push(color);
      whereClause += ` AND color = $${params.length}`;
    }

    // Filtre par statut actif
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND is_active = $${params.length}`;
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM belt b
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Ordre de tri
    let orderClause = 'ORDER BY ';
    switch (sort_by) {
      case 'color':
        orderClause += 'b.color';
        break;
      case 'created_at':
        orderClause += 'b.created_at';
        break;
      case 'id':
        orderClause += 'b.id';
        break;
      default:
        orderClause += 'b.color';
    }
    orderClause += ` ${sort_order.toUpperCase()}`;

    // Requête principale
    const dataSql = `
      SELECT 
        b.*,
        (
          SELECT COUNT(*) 
          FROM sub_groups sg 
          WHERE sg.belt_region1 = b.id OR sg.belt_region2 = b.id
        ) as usage_count
      FROM belt b
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Belt>(
      dataSql, 
      [...params, validatedLimit, offset]
    );

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getBelts:', error);
    throw new Error('Erreur lors de la récupération des ceintures');
  }
}

// Récupérer une ceinture par ID
export async function getBeltById(id: number) {
  try {
    const sql = `
      SELECT 
        b.*,
        (
          SELECT COUNT(*) 
          FROM sub_groups sg 
          WHERE sg.belt_region1 = b.id
        ) as usage_as_region1_count,
        (
          SELECT COUNT(*) 
          FROM sub_groups sg 
          WHERE sg.belt_region2 = b.id
        ) as usage_as_region2_count,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', sg.id,
              'name', sg.name,
              'group_id', sg.group_id,
              'region1', CASE 
                WHEN sg.region1_id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', r1.id,
                    'name', r1.name,
                    'code', r1.code
                  )
                ELSE NULL
              END,
              'region2', CASE 
                WHEN sg.region2_id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', r2.id,
                    'name', r2.name,
                    'code', r2.code
                  )
                ELSE NULL
              END
            )
          )
          FROM sub_groups sg
          LEFT JOIN regions r1 ON sg.region1_id = r1.id
          LEFT JOIN regions r2 ON sg.region2_id = r2.id
          WHERE sg.belt_region1 = b.id OR sg.belt_region2 = b.id
          LIMIT 10
        ) as recent_usages
      FROM belt b
      WHERE b.id = $1
    `;

    const result = await queryOne<Belt & {
      usage_as_region1_count: number;
      usage_as_region2_count: number;
      recent_usages: any[];
    }>(sql, [id]);
    
    if (!result) {
      throw new Error('Ceinture non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getBeltById:', error);
    throw error;
  }
}

// Créer une ceinture
export async function createBelt(formData: FormData) {
  try {
    const rawData = {
      color: formData.get('color') as string,
      is_active: formData.get('is_active') as string | null,
    };

    const cleanedData = {
      color: rawData.color.trim(),
      is_active: rawData.is_active === 'true' || rawData.is_active === 'on',
    };

    // Valider les données
    const validatedData = beltSchema.parse(cleanedData);

    // Vérifier si une ceinture de cette couleur existe déjà
    const existingBelt = await queryOne<{ id: number }>(
      'SELECT id FROM belt WHERE LOWER(color) = LOWER($1)',
      [validatedData.color]
    );

    if (existingBelt) {
      throw new Error('Une ceinture avec cette couleur existe déjà');
    }

    const sql = `
      INSERT INTO belt (color, is_active)
      VALUES ($1, $2)
      RETURNING id, color, is_active, created_at
    `;
    
    const result = await query<Belt>(sql, [
      validatedData.color,
      validatedData.is_active,
    ]);

    revalidatePath('/belts');
    revalidatePath('/api/belts');
    
    return { 
      success: true, 
      id: result[0].id,
      belt: result[0],
      message: 'Ceinture créée avec succès'
    };
  } catch (error) {
    console.error('Error in createBelt:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Données invalides: ${errorMessages}`);
    }
    
    throw new Error(error instanceof Error ? error.message : 'Erreur lors de la création de la ceinture');
  }
}

// Mettre à jour une ceinture
export async function updateBelt(id: number, formData: FormData) {
  try {
    const existing = await getBeltById(id);
    if (!existing) {
      throw new Error('Ceinture non trouvée');
    }

    const rawData = {
      color: formData.get('color') as string,
      is_active: formData.get('is_active') as string | null,
    };

    const cleanedData = {
      color: rawData.color?.trim() || existing.color,
      is_active: rawData.is_active === 'true' || rawData.is_active === 'on',
    };

    // Valider les données
    const validatedData = beltSchema.parse(cleanedData);

    // Vérifier si une autre ceinture a déjà cette couleur (sauf celle qu'on modifie)
    if (validatedData.color.toLowerCase() !== existing.color.toLowerCase()) {
      const existingBelt = await queryOne<{ id: number }>(
        'SELECT id FROM belt WHERE LOWER(color) = LOWER($1) AND id != $2',
        [validatedData.color, id]
      );

      if (existingBelt) {
        throw new Error('Une ceinture avec cette couleur existe déjà');
      }
    }

    const sql = `
      UPDATE belt 
      SET color = $1, is_active = $2
      WHERE id = $3
      RETURNING id, color, is_active, created_at
    `;
    
    const result = await query<Belt>(sql, [
      validatedData.color,
      validatedData.is_active,
      id,
    ]);

    revalidatePath('/belts');
    revalidatePath(`/belts/${id}`);
    revalidatePath('/api/belts');
    revalidatePath(`/api/belts/${id}`);
    
    return { 
      success: true, 
      belt: result[0],
      message: 'Ceinture modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateBelt:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Données invalides: ${errorMessages}`);
    }
    
    throw error;
  }
}

// Supprimer une ceinture
export async function deleteBelt(id: number) {
  try {
    const existing = await getBeltById(id);
    if (!existing) {
      throw new Error('Ceinture non trouvée');
    }

    // Vérifier si la ceinture est utilisée dans des sous-groupes
    const usageCount = (existing.usage_as_region1_count || 0) + (existing.usage_as_region2_count || 0);
    
    if (usageCount > 0) {
      throw new Error(
        `Impossible de supprimer cette ceinture car elle est utilisée dans ${usageCount} sous-groupe(s)`
      );
    }

    const sql = 'DELETE FROM belt WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/belts');
    revalidatePath('/api/belts');
    
    return { 
      success: true, 
      message: 'Ceinture supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteBelt:', error);
    throw new Error('Erreur lors de la suppression de la ceinture');
  }
}

// Activer/désactiver une ceinture
export async function toggleBeltStatus(id: number, is_active: boolean) {
  try {
    const existing = await getBeltById(id);
    if (!existing) {
      throw new Error('Ceinture non trouvée');
    }

    const sql = `
      UPDATE belt 
      SET is_active = $1
      WHERE id = $2
      RETURNING id, color, is_active
    `;
    
    const result = await query<Belt>(sql, [is_active, id]);

    revalidatePath('/belts');
    revalidatePath(`/belts/${id}`);
    revalidatePath('/api/belts');
    revalidatePath(`/api/belts/${id}`);
    
    return { 
      success: true, 
      belt: result[0],
      message: `Ceinture ${is_active ? 'activée' : 'désactivée'} avec succès`
    };
  } catch (error) {
    console.error('Error in toggleBeltStatus:', error);
    throw new Error('Erreur lors de la modification du statut de la ceinture');
  }
}

// Récupérer les statistiques des ceintures
export async function getBeltStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_belts,
        COUNT(*) FILTER (WHERE is_active = true) as active_belts,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_belts,
        (
          SELECT COUNT(DISTINCT sg.belt_region1) + COUNT(DISTINCT sg.belt_region2)
          FROM sub_groups sg
          WHERE sg.belt_region1 IS NOT NULL OR sg.belt_region2 IS NOT NULL
        ) as belts_in_use,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'color', b2.color,
              'count', b2.usage_count
            ) ORDER BY b2.usage_count DESC
          )
          FROM (
            SELECT 
              b.color,
              (
                SELECT COUNT(*)
                FROM sub_groups sg
                WHERE sg.belt_region1 = b.id OR sg.belt_region2 = b.id
              ) as usage_count
            FROM belt b
            ORDER BY usage_count DESC
            LIMIT 5
          ) b2
        ) as most_used_belts
      FROM belt b
    `;
    
    const result = await queryOne<{
      total_belts: string;
      active_belts: string;
      inactive_belts: string;
      belts_in_use: string;
      most_used_belts: any[];
    }>(sql);
    
    return {
      total_belts: parseInt(result?.total_belts ?? '0'),
      active_belts: parseInt(result?.active_belts ?? '0'),
      inactive_belts: parseInt(result?.inactive_belts ?? '0'),
      belts_in_use: parseInt(result?.belts_in_use ?? '0'),
      most_used_belts: result?.most_used_belts || []
    };
  } catch (error) {
    console.error('Error in getBeltStats:', error);
    return {
      total_belts: 0,
      active_belts: 0,
      inactive_belts: 0,
      belts_in_use: 0,
      most_used_belts: []
    };
  }
}

// Récupérer les ceintures disponibles (actives) pour les sélecteurs
export async function getActiveBeltsForSelection() {
  try {
    const sql = `
      SELECT id, color
      FROM belt 
      WHERE is_active = true
      ORDER BY color
    `;
    
    const result = await query<{ id: number; color: string }>(sql);
    
    return result;
  } catch (error) {
    console.error('Error in getActiveBeltsForSelection:', error);
    throw new Error('Erreur lors de la récupération des ceintures actives');
  }
}