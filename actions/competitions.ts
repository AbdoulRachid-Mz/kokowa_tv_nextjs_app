'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { competitionSchema, competitionEditionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Competition, CompetitionEdition, PaginatedResponse } from '@/types';

export interface CompetitionFilters {
  search?: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  region_id?: number;
  with_region?: boolean;
  with_editions?: boolean;
  with_phases?: boolean;
  with_matches?: boolean;
}

// import { query } from "@/lib/neon-client";

export async function getCompetitions(options: {
  search?: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  region_id?: number;
  date_from?: string;
  date_to?: string;
  with_region?: boolean;
  with_editions?: boolean;
  with_phases?: boolean;
  with_matches?: boolean;
}) {
  const {
    search,
    page = 1,
    limit = 20,
    type,
    status,
    region_id,
    date_from,
    date_to,
    with_region = false,
    with_editions = false,
    with_phases = false,
    with_matches = false,
  } = options;

  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  let joinClause = "";
  const params: any[] = [];
  const selectFields = ["c.*"];

  // Optional joins
  if (with_region) {
    joinClause += " LEFT JOIN regions r ON c.region_id = r.id";
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', r.id,
        'name', r.name,
        'code', r.code
      ) as region
    `);
  }

  // Dynamic filters
  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND c.name ILIKE $${params.length}`;
  }

  if (type) {
    params.push(type);
    whereClause += ` AND c.type = $${params.length}`;
  }

  if (status) {
    params.push(status);
    whereClause += ` AND c.status = $${params.length}`;
  }

  if (region_id) {
    params.push(region_id);
    whereClause += ` AND c.region_id = $${params.length}`;
  }

  if (date_from) {
    params.push(date_from);
    whereClause += ` AND c.created_at >= $${params.length}`;
  }
  if (with_editions || with_phases || with_matches) {
    // Start from the topmost requested level
    if (with_editions) {
      joinClause += `
        LEFT JOIN competition_editions ce ON ce.competition_id = c.id
      `;
      selectFields.push(`
        COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'total_participants', ce.total_participants,
              'winner_fighter_id', ce.winner_fighter_id,
              'winner_fighter', JSON_BUILD_OBJECT(
                'id', wf.id,
                'first_name', wf.first_name,
                'last_name', wf.last_name,
                'nickname', wf.nickname
              )
            )
          ) FILTER (WHERE ce.id IS NOT NULL), '[]'
        ) as editions
      `);
      joinClause += ` LEFT JOIN fighters wf ON ce.winner_fighter_id = wf.id`;
    }

    if (with_phases) {
      // If editions are not included, join phases directly via editions
      if (!with_editions) {
        joinClause += `
          LEFT JOIN competition_editions ce ON ce.competition_id = c.id
        `;
      }
      joinClause += `
        LEFT JOIN phases p ON p.edition_id = ce.id
      `;
      selectFields.push(`
        COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed,
              'start_date', p.start_date,
              'end_date', p.end_date,
              'groups', (
                SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', pg.id,
                    'name', pg.name,
                    'group_order', pg.group_order,
                    'is_completed', pg.is_completed,
                    'sub_groups', (
                      SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                          'id', sg.id,
                          'name', sg.name,
                          'sub_group_order', sg.sub_group_order,
                          'belt1_fighter_id', sg.belt1_fighter_id,
                          'belt2_fighter_id', sg.belt2_fighter_id,
                          'belt1_region_id', sg.belt1_region_id,
                          'belt2_region_id', sg.belt2_region_id,
                          'belt1_region', JSON_BUILD_OBJECT(
                            'id', br1.id,
                            'name', br1.name,
                            'code', br1.code
                          ),
                          'belt2_region', JSON_BUILD_OBJECT(
                            'id', br2.id,
                            'name', br2.name,
                            'code', br2.code
                          )
                        )
                      ) FROM sub_groups sg
                      LEFT JOIN regions br1 ON sg.belt1_region_id = br1.id
                      LEFT JOIN regions br2 ON sg.belt2_region_id = br2.id
                      WHERE sg.group_id = pg.id
                    )
                  ) ORDER BY pg.group_order
                ) FROM phase_groups pg WHERE pg.phase_id = p.id
              )
            ) ORDER BY p.phase_order
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) as phases
      `);
    }

    if (with_matches) {
      // Ensure sub_groups are joined if not already
      if (!with_phases) {
        if (!with_editions) {
          joinClause += `
            LEFT JOIN competition_editions ce ON ce.competition_id = c.id
          `;
        }
        joinClause += `
          LEFT JOIN phases p ON p.edition_id = ce.id
          LEFT JOIN phase_groups pg ON pg.phase_id = p.id
          LEFT JOIN sub_groups sg ON sg.group_id = pg.id
        `;
      } else {
        joinClause += `
          LEFT JOIN phase_groups pg ON pg.phase_id = p.id
          LEFT JOIN sub_groups sg ON sg.group_id = pg.id
        `;
      }
      joinClause += `
        LEFT JOIN matches m ON m.sub_group_id = sg.id
        LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
        LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
        LEFT JOIN regions r1 ON m.region1_id = r1.id
        LEFT JOIN regions r2 ON m.region2_id = r2.id
        LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
        LEFT JOIN regions wr ON m.winner_region_id = wr.id
      `;
      selectFields.push(`
        COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'start_time', m.start_time,
              'end_time', m.end_time,
              'fighter1', JSON_BUILD_OBJECT(
                'id', f1.id,
                'first_name', f1.first_name,
                'last_name', f1.last_name,
                'nickname', f1.nickname
              ),
              'fighter2', JSON_BUILD_OBJECT(
                'id', f2.id,
                'first_name', f2.first_name,
                'last_name', f2.last_name,
                'nickname', f2.nickname
              ),
              'region1', JSON_BUILD_OBJECT(
                'id', r1.id,
                'name', r1.name,
                'code', r1.code
              ),
              'region2', JSON_BUILD_OBJECT(
                'id', r2.id,
                'name', r2.name,
                'code', r2.code
              ),
              'winner_fighter', JSON_BUILD_OBJECT(
                'id', wf.id,
                'first_name', wf.first_name,
                'last_name', wf.last_name,
                'nickname', wf.nickname
              ),
              'winner_region', JSON_BUILD_OBJECT(
                'id', wr.id,
                'name', wr.name,
                'code', wr.code
              ),
              'score_fighter1', m.score_fighter1,
              'score_fighter2', m.score_fighter2,
              'match_result', m.match_result,
              'status', m.status,
              'venue', m.venue,
              'notes', m.notes
            )
          ) FILTER (WHERE m.id IS NOT NULL), '[]'
        ) as matches
      `);
    }
  }

  if (date_to) {
    params.push(date_to);
    whereClause += ` AND c.created_at <= $${params.length}`;
  }

  // Count query
  const countSql = `
    SELECT COUNT(DISTINCT c.id) as total
    FROM competitions c
    ${joinClause}
    ${whereClause}
  `;

  const [{ total }] = await query<{ total: number }>(countSql, params);

  // Data query
  params.push(limit, offset);
  const dataSql = `
    SELECT ${selectFields.join(", ")}
    FROM competitions c
    ${joinClause}
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const data = await query(dataSql, params);
  return { total, data };
}

export async function getCompetitionById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM competitions WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          c.*,
          JSON_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'code', r.code
          ) as region,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'total_participants', ce.total_participants,
              'winner_fighter_id', ce.winner_fighter_id,
              'winner_fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname
              )
            ) ORDER BY ce.year DESC
          ) FROM competition_editions ce 
          LEFT JOIN fighters f ON ce.winner_fighter_id = f.id
          WHERE ce.competition_id = c.id) as editions,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed,
              'groups', (
                SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', pg.id,
                    'name', pg.name,
                    'group_order', pg.group_order,
                    'sub_groups', (
                      SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                          'id', sg.id,
                          'name', sg.name,
                          'sub_group_order', sg.sub_group_order,
                          'belt1_fighter_id', sg.belt1_fighter_id,
                          'belt2_fighter_id', sg.belt2_fighter_id,
                          'belt1_region_id', sg.belt1_region_id,
                          'belt2_region_id', sg.belt2_region_id
                        )
                      ) FROM sub_groups sg WHERE sg.group_id = pg.id
                    )
                  ) ORDER BY pg.group_order
                ) FROM phase_groups pg WHERE pg.phase_id = p.id
              )
            ) ORDER BY p.phase_order
          ) FROM phases p 
          JOIN competition_editions ce ON p.edition_id = ce.id 
          WHERE ce.competition_id = c.id) as phases
        FROM competitions c
        LEFT JOIN regions r ON c.region_id = r.id
        WHERE c.id = $1
      `;
    }

    const result = await queryOne<Competition>(sql, params);
    
    if (!result) {
      throw new Error('Compétition non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getCompetitionById:', error);
    throw error;
  }
}

