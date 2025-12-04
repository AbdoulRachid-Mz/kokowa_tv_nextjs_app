import { NextRequest, NextResponse } from 'next/server';
import { getBelts, createBelt, getBeltStats } from '@/actions/belts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      is_active: searchParams.has('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      color: searchParams.get('color') || undefined,
      sort_by: searchParams.get('sort_by') as 'color' | 'created_at' | 'id' || 'color',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'asc',
    };

    const result = await getBelts(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in belts API GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ceintures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createBelt(formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in belts API POST:', error);
    
    if (error instanceof Error && error.message.includes('existe déjà')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de la ceinture' },
      { status: 500 }
    );
  }
}