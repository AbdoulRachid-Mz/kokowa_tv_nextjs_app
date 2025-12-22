// app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, updateArticle, deleteArticle, incrementArticleViewCount } from '@/actions/articles';

interface Props {
  params: Promise<{ articleId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { articleId } = await params;
    const idNum = Number(articleId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'article invalide' }, { status: 400 });
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    const result = await getArticleById(idNum, { with_relations: withRelations });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/articles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { articleId } = await params;
    const idNum = Number(articleId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'article invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateArticle(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/articles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de l\'article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { articleId } = await params;
    const idNum = Number(articleId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'article invalide' }, { status: 400 });
    }

    const result = await deleteArticle(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/articles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de l\'article' },
      { status: 500 }
    );
  }
}