export async function createCompetition(
  formData: FormData, 
  options: { with_edition?: boolean } = { with_edition: true }
) {
  try {
    const { with_edition = true } = options;
    
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      location: formData.get('location'),
      region_id: formData.get('region_id'),
      featured_image: formData.get('featured_image'),
      registration_deadline: formData.get('registration_deadline'),
      max_participants: formData.get('max_participants'),
      prize_pool: formData.get('prize_pool'),
    };

    // Générer le slug à partir du nom
    const slug = (rawData.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const cleanedData = {
      name: rawData.name as string,
      description: rawData.description as string || undefined,
      type: rawData.type as any,
      location: rawData.location as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      featured_image: rawData.featured_image as string || undefined,
      registration_deadline: rawData.registration_deadline as string || undefined,
      max_participants: rawData.max_participants ? Number(rawData.max_participants) : undefined,
      prize_pool: rawData.prize_pool ? Number(rawData.prize_pool) : undefined,
    };

    const validatedData = competitionSchema.parse(cleanedData);

    // Commencer une transaction
    const client = await query('BEGIN');

    try {
      // 1. Créer la compétition
      const competitionSql = `
        INSERT INTO competitions (
          name, slug, description, type, location,
          region_id, featured_image, registration_deadline, max_participants, prize_pool
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      
      const competitionResult = await query<{ id: number }>(competitionSql, [
        validatedData.name,
        slug,
        validatedData.description || null,
        validatedData.type,
        validatedData.location || null,
        validatedData.region_id || null,
        validatedData.featured_image || null,
        validatedData.registration_deadline || null,
        validatedData.max_participants || null,
        validatedData.prize_pool || null,
      ]);

      const competitionId = competitionResult[0].id;

      // 2. Créer automatiquement une édition si demandé
      if (with_edition) {
        const currentYear = new Date().getFullYear();
        const editionSql = `
          INSERT INTO competition_editions (
            competition_id, edition_number, year, theme
          ) VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        
        await query<{ id: number }>(editionSql, [
          competitionId,
          currentYear,
          currentYear,
          `Édition ${currentYear} - ${validatedData.name}`
        ]);
      }

      // Commit de la transaction
      await query('COMMIT');

      revalidatePath('/competitions');
      return { 
        success: true, 
        id: competitionId,
        message: 'Compétition créée avec succès' + (with_edition ? ' (avec édition automatique)' : '')
      };

    } catch (error) {
      // Rollback en cas d'erreur
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error in createCompetition:', error);
    throw new Error('Erreur lors de la création de la compétition');
  }
}

