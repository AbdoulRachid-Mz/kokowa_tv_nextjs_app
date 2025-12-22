// @/actions/sub-groups.ts - VERSION CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { subGroupSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { SubGroup, SubGroupFilters, PaginatedResponse } from '@/types';

export async function getSubGroups(
  filters: SubGroupFilters = {}
): Promise<PaginatedResponse<SubGroup>> {
  try {
    const {
      group_id,
      search = '',
      page = 1,
      limit = 20,
      with_group = true,
      with_matches = true,
      with_regions = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['sg.*'];
    const joins: string[] = [];

    // Filtres de base
    if (group_id) {
      whereClause += ` AND sg.group_id = $${params.length + 1}`;
      params.push(group_id);
    }

    if (search) {
      whereClause += ` AND (sg.name ILIKE $${params.length + 1} OR sg.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Jointures et relations
    if (with_group) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'phase', JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type
          )
        ) as group
      `);
      joins.push(`
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
      `);
    }

    if (with_regions) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r1.id,
          'name', r1.name,
          'code', r1.code
        ) as region1,
        JSON_BUILD_OBJECT(
          'id', r2.id,
          'name', r2.name,
          'code', r2.code
        ) as region2
      `);
      joins.push(`
        LEFT JOIN regions r1 ON sg.region1_id = r1.id
        LEFT JOIN regions r2 ON sg.region2_id = r2.id
      `);
    }

    // Jointures pour les ceintures
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', b1.id,
        'color', b1.color
      ) as belt1,
      JSON_BUILD_OBJECT(
        'id', b2.id,
        'color', b2.color
      ) as belt2,
      JSON_BUILD_OBJECT(
        'id', ref.id,
        'first_name', ref.first_name,
        'last_name', ref.last_name,
        'nickname', ref.nickname
      ) as main_referee
    `);
    joins.push(`
      LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
      LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
      LEFT JOIN referees ref ON sg.main_referee_id = ref.id
    `);

    if (with_matches) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', m.id,
            'match_number', m.match_number,
            'match_date', m.match_date,
            'status', m.status,
            'fighter1_id', m.fighter1_id,
            'fighter2_id', m.fighter2_id,
            'winner_fighter_id', m.winner_fighter_id,
            'match_result', m.match_result
          ) ORDER BY m.match_number, m.match_date
        ) FROM matches m WHERE m.sub_group_id = sg.id) as matches
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM sub_groups sg
      ${joins.join(' ')}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM sub_groups sg
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY sg.sub_group_order ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<SubGroup>(
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
    console.error('Error in getSubGroups:', error);
    throw new Error('Erreur lors de la récupération des sous-groupes');
  }
}

