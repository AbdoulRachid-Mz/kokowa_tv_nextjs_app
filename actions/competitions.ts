// @/actions/competitions.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { competitionSchema, competitionEditionSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, updateTag } from 'next/cache';
import { Competition, CompetitionEdition, CompetitionFilters, PaginatedResponse } from '@/types';
import z from 'zod';

export async function getCompetitions(options: CompetitionFilters) {
  // "use cache";
  // cacheTag("competitions");

  const {
    search,
    page = 1,
    limit = 20,
    status,
    region_id,
    edition_year,
    date_from,
    date_to,
    with_region ,
    with_editions,
    with_phases ,
    with_matches ,
  } = options;

  const offset = (page - 1) * limit;
  const params: any[] = [];

  let whereClause = "WHERE 1=1";
  const selectFields = ["c.id", "c.name", "c.slug", "c.status", "c.featured_image", "c.is_active", "c.created_at"];
  const joins: string[] = [];

  // === JOINS de base ===
  const needsEditionJoin = with_editions || with_phases || with_matches || edition_year;
  const editionJoinType = edition_year ? "INNER JOIN" : needsEditionJoin ? "LEFT JOIN" : "";

  if (editionJoinType) {
    joins.push(`${editionJoinType} competition_editions ce ON ce.competition_id = c.id`);
  }

  if (with_region) {
    joins.push("LEFT JOIN regions r ON r.id = c.region_id");
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', r.id,
        'name', r.name,
        'code', r.code
      ) AS region
    `);
  }

  // === FILTRES ===
  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND c.name ILIKE $${params.length}`;
  }

  if (status) {
    params.push(status);
    whereClause += ` AND c.status = $${params.length}`;
  }

  if (region_id) {
    params.push(region_id);
    whereClause += ` AND c.region_id = $${params.length}`;
  }

  if (edition_year) {
    params.push(edition_year);
    whereClause += ` AND ce.year = $${params.length}`;
  }

  if (date_from) {
    params.push(date_from);
    whereClause += ` AND c.created_at >= $${params.length}`;
  }

  if (date_to) {
    params.push(date_to);
    whereClause += ` AND c.created_at <= $${params.length}`;
  }

  // === RELATIONS ===
  if (with_editions) {
    selectFields.push(`
      COALESCE(
        (
          SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', ce2.id,
            'edition_number', ce2.edition_number,
            'year', ce2.year,
            'status', ce2.status
          ))
          FROM competition_editions ce2
          WHERE ce2.competition_id = c.id
          LIMIT 5
        ),
        '[]'
      ) AS editions
    `);
  }

  if (with_phases) {
    joins.push(`
      LEFT JOIN phases p ON p.edition_id = ce.id
      LEFT JOIN phase_groups pg ON pg.phase_id = p.id
      LEFT JOIN sub_groups sg ON sg.group_id = pg.id
    `);
    selectFields.push(`
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type,
            'phase_order', p.phase_order
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS phases
    `);
  }

