'use server';
// @/actions/mobile/referees.ts

import { query } from '@/lib/db/neon-client';

export interface MobileRefereeFilters {
  regionId?: number;
  isActive?: boolean;
  certificationLevel?: string;
  experienceMin?: number;
  search?: string;
  page?: number;
  limit?: number;
  withRegion?: boolean;
  withSubGroups?: boolean;
  sortOrder?: 'asc' | 'desc';
}


export async function getMobileReferees(filters: MobileRefereeFilters = {}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Construire la clause WHERE dynamiquement
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.regionId) {
      conditions.push(`r.region_id = $${paramIndex}`);
      params.push(filters.regionId);
      paramIndex++;
    }

    if (typeof filters.isActive === 'boolean') {
      conditions.push(`r.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters.certificationLevel) {
      conditions.push(`r.certification_level = $${paramIndex}`);
      params.push(filters.certificationLevel);
      paramIndex++;
    }

    if (filters.experienceMin) {
      conditions.push(`r.experience_years >= $${paramIndex}`);
      params.push(filters.experienceMin);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(
        r.first_name ILIKE $${paramIndex} OR 
        r.last_name ILIKE $${paramIndex} OR 
        r.nickname ILIKE $${paramIndex} OR
        r.license_number ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Obtenir le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM referees r
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total || '0');

    // Construire les champs de sélection
    const selectFields = [
      'r.id',
      'r.first_name as "firstName"',
      'r.last_name as "lastName"',
      'r.nickname',
      'r.profile_image as "profileImage"',
      'r.license_number as "licenseNumber"',
      'r.certification_level as "certificationLevel"',
      'r.experience_years as "experienceYears"',
      'r.is_active as "isActive"',
      'r.social_links as "socialLinks"'
    ];

    const sql = `
      SELECT 
        ${selectFields.join(', ')}
      FROM referees r
      ${whereClause}
      ORDER BY r.last_name ASC, r.first_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const referees = await query(sql, params);

    // Récupérer les compteurs de sous-groupes et de matches si demandé
    if (filters.withSubGroups === true && referees.length > 0) {
      for (const referee of referees) {
        const stats = await getRefereeCounts(referee.id);
        referee.subGroupsCount = stats.subGroupsCount;
        referee.matchesCount = stats.matchesCount;
      }
    }

    // Calculer la pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        referees,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary: {
          total,
          active: filters.isActive === undefined 
            ? await countActiveReferees(filters)
            : filters.isActive ? total : 0
        },
        timestamp: new Date().toISOString()
      },
      message: 'Arbitres récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileReferees:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des arbitres',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// getRefereeCounts
async function getRefereeCounts(refereeId: number) {
  const sql = `
    SELECT 
      COUNT(DISTINCT sg.id) as "subGroupsCount",
      COUNT(DISTINCT m.id) as "matchesCount"
    FROM sub_groups sg
    LEFT JOIN matches m ON sg.id = m.sub_group_id
    WHERE sg.referee_id = $1
  `;
  const result = await query<{ subGroupsCount: string, matchesCount: string }>(sql, [refereeId]);
  return {
    subGroupsCount: parseInt(result[0]?.subGroupsCount || '0'),
    matchesCount: parseInt(result[0]?.matchesCount || '0')
  };
}