export async function getSubGroupById(id: number, options: { 
  with_relations?: boolean;
  relations?: {
    with_group?: boolean;
    with_phase?: boolean;
    with_edition?: boolean;
    with_regions?: boolean;
    with_fighters?: boolean;
    with_belts?: boolean;
    with_referee?: boolean;
    with_matches?: boolean;
    with_edition_regions?: boolean;
    with_edition_fighters?: boolean;
  };
  is_active?: boolean;
} = {}) {
  try {
    const { 
      with_relations = true,
      relations = {},
      is_active 
    } = options;
    
    // Extraire les relations avec des valeurs par défaut
    const {
      with_group = true,
      with_phase = true,
      with_edition = true,
      with_regions = true,
      with_fighters = true,
      with_belts = true,
      with_referee = true,
      with_matches = true,
      with_edition_regions = true, // Désactivé par défaut pour simplifier
      with_edition_fighters = true // Désactivé par défaut pour simplifier
    } = relations;
    
    const params: any[] = [id];
    let whereClause = 'WHERE sg.id = $1';
    
    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND sg.is_active = $${params.length}`;
    }

    if (with_relations) {
      // Construire la requête SQL de manière sécurisée
      const selectFields = ['sg.*'];
      
      // Groupe avec phase et édition
      if (with_group) {
        selectFields.push(`
          JSON_BUILD_OBJECT(
            'id', pg.id,
            'name', pg.name,
            'group_order', pg.group_order,
            'is_active', pg.is_active,
            'is_completed', pg.is_completed,
            'description', pg.description
          ) as phase_group
        `);
        
        if (with_phase) {
          selectFields.push(`
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_active', p.is_active,
              'is_completed', p.is_completed,
              'description', p.description,
              'start_date', p.start_date,
              'end_date', p.end_date
            ) as phase
          `);
          
          if (with_edition) {
            selectFields.push(`
              JSON_BUILD_OBJECT(
                'id', ce.id,
                'edition_number', ce.edition_number,
                'year', ce.year,
                'theme', ce.theme,
                'start_date', ce.start_date,
                'end_date', ce.end_date,
                'is_active', ce.is_active
              ) as edition
            `);
          }
        }
      }
      
      // Régions du sous-groupe
      if (with_regions) {
        selectFields.push(`
          CASE 
            WHEN sg.region1_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r1.id,
                'name', r1.name,
                'code', r1.code,
                'flag_image', r1.flag_image,
                'color', r1.color,
                'stadium_name', r1.stadium_name,
                'stadium_image', r1.stadium_image
              )
            ELSE NULL
          END as region1,
          CASE 
            WHEN sg.region2_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r2.id,
                'name', r2.name,
                'code', r2.code,
                'flag_image', r2.flag_image,
                'color', r2.color,
                'stadium_name', r2.stadium_name,
                'stadium_image', r2.stadium_image
              )
            ELSE NULL
          END as region2
        `);
      }
      
      // Ceintures
      if (with_belts) {
        selectFields.push(`
          CASE 
            WHEN sg.belt_region1 IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b1.id,
                'color', b1.color
              )
            ELSE NULL
          END as belt1,
          CASE 
            WHEN sg.belt_region2 IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b2.id,
                'color', b2.color
              )
            ELSE NULL
          END as belt2
        `);
      }
      
      // Arbitre
      if (with_referee) {
        selectFields.push(`
          CASE 
            WHEN sg.main_referee_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref.id,
                'first_name', ref.first_name,
                'last_name', ref.last_name,
                'nickname', ref.nickname,
                'profile_image', ref.profile_image,
                'license_number', ref.license_number,
                'certification_level', ref.certification_level,
                'region_id', ref.region_id
              )
            ELSE NULL
          END as main_referee
        `);
      }
      
      // Matchs - version simplifiée
      if (with_matches) {
        selectFields.push(`
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', m.id,
                'match_number', m.match_number,
                'match_date', m.match_date,
                'start_time', m.start_time,
                'end_time', m.end_time,
                'status', m.status,
                'match_result', m.match_result,
                'fighter1_id', m.fighter1_id,
                'fighter2_id', m.fighter2_id,
                'winner_fighter_id', m.winner_fighter_id,
                'loser_fighter_id', m.loser_fighter_id,
                'total_duration', m.total_duration,
                'break_count', m.break_count,
                'audience_count', m.audience_count,
                'video_url', m.video_url,
                'live_stream_url', m.live_stream_url,
                'is_active', m.is_active
              ) ORDER BY m.match_number, m.match_date
            )
            FROM matches m
            WHERE m.sub_group_id = sg.id
            ${typeof is_active === 'boolean' ? `AND m.is_active = ${is_active}` : ''}
          ) as matches
        `);
      }
      
      // Construire la clause FROM avec les jointures nécessaires
      let fromClause = 'FROM sub_groups sg';
      
      // Jointures pour le groupe, phase et édition
      if (with_group) {
        fromClause += ' LEFT JOIN phase_groups pg ON sg.group_id = pg.id';
        if (with_phase) {
          fromClause += ' LEFT JOIN phases p ON pg.phase_id = p.id';
          if (with_edition) {
            fromClause += ' LEFT JOIN competition_editions ce ON p.edition_id = ce.id';
          }
        }
      }
      
      // Jointures pour les régions du sous-groupe
      if (with_regions) {
        fromClause += ' LEFT JOIN regions r1 ON sg.region1_id = r1.id';
        fromClause += ' LEFT JOIN regions r2 ON sg.region2_id = r2.id';
      }
      
      // Jointures pour les ceintures
      if (with_belts) {
        fromClause += ' LEFT JOIN belt b1 ON sg.belt_region1 = b1.id';
        fromClause += ' LEFT JOIN belt b2 ON sg.belt_region2 = b2.id';
      }
      
      // Jointures pour l'arbitre
      if (with_referee) {
        fromClause += ' LEFT JOIN referees ref ON sg.main_referee_id = ref.id';
      }
      
      const sql = `SELECT ${selectFields.join(', ')} ${fromClause} ${whereClause}`;
      
      console.log('🔍 SQL Query for getSubGroupById:', sql); // Pour déboguer
      console.log('🔢 Params:', params);

      const result = await queryOne<any>(sql, params);
      
      if (!result) {
        throw new Error('Sous-groupe non trouvé');
      }
      
      // Si on a besoin des lutteurs d'édition, faire une requête séparée
      if (with_edition_fighters && result.edition?.id) {
        const editionId = result.edition.id;
        
        // Récupérer les lutteurs d'édition pour region1
        if (result.region1?.id) {
          const fighters1Sql = `
            SELECT 
              ef.id,
              ef.fighter_id,
              ef.status,
              ef.registration_date,
              f.first_name,
              f.last_name,
              f.nickname,
              f.profile_image,
              f.ranking,
              f.is_champion,
              f.is_active
            FROM edition_fighters ef
            JOIN fighters f ON ef.fighter_id = f.id
            WHERE ef.edition_id = $1 
              AND ef.region_id = $2
              AND ef.status = 'qualified'
              AND f.is_active = true
            ORDER BY f.ranking DESC NULLS LAST, f.first_name, f.last_name
          `;
          
          const fighters1 = await query<any>(fighters1Sql, [editionId, result.region1.id]);
          result.region1.edition_fighters = fighters1;
        }
        
        // Récupérer les lutteurs d'édition pour region2
        if (result.region2?.id) {
          const fighters2Sql = `
            SELECT 
              ef.id,
              ef.fighter_id,
              ef.status,
              ef.registration_date,
              f.first_name,
              f.last_name,
              f.nickname,
              f.profile_image,
              f.ranking,
              f.is_champion,
              f.is_active
            FROM edition_fighters ef
            JOIN fighters f ON ef.fighter_id = f.id
            WHERE ef.edition_id = $1 
              AND ef.region_id = $2
              AND ef.status = 'qualified'
              AND f.is_active = true
            ORDER BY f.ranking DESC NULLS LAST, f.first_name, f.last_name
          `;
          
          const fighters2 = await query<any>(fighters2Sql, [editionId, result.region2.id]);
          result.region2.edition_fighters = fighters2;
        }
      }
      
      // Si on a besoin des régions d'édition, faire une requête séparée
      if (with_edition_regions && result.edition?.id) {
        const editionRegionsSql = `
          SELECT 
            r.id,
            r.name,
            r.code,
            r.flag_image,
            r.color,
            r.stadium_name,
            r.stadium_image,
            er.status as registration_status,
            er.registration_date
          FROM edition_regions er
          JOIN regions r ON er.region_id = r.id
          WHERE er.edition_id = $1 
            AND er.status = 'approved'
          ORDER BY r.name
        `;
        
        const editionRegions = await query<any>(editionRegionsSql, [result.edition.id]);
        result.edition_regions = editionRegions;
      }
      
      // Si on a besoin des détails des lutteurs pour les matchs
      if (with_fighters && result.matches) {
        // Récupérer tous les IDs de lutteurs des matchs
        const fighterIds = new Set<number>();
        result.matches.forEach((match: any) => {
          if (match.fighter1_id) fighterIds.add(match.fighter1_id);
          if (match.fighter2_id) fighterIds.add(match.fighter2_id);
        });
        
        if (fighterIds.size > 0) {
          const fighterIdsArray = Array.from(fighterIds);
          const fightersSql = `
            SELECT 
              id,
              first_name,
              last_name,
              nickname,
              profile_image,
              ranking,
              is_champion
            FROM fighters
            WHERE id = ANY($1)
          `;
          
          const fighters = await query<any>(fightersSql, [fighterIdsArray as any]);
          
          // Créer un map pour un accès rapide
          const fightersMap = new Map();
          fighters.forEach((fighter: any) => {
            fightersMap.set(fighter.id, fighter);
          });
          
          // Ajouter les données des lutteurs aux matchs
          result.matches.forEach((match: any) => {
            if (match.fighter1_id && fightersMap.has(match.fighter1_id)) {
              match.fighter1 = fightersMap.get(match.fighter1_id);
            }
            if (match.fighter2_id && fightersMap.has(match.fighter2_id)) {
              match.fighter2 = fightersMap.get(match.fighter2_id);
            }
          });
        }
      }
      
      return result;
    } else {
      // Sans relations
      const sql = `SELECT * FROM sub_groups sg ${whereClause}`;
      const result = await queryOne<any>(sql, params);
      
      if (!result) {
        throw new Error('Sous-groupe non trouvé');
      }
      
      return result;
    }
  } catch (error) {
    console.error('Error in getSubGroupById:', error);
    throw error;
  }
}

export async function createSubGroup(formData: FormData) {
  try {
    const rawData = {
      group_id: formData.get('group_id'),
      name: formData.get('name'),
      sub_group_order: formData.get('sub_group_order'),
      description: formData.get('description'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: rawData.description as string || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
    };

    const validatedData = subGroupSchema.parse(cleanedData);

    const sql = `
      INSERT INTO sub_groups (
        group_id, name, sub_group_order, description,
        region1_id, region2_id, belt_region1, belt_region2, main_referee_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
    ]);

    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${validatedData.group_id}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Sous-groupe créé avec succès'
    };
  } catch (error) {
    console.error('Error in createSubGroup:', error);
    throw new Error('Erreur lors de la création du sous-groupe');
  }
}

