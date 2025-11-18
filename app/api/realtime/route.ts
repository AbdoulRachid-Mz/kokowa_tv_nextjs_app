// app/api/realtime/route.ts
import { NextRequest } from 'next/server';
import { connectionManager } from '@/lib/realtime/connection-manager';

export async function GET(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const encoder = new TextEncoder();
      
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Ajouter le client
      connectionManager.addClient({
        id: clientId,
        type: 'web',
        send,
        subscriptions: new Set()
      });

      // Envoyer un message de connexion
      send({ type: 'connected', clientId });

      // Gérer la déconnexion
      request.signal.addEventListener('abort', () => {
        connectionManager.removeClient(clientId);
        controller.close();
      });

      // Garder la connexion active
      const keepAlive = setInterval(() => {
        send({ type: 'keepalive' });
      }, 30000);

      // Nettoyer à la déconnexion
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        connectionManager.removeClient(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}