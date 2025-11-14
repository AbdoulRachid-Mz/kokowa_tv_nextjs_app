// app/api/videos/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { likeVideo } from '@/actions/videos';

interface Props {
  params: Promise<{ videoId: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const idNum = Number(videoId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de vidéo invalide' }, { status: 400 });
    }

    const result = await likeVideo(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PATCH /api/videos/[id]/like:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du like de la vidéo' },
      { status: 500 }
    );
  }
}