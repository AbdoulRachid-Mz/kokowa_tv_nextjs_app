// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticles, createArticle, getPopularArticles } from '@/actions/articles';
import { ArticleFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Route spéciale pour les articles populaires
    if (searchParams.get('popular')) {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const result = await getPopularArticles(limit);
      return NextResponse.json(result);
    }

    const filters = {
      author_id: searchParams.get('author_id') ? parseInt(searchParams.get('author_id')!) : undefined,
      status: searchParams.get('status') || undefined,
      language: searchParams.get('language') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_author: searchParams.get('with_author') !== 'false',
    };

    const result = await getArticles(filters as ArticleFilters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/articles:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createArticle(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/articles:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'article' },
      { status: 500 }
    );
  }
}