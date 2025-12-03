// lib/actions/media.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { mediaSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Media, MediaFilters, PaginatedResponse } from '@/types';

export async function getMedia(
  filters: MediaFilters = {}
): Promise<PaginatedResponse<Media>> {
  try {
    const {
      file_type,
      uploader_id,
      entity_type,
      entity_id,
      is_featured,
      search = '',
      page = 1,
      limit = 20,
      with_uploader = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['m.*'];
    const joins: string[] = [];

    // Filtres de base
    if (file_type) {
      whereClause += ` AND m.file_type = $${params.length + 1}`;
      params.push(file_type);
    }

    if (uploader_id) {
      whereClause += ` AND m.uploader_id = $${params.length + 1}`;
      params.push(uploader_id);
    }

    if (entity_type) {
      whereClause += ` AND m.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (entity_id) {
      whereClause += ` AND m.entity_id = $${params.length + 1}`;
      params.push(entity_id);
    }

    if (is_featured !== undefined) {
      whereClause += ` AND m.is_featured = $${params.length + 1}`;
      params.push(is_featured);
    }

    if (search) {
      whereClause += ` AND (
        m.title ILIKE $${params.length + 1} 
        OR m.description ILIKE $${params.length + 1}
        OR m.alt_text ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Jointures pour les relations
    if (with_uploader) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as uploader
      `);
      joins.push('LEFT JOIN users u ON m.uploader_id = u.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM media m
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
      FROM media m
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Media>(
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
    console.error('Error in getMedia:', error);
    throw new Error('Erreur lors de la récupération des médias');
  }
}

export async function getMediaById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM media WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          m.*,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name
          ) as uploader
        FROM media m
        LEFT JOIN users u ON m.uploader_id = u.id
        WHERE m.id = $1
      `;
    }

    const result = await queryOne<Media>(sql, params);
    
    if (!result) {
      throw new Error('Média non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getMediaById:', error);
    throw error;
  }
}

export async function createMedia(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      file_path: formData.get('file_path'),
      file_type: formData.get('file_type'),
      mime_type: formData.get('mime_type'),
      file_size: formData.get('file_size'),
      alt_text: formData.get('alt_text'),
      description: formData.get('description'),
      uploader_id: formData.get('uploader_id'),
      is_featured: formData.get('is_featured'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
    };

    const cleanedData = {
      title: rawData.title as string,
      file_path: rawData.file_path as string,
      file_type: rawData.file_type as 'image' | 'video' | 'document' | 'audio',
      mime_type: rawData.mime_type as string || undefined,
      file_size: rawData.file_size ? Number(rawData.file_size) : undefined,
      alt_text: rawData.alt_text as string || undefined,
      description: rawData.description as string || undefined,
      uploader_id: Number(rawData.uploader_id),
      is_featured: rawData.is_featured === 'true',
      entity_type: rawData.entity_type as string || undefined,
      entity_id: rawData.entity_id ? Number(rawData.entity_id) : undefined,
    };

    const validatedData = mediaSchema.parse(cleanedData);

    const sql = `
      INSERT INTO media (
        title, file_path, file_type, mime_type, file_size,
        alt_text, description, uploader_id, is_featured,
        entity_type, entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.title,
      validatedData.file_path,
      validatedData.file_type,
      validatedData.mime_type || null,
      validatedData.file_size || null,
      validatedData.alt_text || null,
      validatedData.description || null,
      validatedData.uploader_id,
      validatedData.is_featured ?? false,
      validatedData.entity_type || null,
      validatedData.entity_id || null,
    ]);

    revalidatePath('/media');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Média créé avec succès'
    };
  } catch (error) {
    console.error('Error in createMedia:', error);
    throw new Error('Erreur lors de la création du média');
  }
}

export async function updateMedia(id: number, formData: FormData) {
  try {
    const existing = await getMediaById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Média non trouvé');
    }

    const rawData = {
      title: formData.get('title'),
      file_path: formData.get('file_path'),
      file_type: formData.get('file_type'),
      mime_type: formData.get('mime_type'),
      file_size: formData.get('file_size'),
      alt_text: formData.get('alt_text'),
      description: formData.get('description'),
      uploader_id: formData.get('uploader_id'),
      is_featured: formData.get('is_featured'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
    };

    const cleanedData = {
      title: rawData.title as string,
      file_path: rawData.file_path as string,
      file_type: rawData.file_type as 'image' | 'video' | 'document' | 'audio',
      mime_type: rawData.mime_type as string || undefined,
      file_size: rawData.file_size ? Number(rawData.file_size) : undefined,
      alt_text: rawData.alt_text as string || undefined,
      description: rawData.description as string || undefined,
      uploader_id: Number(rawData.uploader_id),
      is_featured: rawData.is_featured === 'true',
      entity_type: rawData.entity_type as string || undefined,
      entity_id: rawData.entity_id ? Number(rawData.entity_id) : undefined,
    };

    const validatedData = mediaSchema.parse(cleanedData);

    const sql = `
      UPDATE media 
      SET 
        title = $1, file_path = $2, file_type = $3, mime_type = $4,
        file_size = $5, alt_text = $6, description = $7,
        uploader_id = $8, is_featured = $9, entity_type = $10,
        entity_id = $11
      WHERE id = $12
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.file_path,
      validatedData.file_type,
      validatedData.mime_type || null,
      validatedData.file_size || null,
      validatedData.alt_text || null,
      validatedData.description || null,
      validatedData.uploader_id,
      validatedData.is_featured ?? false,
      validatedData.entity_type || null,
      validatedData.entity_id || null,
      id,
    ]);

    revalidatePath('/media');
    revalidatePath(`/media/${id}`);
    return { 
      success: true, 
      message: 'Média modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateMedia:', error);
    throw error;
  }
}

export async function deleteMedia(id: number) {
  try {
    const existing = await getMediaById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Média non trouvé');
    }

    const sql = 'DELETE FROM media WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/media');
    return { 
      success: true, 
      message: 'Média supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteMedia:', error);
    throw new Error('Erreur lors de la suppression du média');
  }
}

export async function getMediaByEntity(entityType: string, entityId: number, filters: Omit<MediaFilters, 'entity_type' | 'entity_id'> = {}) {
  return getMedia({ ...filters, entity_type: entityType, entity_id: entityId });
}

export async function getFeaturedMedia(limit: number = 10) {
  try {
    const sql = `
      SELECT *
      FROM media
      WHERE is_featured = true
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await query<Media>(sql, [limit]);
    return result;
  } catch (error) {
    console.error('Error in getFeaturedMedia:', error);
    throw new Error('Erreur lors de la récupération des médias en vedette');
  }
}

export async function getMediaStats() {
  try {
    const sql = `
      SELECT 
        file_type,
        COUNT(*) as total,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size
      FROM media
      GROUP BY file_type
      ORDER BY total DESC
    `;

    const result = await query<{
      file_type: string;
      total: string;
      total_size: string;
      avg_size: string;
    }>(sql);

    return result.map(row => ({
      file_type: row.file_type,
      total: parseInt(row.total),
      total_size: parseInt(row.total_size || '0'),
      avg_size: parseFloat(row.avg_size || '0')
    }));
  } catch (error) {
    console.error('Error in getMediaStats:', error);
    throw new Error('Erreur lors de la récupération des statistiques des médias');
  }
}