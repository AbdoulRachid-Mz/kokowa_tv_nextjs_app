'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { advertisementSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Advertisement, AdvertisementFilters, PaginatedResponse, AdvertisementStats } from '@/types';

export async function getAdvertisements(
  filters: AdvertisementFilters = {}
): Promise<PaginatedResponse<Advertisement>> {
  try {
    const {
      position,
      media_type,
      is_active,
      start_date_from,
      start_date_to,
      end_date_from,
      end_date_to,
      advertiser_name,
      target_audience,
      with_clicks = false,
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields = ['a.*'];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (
        a.title ILIKE $${params.length + 1} OR 
        a.description ILIKE $${params.length + 1} OR 
        a.advertiser_name ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Filtres spécifiques
    if (position) {
      whereClause += ` AND a.position = $${params.length + 1}`;
      params.push(position);
    }

    if (media_type) {
      whereClause += ` AND a.media_type = $${params.length + 1}`;
      params.push(media_type);
    }

    if (is_active !== undefined) {
      whereClause += ` AND a.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (advertiser_name) {
      whereClause += ` AND a.advertiser_name ILIKE $${params.length + 1}`;
      params.push(`%${advertiser_name}%`);
    }

    if (target_audience) {
      whereClause += ` AND a.target_audience = $${params.length + 1}`;
      params.push(target_audience);
    }

    // Filtres de date
    if (start_date_from) {
      whereClause += ` AND (a.start_date IS NULL OR a.start_date >= $${params.length + 1})`;
      params.push(start_date_from);
    }

    if (start_date_to) {
      whereClause += ` AND (a.start_date IS NULL OR a.start_date <= $${params.length + 1})`;
      params.push(start_date_to);
    }

    if (end_date_from) {
      whereClause += ` AND (a.end_date IS NULL OR a.end_date >= $${params.length + 1})`;
      params.push(end_date_from);
    }

    if (end_date_to) {
      whereClause += ` AND (a.end_date IS NULL OR a.end_date <= $${params.length + 1})`;
      params.push(end_date_to);
    }

    // Inclure les statistiques de clics si demandé
    if (with_clicks) {
      selectFields.push(`
        CASE 
          WHEN a.impression_count > 0 
          THEN ROUND((a.click_count::DECIMAL / a.impression_count * 100)::DECIMAL, 2)
          ELSE 0 
        END as ctr
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM advertisements a
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Validation du tri
    const validSortColumns = ['priority', 'created_at', 'click_count', 'impression_count', 'title', 'position'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'priority';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM advertisements a
      ${whereClause}
      ORDER BY 
        CASE WHEN a.is_active = true THEN 0 ELSE 1 END,
        a.${sortColumn} ${order} NULLS LAST,
        a.priority DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Advertisement>(
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
    console.error('Error in getAdvertisements:', error);
    throw new Error('Erreur lors de la récupération des publicités');
  }
}

export async function getAdvertisementById(id: number, options: { 
  with_stats?: boolean 
} = {}) {
  try {
    const { with_stats = true } = options;
    
    let sql = 'SELECT * FROM advertisements WHERE id = $1';
    const params: any[] = [id];

    if (with_stats) {
      sql = `
        SELECT 
          a.*,
          ROUND(
            CASE 
              WHEN a.impression_count > 0 
              THEN (a.click_count::DECIMAL / a.impression_count * 100)::DECIMAL
              ELSE 0 
            END, 2
          ) as ctr,
          (a.impression_count - a.click_count) as unique_impressions
        FROM advertisements a
        WHERE a.id = $1
      `;
    }

    const result = await queryOne<Advertisement>(sql, params);
    
    if (!result) {
      throw new Error('Publicité non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getAdvertisementById:', error);
    throw error;
  }
}

export async function createAdvertisement(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      media: formData.get('media'),
      media_type: formData.get('media_type'),
      price: formData.get('price'),
      link_url: formData.get('link_url'),
      cta_text: formData.get('cta_text'),
      position: formData.get('position'),
      priority: formData.get('priority'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      is_active: formData.get('is_active'),
      target_audience: formData.get('target_audience'),
      advertiser_name: formData.get('advertiser_name'),
      advertiser_contact: formData.get('advertiser_contact'),
    };

    const cleanedData = {
      title: rawData.title as string,
      description: rawData.description as string || undefined,
      media: rawData.media as string || undefined,
      media_type: (rawData.media_type as 'image' | 'video' | 'html') || 'image',
      price: rawData.price ? Number(rawData.price) : 0.00,
      link_url: rawData.link_url as string || undefined,
      cta_text: rawData.cta_text as string || undefined,
      position: rawData.position as any,
      priority: rawData.priority ? Number(rawData.priority) : 0,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
      is_active: rawData.is_active === 'true',
      target_audience: rawData.target_audience as string || undefined,
      advertiser_name: rawData.advertiser_name as string || undefined,
      advertiser_contact: rawData.advertiser_contact as string || undefined,
    };

    const validatedData = advertisementSchema.parse(cleanedData);

    const sql = `
      INSERT INTO advertisements (
        title, description, media, media_type, price, link_url, cta_text,
        position, priority, start_date, end_date, is_active,
        target_audience, advertiser_name, advertiser_contact,
        click_count, impression_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, 0)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.media || null,
      validatedData.media_type,
      validatedData.price,
      validatedData.link_url || null,
      validatedData.cta_text || null,
      validatedData.position,
      validatedData.priority,
      validatedData.start_date || null,
      validatedData.end_date || null,
      validatedData.is_active,
      validatedData.target_audience || null,
      validatedData.advertiser_name || null,
      validatedData.advertiser_contact || null,
    ]);

    revalidatePath("/advertisements");
    revalidatePath("/admin/advertisements");
    revalidatePath("/");

    return { 
      success: true, 
      id: result[0].id,
      message: "Publicité créée avec succès",
    };
  } catch (error) {
    console.error("Error in createAdvertisement:", error);
    throw new Error(`Erreur lors de la création de la publicité: ${(error as Error).message}`);
  }
}

export async function updateAdvertisement(id: number, formData: FormData) {
  try {
    const existing = await getAdvertisementById(id, { with_stats: false });
    if (!existing) {
      throw new Error('Publicité non trouvée');
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      media: formData.get('media'),
      media_type: formData.get('media_type'),
      cta_text: formData.get('cta_text'),
      price: formData.get('price'),
      link_url: formData.get('link_url'),
      position: formData.get('position'),
      priority: formData.get('priority'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      is_active: formData.get('is_active'),
      target_audience: formData.get('target_audience'),
      advertiser_name: formData.get('advertiser_name'),
      advertiser_contact: formData.get('advertiser_contact'),
    };

    const cleanedData = {
      title: rawData.title as string,
      description: rawData.description as string || undefined,
      media: rawData.media as string || undefined,
      media_type: (rawData.media_type as 'image' | 'video' | 'html') || existing.media_type,
      price: rawData.price ? Number(rawData.price) : existing.price,
      link_url: rawData.link_url as string || undefined,
      cta_text: rawData.cta_text as string || undefined,
      position: (rawData.position as any) || existing.position,
      priority: rawData.priority ? Number(rawData.priority) : existing.priority,
      start_date: rawData.start_date as string || existing.start_date,
      end_date: rawData.end_date as string || existing.end_date,
      is_active: rawData.is_active === 'true',
      target_audience: rawData.target_audience as string || existing.target_audience,
      advertiser_name: rawData.advertiser_name as string || existing.advertiser_name,
      advertiser_contact: rawData.advertiser_contact as string || existing.advertiser_contact,
    };

    const validatedData = advertisementSchema.parse(cleanedData);

    const sql = `
      UPDATE advertisements 
      SET 
        title = $1, description = $2, media = $3, media_type = $4,
        price = $5, link_url = $6, cta_text = $7, position = $8, priority = $9,
        start_date = $10, end_date = $11, is_active = $12,
        target_audience = $13, advertiser_name = $14, advertiser_contact = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.description || null,
      validatedData.media || null,
      validatedData.media_type,
      validatedData.price,
      validatedData.link_url || null,
      validatedData.cta_text || null,
      validatedData.position,
      validatedData.priority,
      validatedData.start_date || null,
      validatedData.end_date || null,
      validatedData.is_active,
      validatedData.target_audience || null,
      validatedData.advertiser_name || null,
      validatedData.advertiser_contact || null,
      id,
    ]);

    revalidatePath('/advertisements');
    revalidatePath(`/admin/advertisements/${id}`);
    revalidatePath('/');
    
    return { 
      success: true, 
      message: 'Publicité modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateAdvertisement:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la modification de la publicité: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteAdvertisement(id: number) {
  try {
    const existing = await getAdvertisementById(id, { with_stats: false });
    if (!existing) {
      throw new Error('Publicité non trouvée');
    }

    const sql = 'DELETE FROM advertisements WHERE id = $1';
    await query(sql, [id]);

    revalidatePath('/advertisements');
    revalidatePath('/ad/advertisements');
    
    return { 
      success: true, 
      message: 'Publicité supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteAdvertisement:', error);
    throw new Error('Erreur lors de la suppression de la publicité');
  }
}

export async function getAdvertisementStats(): Promise<AdvertisementStats> {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE is_active = true) as active_ads,
        SUM(click_count) as total_clicks,
        SUM(impression_count) as total_impressions,
        ROUND(
          CASE 
            WHEN SUM(impression_count) > 0 
            THEN (SUM(click_count)::DECIMAL / SUM(impression_count) * 100)::DECIMAL
            ELSE 0 
          END, 2
        ) as avg_ctr,
        
        -- Statistiques par position
        JSON_OBJECT_AGG(
          position,
          JSON_BUILD_OBJECT(
            'impressions', COALESCE(position_stats.impressions, 0),
            'clicks', COALESCE(position_stats.clicks, 0)
          )
        ) FILTER (WHERE position_stats.position IS NOT NULL) as by_position,
        
        -- Statistiques par type de média
        JSON_OBJECT_AGG(
          media_type,
          JSON_BUILD_OBJECT(
            'impressions', COALESCE(media_stats.impressions, 0),
            'clicks', COALESCE(media_stats.clicks, 0)
          )
        ) FILTER (WHERE media_stats.media_type IS NOT NULL) as by_media_type
        
      FROM advertisements a
      CROSS JOIN LATERAL (
        SELECT 
          a.position,
          SUM(impression_count) as impressions,
          SUM(click_count) as clicks
        FROM advertisements 
        WHERE position = a.position
        GROUP BY position
      ) position_stats
      CROSS JOIN LATERAL (
        SELECT 
          a.media_type,
          SUM(impression_count) as impressions,
          SUM(click_count) as clicks
        FROM advertisements 
        WHERE media_type = a.media_type
        GROUP BY media_type
      ) media_stats
      GROUP BY position_stats.position, media_stats.media_type
    `;
    
    const result = await queryOne<any>(sql);
    
    return {
      totalAds: parseInt(result?.total_ads ?? '0'),
      activeAds: parseInt(result?.active_ads ?? '0'),
      totalClicks: parseInt(result?.total_clicks ?? '0'),
      totalImpressions: parseInt(result?.total_impressions ?? '0'),
      avgCTR: parseFloat(result?.avg_ctr ?? '0'),
      byPosition: result?.by_position || {},
      byMediaType: result?.by_media_type || {}
    };
  } catch (error) {
    console.error('Error in getAdvertisementStats:', error);
    return {
      totalAds: 0,
      activeAds: 0,
      totalClicks: 0,
      totalImpressions: 0,
      avgCTR: 0,
      byPosition: {
        sidebar: { impressions: 0, clicks: 0 },
        header: { impressions: 0, clicks: 0 },
        footer: { impressions: 0, clicks: 0 },
        in_content: { impressions: 0, clicks: 0 },
        popup: { impressions: 0, clicks: 0 },
        banner_top: { impressions: 0, clicks: 0 },
        banner_bottom: { impressions: 0, clicks: 0 },
        mobile_sticky: { impressions: 0, clicks: 0 },
      },
      byMediaType: {
        image: { impressions: 0, clicks: 0 },
        video: { impressions: 0, clicks: 0 },
        html: { impressions: 0, clicks: 0 },
      }
    };
  }
}

export async function getActiveAdvertisements(position?: string, limit: number = 5) {
  try {
    let sql = `
      SELECT *
      FROM advertisements 
      WHERE is_active = true 
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
    `;
    
    const params: any[] = [];
    
    if (position) {
      sql += ` AND advertisements.position = $${params.length + 1}`;
      params.push(position);
    }
    
    sql += ` ORDER BY advertisements.priority DESC, advertisements.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query<Advertisement>(sql, params);
    return result;
  } catch (error) {
    console.error('Error in getActiveAdvertisements:', error);
    return [];
  }
}

export async function recordAdClick(id: number) {
  try {
    const sql = `
      UPDATE advertisements 
      SET click_count = click_count + 1 
      WHERE id = $1 
      RETURNING id, click_count
    `;
    
    const result = await queryOne<{ id: number; click_count: number }>(sql, [id]);
    
    if (!result) {
      throw new Error('Publicité non trouvée');
    }
    
    return { 
      success: true, 
      click_count: result.click_count 
    };
  } catch (error) {
    console.error('Error in recordAdClick:', error);
    throw new Error('Erreur lors de l\'enregistrement du clic');
  }
}

export async function recordAdImpression(id: number) {
  try {
    const sql = `
      UPDATE advertisements 
      SET impression_count = impression_count + 1 
      WHERE id = $1
    `;
    
    await query(sql, [id]);
    
    return { success: true };
  } catch (error) {
    console.error('Error in recordAdImpression:', error);
    // Ne pas bloquer l'application pour une erreur d'impression
    return { success: false };
  }
}

export async function getAdvertisementsForSelect() {
  try {
    const sql = `
      SELECT id, title, position, priority, is_active
      FROM advertisements 
      WHERE is_active = true
      ORDER BY priority DESC, title ASC
    `;
    
    return await query<{ 
      id: number; 
      title: string; 
      position: string;
      priority: number;
      is_active: boolean;
    }>(sql);
  } catch (error) {
    console.error('Error in getAdvertisementsForSelect:', error);
    return [];
  }
}