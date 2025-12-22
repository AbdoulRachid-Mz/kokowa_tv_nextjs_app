// app/api/videos/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incrementVideoViewCount } from '@/actions/videos';

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

    const result = await incrementVideoViewCount(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PATCH /api/videos/[id]/view:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'incrémentation du compteur de vues' },
      { status: 500 }
    );
  }
}