if (with_matches) {
  // Si on n’a pas déjà ajouté les jointures des phases
  if (!with_phases) {
    joins.push(`
      LEFT JOIN phases p ON p.edition_id = ce.id
      LEFT JOIN phase_groups pg ON pg.phase_id = p.id
      LEFT JOIN sub_groups sg ON sg.group_id = pg.id
    `);
  }

  joins.push(`
    LEFT JOIN matches m ON m.sub_group_id = sg.id
    LEFT JOIN fighters f1 ON f1.id = m.fighter1_id
    LEFT JOIN fighters f2 ON f2.id = m.fighter2_id
  `);

  selectFields.push(`
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', m.id,
          'match_number', m.match_number,
          'match_date', m.match_date,
          'status', m.status,
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
          )
        )
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'
    ) AS matches
  `);
}

  // === Requêtes ===
  const joinClause = joins.join("\n");

  const countSql = `
    SELECT COUNT(DISTINCT c.id) AS total
    FROM competitions c
    ${joinClause}
    ${whereClause}
  `;

  const [{ total }] = await query<{ total: number }>(countSql, params);

  params.push(limit, offset);

  const groupByClause = `GROUP BY c.id${with_region ? ', r.id' : ''}`;

  const dataSql = `
    SELECT ${selectFields.join(", ")}
    FROM competitions c
    ${joinClause}
    ${whereClause}
    ${groupByClause}
    ORDER BY c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const data = await query(dataSql, params);

  return { total, data };
}


export async function getCompetitionById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  // "use cache";
  // cacheTag("competitions", `competition:${id}`);

  try {
    const { with_relations = false } = options;
    
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
              'prize_pool', ce.prize_pool,
              'registration_deadline', ce.registration_deadline,
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
                          'region1_id', sg.region1_id,
                          'region2_id', sg.region2_id,
                          'belt_region1', sg.belt_region1,
                          'belt_region2', sg.belt_region2
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
  options: { with_edition?: boolean } = { with_edition: false }
) {
  try {
    const { with_edition = false } = options;
    
    // Extraire et transformer les données du FormData
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string | null,
      featured_image: formData.get('featured_image') as string | null,
      status: formData.get('status') as string || 'upcoming',
      is_active: formData.get('is_active') as string | null,
    };

    // VÉRIFICATION 1: Vérifier si une compétition avec le même nom existe déjà
    const existingCompetition = await queryOne<{ id: number }>(
      'SELECT id FROM competitions WHERE LOWER(name) = LOWER($1)',
      [rawData.name.trim()]
    );

    if (existingCompetition) {
      throw new Error('Une compétition avec ce nom existe déjà');
    }

    // VÉRIFICATION 2: Vérifier aussi par slug pour éviter les conflits
    const slug = rawData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, ' ') // Remplacer caractères spéciaux par espace
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await queryOne<{ id: number }>(
      'SELECT id FROM competitions WHERE slug = $1',
      [slug]
    );

    if (existingSlug) {
      // Si le slug existe déjà, ajouter un timestamp
      const uniqueSlug = `${slug}-${Date.now()}`;
      
      // Préparer les données pour la validation avec le slug unique
      const dataForValidation = {
        name: rawData.name.trim(),
        slug: uniqueSlug,
        description: rawData.description || undefined,
        featured_image: rawData.featured_image || undefined,
        status: rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed',
        is_active: rawData.is_active || 'true',
      };

      const validatedData = competitionSchema.parse(dataForValidation);

      await query('BEGIN');

      try {
        // Créer la compétition avec slug unique
        const competitionSql = `
          INSERT INTO competitions (
            name, slug, description, featured_image, status, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, name, slug
        `;
        
        const competitionResult = await query<{ id: number; name: string; slug: string }>(
          competitionSql, 
          [
            validatedData.name,
            validatedData.slug ?? null,
            validatedData.description || null,
            validatedData.featured_image || null,
            validatedData.status,
            validatedData.is_active,
          ]
        );

        const competition = competitionResult[0];
        const competitionId = competition.id;

        // Créer automatiquement une édition si demandé
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
            1, // Première édition
            currentYear,
            `Édition ${currentYear} - ${validatedData.name}`
          ]);
        }

        await query('COMMIT');

        revalidatePath('/competitions');
        revalidatePath('/ad/competitions');
        updateTag("competitions");
        
        return { 
          success: true, 
          id: competitionId,
          competition: {
            id: competitionId,
            name: competition.name,
            slug: competition.slug
          },
          message: 'Compétition créée avec succès' + (with_edition ? ' (avec édition automatique)' : ''),
          warning: with_edition ? 'Une édition a été créée automatiquement' : undefined
        };

      } catch (error) {
        await query('ROLLBACK');
        console.error('Database error in createCompetition:', error);
        
        // Gestion spécifique des erreurs de contrainte d'unicité
        if (error instanceof Error && error.message.includes('unique constraint')) {
          throw new Error('Une compétition avec ce nom ou slug existe déjà');
        }
        
        throw new Error('Erreur base de données lors de la création de la compétition');
      }
    }

    // Si le slug n'existe pas, continuer avec le slug normal
    const dataForValidation = {
      name: rawData.name.trim(),
      slug,
      description: rawData.description || undefined,
      featured_image: rawData.featured_image || undefined,
      status: rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed',
      is_active: rawData.is_active || 'true',
    };

    const validatedData = competitionSchema.parse(dataForValidation);

    await query('BEGIN');

    try {
      // Créer la compétition
      const competitionSql = `
        INSERT INTO competitions (
          name, slug, description, featured_image, status, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, slug
      `;
      
      const competitionResult = await query<{ id: number; name: string; slug: string }>(
        competitionSql, 
        [
          validatedData.name,
          validatedData.slug ?? null,
          validatedData.description || null,
          validatedData.featured_image || null,
          validatedData.status,
          validatedData.is_active,
        ]
      );

      const competition = competitionResult[0];
      const competitionId = competition.id;

      // Créer automatiquement une édition si demandé
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
          1, // Première édition
          currentYear,
          `Édition ${currentYear} - ${validatedData.name}`
        ]);
      }

      await query('COMMIT');

      revalidatePath('/competitions');
      revalidatePath('/ad/competitions');
      updateTag("competitions");
      
      return { 
        success: true, 
        id: competitionId,
        competition: {
          id: competitionId,
          name: competition.name,
          slug: competition.slug
        },
        message: 'Compétition créée avec succès' + (with_edition ? ' (avec édition automatique)' : ''),
        warning: with_edition ? 'Une édition a été créée automatiquement' : undefined
      };

    } catch (error) {
      await query('ROLLBACK');
      console.error('Database error in createCompetition:', error);
      
      // Gestion spécifique des erreurs de contrainte d'unicité
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new Error('Une compétition avec ce nom existe déjà');
      }
      
      throw new Error('Erreur base de données lors de la création de la compétition');
    }

  } catch (error) {
    console.error('Error in createCompetition:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Données invalides: ${errorMessages}`);
    }
    
    throw new Error(error instanceof Error ? error.message : 'Erreur lors de la création de la compétition');
  }
}

