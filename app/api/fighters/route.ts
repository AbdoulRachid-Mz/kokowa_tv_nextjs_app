import { NextRequest, NextResponse } from 'next/server';
import { getFighters, createFighter } from '@/actions/fighters';
import { fighterSchema } from '@/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Reading and validating parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const orderByParam = searchParams.get('orderBy');
    const orderParam = searchParams.get('order');
    const searchParam = searchParams.get('search');

    // Conversion and default values
    const limit = limitParam ? Math.max(1, Number(limitParam)) : 20;
    const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;
    const page = Math.floor(offset / limit) + 1;
    const orderBy =
      orderByParam === 'ranking' || orderByParam === 'id' || orderByParam === 'name'
        ? orderByParam
        : 'name';
    const order = orderParam === 'DESC' ? 'DESC' : 'ASC';
    const search = searchParam ?? '';

    // Call the retrieval method
    const fighters = await getFighters({
      limit,
      page,
      search,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      is_active: searchParams.get('is_active') === '1' || Boolean("true"),
      is_champion: searchParams.get('is_champion') === '1',
      min_ranking: searchParams.get('min_ranking') ? parseInt(searchParams.get('min_ranking')!) : undefined,
      max_ranking: searchParams.get('max_ranking') ? parseInt(searchParams.get('max_ranking')!) : undefined,
      with_region: searchParams.get('with_region') !== "false",
      with_achievements: searchParams.get('with_achievements') !== "false",
    });

    return NextResponse.json({
      data: fighters.data,
      pagination: {
        page: fighters.pagination.page,
        limit: fighters.pagination.limit,
        total: fighters.pagination.total,
        totalPages: fighters.pagination.totalPages,
      },
      orderBy,
      order,
      search,
    });
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
    const formData = await request.formData();

    // Convertir FormData en objet brut
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    // Nettoyage et validation
    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname || undefined,
      birth_date: rawData.birth_date || undefined,
      birth_place: rawData.birth_place || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      height: rawData.height ? Number(rawData.height) : undefined,
      weight: rawData.weight ? Number(rawData.weight) : undefined,
      profile_image: rawData.profile_image || undefined,
      cover_image: rawData.cover_image || undefined,
      bio: rawData.bio || undefined,
      fighting_style: rawData.fighting_style || undefined,
      debut_year: rawData.debut_year ? Number(rawData.debut_year) : undefined,
      ranking: rawData.ranking ? Number(rawData.ranking) : 999,
      is_active: rawData.is_active === "true",
      is_champion: rawData.is_champion === "true",
    };

    const validatedData = fighterSchema.parse(cleanedData);

    // Appel à la fonction d’action
    const result = await createFighter(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error POST /api/fighters:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du lutteur" },
      { status: 500 }
    );
  }
}