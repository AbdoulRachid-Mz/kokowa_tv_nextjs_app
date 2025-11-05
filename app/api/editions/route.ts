import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEditions,
  getEditionById,
  createEdition,
  getEditionsStats
} from '@/actions/editions';
import { competitionEditionSchema } from '@/validation/schemas';

// GET /api/editions
// app/api/editions/route.ts - CORRIGÉ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Tous les paramètres de requête possibles
    const competition_id = searchParams.get('competition_id') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const search = searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const with_competition = searchParams.get('with_competition') === 'true';
    const with_fighters = searchParams.get('with_fighters') === 'true';
    const with_regions = searchParams.get('with_regions') === 'true';
    const with_phases = searchParams.get('with_phases') === 'true';
    const stats = searchParams.get('stats') === 'true';
    const id = searchParams.get('id') || undefined;

    // Gérer l'endpoint des statistiques
    if (stats) {
      const statistics = await getEditionsStats();
      return NextResponse.json(statistics);
    }

    // Gérer la récupération d'une seule édition
    if (id) {
      const editionId = parseInt(id, 10);
      if (isNaN(editionId)) {
        return NextResponse.json({ error: 'ID d\'édition invalide' }, { status: 400 });
      }
      const edition = await getEditionById(editionId, { with_relations: true });
      if (!edition) {
        return NextResponse.json({ error: 'Édition non trouvée' }, { status: 404 });
      }
      return NextResponse.json(edition);
    }

    // Construire les options pour getEditions
    const options: any = {
      with_competition,
      limit,
      offset: (page - 1) * limit,
    };

    if (competition_id) options.competition_id = competition_id;
    if (search) options.search = search;

    const editions = await getEditions(options);

    return NextResponse.json({
      data: editions.data,
      pagination: {
        page,
        limit,
        total: editions.total,
        totalPages: Math.ceil(editions.total / limit),
      }
    });
  } catch (error) {
    console.error('GET /api/editions error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' }, 
      { status: 500 }
    );
  }
}

// POST /api/editions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = competitionEditionSchema.parse(body);

    // Convert JSON body to FormData for compatibility with existing createEdition
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const result = await createEdition(formData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('POST /api/editions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
