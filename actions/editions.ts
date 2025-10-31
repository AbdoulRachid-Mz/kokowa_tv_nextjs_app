'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { competitionEditionSchema, editionFighterSchema, editionRegionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { CompetitionEdition, EditionFighter, EditionRegion, PaginatedResponse } from '@/types';

export interface EditionFilters {
  competition_id?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
  with_competition?: boolean;
  with_fighters?: boolean;
  with_regions?: boolean;
  with_phases?: boolean;
}

// import { query } from "@/lib/neon-client";

export async function getEditions(options: {
  competition_id?: string;
  search?: string;
  with_competition?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { competition_id, search, with_competition = false, limit = 20, offset = 0 } = options;

  let whereClause = "WHERE 1=1";
  let joinClause = "";
  const params: any[] = [];
  const selectFields = ["e.*"];

  // Jointure optionnelle
  if (with_competition) {
    joinClause += " LEFT JOIN competitions c ON e.competition_id = c.id";
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', c.id,
        'name', c.name
      ) as competition
    `);
  }

  // Filtres dynamiques
  if (competition_id) {
    params.push(competition_id);
    whereClause += ` AND e.competition_id = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND e.name ILIKE $${params.length}`;
  }

  // Count
  const countSql = `
    SELECT COUNT(DISTINCT e.id) as total
    FROM editions e
    ${joinClause}
    ${whereClause}
  `;

  const [{ total }] = await query<{ total: number }>(countSql, params);

  // Data
  params.push(limit, offset);
  const dataSql = `
    SELECT ${selectFields.join(", ")}
    FROM editions e
    ${joinClause}
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const data = await query(dataSql, params);
  return { total, data };
}


export async function getEditionById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM competition_editions WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          ce.*,
          JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'type', c.type,
            'slug', c.slug
          ) as competition,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ef.id,
              'fighter_id', ef.fighter_id,
              'status', ef.status,
              'registration_date', ef.registration_date,
              'fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname,
                'ranking', f.ranking
              )
            ) ORDER BY f.ranking
          ) FROM edition_fighters ef
          JOIN fighters f ON ef.fighter_id = f.id
          WHERE ef.edition_id = ce.id) as fighters,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', er.id,
              'region_id', er.region_id,
              'status', er.status,
              'registration_date', er.registration_date,
              'region', JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'code', r.code
              )
            ) ORDER BY r.name
          ) FROM edition_regions er
          JOIN regions r ON er.region_id = r.id
          WHERE er.edition_id = ce.id) as regions,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed
            ) ORDER BY p.phase_order
          ) FROM phases p WHERE p.edition_id = ce.id) as phases
        FROM competition_editions ce
        LEFT JOIN competitions c ON ce.competition_id = c.id
        WHERE ce.id = $1
      `;
    }

    const result = await queryOne<CompetitionEdition>(sql, params);
    
    if (!result) {
      throw new Error('Édition non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getEditionById:', error);
    throw error;
  }
}

export async function createEdition(formData: FormData) {
  try {
    const rawData = {
      competition_id: formData.get('competition_id'),
      edition_number: formData.get('edition_number'),
      year: formData.get('year'),
      theme: formData.get('theme'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    };

    const cleanedData = {
      competition_id: Number(rawData.competition_id),
      edition_number: Number(rawData.edition_number),
      year: Number(rawData.year),
      theme: rawData.theme as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
    };

    const validatedData = competitionEditionSchema.parse(cleanedData);

    const sql = `
      INSERT INTO competition_editions (
        competition_id, edition_number, year, theme, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.competition_id,
      validatedData.edition_number,
      validatedData.year,
      validatedData.theme || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
    ]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${validatedData.competition_id}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Édition créée avec succès'
    };
  } catch (error) {
    console.error('Error in createEdition:', error);
    throw new Error('Erreur lors de la création de l\'édition');
  }
}