export async function updateCompetition(id: number, formData: FormData) {
  try {
    const existing = await getCompetitionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Compétition non trouvée');
    }

    // Extraire et transformer les données du FormData
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string | null,
      featured_image: formData.get('featured_image') as string | null,
      status: formData.get('status') as string,
      is_active: formData.get('is_active') as string | null,
    };

    // VÉRIFICATION: Si le nom a changé, vérifier qu'il n'existe pas déjà
    if (rawData.name !== existing.name) {
      const existingCompetition = await queryOne<{ id: number }>(
        'SELECT id FROM competitions WHERE LOWER(name) = LOWER($1) AND id != $2',
        [rawData.name.trim(), id]
      );

      if (existingCompetition) {
        throw new Error('Une compétition avec ce nom existe déjà');
      }
    }

    // Générer le slug si le nom a changé
    const slug = rawData.name !== existing.name 
      ? rawData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : existing.slug;

    // Vérifier si le nouveau slug existe déjà (pour un autre enregistrement)
    if (slug !== existing.slug) {
      const existingSlug = await queryOne<{ id: number }>(
        'SELECT id FROM competitions WHERE slug = $1 AND id != $2',
        [slug, id] as (string | number)[]
      );

      if (existingSlug) {
        // Ajouter un suffixe unique si le slug existe
        const uniqueSlug = `${slug}-${Date.now()}`;
        
        const dataForValidation = {
          name: rawData.name.trim(),
          slug: uniqueSlug,
          description: rawData.description || undefined,
          featured_image: rawData.featured_image || undefined,
          status: rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed',
          is_active: rawData.is_active || 'true',
        };

        const validatedData = competitionSchema.parse(dataForValidation);

        const sql = `
          UPDATE competitions 
          SET 
            name = $1, slug = $2, description = $3, featured_image = $4, status = $5, 
            is_active = $6, updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
          RETURNING id, name, slug
        `;
        
        const result = await query<{ id: number; name: string; slug: string }>(sql, [
          validatedData.name,
          validatedData.slug ?? null,
          validatedData.description || null,
          validatedData.featured_image || null,
          validatedData.status,
          validatedData.is_active,
          id,
        ]);

        if (result.length === 0) {
          throw new Error('Compétition non trouvée lors de la mise à jour');
        }

        revalidatePath(`/ad/competitions`);
        revalidatePath(`/ad/competitions/${id}`);
        updateTag("competitions");
        updateTag(`competition:${id}`);
        
        return { 
          success: true, 
          competition: result[0],
          message: 'Compétition modifiée avec succès',
          warning: 'Le slug a été modifié car il existait déjà'
        };
      }
    }

    // Si le slug n'existe pas, continuer normalement
    const dataForValidation = {
      name: rawData.name.trim(),
      slug,
      description: rawData.description || undefined,
      featured_image: rawData.featured_image || undefined,
      status: rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed',
      is_active: rawData.is_active || 'true',
    };

    const validatedData = competitionSchema.parse(dataForValidation);

    const sql = `
      UPDATE competitions 
      SET 
        name = $1, slug = $2, description = $3, featured_image = $4, status = $5, 
        is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, slug
    `;
    
    const result = await query<{ id: number; name: string; slug: string }>(sql, [
      validatedData.name,
      validatedData.slug ?? null,
      validatedData.description || null,
      validatedData.featured_image || null,
      validatedData.status,
      validatedData.is_active,
      id,
    ]);

    if (result.length === 0) {
      throw new Error('Compétition non trouvée lors de la mise à jour');
    }

    updateTag("competitions");
    updateTag(`competition:${id}`);
    revalidatePath(`/ad/competitions`);
    revalidatePath(`/ad/competitions/${id}`);
    
    return { 
      success: true, 
      competition: result[0],
      message: 'Compétition modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateCompetition:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Données invalides: ${errorMessages}`);
    }
    
    throw error;
  }
}


