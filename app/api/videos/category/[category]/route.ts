// app/api/videos/category/[category]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVideosByCategory } from '@/actions/videos';

interface Props {
  params: Promise<{ category: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { category } = await params;
    
    if (!category) {
      return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });
    }

    const videos = await getVideosByCategory(category);
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos par catégorie:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
