import { NextRequest, NextResponse } from 'next/server';
import { getCompetitions, createCompetition, CompetitionFilters } from '@/actions/competitions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtres
    const filters: CompetitionFilters = {};
    const pagination = {};
    
    const search = searchParams.get('search');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    if (search) filters.search = search;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;
    if (page) pagination.page = Number(page);
    if (limit) pagination.limit = Number(limit);
    
    const result = await getCompetitions(filters, pagination);
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error: any) {
    console.error('API GET /competitions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la récupération des compétitions' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createCompetition(formData);
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error: any) {
    console.error('API POST /competitions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la création de la compétition' 
      },
      { status: 500 }
    );
  }
}