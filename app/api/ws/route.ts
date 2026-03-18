// app/api/ws/route.ts
import { wsManager } from '@/server/ws-connection-manager';
import { WebSocketServer } from 'ws';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

let wss: WebSocketServer | null = null;

export const GET = (req: NextRequest) => {
  const { socket } = (req as any); // socket n'existe pas sur NextRequest TS, on force any
  if (!socket) {
    return NextResponse.json({ error: 'No socket found' }, { status: 400 });
  }

  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    (socket as any).server.on('upgrade', (request: any, sock: any, head: any) => {
      if (request.url === '/api/ws') {
        wss!.handleUpgrade(request, sock, head, (ws) => {
          wsManager.addClient(ws, request);
        });
      } else {
        sock.destroy();
      }
    });
  }

  return NextResponse.json({ status: 'ok' });
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};