// lib/actions/articles.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { articleSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Article, ArticleFilters, PaginatedResponse } from '@/types';

export async function getArticles(
  filters: ArticleFilters = {}
): Promise<PaginatedResponse<Article>> {
  try {
    const {
      author_id,
      status,
      language,
      search = '',
      page = 1,
      limit = 20,
      with_author = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['a.*'];
    const joins: string[] = [];

    // Filtres de base
    if (author_id) {
      whereClause += ` AND a.author_id = $${params.length + 1}`;
      params.push(author_id);
    }

    if (status) {
      whereClause += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    if (language) {
      whereClause += ` AND a.language = $${params.length + 1}`;
      params.push(language);
    }

    if (search) {
      whereClause += ` AND (
        a.title ILIKE $${params.length + 1} 
        OR a.excerpt ILIKE $${params.length + 1}
        OR a.content ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Jointures pour les relations
    if (with_author) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_picture', u.profile_picture
        ) as author
      `);
      joins.push('LEFT JOIN users u ON a.author_id = u.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
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
      FROM articles a
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN a.status = 'published' THEN 1
          WHEN a.status = 'draft' THEN 2
          ELSE 3
        END,
        a.published_at DESC NULLS LAST,
        a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Article>(
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
    console.error('Error in getArticles:', error);
    throw new Error('Erreur lors de la récupération des articles');
  }
}

export async function getArticleById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM articles WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          a.*,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_picture', u.profile_picture
          ) as author
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.id = $1
      `;
    }

    const result = await queryOne<Article>(sql, params);
    
    if (!result) {
      throw new Error('Article non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getArticleById:', error);
    throw error;
  }
}

export async function getArticleBySlug(slug: string, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM articles WHERE slug = $1';
    const params: any[] = [slug];

    if (with_relations) {
      sql = `
        SELECT 
          a.*,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_picture', u.profile_picture
          ) as author
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.slug = $1
      `;
    }

    const result = await queryOne<Article>(sql, params);
    
    if (!result) {
      throw new Error('Article non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getArticleBySlug:', error);
    throw error;
  }
}

export async function createArticle(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      featured_image: formData.get('featured_image'),
      author_id: formData.get('author_id'),
      status: formData.get('status'),
      language: formData.get('language'),
      meta_title: formData.get('meta_title'),
      meta_description: formData.get('meta_description'),
    };

    const cleanedData = {
      title: rawData.title as string,
      slug: rawData.slug as string,
      excerpt: rawData.excerpt as string || undefined,
      content: rawData.content as string,
      featured_image: rawData.featured_image as string || undefined,
      author_id: Number(rawData.author_id),
      status: (rawData.status as 'draft' | 'published' | 'archived') || 'draft',
      language: (rawData.language as 'fr' | 'ha' | 'en') || 'fr',
      meta_title: rawData.meta_title as string || undefined,
      meta_description: rawData.meta_description as string || undefined,
    };

    const validatedData = articleSchema.parse(cleanedData);

    const sql = `
      INSERT INTO articles (
        title, slug, excerpt, content, featured_image, author_id, 
        status, language, meta_title, meta_description,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const publishedAt = validatedData.status === 'published' ? new Date().toISOString() : null;

    const result = await query<{ id: number }>(sql, [
      validatedData.title,
      validatedData.slug,
      validatedData.excerpt || null,
      validatedData.content,
      validatedData.featured_image instanceof File ? null : validatedData.featured_image || null,
      validatedData.author_id,
      validatedData.status,
      validatedData.language,
      validatedData.meta_title || null,
      validatedData.meta_description || null,
      publishedAt,
    ]);

    revalidatePath('/articles');
    revalidatePath('/');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Article créé avec succès'
    };
  } catch (error) {
    console.error('Error in createArticle:', error);
    throw new Error('Erreur lors de la création de l\'article');
  }
}

export async function updateArticle(id: number, formData: FormData) {
  try {
    const existing = await getArticleById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Article non trouvé');
    }

    const rawData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      featured_image: formData.get('featured_image'),
      author_id: formData.get('author_id'),
      status: formData.get('status'),
      language: formData.get('language'),
      meta_title: formData.get('meta_title'),
      meta_description: formData.get('meta_description'),
    };

    const cleanedData = {
      title: rawData.title as string,
      slug: rawData.slug as string,
      excerpt: rawData.excerpt as string || undefined,
      content: rawData.content as string,
      featured_image: rawData.featured_image as string || undefined,
      author_id: Number(rawData.author_id),
      status: rawData.status as 'draft' | 'published' | 'archived',
      language: rawData.language as 'fr' | 'ha' | 'en',
      meta_title: rawData.meta_title as string || undefined,
      meta_description: rawData.meta_description as string || undefined,
    };

    const validatedData = articleSchema.parse(cleanedData);

    // Gérer la date de publication
    let publishedAt = existing.published_at;
    if (existing.status !== 'published' && validatedData.status === 'published') {
      publishedAt = new Date().toISOString();
    } else if (validatedData.status !== 'published') {
      publishedAt = undefined;
    }

    const sql = `
      UPDATE articles 
      SET 
        title = $1, slug = $2, excerpt = $3, content = $4, 
        featured_image = $5, author_id = $6, status = $7, 
        language = $8, meta_title = $9, meta_description = $10,
        published_at = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `;
    
    await query(sql, [
      validatedData.title,
      validatedData.slug,
      validatedData.excerpt || null,
      validatedData.content,
      validatedData.featured_image instanceof File ? null : validatedData.featured_image || null,
      validatedData.author_id,
      validatedData.status,
      validatedData.language,
      validatedData.meta_title || null,
      validatedData.meta_description || null,
      publishedAt || null,
      id,
    ]);

    revalidatePath('/articles');
    revalidatePath(`/articles/${id}`);
    revalidatePath(`/articles/${validatedData.slug}`);
    revalidatePath('/');
    return { 
      success: true, 
      message: 'Article modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateArticle:', error);
    throw error;
  }
}

export async function deleteArticle(id: number) {
  try {
    const existing = await getArticleById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Article non trouvé');
    }

    const sql = 'DELETE FROM articles WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/articles');
    revalidatePath('/');
    return { 
      success: true, 
      message: 'Article supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteArticle:', error);
    throw new Error('Erreur lors de la suppression de l\'article');
  }
}

export async function incrementArticleViewCount(id: number) {
  try {
    const sql = `
      UPDATE articles 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    
    await query(sql, [id]);
    
    return { success: true };
  } catch (error) {
    console.error('Error in incrementArticleViewCount:', error);
    throw new Error('Erreur lors de l\'incrémentation du compteur de vues');
  }
}

export async function getPopularArticles(limit: number = 10) {
  try {
    const sql = `
      SELECT 
        a.*,
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as author
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.view_count DESC, a.like_count DESC
      LIMIT $1
    `;

    const result = await query<Article>(sql, [limit]);
    return result;
  } catch (error) {
    console.error('Error in getPopularArticles:', error);
    throw new Error('Erreur lors de la récupération des articles populaires');
  }
}