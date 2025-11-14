// app/api/articles/slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/actions/articles';

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug d\'article requis' }, { status: 400 });
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    const result = await getArticleBySlug(slug, { with_relations: withRelations });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/articles/slug/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    );
  }
}