export async function updateEdition(id: number, formData: FormData) {
  try {
    const existing = await getEditionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Édition non trouvée');
    }

    const rawData = {
      competition_id: formData.get('competition_id'),
      edition_number: formData.get('edition_number'),
      year: formData.get('year'),
      theme: formData.get('theme'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    };

    const cleanedData = {
      competition_id: Number(rawData.competition_id),
      edition_number: Number(rawData.edition_number),
      year: Number(rawData.year),
      theme: rawData.theme as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
    };

    const validatedData = competitionEditionSchema.parse(cleanedData);

    const sql = `
      UPDATE competition_editions 
      SET 
        competition_id = $1, edition_number = $2, year = $3, 
        theme = $4, start_date = $5, end_date = $6
      WHERE id = $7
    `;
    
    await query(sql, [
      validatedData.competition_id,
      validatedData.edition_number,
      validatedData.year,
      validatedData.theme || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      id,
    ]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${validatedData.competition_id}`);
    revalidatePath(`/editions/${id}`);
    return { 
      success: true, 
      message: 'Édition modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateEdition:', error);
    throw error;
  }
}

export async function deleteEdition(id: number) {
  try {
    const existing = await getEditionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Édition non trouvée');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT 
        (SELECT COUNT(*) FROM phases WHERE edition_id = $1) as phase_count,
        (SELECT COUNT(*) FROM edition_fighters WHERE edition_id = $1) as fighter_count,
        (SELECT COUNT(*) FROM edition_regions WHERE edition_id = $1) as region_count
    `, [id]);

    const counts = relatedData[0];
    if (counts.phase_count > 0 || counts.fighter_count > 0 || counts.region_count > 0) {
      throw new Error(
        `Impossible de supprimer cette édition car elle contient des données liées: 
        ${counts.phase_count} phase(s), ${counts.fighter_count} lutteur(s), ${counts.region_count} région(s)`
      );
    }

    const sql = 'DELETE FROM competition_editions WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/competitions');
    revalidatePath(`/competitions/${existing.competition_id}`);
    return { 
      success: true, 
      message: 'Édition supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteEdition:', error);
    throw new Error('Erreur lors de la suppression de l\'édition');
  }
}

// Gestion des lutteurs d'édition
export async function addFighterToEdition(editionId: number, fighterId: number, status: string = 'registered') {
  try {
    const validatedData = editionFighterSchema.parse({
      edition_id: editionId,
      fighter_id: fighterId,
      status: status as any,
    });

    const sql = `
      INSERT INTO edition_fighters (edition_id, fighter_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (edition_id, fighter_id) DO UPDATE SET status = $3
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.edition_id,
      validatedData.fighter_id,
      validatedData.status,
    ]);

    revalidatePath(`/editions/${editionId}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Lutteur ajouté à l\'édition avec succès'
    };
  } catch (error) {
    console.error('Error in addFighterToEdition:', error);
    throw new Error('Erreur lors de l\'ajout du lutteur à l\'édition');
  }
}

// Gestion des régions d'édition
export async function addRegionToEdition(editionId: number, regionId: number, status: string = 'registered') {
  try {
    const validatedData = editionRegionSchema.parse({
      edition_id: editionId,
      region_id: regionId,
      status: status as any,
    });

    const sql = `
      INSERT INTO edition_regions (edition_id, region_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (edition_id, region_id) DO UPDATE SET status = $3
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.edition_id,
      validatedData.region_id,
      validatedData.status,
    ]);

    revalidatePath(`/editions/${editionId}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Région ajoutée à l\'édition avec succès'
    };
  } catch (error) {
    console.error('Error in addRegionToEdition:', error);
    throw new Error('Erreur lors de l\'ajout de la région à l\'édition');
  }
}

export async function getEditionsStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_editions,
        COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE) as upcoming,
        COUNT(*) FILTER (WHERE start_date < CURRENT_DATE AND end_date >= CURRENT_DATE) as ongoing,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as completed,
        AVG(total_participants) as avg_participants,
        MAX(total_participants) as max_participants
      FROM competition_editions
    `;
    
    const result = await queryOne<{
      total_editions: string;
      upcoming: string;
      ongoing: string;
      completed: string;
      avg_participants: string;
      max_participants: string;
    }>(sql);
    
    return {
      total_editions: parseInt(result?.total_editions ?? '0'),
      upcoming: parseInt(result?.upcoming ?? '0'),
      ongoing: parseInt(result?.ongoing ?? '0'),
      completed: parseInt(result?.completed ?? '0'),
      avg_participants: parseFloat(result?.avg_participants ?? '0'),
      max_participants: parseInt(result?.max_participants ?? '0'),
    };
  } catch (error) {
    console.error('Error in getEditionsStats:', error);
    return {
      total_editions: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      avg_participants: 0,
      max_participants: 0,
    };
  }
}