// app/api/app-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, createAppSetting, getAllAppSettings, getPublicAppSettings } from '@/actions/app-settings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Endpoint pour les settings publics
    if (searchParams.get('public') === 'true') {
      const result = await getPublicAppSettings();
      return NextResponse.json(result);
    }

    // Endpoint pour tous les settings (typés)
    if (searchParams.get('all') === 'true') {
      const result = await getAllAppSettings();
      return NextResponse.json(result);
    }

    const filters = {
      category: searchParams.get('category') || undefined,
      is_public: searchParams.get('is_public') ? searchParams.get('is_public') === 'true' : undefined,
      is_editable: searchParams.get('is_editable') ? searchParams.get('is_editable') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    };

    const result = await getAppSettings(filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/app-settings:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createAppSetting(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/app-settings:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du paramètre' },
      { status: 500 }
    );
  }
}