export async function deleteCompetition(id: number) {
  updateTag("competitions");
  updateTag(`competition:${id}`);
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
        
    updateTag("competitions");
    updateTag(`competition:${id}`);
    revalidatePath('/ad/competitions');
    
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
  // "use cache";
  // cacheTag("competitions");

  try {
    const sql = `
      SELECT 
        COUNT(*) as total_competitions,
        COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
        COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'postponed') as postponed,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive,
        (SELECT COUNT(*) FROM competition_editions) as total_editions,
        (SELECT COUNT(*) FROM edition_fighters) as total_participants
      FROM competitions
    `;
    
    const result = await queryOne<{
      total_competitions: string;
      upcoming: string;
      ongoing: string;
      completed: string;
      cancelled: string;
      postponed: string;
      active: string;
      inactive: string;
      total_editions: string;
      total_participants: string;
    }>(sql);
    
    return {
      total_competitions: parseInt(result?.total_competitions ?? '0'),
      upcoming: parseInt(result?.upcoming ?? '0'),
      ongoing: parseInt(result?.ongoing ?? '0'),
      completed: parseInt(result?.completed ?? '0'),
      cancelled: parseInt(result?.cancelled ?? '0'),
      postponed: parseInt(result?.postponed ?? '0'),
      by_active: {
        active: parseInt(result?.active ?? '0'),
        inactive: parseInt(result?.inactive ?? '0'),
      },
      total_editions: parseInt(result?.total_editions ?? '0'),
      total_participants: parseInt(result?.total_participants ?? '0'),
    };
  } catch (error) {
    console.error('Error in getCompetitionStats:', error);
    return {
      total_competitions: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      postponed: 0,
      by_active: {
        active: 0,
        inactive: 0,
      },
      total_editions: 0,
      total_participants: 0,
    };
  }
}
export async function updateCompetitionStatus(id: number, status: string) {
  try {
    const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'];
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
    revalidatePath('/ad/competitions');
    revalidatePath(`/ad/competitions/${id}`);
    
    updateTag("competitions");
    updateTag(`competition:${id}`);

    return { 
      success: true, 
      message: `Statut de la compétition mis à jour: ${status}` 
    };
  } catch (error) {
    console.error('Error in updateCompetitionStatus:', error);
    throw new Error('Erreur lors de la mise à jour du statut');
  }
}

// =============================================
// ACTIONS POUR LES ÉDITIONS DE COMPÉTITION
// =============================================

export async function createCompetitionEdition(competitionId: number, formData: FormData) {
  try {
    const rawData = {
      edition_number: formData.get('edition_number'),
      year: formData.get('year'),
      theme: formData.get('theme'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      prize_pool: formData.get('prize_pool'),
      registration_deadline: formData.get('registration_deadline'),
      region_id: formData.get('region_id'),
    };

    const cleanedData = {
      competition_id: competitionId,
      edition_number: Number(rawData.edition_number),
      year: Number(rawData.year),
      theme: rawData.theme as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
      prize_pool: rawData.prize_pool ? Number(rawData.prize_pool) : undefined,
      registration_deadline: rawData.registration_deadline as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
    };

    const validatedData = competitionEditionSchema.parse(cleanedData);

    const sql = `
      INSERT INTO competition_editions (
        competition_id, edition_number, year, theme, start_date, end_date,
        prize_pool, registration_deadline, region_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.competition_id,
      validatedData.edition_number,
      validatedData.year,
      validatedData.theme || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      validatedData.prize_pool || null,
      validatedData.registration_deadline || null,
      validatedData.region_id || null,
    ]);

    revalidatePath(`/competitions/${competitionId}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Édition créée avec succès'
    };
  } catch (error) {
    console.error('Error in createCompetitionEdition:', error);
    throw new Error('Erreur lors de la création de l\'édition');
  }
}