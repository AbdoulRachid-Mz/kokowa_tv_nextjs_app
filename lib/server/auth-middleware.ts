import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-middleware';
import { query } from '@/lib/db/neon-client';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authResult = await requireAuth(request, ['manage_users']);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Récupérer les utilisateurs
    const users = await query(`
      SELECT 
        u.*,
        r.name as region_name
      FROM users u
      LEFT JOIN regions r ON u.region_id = r.id
      ORDER BY u.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('API Error GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}
