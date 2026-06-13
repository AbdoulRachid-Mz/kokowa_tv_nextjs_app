// app/api/mobile/referees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getMobileReferees, 
  createMobileReferee 
} from '@/actions/mobile/referees';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Récupérer les filtres
    const filters = {
      regionId: searchParams.get('regionId') ? parseInt(searchParams.get('regionId')!) : undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      certificationLevel: searchParams.get('certificationLevel') || undefined,
      experienceMin: searchParams.get('experienceMin') ? parseInt(searchParams.get('experienceMin')!) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      withRegion: searchParams.get('withRegion') !== 'false',
      withSubGroups: searchParams.get('withSubGroups') === 'true',
      sortBy: searchParams.get('sortBy') as 'experience' | 'matches' | 'name' || 'name',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    const result = await getMobileReferees(filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/mobile/referees:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la récupération des arbitres',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createMobileReferee(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/mobile/referees:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la création de l\'arbitre',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}