// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
// @ts-ignore
import { wsManager } from './server/ws-connection-manager.ts';
import * as dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import pino from 'pino';

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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

// Firebase Admin initialization for Server
if (!getApps().length) {
    try {
        const firebaseConfig = {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
            initializeApp({
                credential: cert(firebaseConfig as any),
            });
            logger.info('✅ Firebase Admin initialized');
        } else {
            logger.warn('⚠️ Firebase Admin credentials missing, authentication might fail');
        }
    } catch (error) {
        logger.error({ msg: '❌ Firebase Admin initialization failed', error });
    }
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            const { pathname } = parsedUrl;

            // Custom health endpoint
            if (pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    timestamp: Date.now(),
                    instance: process.env.INSTANCE_ID || 'unknown'
                }));
                return;
            }

            // Custom stats endpoint
            if (pathname === '/ws-stats') {
                const stats = wsManager.getStats();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    ...stats,
                    instance: process.env.INSTANCE_ID || 'unknown'
                }));
                return;
            }

            // Default Next.js handler
            await handle(req, res, parsedUrl);
        } catch (err) {
            logger.error({ msg: 'Error occurred handling request', url: req.url, error: err });
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    // WebSocket Server attached to the same HTTP server
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        clientTracking: true,
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on('connection', (ws, req) => {
        wsManager.addClient(ws, req);
    });

    wss.on('error', (error) => {
        logger.error({ msg: 'WebSocket Server error', error });
    });

    server.listen(Number(PORT), HOST, () => {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';

        logger.info(`
🚀 Server ready on ${protocol}://${HOST}:${PORT}
   - Environment: ${process.env.NODE_ENV || 'development'}
   - Next.js: ${protocol}://${HOST}:${PORT}
   - WebSocket: ${wsProtocol}://${HOST}:${PORT}/ws
   - Health Check: ${protocol}://${HOST}:${PORT}/health
        `);
    });

    const shutdown = () => {
        logger.info('Shutting down server...');

        wsManager.shutdown();

        wss.close(() => {
            server.close(() => {
                logger.info('Server stopped');
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
        logger.error({ msg: 'Unhandled Rejection', promise, reason });
    });
}).catch((err) => {
    logger.error('Error during app.prepare():', err);
    process.exit(1);
});
