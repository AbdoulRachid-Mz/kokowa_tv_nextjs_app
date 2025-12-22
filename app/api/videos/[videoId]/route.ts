// app/api/videos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVideoById, updateVideo, deleteVideo, incrementVideoViewCount, likeVideo } from '@/actions/videos';

interface Props {
  params: Promise<{ videoId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const idNum = Number(videoId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de vidéo invalide' }, { status: 400 });
    }

    const result = await getVideoById(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/videos/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de la vidéo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const idNum = Number(videoId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de vidéo invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateVideo(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/videos/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de la vidéo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const idNum = Number(videoId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de vidéo invalide' }, { status: 400 });
    }

    const result = await deleteVideo(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/videos/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la vidéo' },
      { status: 500 }
    );
  }
}