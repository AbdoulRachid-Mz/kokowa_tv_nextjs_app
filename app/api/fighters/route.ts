import { NextRequest, NextResponse } from 'next/server';
import { getFighters, createFighter } from '@/actions/fighters';
import { fighterSchema } from '@/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build the filters object expected by getFighters
    const filters = {
      search: searchParams.get('search') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      is_champion: searchParams.get('is_champion') ? searchParams.get('is_champion') === 'true' : undefined,
      min_ranking: searchParams.get('min_ranking') ? parseInt(searchParams.get('min_ranking')!) : undefined,
      max_ranking: searchParams.get('max_ranking') ? parseInt(searchParams.get('max_ranking')!) : undefined,
      with_region: searchParams.get('with_region') === 'true',
      with_achievements: searchParams.get('with_achievements') === 'true',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await getFighters(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error GET /api/fighters:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des lutteurs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = fighterSchema.parse(body);
    
    // Simuler FormData pour l'action serveur
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const result = await createFighter(formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error POST /api/fighters:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du lutteur' },
      { status: 500 }
    );
  }
}