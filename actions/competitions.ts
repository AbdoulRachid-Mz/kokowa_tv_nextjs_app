'use server';

import { query, queryOne } from '@/lib/db/connection';
import { competitionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Competition, Phase } from '@/types';

export interface CompetitionFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface CompetitionListResponse {
  data: Competition[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getCompetitions(
  filters: CompetitionFilters = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<CompetitionListResponse> {
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtres
    if (filters.search) {
      whereClause += ' AND (title ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 2) + ' OR lieu ILIKE $' + (params.length + 3) + ')';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.date_from) {
      whereClause += ' AND date >= $' + (params.length + 1);
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereClause += ' AND date <= $' + (params.length + 1);
      params.push(filters.date_to);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM competition
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination.limit ?? 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Requête principale
    const dataSql = `
      SELECT * FROM competition 
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Competition>(dataSql, [...params, limit, offset]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getCompetitions:', error);
    throw new Error('Erreur lors de la récupération des compétitions');
  }
}

export async function getCompetitionById(id: number) {
  try {
    const sql = 'SELECT * FROM competition WHERE id = $1';
    const result = await queryOne<Competition>(sql, [id]);
    
    if (!result) {
      throw new Error('Compétition non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getCompetitionById:', error);
    throw error;
  }
}

export async function getCompetitionWithPhases(id: number) {
  try {
    const competition = await getCompetitionById(id);
    const phases = await query<Phase>(
      'SELECT * FROM phase WHERE competition_id = $1 ORDER BY position', 
      [id]
    );
    
    return { ...competition, phases };
  } catch (error) {
    console.error('Error in getCompetitionWithPhases:', error);
    throw error;
  }
}

export async function createCompetition(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      lieu: formData.get('lieu'),
      date: formData.get('date'),
    };

    const validatedData = competitionSchema.parse(rawData);

    const sql = `
      INSERT INTO competition (title, description, lieu, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.lieu,
      validatedData.date,
    ]);

    revalidatePath('/competitions');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Compétition créée avec succès'
    };
  } catch (error) {
    console.error('Error in createCompetition:', error);
    throw new Error('Erreur lors de la création de la compétition');
  }
}

export async function updateCompetition(id: number, formData: FormData) {
  try {
    const existing = await getCompetitionById(id);
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      lieu: formData.get('lieu'),
      date: formData.get('date'),
    };

    const validatedData = competitionSchema.parse(rawData);

    const sql = `
      UPDATE competition 
      SET title = $1, description = $2, lieu = $3, date = $4
      WHERE id = $5
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.lieu,
      validatedData.date,
      id,
    ]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${id}`);
    return { 
      success: true, 
      message: 'Compétition modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateCompetition:', error);
    throw error;
  }
}

export async function deleteCompetition(id: number) {
  try {
    const existing = await getCompetitionById(id);
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    const sql = 'DELETE FROM competition WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/competitions');
    return { 
      success: true, 
      message: 'Compétition supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteCompetition:', error);
    throw new Error('Erreur lors de la suppression de la compétition');
  }
}