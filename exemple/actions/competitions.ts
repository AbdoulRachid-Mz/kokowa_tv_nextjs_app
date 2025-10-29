'use server';

import { query, queryOne } from '@/lib/db/connection';
import { competitionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Competition, Phase } from '@/types/entities';

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
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR lieu LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.date_from) {
      whereClause += ' AND date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereClause += ' AND date <= ?';
      params.push(filters.date_to);
    }

    // Pagination
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination.limit ?? 20));
    const offset = (page - 1) * limit;

    // Requête principale
    const dataSql = `
      SELECT * FROM competition 
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM competition
      ${whereClause}
    `;

    const [data, countResult] = await Promise.all([
      query<Competition>(dataSql, [...params, limit, offset]),
      query<{ total: number }>(countSql, params)
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

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
    const sql = 'SELECT * FROM competition WHERE id = ?';
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
      'SELECT * FROM phase WHERE competition_id = ? ORDER BY position', 
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

    // Formater la date pour MySQL
    const formattedDate = new Date(validatedData.date).toISOString().split('T')[0];

    const sql = `
      INSERT INTO competition (title, description, lieu, date)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await query<{ insertId: number }>(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.lieu,
      formattedDate,
    ]);

    revalidatePath('/competitions');
    return { 
      success: true, 
      id: result[0].insertId,
      message: 'Compétition créée avec succès'
    };
  } catch (error) {
    console.error('Error in createCompetition:', error);
    throw new Error('Erreur lors de la création de la compétition');
  }
}

export async function updateCompetition(id: number, formData: FormData) {
  try {
    // Vérifier que la compétition existe
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

    // Formater la date pour MySQL
    const formattedDate = new Date(validatedData.date).toISOString().split('T')[0];

    const sql = `
      UPDATE competition 
      SET title = ?, description = ?, lieu = ?, date = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.lieu,
      formattedDate,
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
    // Vérifier que la compétition existe
    const existing = await getCompetitionById(id);
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    const sql = 'DELETE FROM competition WHERE id = ?';
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