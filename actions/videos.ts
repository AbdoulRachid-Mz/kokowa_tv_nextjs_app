// @/actions/videos.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { videoSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, revalidateTag } from 'next/cache';
import { Video, VideoFilters, PaginatedResponse } from '@/types';

export async function getVideos(
  filters: VideoFilters = {}
): Promise<PaginatedResponse<Video>> {
  // "use cache";
  // cacheTag("videos");

  try {
    const {
      type,
      category,
      is_live,
      is_featured,
      with_duration = true,
      search = '',
      page = 1,
      limit = 20,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['v.*'];

    // Filtres de base
    if (type) {
      whereClause += ` AND v.type = $${params.length + 1}`;
      params.push(type);
    }

    if (category) {
      whereClause += ` AND v.category = $${params.length + 1}`;
      params.push(category);
    }

    if (is_live !== undefined) {
      whereClause += ` AND v.is_live = $${params.length + 1}`;
      params.push(is_live);
    }

    if (is_featured !== undefined) {
      whereClause += ` AND v.is_featured = $${params.length + 1}`;
      params.push(is_featured);
    }

    if (search) {
      whereClause += ` AND (
        v.title ILIKE $${params.length + 1} 
        OR v.description ILIKE $${params.length + 1}
        OR v.slug ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM videos v
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
      FROM videos v
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN v.is_live = true THEN 1
          WHEN v.is_featured = true THEN 2
          ELSE 3
        END,
        v.published_at DESC NULLS LAST,
        v.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Video>(
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
    console.error('Error in getVideos:', error);
    throw new Error('Erreur lors de la récupération des vidéos');
  }
}

export async function getVideoById(id: number) {
  // "use cache";
  // cacheTag("videos", `video:${id}`);

  try {
    const sql = 'SELECT * FROM videos WHERE id = $1';
    const result = await queryOne<Video>(sql, [id]);
    
    if (!result) {
      throw new Error('Vidéo non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getVideoById:', error);
    throw error;
  }
}

export async function getVideoBySlug(slug: string) {
  // "use cache";
  // cacheTag("videos");

  try {
    const sql = 'SELECT * FROM videos WHERE slug = $1';
    const result = await queryOne<Video>(sql, [slug]);
    
    if (!result) {
      throw new Error('Vidéo non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getVideoBySlug:', error);
    throw error;
  }
}

export async function createVideo(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      video_url: formData.get('video_url'),
      thumbnail_url: formData.get('thumbnail_url'),
      duration: formData.get('duration'),
      type: formData.get('type'),
      category: formData.get('category'),
      is_live: formData.get('is_live'),
      is_featured: formData.get('is_featured'),
    };

    const cleanedData = {
      title: rawData.title as string,
      slug: rawData.slug as string,
      description: rawData.description as string || undefined,
      video_url: rawData.video_url as string,
      thumbnail_url: rawData.thumbnail_url as string || undefined,
      duration: rawData.duration ? Number(rawData.duration) : undefined,
      type: rawData.type as 'youtube' | 'facebook' | 'tiktok' | 'rtmp' | 'upload' | 'vimeo',
      category: rawData.category as 'match' | 'interview' | 'highlights' | 'training' | 'documentary' | 'ceremony',
      is_live: rawData.is_live === 'true',
      is_featured: rawData.is_featured === 'true',
    };

    const validatedData = videoSchema.parse(cleanedData);

    const sql = `
      INSERT INTO videos (
        title, slug, description, video_url, thumbnail_url,
        duration, type, category, is_live, is_featured,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const publishedAt = validatedData.is_live ? new Date().toISOString() : null;

    const result = await query<{ id: number }>(sql, [
      validatedData.title,
      validatedData.slug,
      validatedData.description || null,
      validatedData.video_url,
      validatedData.thumbnail_url || null,
      validatedData.duration || null,
      validatedData.type,
      validatedData.category,
      validatedData.is_live,
      validatedData.is_featured,
      publishedAt,
    ]);

    revalidatePath('/videos');
    revalidatePath('/');
    revalidateTag("videos", {});
    return { 
      success: true, 
      id: result[0].id,
      message: 'Vidéo créée avec succès'
    };
  } catch (error) {
    console.error('Error in createVideo:', error);
    throw new Error('Erreur lors de la création de la vidéo');
  }
}

export async function updateVideo(id: number, formData: FormData) {
  try {
    const existing = await getVideoById(id);
    if (!existing) {
      throw new Error('Vidéo non trouvée');
    }

    const rawData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      video_url: formData.get('video_url'),
      thumbnail_url: formData.get('thumbnail_url'),
      duration: formData.get('duration'),
      type: formData.get('type'),
      category: formData.get('category'),
      is_live: formData.get('is_live'),
      is_featured: formData.get('is_featured'),
    };

    const cleanedData = {
      title: rawData.title as string,
      slug: rawData.slug as string,
      description: rawData.description as string || undefined,
      video_url: rawData.video_url as string,
      thumbnail_url: rawData.thumbnail_url as string || undefined,
      duration: rawData.duration ? Number(rawData.duration) : undefined,
      type: rawData.type as 'youtube' | 'facebook' | 'tiktok' | 'rtmp' | 'upload' | 'vimeo',
      category: rawData.category as 'match' | 'interview' | 'highlights' | 'training' | 'documentary' | 'ceremony',
      is_live: rawData.is_live === 'true',
      is_featured: rawData.is_featured === 'true',
    };

    const validatedData = videoSchema.parse(cleanedData);

    // Gérer la date de publication pour les lives
    let publishedAt = existing.published_at;
    if (!existing.published_at && validatedData.is_live) {
      publishedAt = new Date().toISOString();
    }

    const sql = `
      UPDATE videos 
      SET 
        title = $1, slug = $2, description = $3, video_url = $4,
        thumbnail_url = $5, duration = $6, type = $7, category = $8,
        is_live = $9, is_featured = $10, published_at = $11
      WHERE id = $12
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.slug,
      validatedData.description || null,
      validatedData.video_url,
      validatedData.thumbnail_url || null,
      validatedData.duration || null,
      validatedData.type,
      validatedData.category,
      validatedData.is_live,
      validatedData.is_featured,
      publishedAt ?? null,
      id,
    ]);

    revalidatePath('/videos');
    revalidatePath(`/videos/${id}`);
    revalidatePath(`/videos/${validatedData.slug}`);
    revalidatePath('/');
    revalidateTag("videos", {});
    revalidateTag(`video:${id}`, {});
    return { 
      success: true, 
      message: 'Vidéo modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateVideo:', error);
    throw error;
  }
}

export async function deleteVideo(id: number) {
  try {
    const existing = await getVideoById(id);
    if (!existing) {
      throw new Error('Vidéo non trouvée');
    }

    const sql = 'DELETE FROM videos WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/videos');
    revalidatePath('/');
    revalidateTag("videos", {});
    revalidateTag(`video:${id}`, {});
    return { 
      success: true, 
      message: 'Vidéo supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteVideo:', error);
    throw new Error('Erreur lors de la suppression de la vidéo');
  }
}

export async function incrementVideoViewCount(id: number) {
  try {
    const sql = `
      UPDATE videos 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    
    await query(sql, [id]);
    
    return { success: true };
  } catch (error) {
    console.error('Error in incrementVideoViewCount:', error);
    throw new Error('Erreur lors de l\'incrémentation du compteur de vues');
  }
}

export async function likeVideo(id: number) {
  try {
    const sql = `
      UPDATE videos 
      SET like_count = like_count + 1 
      WHERE id = $1
    `;
    
    await query(sql, [id]);
    
    revalidatePath('/videos');
    return { success: true, message: 'Vidéo likée' };
  } catch (error) {
    console.error('Error in likeVideo:', error);
    throw new Error('Erreur lors du like de la vidéo');
  }
}

export async function getLiveVideos() {
  // "use cache";
  // cacheTag("videos");

  try {
    const sql = `
      SELECT *
      FROM videos
      WHERE is_live = true
      ORDER BY published_at DESC
    `;

    const result = await query<Video>(sql);
    return result;
  } catch (error) {
    console.error('Error in getLiveVideos:', error);
    throw new Error('Erreur lors de la récupération des vidéos en direct');
  }
}

export async function getFeaturedVideos(limit: number = 10) {
  // "use cache";
  // cacheTag("videos");

  try {
    const sql = `
      SELECT *
      FROM videos
      WHERE is_featured = true AND is_live = false
      ORDER BY published_at DESC
      LIMIT $1
    `;

    const result = await query<Video>(sql, [limit]);
    return result;
  } catch (error) {
    console.error('Error in getFeaturedVideos:', error);
    throw new Error('Erreur lors de la récupération des vidéos en vedette');
  }
}

export async function getVideosByCategory(category: string, filters: Omit<VideoFilters, 'category'> = {}) {
  return getVideos({ ...filters, category: category as VideoFilters['category'] });
}

export async function getPopularVideos(limit: number = 10) {
  // "use cache";
  // cacheTag("videos");

  try {
    const sql = `
      SELECT *
      FROM videos
      WHERE is_live = false
      ORDER BY view_count DESC, like_count DESC
      LIMIT $1
    `;

    const result = await query<Video>(sql, [limit]);
    return result;
  } catch (error) {
    console.error('Error in getPopularVideos:', error);
    throw new Error('Erreur lors de la récupération des vidéos populaires');
  }
}

export async function getVideoStats() {
  // "use cache";
  // cacheTag("videos");

  try {
    const sql = `
      SELECT 
        category,
        COUNT(*) as total,
        SUM(view_count) as total_views,
        SUM(like_count) as total_likes,
        AVG(view_count) as avg_views,
        AVG(like_count) as avg_likes
      FROM videos
      GROUP BY category
      ORDER BY total DESC
    `;

    const result = await query<{
      category: string;
      total: string;
      total_views: string;
      total_likes: string;
      avg_views: string;
      avg_likes: string;
    }>(sql);

    return result.map(row => ({
      category: row.category,
      total: parseInt(row.total),
      total_views: parseInt(row.total_views || '0'),
      total_likes: parseInt(row.total_likes || '0'),
      avg_views: parseFloat(row.avg_views || '0'),
      avg_likes: parseFloat(row.avg_likes || '0')
    }));
  } catch (error) {
    console.error('Error in getVideoStats:', error);
    throw new Error('Erreur lors de la récupération des statistiques des vidéos');
  }
}