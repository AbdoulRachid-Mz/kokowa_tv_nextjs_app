'use server';

import { query } from '@/lib/db/neon-client';
import { Advertisement, AdvertisementFilters, PaginatedResponse, AdvertisementStats, AdvertisementPosition, AdvertisementMediaType } from '@/types';


export async function getMobileAdvertisements(filters?: {
  position?: AdvertisementPosition;
  media_type?: AdvertisementMediaType;
  is_active?: boolean;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  advertiser_name?: string;
  target_audience?: string;
  with_clicks?: boolean;
  userId?: number;
  page?: number;
  limit?: number;
}) {
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
      with_clicks,
      userId,
      page = 1,
      limit = 10,
    } = filters || {};

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.media,
        a.media_type as "mediaType",
        a.price,
        a.link_url as "linkUrl",
        a.position,
        a.priority,
        a.is_active as "isActive",
        a.target_audience as "targetAudience",
        a.advertiser_name as "advertiserName",
        a.created_at as "createdAt",
        
        -- Vérifier si l'utilisateur a interagi avec cette pub
        ${userId ? `
        EXISTS(
          SELECT 1
          FROM interactions i
          WHERE i.entity_type = 'advertisement'
            AND i.entity_id = a.id
            AND i.interaction_type = 'click'
            AND i.user_id = $1
        ) as "hasClicked"
        ` : 'FALSE as "hasClicked"'}
        
      FROM advertisements a
      WHERE 1=1
    `;

    const params: any[] = userId ? [userId] : [];

    if (is_active !== undefined) {
      sql += ` AND a.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (position) {
      sql += ` AND a.position = $${params.length + 1}`;
      params.push(position);
    }

    if (media_type) {
      sql += ` AND a.media_type = $${params.length + 1}`;
      params.push(media_type);
    }

    if (advertiser_name) {
      sql += ` AND a.advertiser_name ILIKE $${params.length + 1}`;
      params.push(`%${advertiser_name}%`);
    }

    if (target_audience) {
      sql += ` AND a.target_audience ILIKE $${params.length + 1}`;
      params.push(`%${target_audience}%`);
    }

    if (start_date_from) {
      sql += ` AND (a.start_date IS NULL OR a.start_date >= $${params.length + 1})`;
      params.push(start_date_from);
    }

    if (start_date_to) {
      sql += ` AND (a.start_date IS NULL OR a.start_date <= $${params.length + 1})`;
      params.push(start_date_to);
    }

    if (end_date_from) {
      sql += ` AND (a.end_date IS NULL OR a.end_date >= $${params.length + 1})`;
      params.push(end_date_from);
    }

    if (end_date_to) {
      sql += ` AND (a.end_date IS NULL OR a.end_date <= $${params.length + 1})`;
      params.push(end_date_to);
    }

    if (is_active === true) {
      sql += ` AND (a.start_date IS NULL OR a.start_date <= CURRENT_TIMESTAMP)
               AND (a.end_date IS NULL OR a.end_date >= CURRENT_TIMESTAMP)`;
    }

    sql += ` ORDER BY a.priority DESC, a.created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const advertisements = await query(sql, params);

    // Count total for pagination metadata
    let countSql = `SELECT COUNT(*) as total FROM advertisements a WHERE 1=1`;
    const countParams: any[] = [];

    if (is_active !== undefined) {
      countSql += ` AND a.is_active = $${countParams.length + 1}`;
      countParams.push(is_active);
    }

    if (position) {
      countSql += ` AND a.position = $${countParams.length + 1}`;
      countParams.push(position);
    }

    if (media_type) {
      countSql += ` AND a.media_type = $${countParams.length + 1}`;
      countParams.push(media_type);
    }

    if (advertiser_name) {
      countSql += ` AND a.advertiser_name ILIKE $${countParams.length + 1}`;
      countParams.push(`%${advertiser_name}%`);
    }

    if (target_audience) {
      countSql += ` AND a.target_audience ILIKE $${countParams.length + 1}`;
      countParams.push(`%${target_audience}%`);
    }

    if (start_date_from) {
      countSql += ` AND (a.start_date IS NULL OR a.start_date >= $${countParams.length + 1})`;
      countParams.push(start_date_from);
    }

    if (start_date_to) {
      countSql += ` AND (a.start_date IS NULL OR a.start_date <= $${countParams.length + 1})`;
      countParams.push(start_date_to);
    }

    if (end_date_from) {
      countSql += ` AND (a.end_date IS NULL OR a.end_date >= $${countParams.length + 1})`;
      countParams.push(end_date_from);
    }

    if (end_date_to) {
      countSql += ` AND (a.end_date IS NULL OR a.end_date <= $${countParams.length + 1})`;
      countParams.push(end_date_to);
    }

    if (!is_active) {
      countSql += ` AND (a.start_date IS NULL OR a.start_date <= CURRENT_TIMESTAMP)
                   AND (a.end_date IS NULL OR a.end_date >= CURRENT_TIMESTAMP)`;
    }

    const countResult = await query(countSql, countParams);
    const total = Number(countResult[0]?.total || 0);

    return {
      success: true,
      data: {
        advertisements,
        count: advertisements.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
      },
      message: 'Publicités récupérées avec succès',
    };
  } catch (error) {
    console.error('Error in getMobileAdvertisements:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des publicités',
        timestamp: new Date().toISOString(),
      },
    };
  }
}


export async function getMobileAdvertisementById(adId: number, userId?: number) {
  try {
    // Vérifier que la publicité existe et est active
    const existsSql = `
      SELECT id 
      FROM advertisements 
      WHERE id = $1 
        AND is_active = true
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
    `;
    const existsResult = await query(existsSql, [adId]);
    
    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Publicité non trouvée',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Récupérer les détails de la publicité
    const sql = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.media,
        a.media_type as "mediaType",
        a.price,
        a.link_url as "linkUrl",
        a.position,
        a.priority,
        a.start_date as "startDate",
        a.end_date as "endDate",
        a.is_active as "isActive",
        a.click_count as "clickCount",
        a.impression_count as "impressionCount",
        a.target_audience as "targetAudience",
        a.advertiser_name as "advertiserName",
        a.advertiser_contact as "advertiserContact",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        
        -- Calculer le CTR
        CASE 
          WHEN a.impression_count > 0 
          THEN ROUND((a.click_count::DECIMAL / a.impression_count * 100)::DECIMAL, 2)
          ELSE 0 
        END as "ctr",
        
        ${userId ? `
        -- Vérifier si l'utilisateur a cliqué
        EXISTS(
          SELECT 1
          FROM interactions i
          WHERE i.entity_type = 'advertisement'
            AND i.entity_id = a.id
            AND i.interaction_type = 'click'
            AND i.user_id = $2
        ) as "hasClicked"
        ` : 'FALSE as "hasClicked"'}
        
      FROM advertisements a
      WHERE a.id = $1
    `;

    const params = userId ? [adId, userId] : [adId];
    const result = await query(sql, params);
    const advertisement = result[0];

    return {
      success: true,
      data: {
        advertisement
      },
      message: 'Détails de la publicité récupérés avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileAdvertisementById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des détails de la publicité',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function recordMobileAdInteraction(
  adId: number, 
  interactionType: 'impression' | 'click',
  userId?: number
) {
  try {
    if (interactionType === 'impression') {
      // Enregistrer une impression
      const impressionSql = `
        UPDATE advertisements 
        SET impression_count = impression_count + 1 
        WHERE id = $1
        RETURNING impression_count as "impressionCount"
      `;
      
      const result = await query(impressionSql, [adId]);
      
      return {
        success: true,
        data: {
          impressionCount: result[0]?.impressionCount || 0
        },
        message: 'Impression enregistrée'
      };
      
    } else if (interactionType === 'click') {
      // Enregistrer un clic
      const clickSql = `
        UPDATE advertisements 
        SET click_count = click_count + 1 
        WHERE id = $1
        RETURNING click_count as "clickCount"
      `;
      
      const result = await query(clickSql, [adId]);
      
      // Si userId est fourni, enregistrer l'interaction
      if (userId) {
        const interactionSql = `
          INSERT INTO interactions (
            user_id, entity_type, entity_id, interaction_type
          ) VALUES ($1, 'advertisement', $2, 'click')
          ON CONFLICT DO NOTHING
        `;
        await query(interactionSql, [userId, adId]);
      }
      
      return {
        success: true,
        data: {
          clickCount: result[0]?.clickCount || 0
        },
        message: 'Clic enregistré'
      };
    }
    
    return {
      success: false,
      error: {
        code: 400,
        message: 'Type d\'interaction invalide',
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error in recordMobileAdInteraction:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de l\'enregistrement de l\'interaction',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function getMobileAdvertisementsByPosition(position: string, limit: number = 5) {
  try {
    const sql = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.media,
        a.media_type as "mediaType",
        a.link_url as "linkUrl",
        a.position,
        a.priority,
        a.advertiser_name as "advertiserName"
      FROM advertisements a
      WHERE a.is_active = true 
        AND a.position = $1
        AND (a.start_date IS NULL OR a.start_date <= CURRENT_TIMESTAMP)
        AND (a.end_date IS NULL OR a.end_date >= CURRENT_TIMESTAMP)
      ORDER BY a.priority DESC, a.created_at DESC
      LIMIT $2
    `;

    const advertisements = await query(sql, [position, limit]);

    return {
      success: true,
      data: {
        position,
        advertisements,
        count: advertisements.length
      },
      message: `Publicités pour la position "${position}" récupérées`
    };
  } catch (error) {
    console.error('Error in getMobileAdvertisementsByPosition:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des publicités par position',
        timestamp: new Date().toISOString()
      }
    };
  }
}