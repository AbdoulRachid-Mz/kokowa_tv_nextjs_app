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
        `(a.title ILIKE $${paramIndex} OR a.excerpt ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
    `;

    // Build selection fields with likes
    const selectFields = `
      a.id,
      a.title,
      a.type,
      a.excerpt,
      a.featured_image as "featuredImage",
      a.view_count as "viewCount",
      a.share_count as "shareCount",
      a.published_at as "publishedAt",
      
      -- Author information
      u.username as "authorName"
    `;

    const likesField = `
      , COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
      ), 0) as "likes"
    `;

    // Get articles with author information
    const articlesSql = `
      SELECT 
        ${selectFields}
        ${likesField}
        
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT $${paramIndex} 
      OFFSET $${paramIndex + 1}
    `;

    const countParams = params.slice();
    params.push(limit, offset);

    // COUNT et page sont indépendants : une seule vague.
    const [countResult, articles] = await Promise.all([
      query<{ total: string }>(countSql, countParams),
      query(articlesSql, params),
    ]);
    const total = parseInt(countResult[0]?.total || "0");

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

export async function getArticleById(articleId: number, userId?: number) {
  try {
    const selectFields = `
      a.id,
      a.title,
      a.type,
      a.excerpt,
      a.content,
      a.featured_image as "featuredImage",
      a.view_count as "viewCount",
      a.share_count as "shareCount",
      a.published_at as "publishedAt",
      JSON_BUILD_OBJECT(
        'id', u.id,
        'username', u.username,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'profilePicture', u.profile_picture
      ) as author
    `;

    const likesField = `
      , COALESCE((
        SELECT COUNT(*)
        FROM interactions i
        WHERE i.entity_type = 'article'
          AND i.entity_id = a.id
          AND i.interaction_type = 'like'
      ), 0) as "likes"
    `;

    const articleSql = `
      SELECT 
        ${selectFields}
        ${likesField}
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `;

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

    // Article et médias sont indépendants : une seule vague.
    const [result, mediaRows] = await Promise.all([
      query(articleSql, [articleId]),
      query(mediaSql, [articleId]),
    ]);
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

    const updateViewSql = `
      UPDATE articles 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    await query(updateViewSql, [articleId]);

    return {
      success: true,
      data: {
        article: {
          ...article,
          images,
          videos,
          documents,
          audios,
        },
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

