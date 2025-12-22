// app/api/articles/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incrementArticleViewCount } from '@/actions/articles';

interface Props {
  params: Promise<{ articleId: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { articleId } = await params;
    const idNum = Number(articleId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'article invalide' }, { status: 400 });
    }

    const result = await incrementArticleViewCount(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PATCH /api/articles/[id]/view:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'incrémentation du compteur de vues' },
      { status: 500 }
    );
  }
}