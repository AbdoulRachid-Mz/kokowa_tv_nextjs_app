// app/api/coaches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCoaches, createCoach } from '@/actions/coaches';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      certification_level: searchParams.get('certification_level') || undefined,
      experience_min: searchParams.get('experience_min') ? parseInt(searchParams.get('experience_min')!) : undefined,
      with_region: searchParams.has('with_region') !== Boolean("false"),
    };

    const result = await getCoaches(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/coaches:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des coachs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      region_id: formData.get('region_id'),
      profile_image: formData.get('profile_image'),
      license_number: formData.get('license_number'),
      certification_level: formData.get('certification_level'),
      experience_years: formData.get('experience_years'),
      specialties: formData.get('specialties'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      profile_image: rawData.profile_image as string || undefined,
      license_number: rawData.license_number as string,
      certification_level: rawData.certification_level as string || undefined,
      experience_years: rawData.experience_years ? Number(rawData.experience_years) : undefined,
      specialties: rawData.specialties as string || undefined,
      is_active: rawData.is_active === 'true',
    };

    const { coachSchema } = await import('@/validation/schemas');
    const validatedData = coachSchema.parse(cleanedData);

    const result = await createCoach(validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/coaches:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du coach' },
      { status: 500 }
    );
  }
}