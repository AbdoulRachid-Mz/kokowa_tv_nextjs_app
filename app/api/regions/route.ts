import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/actions/regions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Number(limitParam) : undefined;
    const offset = offsetParam ? Number(offsetParam) : undefined;

    const regions = await getRegions(limit, offset);

    return NextResponse.json({
      data: regions,
      pagination: {
        limit: limit ?? null,
        offset: offset ?? null,
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
    const body = await request.json();
    const newRegion = await createRegion(body);
    return NextResponse.json(newRegion, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
  }
}
