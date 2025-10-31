import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/actions/regions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const orderByParam = searchParams.get('orderBy');
    const orderParam = searchParams.get('order');
    const searchParam = searchParams.get('search');

    const limit = limitParam ? Number(limitParam) : 50;
    const offset = offsetParam ? Number(offsetParam) : 0;
    const orderBy = orderByParam === 'code' || orderByParam === 'id' ? orderByParam : 'name';
    const order = orderParam === 'DESC' ? 'DESC' : 'ASC';
    const search = searchParam ?? '';

    const regions = await getRegions({ limit, offset, orderBy, order, search });

    return NextResponse.json({
      data: regions,
      pagination: {
        limit,
        offset,
        count: regions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const newRegion = await createRegion(formData);
    return NextResponse.json(newRegion, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
  }
}
