// app/api/referees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refereeSchema } from '@/validation/schemas';
import { createReferee, getReferees } from '@/actions/referees';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
      certification_level: searchParams.get('certification_level') || undefined,
      experience_min: searchParams.get('experience_min') ? parseInt(searchParams.get('experience_min')!) : undefined,
      with_region: searchParams.get('with_region') !== 'false',
      with_sub_groups: searchParams.get('with_sub_groups') !== 'false',
    };

    const result = await getReferees(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error GET /api/referees:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des arbitres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = refereeSchema.parse(body);
    
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

    const result = await createReferee(formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error POST /api/referees:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'arbitre' },
      { status: 500 }
    );
  }
}