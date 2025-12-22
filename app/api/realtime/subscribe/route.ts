// app/api/realtime/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectionManager } from '@/lib/realtime/connection-manager';

export async function POST(request: NextRequest) {
  try {
    const { clientId, subscriptions } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    // Gérer les subscriptions aux matches
    if (subscriptions.matches) {
      subscriptions.matches.forEach((matchId: number) => {
        connectionManager.subscribeToMatch(clientId, matchId);
      });
    }

    // Gérer les subscriptions aux éditions
    if (subscriptions.editions) {
      subscriptions.editions.forEach((editionId: number) => {
        connectionManager.subscribeToEdition(clientId, editionId);
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscriptions mises à jour',
      stats: connectionManager.getStats()
    });
  } catch (error: any) {
    console.error('Error in subscribe API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la subscription' },
      { status: 500 }
    );
  }
}