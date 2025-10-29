import { NextRequest, NextResponse } from 'next/server';
import { getLutteurs, createLutteur } from '@/actions/lutteurs';

export async function GET(request: NextRequest) {
  try {
    // console.log('GET /api/lutteurs called');
    
    const { searchParams } = new URL(request.url);
    
    // Filtres avec valeurs par défaut
    const filters = {};
    const pagination = {
      page: 1,
      limit: 20
    };
    
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    
    const result = await getLutteurs(filters, pagination);
    
    console.log('Lutteurs found:', result.data.length);
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error: any) {
    console.error('API GET /lutteurs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la récupération des lutteurs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // console.log('POST /api/lutteurs called');
    
    const formData = await request.formData();
    console.log('FormData received:', Object.fromEntries(formData.entries()));
    
    const result = await createLutteur(formData);
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error: any) {
    console.error('API POST /lutteurs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la création du lutteur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}