export async function getMobileRefereeById(id: number, options: {
  withRegion?: boolean;
  withSubGroups?: boolean;
  withStatistics?: boolean;
} = {}) {
  try {
    const { 
      withRegion = true, 
      withSubGroups = false, 
      withStatistics = false 
    } = options;

    // Vérifier si l'arbitre existe
    const existsSql = 'SELECT id FROM referees WHERE id = $1';
    const existsResult = await query(existsSql, [id]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Arbitre non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Construire les champs de sélection
    const selectFields = [
      'r.id',
      'r.first_name as "firstName"',
      'r.last_name as "lastName"',
      'r.nickname',
      'r.profile_image as "profileImage"',
      'r.license_number as "licenseNumber"',
      'r.certification_level as "certificationLevel"',
      'r.experience_years as "experienceYears"',
      'r.is_active as "isActive"',
      'r.social_links as "socialLinks"'
    ];

    // Requête pour obtenir l'arbitre
    const refereeSql = `
      SELECT ${selectFields.join(', ')}
      FROM referees r
      WHERE r.id = $1
    `;

    const result = await query(refereeSql, [id]);
    const referee = result[0];

    if (!referee) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Arbitre non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer les compteurs si demandé
    if (withSubGroups || withStatistics) {
      const counts = await getRefereeCounts(id);
      referee.subGroupsCount = counts.subGroupsCount;
      referee.matchesCount = counts.matchesCount;
    }

    return {
      success: true,
      data: {
        referee,
        timestamp: new Date().toISOString()
      },
      message: 'Arbitre récupéré avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileRefereeById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération de l\'arbitre',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function createMobileReferee(formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      nickname: formData.get('nickname'),
      regionId: formData.get('regionId'),
      birthDate: formData.get('birthDate'),
      profileImage: formData.get('profileImage'),
      licenseNumber: formData.get('licenseNumber'),
      certificationLevel: formData.get('certificationLevel'),
      experienceYears: formData.get('experienceYears'),
      isActive: formData.get('isActive') === 'true',
      socialLinks: formData.get('socialLinks')
    };

    // Validation des données requises
    if (!rawData.firstName || !rawData.lastName) {
      return {
        success: false,
        error: {
          code: 400,
          message: 'Le prénom et le nom sont requis',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Vérifier si le numéro de licence existe déjà
    if (rawData.licenseNumber) {
      const checkSql = 'SELECT id FROM referees WHERE license_number = $1';
      const existing = await query(checkSql, [rawData.licenseNumber as string]);

      if (existing.length > 0) {
        return {
          success: false,
          error: {
            code: 409,
            message: 'Un arbitre avec ce numéro de licence existe déjà',
            timestamp: new Date().toISOString()
          }
        };
      }
    }

    // Créer l'arbitre
    const insertSql = `
      INSERT INTO referees (
        first_name, 
        last_name, 
        nickname, 
        region_id, 
        birth_date, 
        profile_image, 
        license_number, 
        certification_level, 
        experience_years, 
        is_active, 
        social_links
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        first_name as "firstName",
        last_name as "lastName",
        nickname,
        region_id as "regionId",
        birth_date as "birthDate",
        profile_image as "profileImage",
        license_number as "licenseNumber",
        certification_level as "certificationLevel",
        experience_years as "experienceYears",
        is_active as "isActive",
        created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      rawData.firstName as string,
      rawData.lastName as string,
      rawData.nickname as string || null,
      (rawData.regionId as unknown as number) || null,
      (rawData.birthDate as unknown as string) || null,
      rawData.profileImage as string || null,
      rawData.licenseNumber as string || null,
      rawData.certificationLevel as string || null,
      (rawData.experienceYears as unknown as number) || 0,
      rawData.isActive !== false,
      rawData.socialLinks as string || null
    ]);

    const referee = result[0];

    return {
      success: true,
      data: {
        referee,
        timestamp: new Date().toISOString()
      },
      message: 'Arbitre créé avec succès'
    };
  } catch (error) {
    console.error('Error in createMobileReferee:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la création de l\'arbitre',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function updateMobileReferee(id: number, formData: FormData) {
  try {
    // Vérifier si l'arbitre existe
    const existsResult = await query('SELECT id FROM referees WHERE id = $1', [id]);
    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Arbitre non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      nickname: formData.get('nickname'),
      regionId: formData.get('regionId'),
      birthDate: formData.get('birthDate'),
      profileImage: formData.get('profileImage'),
      licenseNumber: formData.get('licenseNumber'),
      certificationLevel: formData.get('certificationLevel'),
      experienceYears: formData.get('experienceYears'),
      isActive: formData.get('isActive'),
      socialLinks: formData.get('socialLinks')
    };

    // Construire dynamiquement les champs à mettre à jour
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (rawData.firstName) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(rawData.firstName);
      paramIndex++;
    }

    if (rawData.lastName) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(rawData.lastName);
      paramIndex++;
    }

    if (rawData.nickname !== undefined) {
      updates.push(`nickname = $${paramIndex}`);
      params.push(rawData.nickname || null);
      paramIndex++;
    }

    if (rawData.regionId !== undefined) {
      updates.push(`region_id = $${paramIndex}`);
      params.push(rawData.regionId || null);
      paramIndex++;
    }

    if (rawData.birthDate !== undefined) {
      updates.push(`birth_date = $${paramIndex}`);
      params.push(rawData.birthDate || null);
      paramIndex++;
    }

    if (rawData.profileImage !== undefined) {
      updates.push(`profile_image = $${paramIndex}`);
      params.push(rawData.profileImage || null);
      paramIndex++;
    }

    if (rawData.licenseNumber !== undefined) {
      updates.push(`license_number = $${paramIndex}`);
      params.push(rawData.licenseNumber || null);
      paramIndex++;
    }

    if (rawData.certificationLevel !== undefined) {
      updates.push(`certification_level = $${paramIndex}`);
      params.push(rawData.certificationLevel || null);
      paramIndex++;
    }

    if (rawData.experienceYears !== undefined) {
      updates.push(`experience_years = $${paramIndex}`);
      params.push(rawData.experienceYears || 0);
      paramIndex++;
    }

    if (rawData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(rawData.isActive === 'true');
      paramIndex++;
    }

    if (rawData.socialLinks !== undefined) {
      updates.push(`social_links = $${paramIndex}`);
      params.push(rawData.socialLinks || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return {
        success: false,
        error: {
          code: 400,
          message: 'Aucune donnée à mettre à jour',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Ajouter la mise à jour de updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Mettre à jour l'arbitre
    const updateSql = `
      UPDATE referees 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        first_name as "firstName",
        last_name as "lastName",
        nickname,
        region_id as "regionId",
        birth_date as "birthDate",
        profile_image as "profileImage",
        license_number as "licenseNumber",
        certification_level as "certificationLevel",
        experience_years as "experienceYears",
        is_active as "isActive",
        updated_at as "updatedAt"
    `;

    params.push(id);
    const result = await query(updateSql, params);
    const referee = result[0];

    return {
      success: true,
      data: {
        referee,
        timestamp: new Date().toISOString()
      },
      message: 'Arbitre mis à jour avec succès'
    };
  } catch (error) {
    console.error('Error in updateMobileReferee:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la mise à jour de l\'arbitre',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function deleteMobileReferee(id: number) {
  try {
    // Vérifier si l'arbitre existe
    const existsResult = await query('SELECT id FROM referees WHERE id = $1', [id]);
    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Arbitre non trouvé',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Vérifier si l'arbitre est assigné à des sous-groupes
    const assignedSql = 'SELECT COUNT(*) as count FROM sub_groups WHERE main_referee_id = $1';
    const assignedResult = await query<{ count: string }>(assignedSql, [id]);
    const assignedCount = parseInt(assignedResult[0]?.count || '0');

    if (assignedCount > 0) {
      return {
        success: false,
        error: {
          code: 409,
          message: `Impossible de supprimer l'arbitre : il est assigné à ${assignedCount} sous-groupe(s)`,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Supprimer l'arbitre
    const deleteSql = 'DELETE FROM referees WHERE id = $1';
    await query(deleteSql, [id]);

    return {
      success: true,
      data: {
        deletedId: id,
        timestamp: new Date().toISOString()
      },
      message: 'Arbitre supprimé avec succès'
    };
  } catch (error) {
    console.error('Error in deleteMobileReferee:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la suppression de l\'arbitre',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Fonctions auxiliaires
async function getRefereeSubGroups(refereeId: number) {
  const sql = `
    SELECT 
      sg.id,
      sg.name,
      sg.sub_group_order as "subGroupOrder",
      sg.period,
      sg.status,
      sg.is_completed as "isCompleted",
      sg.created_at as "createdAt",
      
      JSON_BUILD_OBJECT(
        'id', pg.id,
        'name', pg.name,
        'groupOrder', pg.group_order,
        'phase', JSON_BUILD_OBJECT(
          'id', p.id,
          'name', p.name,
          'phaseType', p.phase_type,
          'edition', JSON_BUILD_OBJECT(
            'id', e.id,
            'editionNumber', e.edition_number,
            'year', e.year,
            'theme', e.theme
          )
        )
      ) as "phaseGroup"
      
    FROM sub_groups sg
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN competition_editions e ON p.edition_id = e.id
    WHERE sg.main_referee_id = $1
    ORDER BY sg.created_at DESC
  `;

  return await query(sql, [refereeId]);
}

async function getRefereeStatistics(refereeId: number) {
  // Compter les sous-groupes arbitrés
  const subGroupsSql = `
    SELECT COUNT(*) as count
    FROM sub_groups 
    WHERE main_referee_id = $1
  `;

  const subGroupsResult = await query<{ count: string }>(subGroupsSql, [refereeId]);
  const subGroupsCount = parseInt(subGroupsResult[0]?.count || '0');

  // Compter les matchs arbitrés (via les sous-groupes)
  const matchesSql = `
    SELECT COUNT(*) as count
    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    WHERE sg.main_referee_id = $1
  `;

  const matchesResult = await query<{ count: string }>(matchesSql, [refereeId]);
  const matchesCount = parseInt(matchesResult[0]?.count || '0');

  // Obtenir les types de matchs arbitrés
  const matchTypesSql = `
    SELECT 
      m.status,
      COUNT(*) as count
    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    WHERE sg.main_referee_id = $1
    GROUP BY m.status
    ORDER BY count DESC
  `;

  const matchTypes = await query(matchTypesSql, [refereeId]);

  return {
    subGroups: subGroupsCount,
    matches: matchesCount,
    matchTypes
  };
}

async function countActiveReferees(filters: MobileRefereeFilters) {
  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];

  if (filters.regionId) {
    conditions.push('region_id = $1');
    params.push(filters.regionId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `SELECT COUNT(*) as count FROM referees ${whereClause}`;
  const result = await query<{ count: string }>(sql, params);
  
  return parseInt(result[0]?.count || '0');
}