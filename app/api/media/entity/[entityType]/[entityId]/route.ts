// app/api/media/entity/[entityType]/[entityId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMediaByEntity } from '@/actions/media';

interface Props {
  params: Promise<{ entityType: string; entityId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { entityType, entityId } = await params;
    const entityIdNum = Number(entityId);
    
    if (isNaN(entityIdNum)) {
      return NextResponse.json({ error: 'ID d\'entité invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      file_type: searchParams.get('file_type') || undefined,
      uploader_id: searchParams.get('uploader_id') ? parseInt(searchParams.get('uploader_id')!) : undefined,
      is_featured: searchParams.get('is_featured') ? searchParams.get('is_featured') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_uploader: searchParams.get('with_uploader') !== 'false',
    };

    const result = await getMediaByEntity(entityType, entityIdNum, {
      file_type: filters.file_type as "image" | "video" | "document" | "audio" | undefined,
      uploader_id: filters.uploader_id,
      is_featured: filters.is_featured,
      page: filters.page,
      limit: filters.limit,
      with_uploader: filters.with_uploader,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/media/entity/[entityType]/[entityId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des médias de l\'entité' },
      { status: 500 }
    );
  }
}