// @/api/ws.ts
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import type { NextApiRequest } from 'next';
import { wsManager } from '@/server/ws-connection-manager';

export const config = {
  api: {
    bodyParser: false,
  },
};

let wss: WebSocketServer | null = null;

export default function handler(req: NextApiRequest, res: any) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  if (!wss) {
    const server = (res.socket as any)?.server;
    
    if (server && !server.wss) {
      wss = new WebSocketServer({ 
        server,
        path: '/api/ws',
      });

      server.wss = wss;

      wss.on('connection', (ws, req) => {
        wsManager.addClient(ws, req as any);
      });

      wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });

      console.log('✅ WebSocket server attached to Next.js');
    }
  }

  res.status(200).end();
}