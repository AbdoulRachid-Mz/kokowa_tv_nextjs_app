"use server";

import { query } from "@/lib/db/neon-client";

export async function getArticles(filters?: {
  status?: "draft" | "published" | "archived";
  language?: "fr" | "ha" | "en";
  author_id?: number;
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.language) {
      conditions.push(`a.language = $${paramIndex}`);
      params.push(filters.language);
      paramIndex++;
    }

    if (filters?.author_id) {
      conditions.push(`a.author_id = $${paramIndex}`);
      params.push(filters.author_id);
      paramIndex++;
    }

    if (filters?.search) {
      conditions.push(
        `(a.title ILIKE $${paramIndex} OR a.excerpt ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `;

    const countResult = await query(countSql, params);
    const total = parseInt(countResult[0]?.total || "0");

    // Get articles with author information and media
    const articlesSql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.featured_image as "featuredImage",
        a.author_id as "authorId",
        a.status,
        a.language,
        a.view_count as "viewCount",
        a.like_count as "likeCount",
        a.share_count as "shareCount",
        a.meta_title as "metaTitle",
        a.meta_description as "metaDescription",
        a.published_at as "publishedAt",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        
        -- Author information
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture
        ) as author,
        
        -- Media relations by type
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'image' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured
              )
            END
          ) FILTER (WHERE m.file_type = 'image'), '[]'
        ) as images,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'video' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured
              )
            END
          ) FILTER (WHERE m.file_type = 'video'), '[]'
        ) as videos,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'document' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured
              )
            END
          ) FILTER (WHERE m.file_type = 'document'), '[]'
        ) as documents,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'audio' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured
              )
            END
          ) FILTER (WHERE m.file_type = 'audio'), '[]'
        ) as audios
        
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN media m ON m.entity_type = 'article' AND m.entity_id = a.id
      ${whereClause}
      GROUP BY a.id, u.id
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const articles = await query(articlesSql, params);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Articles récupérés avec succès",
    };
  } catch (error) {
    console.error("Error in getArticles:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des articles",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function getArticleById(articleId: number) {
  try {
    // Check if article exists
    const existsSql = "SELECT id FROM articles WHERE id = $1";
    const existsResult = await query(existsSql, [articleId]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Article non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Get article with full details including media
    const articleSql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.featured_image as "featuredImage",
        a.author_id as "authorId",
        a.status,
        a.language,
        a.view_count as "viewCount",
        a.like_count as "likeCount",
        a.share_count as "shareCount",
        a.meta_title as "metaTitle",
        a.meta_description as "metaDescription",
        a.published_at as "publishedAt",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        
        -- Author information
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture,
          'bio', u.bio
        ) as author,
        
        -- Media relations by type
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'image' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured,
                'createdAt', m.created_at
              )
            END
          ) FILTER (WHERE m.file_type = 'image'), '[]'
        ) as images,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'video' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured,
                'createdAt', m.created_at
              )
            END
          ) FILTER (WHERE m.file_type = 'video'), '[]'
        ) as videos,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'document' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured,
                'createdAt', m.created_at
              )
            END
          ) FILTER (WHERE m.file_type = 'document'), '[]'
        ) as documents,
        COALESCE(
          JSON_AGG(
            CASE WHEN m.file_type = 'audio' THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'filePath', m.file_path,
                'fileType', m.file_type,
                'mimeType', m.mime_type,
                'fileSize', m.file_size,
                'altText', m.alt_text,
                'description', m.description,
                'isFeatured', m.is_featured,
                'createdAt', m.created_at
              )
            END
          ) FILTER (WHERE m.file_type = 'audio'), '[]'
        ) as audios
        
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN media m ON m.entity_type = 'article' AND m.entity_id = a.id
      WHERE a.id = $1
      GROUP BY a.id, u.id
    `;

    const result = await query(articleSql, [articleId]);
    const article = result[0];

    if (!article) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Article non trouvé",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Increment view count
    const updateViewSql = `
      UPDATE articles 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    await query(updateViewSql, [articleId]);

    return {
      success: true,
      data: {
        article,
        timestamp: new Date().toISOString(),
      },
      message: "Article récupéré avec succès",
    };
  } catch (error) {
    console.error("Error in getArticleById:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération de l'article",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
