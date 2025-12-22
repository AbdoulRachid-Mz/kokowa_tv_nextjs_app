import { NextRequest, NextResponse } from 'next/server';
import { getCompleteUserData } from '@/lib/server/auth-utils';
import { verifyFirebaseToken } from '@/lib/server/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Vérifier le token Firebase
    const authResult = await verifyFirebaseToken(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer les données utilisateur complètes
    const userData = await getCompleteUserData(authResult.user.uid);

    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('API Error GET /api/auth/user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données utilisateur' },
      { status: 500 }
    );
  }
}