export async function updateCompetition(id: number, formData: FormData) {
  try {
    const existing = await getCompetitionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      location: formData.get('location'),
      region_id: formData.get('region_id'),
      featured_image: formData.get('featured_image'),
      registration_deadline: formData.get('registration_deadline'),
      max_participants: formData.get('max_participants'),
      prize_pool: formData.get('prize_pool'),
    };

    // Générer le slug si le nom a changé
    const newName = rawData.name as string;
    const slug = newName !== existing.name 
      ? newName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : existing.slug;

    const cleanedData = {
      name: newName,
      description: rawData.description as string || undefined,
      type: rawData.type as any,
      location: rawData.location as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      featured_image: rawData.featured_image as string || undefined,
      registration_deadline: rawData.registration_deadline as string || undefined,
      max_participants: rawData.max_participants ? Number(rawData.max_participants) : undefined,
      prize_pool: rawData.prize_pool ? Number(rawData.prize_pool) : undefined,
    };

    const validatedData = competitionSchema.parse(cleanedData);

    const sql = `
      UPDATE competitions 
      SET 
        name = $1, slug = $2, description = $3, type = $4, location = $5,
        region_id = $6, featured_image = $7, registration_deadline = $8, 
        max_participants = $9, prize_pool = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `;
    
    await query(sql, [
      validatedData.name,
      slug,
      validatedData.description || null,
      validatedData.type,
      validatedData.location || null,
      validatedData.region_id || null,
      validatedData.featured_image || null,
      validatedData.registration_deadline || null,
      validatedData.max_participants || null,
      validatedData.prize_pool || null,
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
    const existing = await getCompetitionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT 
        (SELECT COUNT(*) FROM competition_editions WHERE competition_id = $1) as edition_count
    `, [id]);

    const counts = relatedData[0];
    if (counts.edition_count > 0) {
      throw new Error(
        `Impossible de supprimer cette compétition car elle contient ${counts.edition_count} édition(s)`
      );
    }

    const sql = 'DELETE FROM competitions WHERE id = $1';
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

export async function getCompetitionStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_competitions,
        COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
        COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE type = 'sabre_national') as sabre_national,
        COUNT(*) FILTER (WHERE type = 'coupe_regionale') as coupe_regionale,
        COUNT(*) FILTER (WHERE type = 'halarou_bakwai') as halarou_bakwai,
        COUNT(*) FILTER (WHERE type = 'aes') as aes,
        COUNT(*) FILTER (WHERE type = 'friendly') as friendly,
        COUNT(*) FILTER (WHERE type = 'ministre') as ministre,
        COUNT(*) FILTER (WHERE type = 'coupe_airtel') as coupe_airtel,
        COUNT(*) FILTER (WHERE type = 'other') as other,
        SUM(prize_pool) as total_prize_pool,
        (SELECT COUNT(*) FROM competition_editions) as total_editions
      FROM competitions
    `;
    
    const result = await queryOne<{
      total_competitions: string;
      upcoming: string;
      ongoing: string;
      completed: string;
      cancelled: string;
      sabre_national: string;
      coupe_regionale: string;
      halarou_bakwai: string;
      aes: string;
      friendly: string;
      ministre: string;
      coupe_airtel: string;
      other: string;
      total_prize_pool: string;
      total_editions: string;
    }>(sql);
    
    return {
      total_competitions: parseInt(result?.total_competitions ?? '0'),
      upcoming: parseInt(result?.upcoming ?? '0'),
      ongoing: parseInt(result?.ongoing ?? '0'),
      completed: parseInt(result?.completed ?? '0'),
      cancelled: parseInt(result?.cancelled ?? '0'),
      by_type: {
        sabre_national: parseInt(result?.sabre_national ?? '0'),
        coupe_regionale: parseInt(result?.coupe_regionale ?? '0'),
        halarou_bakwai: parseInt(result?.halarou_bakwai ?? '0'),
        aes: parseInt(result?.aes ?? '0'),
        friendly: parseInt(result?.friendly ?? '0'),
        ministre: parseInt(result?.ministre ?? '0'),
        coupe_airtel: parseInt(result?.coupe_airtel ?? '0'),
        other: parseInt(result?.other ?? '0'),
      },
      total_prize_pool: parseFloat(result?.total_prize_pool ?? '0'),
      total_editions: parseInt(result?.total_editions ?? '0'),
    };
  } catch (error) {
    console.error('Error in getCompetitionStats:', error);
    return {
      total_competitions: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      by_type: {
        sabre_national: 0,
        coupe_regionale: 0,
        halarou_bakwai: 0,
        aes: 0,
        friendly: 0,
        ministre: 0,
        coupe_airtel: 0,
        other: 0,
      },
      total_prize_pool: 0,
      total_editions: 0,
    };
  }
}

export async function updateCompetitionStatus(id: number, status: string) {
  try {
    const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    const sql = `
      UPDATE competitions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await query(sql, [status, id]);

    revalidatePath('/competitions');
    revalidatePath(`/competitions/${id}`);
    return { 
      success: true, 
      message: `Statut de la compétition mis à jour: ${status}` 
    };
  } catch (error) {
    console.error('Error in updateCompetitionStatus:', error);
    throw new Error('Erreur lors de la mise à jour du statut');
  }
}