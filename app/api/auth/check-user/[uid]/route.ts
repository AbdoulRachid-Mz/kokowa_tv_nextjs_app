import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/neon-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    const sql = 'SELECT id FROM users WHERE auth_id = $1';
    const result = await query(sql, [uid]);
    
    return NextResponse.json({
      exists: result.length > 0,
      userId: result[0]?.id || null
    });
    
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'utilisateur' },
      { status: 500 }
    );
  }
}