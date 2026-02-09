// /api/mobile/fighters
import { NextRequest } from 'next/server';
import { getMobileFighters } from '@/actions/mobile/fighters';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  // Extract query parameters
  const { searchParams } = new URL(request.url);
  const filters = {
    page: searchParams.has('page') ? Number(searchParams.get('page')) : undefined,
    limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined,
    userId: searchParams.has('userId') ? Number(searchParams.get('userId')) : undefined,
    search: searchParams.get('search') || undefined,
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
    regionId: searchParams.has('regionId') ? Number(searchParams.get('regionId')) : undefined,
    isChampion: searchParams.has('isChampion') ? searchParams.get('isChampion') === 'true' : undefined,
    isActive: searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    achievementFilter: searchParams.get('achievementFilter') as 'champion' | 'finalist' | 'medalist' | 'all' | undefined,
  };

  const result = await getMobileFighters(filters);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);