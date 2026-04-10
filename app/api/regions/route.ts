import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/actions/regions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Lecture et validation des paramètres
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const orderByParam = searchParams.get("orderBy");
    const orderParam = searchParams.get("order");
    const searchParam = searchParams.get("search");

    // Conversion et valeurs par défaut
    const rawLimit = limitParam ? Number(limitParam) : 20;
    // 🔥 allow ALL mode
    const limit = isNaN(rawLimit) ? 20 : rawLimit;
    const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;
    // safe page
    const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
    const orderBy =
      orderByParam === "code" || orderByParam === "id" || orderByParam === "name"
        ? orderByParam
        : "name";
    const order = orderParam === "DESC" ? "DESC" : "ASC";
    const search = searchParam ?? "";

    // Appel à la méthode de récupération
    const regions = await getRegions({
      limit,
      page,
      search,
      with_fighters: searchParams.get("with_fighters") !== "false",
      with_coach: searchParams.get("with_coach") !== 'false',
      with_competitions: searchParams.get("with_competitions") !== "false",
    });


    return NextResponse.json({
      data: regions.data,
      pagination: {
        page: regions.pagination.page,
        limit: regions.pagination.limit,
        total: regions.pagination.total,
        totalPages: regions.pagination.totalPages,
      },
      orderBy,
      order,
      search,
    });
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const newRegion = await createRegion(formData);
    return NextResponse.json(newRegion, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json({ error: 'echec de création de région' }, { status: 500 });
  }
}
