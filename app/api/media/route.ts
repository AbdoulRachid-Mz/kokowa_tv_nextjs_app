// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMedia, createMedia, getFeaturedMedia, getMediaStats } from '@/actions/media';
import { MediaFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Route pour les médias en vedette
    if (searchParams.get('featured')) {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const result = await getFeaturedMedia(limit);
      return NextResponse.json(result);
    }

    // Route pour les statistiques
    if (searchParams.get('stats')) {
      const result = await getMediaStats();
      return NextResponse.json(result);
    }

    const filters = {
      file_type: searchParams.get('file_type') || undefined,
      uploader_id: searchParams.get('uploader_id') ? parseInt(searchParams.get('uploader_id')!) : undefined,
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') ? parseInt(searchParams.get('entity_id')!) : undefined,
      is_featured: searchParams.get('is_featured') ? searchParams.get('is_featured') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_uploader: searchParams.get('with_uploader') !== 'false',
    };

    const result = await getMedia(filters as MediaFilters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/media:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des médias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createMedia(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/media:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du média' },
      { status: 500 }
    );
  }
}