// @/server/websocket-server.ts
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
// @ts-ignore
import { wsManager } from './ws-connection-manager.ts';
import { parse } from 'url';
import * as dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import pino from 'pino';

// Load environment variables
dotenv.config();

// Logger
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
});

// Firebase Admin initialization for WebSocket Server
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        logger.info('✅ Firebase Admin initialized for WebSocket Server');
    } catch (error) {
        logger.error({ msg: '❌ Firebase Admin initialization failed', error });
        process.exit(1);
    }
}

const PORT = process.env.PORT || 3001;  // Railway définit automatiquement PORT
const HOST = process.env.WS_HOST || '0.0.0.0';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

const server = createServer((req, res) => {
    const { pathname } = parse(req.url || '/', true);

    // CORS headers
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: Date.now(),
            instance: process.env.INSTANCE_ID || 'unknown'
        }));
    } else if (pathname === '/stats') {
        const stats = wsManager.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ...stats,
            instance: process.env.INSTANCE_ID || 'unknown',
            redis: process.env.REDIS_URL ? 'connected' : 'disabled'
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const wss = new WebSocketServer({
    server,
    path: '/ws',
    // Options pour production
    clientTracking: true,
    maxPayload: 1024 * 1024, // 1MB max
});

wss.on('connection', (ws, req) => {
    wsManager.addClient(ws, req);
});

wss.on('error', (error) => {
    logger.error({ msg: 'WebSocket Server error', error });
});

const shutdown = () => {
    logger.info('Shutting down WebSocket Server...');

    wsManager.shutdown();

    wss.close(() => {
        server.close(() => {
            logger.info('WebSocket Server stopped');
            process.exit(0);
        });
    });

    // Force exit after 10s
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
    logger.error({ msg: 'Uncaught Exception', error });
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ msg: 'Unhandled Rejection at:', promise, 'reason:': reason });
});

server.listen(Number(PORT), HOST, () => {
    // ✅ Construire l'URL dynamiquement
    let wsUrl;
    if (process.env.NODE_ENV === 'production') {
        // Utiliser le même domaine que l'application
        const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || 'kokowa-tv.up.railway.app';
        wsUrl = `wss://${host}/ws`;
    } else {
        wsUrl = `ws://${HOST}:${PORT}/ws`;
    }

    logger.info(`
🚀 WebSocket Gateway Server running
   - Environment: ${process.env.NODE_ENV || 'development'}
   - Port: ${PORT}
   - Host: ${HOST}
   - URL: ${wsUrl}
   - Redis: ${process.env.REDIS_WS_URL ? '✅ Enabled' : '❌ Disabled (single instance)'}
   - Instance ID: ${process.env.INSTANCE_ID || 'unknown'}
    `);
});