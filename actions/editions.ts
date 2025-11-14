'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { competitionEditionSchema, editionFighterSchema, editionRegionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { CompetitionEdition, EditionFighter, EditionFilters, EditionRegion, PaginatedResponse } from '@/types';


export async function getEditions(options: EditionFilters = {}) {
  try {
    const {
      competition_id,
      year,
      search = '',
      page = 1,
      limit = 20,
      offset = 0,
      with_competition = false,
      with_fighters = false,
      with_regions = false,
      with_phases = false,
    } = options;

    let whereClause = "WHERE 1=1";
    let joinClause = "";
    const params: any[] = [];
    const selectFields = ["ce.*"];

    // Jointures optionnelles
    if (with_competition) {
      joinClause += " LEFT JOIN competitions c ON ce.competition_id = c.id";
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'status', c.status,
          'featured_image', c.featured_image,
          'is_active', c.is_active,
          'region_id', c.region_id
        ) as competition
      `);
    }

    if (with_fighters) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ef.id,
            'fighter_id', ef.fighter_id,
            'region_id', ef.region_id,
            'status', ef.status,
            'registration_date', ef.registration_date,
            'fighter', JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname,
              'ranking', f.ranking,
              'profile_image', f.profile_image,
              'is_active', f.is_active,
              'is_champion', f.is_champion
            )
          ) ORDER BY f.ranking
        ) FROM edition_fighters ef
        JOIN fighters f ON ef.fighter_id = f.id
        WHERE ef.edition_id = ce.id) as fighters
      `);
    }

    if (with_regions) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', er.id,
            'region_id', er.region_id,
            'status', er.status,
            'registration_date', er.registration_date,
            'region', JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code,
              'color', r.color,
              'flag_image', r.flag_image,
              'stadium_name', r.stadium_name,
              'stadium_image', r.stadium_image,
              'total_fighters', r.total_fighters,
              'total_champions', r.total_champions
            )
          ) ORDER BY r.name
        ) FROM edition_regions er
        JOIN regions r ON er.region_id = r.id
        WHERE er.edition_id = ce.id) as regions
      `);
    }

    if (with_phases) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type,
            'phase_order', p.phase_order,
            'is_completed', p.is_completed,
            'is_active', p.is_active,
            'description', p.description,
            'start_date', p.start_date,
            'end_date', p.end_date
          ) ORDER BY p.phase_order
        ) FROM phases p WHERE p.edition_id = ce.id) as phases
      `);
    }

    // Filtres dynamiques
    if (competition_id) {
      params.push(competition_id);
      whereClause += ` AND ce.competition_id = $${params.length}`;
    }

    if (year) {
      params.push(year);
      whereClause += ` AND ce.year = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        ce.theme ILIKE $${params.length} 
        OR CAST(ce.year AS TEXT) ILIKE $${params.length}
        OR CAST(ce.edition_number AS TEXT) ILIKE $${params.length}
        ${with_competition ? `OR c.name ILIKE $${params.length}` : ''}
      )`;
    }

    // Count
    const countSql = `
      SELECT COUNT(DISTINCT ce.id) as total
      FROM competition_editions ce
      ${joinClause}
      ${whereClause}
    `;

    const countResult = await query<{ total: number }>(countSql, params);
    const total = countResult[0]?.total || 0;

    // Data
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const validatedOffset = offset || (page - 1) * validatedLimit;
    
    params.push(validatedLimit, validatedOffset);
    
    const dataSql = `
      SELECT ${selectFields.join(", ")}
      FROM competition_editions ce
      ${joinClause}
      ${whereClause}
      ORDER BY ce.year DESC, ce.edition_number DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const data = await query(dataSql, params);
    
    return {
      data,
      total,
      pagination: {
        page: Math.floor(validatedOffset / validatedLimit) + 1,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      }
    };
  } catch (error) {
    console.error('Error in getEditions:', error);
    throw new Error('Erreur lors de la récupération des éditions');
  }
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
            'slug', c.slug,
            'status', c.status,
            'featured_image', c.featured_image,
            'is_active', c.is_active,
            'region_id', c.region_id,
            'description', c.description
          ) as competition,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ef.id,
              'fighter_id', ef.fighter_id,
              'region_id', ef.region_id,
              'status', ef.status,
              'registration_date', ef.registration_date,
              'fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname,
                'ranking', f.ranking,
                'profile_image', f.profile_image,
                'is_active', f.is_active,
                'is_champion', f.is_champion,
                'birth_date', f.birth_date,
                'birth_place', f.birth_place,
                'height', f.height,
                'weight', f.weight,
                'fighting_style', f.fighting_style,
                'debut_year', f.debut_year
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
                'code', r.code,
                'color', r.color,
                'flag_image', r.flag_image,
                'stadium_name', r.stadium_name,
                'stadium_image', r.stadium_image,
                'total_fighters', r.total_fighters,
                'total_champions', r.total_champions,
                'description', r.description
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
              'is_completed', p.is_completed,
              'is_active', p.is_active,
              'description', p.description,
              'start_date', p.start_date,
              'end_date', p.end_date
            ) ORDER BY p.phase_order
          ) FROM phases p WHERE p.edition_id = ce.id) as phases,
          (SELECT JSON_BUILD_OBJECT(
            'id', wf.id,
            'first_name', wf.first_name,
            'last_name', wf.last_name,
            'nickname', wf.nickname,
            'profile_image', wf.profile_image
          ) FROM fighters wf WHERE wf.id = ce.winner_fighter_id) as winner_fighter,
          (SELECT JSON_BUILD_OBJECT(
            'id', wr.id,
            'name', wr.name,
            'code', wr.code,
            'flag_image', wr.flag_image
          ) FROM regions wr WHERE wr.id = ce.winner_region_id) as winner_region
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

export interface EditionParticipantsFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  region_id?: number;
  with_region?: boolean;
  with_fighter?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// // Lutteur participant à une édition
// export interface EditionFighter extends BaseEntity {
//   edition_id: number;
//   fighter_id: number;
//   region_id: number;
//   registration_date: string;
//   status: 'registered' | 'qualified' | 'disqualified' | 'withdrawn';  
//   // Relations
//   edition?: CompetitionEdition;
//   fighter?: Fighter;
//   region?: Region;
// }

// // Région participante à une édition
// export interface EditionRegion extends BaseEntity {
//   edition_id: number;
//   region_id: number;
//   registration_date: string;
//   status: 'registered' | 'approved' | 'rejected';
  
//   // Relations
//   edition?: CompetitionEdition;
//   region?: Region;
// }

// Récupérer les lutteurs participants d'une édition
export async function getEditionFighters(
  editionId: number,
  options: EditionParticipantsFilters = {}
): Promise<PaginatedResponse<any>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      status,
      region_id,
      with_region = true,
      with_fighter = true,
      sort_by = 'ranking',
      sort_order = 'asc',
    } = options;

    let whereClause = 'WHERE ef.edition_id = $1';
    const params: any[] = [editionId];
    const selectFields: string[] = ['ef.*'];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        f.first_name ILIKE $${params.length} 
        OR f.last_name ILIKE $${params.length}
        OR f.nickname ILIKE $${params.length}
      )`;
    }

    // Filtre par statut
    if (status) {
      params.push(status);
      whereClause += ` AND ef.status = $${params.length}`;
    }

    // Filtre par région
    if (region_id) {
      params.push(region_id);
      whereClause += ` AND f.region_id = $${params.length}`;
    }

    // Jointures
    let joinClause = 'FROM edition_fighters ef';
    
    if (with_fighter || search || region_id) {
      joinClause += ' JOIN fighters f ON ef.fighter_id = f.id';
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname,
          'ranking', f.ranking,
          'profile_image', f.profile_image,
          'is_active', f.is_active,
          'is_champion', f.is_champion
        ) as fighter
      `);
    }

    if (with_region) {
      joinClause += ' LEFT JOIN regions r ON f.region_id = r.id';
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color
        ) as region
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT ef.id) as total
      ${joinClause}
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
      case 'name':
        orderClause += 'f.first_name, f.last_name';
        break;
      case 'ranking':
        orderClause += 'f.ranking';
        break;
      case 'registration_date':
        orderClause += 'ef.registration_date';
        break;
      case 'status':
        orderClause += 'ef.status';
        break;
      default:
        orderClause += 'f.ranking';
    }
    orderClause += ` ${sort_order.toUpperCase()}`;

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query(
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
    console.error('Error in getEditionFighters:', error);
    throw new Error('Erreur lors de la récupération des lutteurs de l\'édition');
  }
}

// Récupérer les régions participantes d'une édition
export async function getEditionRegions(
  editionId: number,
  options: EditionParticipantsFilters = {}
): Promise<PaginatedResponse<any>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      status,
      with_region = true,
      sort_by = 'name',
      sort_order = 'asc',
    } = options;

    let whereClause = 'WHERE er.edition_id = $1';
    const params: any[] = [editionId];
    const selectFields: string[] = ['er.*'];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        r.name ILIKE $${params.length} 
        OR r.code ILIKE $${params.length}
      )`;
    }

    // Filtre par statut
    if (status) {
      params.push(status);
      whereClause += ` AND er.status = $${params.length}`;
    }

    // Jointures
    let joinClause = 'FROM edition_regions er';
    
    if (with_region || search) {
      joinClause += ' JOIN regions r ON er.region_id = r.id';
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color,
          'total_fighters', r.total_fighters,
          'total_champions', r.total_champions,
          'flag_image', r.flag_image
        ) as region
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT er.id) as total
      ${joinClause}
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
      case 'name':
        orderClause += 'r.name';
        break;
      case 'code':
        orderClause += 'r.code';
        break;
      case 'total_fighters':
        orderClause += 'r.total_fighters';
        break;
      case 'registration_date':
        orderClause += 'er.registration_date';
        break;
      case 'status':
        orderClause += 'er.status';
        break;
      default:
        orderClause += 'r.name';
    }
    orderClause += ` ${sort_order.toUpperCase()}`;

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query(
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
    console.error('Error in getEditionRegions:', error);
    throw new Error('Erreur lors de la récupération des régions de l\'édition');
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

    revalidatePath(`/ad/editions/${editionId}/figthers`);
    revalidatePath(`/ad/editions/${editionId}`);
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

      revalidatePath(`/ad/editions/${editionId}/regions`);
    revalidatePath(`/ad/editions/${editionId}`)
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

export async function removeFighterFromEdition(editionId: number, fighterId: number) {
  try {
    const sql = `
      DELETE FROM edition_fighters
      WHERE edition_id = $1 AND fighter_id = $2
    `;
    
    await query(sql, [editionId, fighterId]);

    revalidatePath(`/ad/editions/${editionId}/figthers`);
    revalidatePath(`/ad/editions/${editionId}`);
    return { 
      success: true, 
      message: 'Lutteur retiré de l\'édition avec succès'
    };
  } catch (error) {
    console.error('Error in removeFighterFromEdition:', error);
    throw new Error('Erreur lors du retrait du lutteur de l\'édition');
  }
}

export async function removeRegionFromEdition(editionId: number, regionId: number) {
  try {
    const sql = `
      DELETE FROM edition_regions
      WHERE edition_id = $1 AND region_id = $2
    `;
    
    await query(sql, [editionId, regionId]);

    revalidatePath(`/ad/editions/${editionId}/regions`);
    revalidatePath(`/ad/editions/${editionId}`);
    return { 
      success: true, 
      message: 'Région retirée de l\'édition avec succès'
    };
  } catch (error) {
    console.error('Error in removeRegionFromEdition:', error);
    throw new Error('Erreur lors du retrait de la région de l\'édition');
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