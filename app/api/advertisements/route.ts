import { NextRequest, NextResponse } from 'next/server';

import { getAdvertisements } from '@/actions/advertisements';
import { AdvertisementFilters, AdvertisementMediaType, AdvertisementPosition } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: AdvertisementFilters = {
      position: (searchParams.get('position') as AdvertisementPosition | null) || undefined,
      media_type: (searchParams.get('media_type') as AdvertisementMediaType | null) || undefined,
      is_active: searchParams.has('is_active')
        ? searchParams.get('is_active') === 'true'
        : undefined,
      start_date_from: searchParams.get('start_date_from') || undefined,
      start_date_to: searchParams.get('start_date_to') || undefined,
      end_date_from: searchParams.get('end_date_from') || undefined,
      end_date_to: searchParams.get('end_date_to') || undefined,
      advertiser_name: searchParams.get('advertiser_name') || undefined,
      target_audience: searchParams.get('target_audience') || undefined,
      with_clicks: searchParams.has('with_clicks')
        ? searchParams.get('with_clicks') === 'true'
        : false,
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      sortBy: searchParams.get('sortBy') || 'priority',
      sortOrder: (searchParams.get('sortOrder') as 'desc' | 'asc' | null) || 'desc',
    };

    const result = await getAdvertisements(filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET /api/advertisements error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des publicités' },
      { status: 500 }
    );
  }
}
