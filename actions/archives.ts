// @/actions/archives.ts
// archives
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath } from 'next/cache';
import { ArchiveFighterAchievementFilters, Fighter, FighterFilters, PaginatedResponse } from '@/types';

export async function getArchiveFighterAchievements(
  filters: ArchiveFighterAchievementFilters = {}
): Promise<PaginatedResponse<any>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      fighter_id,
      region_id,
      edition_id,
      year,
      position,
      archive_reason,
      date_from,
      date_to,
      with_fighter = false,
      with_region = false,
      with_edition = false,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields = ['faa.*'];

    // Filtre de recherche (sur le titre ou la description)
    if (search) {
      whereClause += ` AND (
        faa.title ILIKE $${params.length + 1} OR 
        faa.description ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    if (fighter_id !== undefined) {
      whereClause += ` AND faa.fighter_id = $${params.length + 1}`;
      params.push(fighter_id);
    }

    if (region_id !== undefined) {
      whereClause += ` AND faa.region_id = $${params.length + 1}`;
      params.push(region_id);
    }

    if (edition_id !== undefined) {
      whereClause += ` AND faa.edition_id = $${params.length + 1}`;
      params.push(edition_id);
    }

    if (year !== undefined) {
      whereClause += ` AND faa.year = $${params.length + 1}`;
      params.push(year);
    }

    if (position) {
      whereClause += ` AND faa.position = $${params.length + 1}`;
      params.push(position);
    }

    if (archive_reason) {
      whereClause += ` AND faa.archive_reason ILIKE $${params.length + 1}`;
      params.push(`%${archive_reason}%`);
    }

    if (date_from) {
      whereClause += ` AND DATE(faa.created_at) >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ` AND DATE(faa.created_at) <= $${params.length + 1}`;
      params.push(date_to);
    }

    // Jointures optionnelles
    if (with_fighter) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname
        ) as fighter
      `);
    }

    if (with_region) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color,
          'flag_image', r.flag_image
        ) as region
      `);
    }

    if (with_edition) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', ce.id,
          'name', ce.name,
          'year', ce.year,
          'start_date', ce.start_date,
          'end_date', ce.end_date,
          'competition_id', ce.competition_id
        ) as edition
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighter_achievements_archives faa
      ${with_fighter ? 'LEFT JOIN fighters f ON faa.fighter_id = f.id' : ''}
      ${with_region ? 'LEFT JOIN regions r ON faa.region_id = r.id' : ''}
      ${with_edition ? 'LEFT JOIN competition_editions ce ON faa.edition_id = ce.id' : ''}
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
      FROM fighter_achievements_archives faa
      ${with_fighter ? 'LEFT JOIN fighters f ON faa.fighter_id = f.id' : ''}
      ${with_region ? 'LEFT JOIN regions r ON faa.region_id = r.id' : ''}
      ${with_edition ? 'LEFT JOIN competition_editions ce ON faa.edition_id = ce.id' : ''}
      ${whereClause}
      ORDER BY faa.year DESC, faa.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<any>(dataSql, [...params, validatedLimit, offset]);

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error in getArchiveFighterAchievements:', error);
    throw new Error('Erreur lors de la récupération des archives de palmarès');
  }
}

export async function archiveFighterAchievement(id: number, archiveReason: string) {
  try {
    const sql = `
      INSERT INTO fighter_achievements_archives (
        fighter_id, region_id, title, edition_id, year, position,
        description, medal_image, archive_reason, original_id, created_at
      )
      SELECT 
        fighter_id, region_id, title, edition_id, year, position,
        description, medal_image, $2, id, CURRENT_TIMESTAMP
      FROM fighter_achievements
      WHERE id = $1
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [id, archiveReason]);

    if (result.length === 0) {
      throw new Error('Palmarès non trouvé');
    }

    // Supprimer l'original
    await query('DELETE FROM fighter_achievements WHERE id = $1', [id]);

    revalidatePath('/admin/fighter-achievements');
    return {
      success: true,
      message: 'Palmarès archivé avec succès',
    };
  } catch (error) {
    console.error('Error in archiveFighterAchievement:', error);
    throw new Error(`Erreur lors de l’archivage du palmarès: ${(error as Error).message}`);
  }
}

export async function restoreArchiveFighterAchievement(archiveId: number) {
  try {
    const sql = `
      INSERT INTO fighter_achievements (
        fighter_id, region_id, title, edition_id, year, position,
        description, medal_image
      )
      SELECT 
        fighter_id, region_id, title, edition_id, year, position,
        description, medal_image
      FROM fighter_achievements_archives
      WHERE id = $1
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [archiveId]);

    if (result.length === 0) {
      throw new Error('Archive non trouvée');
    }

    // Supprimer l’archive
    await query('DELETE FROM fighter_achievements_archives WHERE id = $1', [archiveId]);

    revalidatePath('/admin/fighter-achievements');
    return {
      success: true,
      message: 'Palmarès restauré avec succès',
    };
  } catch (error) {
    console.error('Error in restoreArchiveFighterAchievement:', error);
    throw new Error(`Erreur lors de la restauration du palmarès: ${(error as Error).message}`);
  }
}


