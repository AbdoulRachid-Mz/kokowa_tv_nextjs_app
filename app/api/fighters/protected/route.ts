import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth-middleware';
import { getFighters } from '@/actions/fighters';

// API protégée - seulement pour utilisateurs authentifiés
const protectedHandler = async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await getFighters(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error GET /api/fighters/protected:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des lutteurs' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(protectedHandler);