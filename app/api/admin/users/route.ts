import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth-middleware';
import { query } from '@/lib/db/neon-client';

// API admin seulement - nécessite la permission 'manage_users'
const adminHandler = async (request: NextRequest, context: { params: Promise<{}> }, user: any) => {
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
};

export const GET = withAuth((request: NextRequest, user: any) => adminHandler(request, { params: Promise.resolve({}) }, user), ['manage_users']);