// Archive CRUD operations
export async function createArchiveFighterAchievement(validatedData: any) {
  try {
    const sql = `
      INSERT INTO fighter_achievements_archives (
        fighter_id, region_id, title, edition_id, year, position,
        description, medal_image, archive_reason, original_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.fighter_id,
      validatedData.region_id || null,
      validatedData.title,
      validatedData.edition_id || null,
      validatedData.year,
      validatedData.position || null,
      validatedData.description || null,
      validatedData.medal_image || null,
      validatedData.archive_reason,
      validatedData.original_id || null,
    ]);

    revalidatePath('/admin/fighter-achievements-archives');
    return {
      success: true,
      id: result[0].id,
      message: 'Archive de palmarès créée avec succès',
    };
  } catch (error) {
    console.error('Error in createArchiveFighterAchievement:', error);
    throw new Error(`Erreur lors de la création de l'archive: ${(error as Error).message}`);
  }
}

export async function updateArchiveFighterAchievement(id: number, formData: FormData) {
  try {
    const existing = await queryOne<any>('SELECT * FROM fighter_achievements_archives WHERE id = $1', [id]);
    if (!existing) {
      throw new Error('Archive non trouvée');
    }

    const rawData = {
      fighter_id: formData.get('fighter_id'),
      region_id: formData.get('region_id'),
      title: formData.get('title'),
      edition_id: formData.get('edition_id'),
      year: formData.get('year'),
      position: formData.get('position'),
      description: formData.get('description'),
      medal_image: formData.get('medal_image'),
      archive_reason: formData.get('archive_reason'),
    };

    const cleanedData = {
      fighter_id: Number(rawData.fighter_id),
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      title: rawData.title as string,
      edition_id: rawData.edition_id ? Number(rawData.edition_id) : undefined,
      year: Number(rawData.year),
      position: rawData.position ? Number(rawData.position) : undefined,
      description: rawData.description as string || undefined,
      medal_image: rawData.medal_image as string || undefined,
      archive_reason: rawData.archive_reason as string,
    };

    const sql = `
      UPDATE fighter_achievements_archives
      SET
        fighter_id = $1, region_id = $2, title = $3, edition_id = $4,
        year = $5, position = $6, description = $7, medal_image = $8,
        archive_reason = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `;

    await query(sql, [
      cleanedData.fighter_id,
      cleanedData.region_id || null,
      cleanedData.title,
      cleanedData.edition_id || null,
      cleanedData.year,
      cleanedData.position || null,
      cleanedData.description || null,
      cleanedData.medal_image || null,
      cleanedData.archive_reason,
      id,
    ]);

    revalidatePath('/admin/fighter-achievements-archives');
    return {
      success: true,
      message: 'Archive modifiée avec succès',
    };
  } catch (error) {
    console.error('Error in updateArchiveFighterAchievement:', error);
    throw new Error(`Erreur lors de la modification de l'archive: ${(error as Error).message}`);
  }
}

export async function deleteArchiveFighterAchievement(id: number) {
  try {
    const existing = await queryOne<any>('SELECT * FROM fighter_achievements_archives WHERE id = $1', [id]);
    if (!existing) {
      throw new Error('Archive non trouvée');
    }

    await query('DELETE FROM fighter_achievements_archives WHERE id = $1', [id]);

    revalidatePath('/admin/fighter-achievements-archives');
    return {
      success: true,
      message: 'Archive supprimée avec succès',
    };
  } catch (error) {
    console.error('Error in deleteArchiveFighterAchievement:', error);
    throw new Error(`Erreur lors de la suppression de l'archive: ${(error as Error).message}`);
  }
}

export async function getArchiveFighterAchievementsStats() {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_archives,
        COUNT(*) FILTER (WHERE archive_reason ILIKE '%correction%') as correction_archives,
        COUNT(*) FILTER (WHERE archive_reason ILIKE '%duplicate%') as duplicate_archives,
        COUNT(*) FILTER (WHERE archive_reason ILIKE '%error%') as error_archives,
        AVG(year) as avg_year,
        MIN(year) as oldest_year,
        MAX(year) as newest_year
      FROM fighter_achievements_archives
    `;

    const result = await queryOne<{
      total_archives: string;
      correction_archives: string;
      duplicate_archives: string;
      error_archives: string;
      avg_year: string;
      oldest_year: string;
      newest_year: string;
    }>(sql);

    return {
      total_archives: parseInt(result?.total_archives ?? '0'),
      correction_archives: parseInt(result?.correction_archives ?? '0'),
      duplicate_archives: parseInt(result?.duplicate_archives ?? '0'),
      error_archives: parseInt(result?.error_archives ?? '0'),
      avg_year: parseFloat(result?.avg_year ?? '0'),
      oldest_year: parseInt(result?.oldest_year ?? '0'),
      newest_year: parseInt(result?.newest_year ?? '0'),
    };
  } catch (error) {
    console.error('Error in getArchiveFighterAchievementsStats:', error);
    return {
      total_archives: 0,
      correction_archives: 0,
      duplicate_archives: 0,
      error_archives: 0,
      avg_year: 0,
      oldest_year: 0,
      newest_year: 0,
    };
  }
}
