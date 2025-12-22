// app/api/videos/slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVideoBySlug } from '@/actions/videos';

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
      return NextResponse.json({ error: 'Slug de vidéo requis' }, { status: 400 });
    }

    const result = await getVideoBySlug(slug);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/videos/slug/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de la vidéo' },
      { status: 500 }
    );
  }
}