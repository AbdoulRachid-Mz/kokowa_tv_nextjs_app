"use server";

import { query } from "@/lib/db/neon-client";
import { ArticleType, Media, MobileMedia } from "@/types";

export async function getArticles(filters?: {
  status?: "draft" | "published" | "archived";
  language?: "fr" | "ha" | "en";
  type?: ArticleType;
  author_id?: number;
  page?: number;
  limit?: number;
  search?: string;
  userId?: number; // Pour vérifier les favoris
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const userId = filters?.userId;
    const type = filters?.type;

    // Build WHERE clause dynamically
    const conditions: string[] = ["a.status = 'published'"]; // Par défaut, ne montrer que les publiés
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`a.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `;

    const countResult = await query(countSql, params);
    const total = parseInt(countResult[0]?.total || "0");

    // Build selection fields with likes and favorites
    const selectFields = `
      a.id,
      a.title,
      a.slug,
      a.type,
      a.excerpt,
      a.content,
      a.featured_image as "featuredImage",
      a.author_id as "authorId",
      a.status,
      a.language,
      a.view_count as "viewCount",
      a.like_count as "likes",  -- Renommer pour cohérence
      a.share_count as "shareCount",
      a.meta_title as "metaTitle",
      a.meta_description as "metaDescription",
      a.published_at as "publishedAt",
      
      -- Author information
      JSON_BUILD_OBJECT(
        'id', u.id,
        'username', u.username,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'profilePicture', u.profile_picture
      ) as author
    `;

    // Add likes from interactions table if needed
    const likesField = userId ? `
      , COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
      ), 0) as "interactionLikes"
    ` : '';

    // Add favorite check for user
    const favoriteField = userId ? `
      , EXISTS(
        SELECT 1
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
          AND i.user_id = $${paramIndex}
      ) as "isMyFavorite"
    ` : ', FALSE as "isMyFavorite"';

    // Get articles with author information and media
    const articlesSql = `
      SELECT 
        ${selectFields}
        ${likesField}
        ${favoriteField}
        
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT $${userId ? paramIndex + 1 : paramIndex} 
      OFFSET $${userId ? paramIndex + 2 : paramIndex + 1}
    `;

    // Add user ID to params if provided
    if (userId) {
      params.push(userId);
    }
    params.push(limit, offset);

    const articles = await query(articlesSql, params);

    // Combine like counts from both tables
    const processedArticles = articles.map(article => ({
      ...article,
      likes: article.interactionLikes || article.likes || 0
    }));

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        articles: processedArticles,
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

export async function getArticleById(articleId: number, userId?: number) {
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

    // Build selection fields with likes and favorites
    const selectFields = `
      a.id,
      a.title,
      a.slug,
      a.type,
      a.excerpt,
      a.content,
      a.featured_image as "featuredImage",
      a.author_id as "authorId",
      a.status,
      a.language,
      a.view_count as "viewCount",
      a.like_count as "likes",  -- Renommer pour cohérence
      a.share_count as "shareCount",
      a.meta_title as "metaTitle",
      a.meta_description as "metaDescription",
      a.published_at as "publishedAt",
      
      -- Author information
      JSON_BUILD_OBJECT(
        'id', u.id,
        'username', u.username,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'profilePicture', u.profile_picture,
        'bio', u.bio
      ) as author
    `;

    // Add likes from interactions table
    const likesField = `
      , COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
      ), 0) as "interactionLikes"
    `;

    // Add favorite check for user
    const favoriteField = userId ? `
      , EXISTS(
        SELECT 1
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
          AND i.user_id = $2
      ) as "isMyFavorite"
    ` : ', FALSE as "isMyFavorite"';

    // Get article with full details including media
    const articleSql = `
      SELECT 
        ${selectFields}
        ${likesField}
        ${favoriteField}
        
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `;

    const params = userId ? [articleId, userId] : [articleId];
    const result = await query(articleSql, params);
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

    // Combine like counts from both tables
    article.likes = article.interactionLikes || article.likes || 0;

    // Fetch media grouped by type
    const mediaSql = `
      SELECT 
        id,
        file_path as "filePath",
        file_type as "fileType",
        mime_type as "mimeType"
      FROM media
      WHERE entity_type = 'article' AND entity_id = $1
      ORDER BY is_featured DESC, created_at ASC
    `;
    const mediaRows = await query(mediaSql, [articleId]);

    // Build arrays of paths
    const images: string[] = [];
    const videos: string[] = [];
    const documents: string[] = [];
    const audios: string[] = [];
    const others: string[] = [];

    mediaRows.forEach(
      (m: {
        id: number;
        filePath: string;
        fileType: string;
        mimeType?: string;
      }) => {
        switch (m.fileType) {
          case "image":
            images.push(m.filePath);
            break;

          case "video":
            videos.push(m.filePath);
            break;

          case "document":
            documents.push(m.filePath);
            break;

          case "audio":
            audios.push(m.filePath);
            break;

          default:
            others.push(m.filePath);
        }
      }
    );

    // Fetch comments (messages) for the article
    const commentsSql = `
      SELECT 
        c.id,
        c.content,
        c.created_at as "createdAt",
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture
        ) as user
      FROM messages c
      JOIN users u ON c.author_id = u.id
      WHERE c.entity_type = 'article' 
        AND c.entity_id = $1
        AND c.message_type = 'comment'
        AND c.is_active = TRUE
        AND c.is_deleted = FALSE
      ORDER BY c.created_at ASC
    `;
    const comments = await query(commentsSql, [articleId]);

    // Attach media and comments to article
    // article.media = {
    //   images,
    //   videos,
    //   documents,
    //   others,
    // };
    article.comments = comments;

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
        images,
        videos,
        documents,
        audios,
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

