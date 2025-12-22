// app/api/database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTablesList, getTableInfo, getDatabaseSummary } from '@/actions/database';

// GET /api/database?page=1&limit=20&search=users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10) || 20;
    const search = searchParams.get('search') ?? undefined;
    const table = searchParams.get('table') ?? undefined;

    if (table) {
      // Récupérer les infos détaillées d'une table spécifique
      const info = await getTableInfo(table);
      return NextResponse.json(info);
    }

    if (searchParams.has('summary')) {
      // Renvoyer le résumé de la base
      const summary = await getDatabaseSummary();
      return NextResponse.json(summary);
    }

    // Renvoyer la liste paginée des tables
    const data = await getTablesList(page, limit, search);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