export async function updateSubGroup(id: number, formData: FormData) {
  try {
    const existing = await getSubGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    const rawData = {
      group_id: formData.get('group_id'),
      name: formData.get('name'),
      sub_group_order: formData.get('sub_group_order'),
      description: formData.get('description'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: rawData.description as string || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
    };

    const validatedData = subGroupSchema.parse(cleanedData);

    const sql = `
      UPDATE sub_groups 
      SET 
        group_id = $1, name = $2, sub_group_order = $3, description = $4,
        region1_id = $5, region2_id = $6, belt_region1 = $7, belt_region2 = $8, main_referee_id = $9
      WHERE id = $10
    `;
    
    await query(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
      id,
    ]);

    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${validatedData.group_id}`);
    revalidatePath(`/sub-groups/${id}`);
    return { 
      success: true, 
      message: 'Sous-groupe modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateSubGroup:', error);
    throw error;
  }
}

export async function deleteSubGroup(id: number) {
  try {
    const existing = await getSubGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT COUNT(*) as match_count FROM matches WHERE sub_group_id = $1
    `, [id]);

    const matchCount = parseInt(relatedData[0]?.match_count ?? '0');
    if (matchCount > 0) {
      throw new Error(
        `Impossible de supprimer ce sous-groupe car il contient ${matchCount} match(s)`
      );
    }

    const sql = 'DELETE FROM sub_groups WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${existing.group_id}`);
    return { 
      success: true, 
      message: 'Sous-groupe supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteSubGroup:', error);
    throw new Error('Erreur lors de la suppression du sous-groupe');
  }
}

export async function assignBeltsToSubGroup(
  subGroupId: number,
  belt_region1?: number,
  belt_region2?: number
) {
  try {
    const existing = await getSubGroupById(subGroupId, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    const sql = `
      UPDATE sub_groups 
      SET 
        belt_region1 = $1, belt_region2 = $2
      WHERE id = $3
    `;
    
    await query(sql, [
      belt_region1 || null,
      belt_region2 || null,
      subGroupId,
    ]);

    revalidatePath('/sub-groups');
    revalidatePath(`/sub-groups/${subGroupId}`);
    return { 
      success: true, 
      message: 'Ceintures assignées avec succès'
    };
  } catch (error) {
    console.error('Error in assignBeltsToSubGroup:', error);
    throw new Error('Erreur lors de l\'assignation des ceintures');
  }
}