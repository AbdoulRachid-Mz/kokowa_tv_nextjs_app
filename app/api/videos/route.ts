// app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVideos, createVideo, getLiveVideos, getFeaturedVideos, getPopularVideos, getVideoStats } from '@/actions/videos';
import { VideoFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Routes spéciales
    if (searchParams.get('live')) {
      const result = await getLiveVideos();
      return NextResponse.json(result);
    }

    if (searchParams.get('featured')) {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const result = await getFeaturedVideos(limit);
      return NextResponse.json(result);
    }

    if (searchParams.get('popular')) {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const result = await getPopularVideos(limit);
      return NextResponse.json(result);
    }

    if (searchParams.get('stats')) {
      const result = await getVideoStats();
      return NextResponse.json(result);
    }

    const filters = {
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      is_live: searchParams.get('is_live') ? searchParams.get('is_live') === 'true' : undefined,
      is_featured: searchParams.get('is_featured') ? searchParams.get('is_featured') === 'true' : undefined,
      with_duration: searchParams.get('with_duration') !== 'false',
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await getVideos(filters as VideoFilters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/videos:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des vidéos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createVideo(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/videos:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la vidéo' },
      { status: 500 }
    );
  }
}