import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth-middleware';
import { query } from '@/lib/db/neon-client';

// Handler principal
async function adminHandler(request: NextRequest, user: any) {
  try {
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

// Export avec auth - version corrigée
export const GET = withAuth(adminHandler, ['manage_users']);

// Si vous avez besoin d'autres méthodes
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}
