import { NextRequest, NextResponse } from 'next/server';
import { getFighters, createFighter } from '@/actions/fighters';
import { fighterSchema } from '@/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Construire l'objet d'options attendu par getFighters
    const options = {
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      region_id: searchParams.get('region_id') || undefined,
      with_category: searchParams.get('with_category') === 'true',
      with_region: searchParams.get('with_region') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('page')
        ? (parseInt(searchParams.get('page')!) - 1) * (parseInt(searchParams.get('limit')!) || 20)
        : 0,
    };

    const result = await getFighters(options);

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