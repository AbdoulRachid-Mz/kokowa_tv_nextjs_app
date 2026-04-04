// @/server/ws-connection-manager.ts
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import type { WSClient, WSMessage, WSMessageType, SubscriptionData, RealtimeUpdatePayload, ServerStats, Platform, RedisMessage } from './ws-types.ts';
import * as admin from 'firebase-admin';
import { createClient } from 'redis';
import crypto from 'crypto';

// Configuration
const RATE_LIMIT = {
    MESSAGES_PER_MINUTE: 60,
    SUBSCRIBES_PER_MINUTE: 30,
    WINDOW_MS: 60000, // 1 minute
};

class WSConnectionManager {
    private clients: Map<string, WSClient> = new Map();
    private rooms: Map<string, Set<string>> = new Map();

    private pingInterval: NodeJS.Timeout | null = null;
    private rateLimitCleanupInterval: NodeJS.Timeout | null = null;
    private readonly PING_FREQ = 30000; // 30s
    private readonly CLIENT_TIMEOUT = 65000; // 65s

    // Redis client for multi-instance support
    private redisClient: ReturnType<typeof createClient> | null = null;
    private readonly instanceId: string;
    private readonly REDIS_CHANNEL = 'ws:broadcast';

    constructor() {
        this.instanceId = crypto.randomBytes(16).toString('hex');
        this.startHeartbeat();
        this.startRateLimitCleanup();
        this.connectRedis();
    }

    private async connectRedis() {
        if (!process.env.REDIS_WS_URL) {
            console.warn('⚠️ REDIS_WS_URL not set, running in single-instance mode');
            return;
        }

        try {
            this.redisClient = createClient({ url: process.env.REDIS_WS_URL });

            await this.redisClient.connect();
            console.log(`✅ Redis connected for WebSocket (instance: ${this.instanceId})`);

            // Subscribe to broadcast channel
            await this.redisClient.subscribe(this.REDIS_CHANNEL, (message) => {
                try {
                    const redisMsg: RedisMessage = JSON.parse(message);

                    // Ignore messages from this instance
                    if (redisMsg.instanceId === this.instanceId) return;

                    // Broadcast to local clients
                    this.broadcastToLocalClients(redisMsg.payload);
                } catch (err) {
                    console.error('❌ Redis message parse error:', err);
                }
            });

        } catch (err) {
            console.error('❌ Redis connection failed:', err);
            this.redisClient = null;
        }
    }

    private startHeartbeat() {
        this.pingInterval = setInterval(() => this.checkAlive(), this.PING_FREQ);
    }

    private startRateLimitCleanup() {
        this.rateLimitCleanupInterval = setInterval(() => this.resetRateLimits(), RATE_LIMIT.WINDOW_MS);
    }

    private resetRateLimits() {
        const now = Date.now();
        this.clients.forEach(client => {
            if (now - client.rateLimit.lastReset >= RATE_LIMIT.WINDOW_MS) {
                client.rateLimit.messageCount = 0;
                client.rateLimit.subscribeCount = 0;
                client.rateLimit.lastReset = now;
            }
        });
    }

    private checkRateLimit(client: WSClient, type: 'message' | 'subscribe'): boolean {
        const now = Date.now();

        // Reset if window expired
        if (now - client.rateLimit.lastReset >= RATE_LIMIT.WINDOW_MS) {
            client.rateLimit.messageCount = 0;
            client.rateLimit.subscribeCount = 0;
            client.rateLimit.lastReset = now;
        }

        if (type === 'message') {
            client.rateLimit.messageCount++;
            return client.rateLimit.messageCount <= RATE_LIMIT.MESSAGES_PER_MINUTE;
        } else {
            client.rateLimit.subscribeCount++;
            return client.rateLimit.subscribeCount <= RATE_LIMIT.SUBSCRIBES_PER_MINUTE;
        }
    }

    public addClient(ws: WebSocket, req: IncomingMessage): string {
        const clientId = Math.random().toString(36).substring(2, 15);
        const userAgent = req.headers['user-agent'] || '';
        const platform = this.detectPlatform(userAgent);
        const ip = req.socket.remoteAddress || 'unknown';

        console.log(`[WS] Client connecting: ${clientId} (${platform}) from ${ip}`);

        const client: WSClient = {
            ws,
            id: clientId,
            authenticated: false,
            subscriptions: new Set(),
            connectedAt: new Date(),
            userAgent,
            platform,
            lastPing: Date.now(),
            rateLimit: {
                messageCount: 0,
                subscribeCount: 0,
                lastReset: Date.now()
            }
        };

        this.clients.set(clientId, client);

        ws.on('message', (data) => this.handleMessage(clientId, data));
        ws.on('close', () => {
            console.log(`[WS] Client disconnected: ${clientId}`);
            this.removeClient(clientId);
        });
        ws.on('error', (err) => {
            console.error(`[WS] Client error ${clientId}:`, err);
            this.removeClient(clientId);
        });
        ws.on('pong', () => {
            const c = this.clients.get(clientId);
            if (c) c.lastPing = Date.now();
        });

        this.sendToClient(clientId, 'connected', {
            clientId,
            heartbeat: this.PING_FREQ,
            timestamp: Date.now(),
            instanceId: this.instanceId
        });

        console.log(`[WS] Client connected: ${clientId} (Total: ${this.clients.size})`);
        return clientId;
    }

    private async handleMessage(clientId: string, rawData: any) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Rate limiting
        if (!this.checkRateLimit(client, 'message')) {
            this.sendToClient(clientId, 'rate_limit_exceeded', {
                message: 'Rate limit exceeded. Slow down!',
                limit: RATE_LIMIT.MESSAGES_PER_MINUTE,
                windowMs: RATE_LIMIT.WINDOW_MS
            });
            return;
        }

        try {
            const message: WSMessage = JSON.parse(rawData.toString());
            const { type, data } = message;

            switch (type) {
                case 'auth':
                    await this.handleAuth(client, data);
                    break;
                case 'subscribe':
                    this.handleSubscribe(client, data);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(client, data);
                    break;
                case 'ping':
                    this.sendToClient(clientId, 'pong', { timestamp: Date.now() });
                    break;
                default:
                    console.warn(`[WS] Unknown message type: ${type} from ${clientId}`);
            }
        } catch (error) {
            this.sendToClient(clientId, 'error', { message: 'Protocol error' });
        }
    }

    private async handleAuth(client: WSClient, data: any) {
        const { token } = data;
        if (!token) {
            this.sendToClient(client.id, 'error', { message: 'Token required' });
            return;
        }

        try {
            // Vérification du token Firebase
            const decodedToken = await admin.auth().verifyIdToken(token);
            client.userId = decodedToken.uid;
            client.authenticated = true;
            client.roles = (decodedToken.roles as string[]) || [];

            console.log(`[WS] Client authenticated: ${client.id} (${client.userId})`);

            this.sendToClient(client.id, 'auth_success', {
                userId: client.userId,
                roles: client.roles,
                message: 'Authenticated successfully'
            });
        } catch (error) {
            console.error(`[WS] Auth failed for ${client.id}:`, error);
            this.sendToClient(client.id, 'error', { message: 'Authentication failed' });
        }
    }

    private handleSubscribe(client: WSClient, data: SubscriptionData) {
        // Rate limiting pour les souscriptions
        if (!this.checkRateLimit(client, 'subscribe')) {
            this.sendToClient(client.id, 'rate_limit_exceeded', {
                message: 'Subscribe rate limit exceeded',
                limit: RATE_LIMIT.SUBSCRIBES_PER_MINUTE
            });
            return;
        }

        const { entityType, entityId } = data;
        const roomName = `${entityType}:${entityId}`;

        // Vérification d'authentification pour certaines rooms
        if (entityType === 'admin' && !client.roles?.includes('admin')) {
            this.sendToClient(client.id, 'error', {
                message: 'Unauthorized: Admin access required'
            });
            return;
        }

        // Vérification pour les matchs (optionnel : exiger auth)
        // if (entityType === 'match' && !client.authenticated) {
        //     this.sendToClient(client.id, 'error', {
        //         message: 'Authentication required for match updates'
        //     });
        //     return;
        // }

        client.subscriptions.add(roomName);
        if (!this.rooms.has(roomName)) this.rooms.set(roomName, new Set());
        this.rooms.get(roomName)!.add(client.id);

        console.log(`[WS] ${client.id} subscribed to ${roomName}`);
        this.sendToClient(client.id, 'subscribed', { entityType, entityId });
    }

    private handleUnsubscribe(client: WSClient, data: SubscriptionData) {
        const { entityType, entityId } = data;
        const roomName = `${entityType}:${entityId}`;

        client.subscriptions.delete(roomName);
        this.rooms.get(roomName)?.delete(client.id);

        console.log(`[WS] ${client.id} unsubscribed from ${roomName}`);
        this.sendToClient(client.id, 'unsubscribed', { entityType, entityId });
    }

    public broadcastToEntity(payload: RealtimeUpdatePayload) {
        // 1. Broadcast aux clients locaux
        this.broadcastToLocalClients(payload);

        // 2. Si Redis est configuré, broadcast aux autres instances
        if (this.redisClient) {
            const redisMsg: RedisMessage = {
                type: 'broadcast',
                payload,
                timestamp: Date.now(),
                instanceId: this.instanceId
            };

            this.redisClient.publish(this.REDIS_CHANNEL, JSON.stringify(redisMsg))
                .catch(err => console.error('❌ Redis publish error:', err));
        }
    }

    private broadcastToLocalClients(payload: RealtimeUpdatePayload) {
        const roomName = `${payload.entityType}:${payload.entityId}`;
        const subscribers = this.rooms.get(roomName);

        if (!subscribers || subscribers.size === 0) {
            return;
        }

        const message = JSON.stringify({
            type: 'update',
            data: {
                ...payload,
                _instance: this.instanceId // Pour debug
            }
        });

        let sentCount = 0;
        subscribers.forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
                sentCount++;
            }
        });

        if (sentCount > 0) {
            console.log(`[WS] Broadcast to ${roomName}: ${sentCount} clients`);
        }
    }

    private checkAlive() {
        const now = Date.now();
        let timedOut = 0;

        this.clients.forEach((client, clientId) => {
            if (now - client.lastPing > this.CLIENT_TIMEOUT) {
                console.log(`[WS] Client timeout: ${clientId} (no ping for ${Math.round((now - client.lastPing) / 1000)}s)`);
                this.removeClient(clientId);
                timedOut++;
            } else if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.ping();
            }
        });

        if (timedOut > 0) {
            console.log(`[WS] Cleaned up ${timedOut} stale clients`);
        }
    }

    private removeClient(clientId: string) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Nettoyer les souscriptions
        client.subscriptions.forEach(roomName => {
            this.rooms.get(roomName)?.delete(clientId);
        });

        this.clients.delete(clientId);

        if (client.ws.readyState !== WebSocket.CLOSED) {
            client.ws.terminate();
        }
    }

    private sendToClient(clientId: string, type: WSMessageType, data: any) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type, data }));
        }
    }

    private detectPlatform(userAgent: string): Platform {
        if (userAgent.includes('Flutter') || userAgent.includes('Dart')) return 'flutter';
        if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) return 'web';
        return 'unknown';
    }

    public getStats(): ServerStats {
        const stats: Record<Platform, number> = { web: 0, flutter: 0, unknown: 0 };
        let authenticated = 0;
        let rateLimited = 0;

        this.clients.forEach(c => {
            stats[c.platform]++;
            if (c.authenticated) authenticated++;
            if (c.rateLimit.messageCount > RATE_LIMIT.MESSAGES_PER_MINUTE * 0.8) rateLimited++;
        });

        return {
            totalClients: this.clients.size,
            clientsByPlatform: stats,
            activeSubscriptions: this.rooms.size,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            authenticatedClients: authenticated,
            rateLimitedClients: rateLimited,
            redisConnected: this.redisClient !== null,
            instanceId: this.instanceId
        };
    }

    public shutdown() {
        console.log('[WS] Shutting down...');

        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.rateLimitCleanupInterval) clearInterval(this.rateLimitCleanupInterval);

        // Notifier tous les clients
        this.clients.forEach(c => {
            c.ws.close(1000, 'Server shutdown');
        });

        // Fermer Redis
        if (this.redisClient) {
            this.redisClient.unsubscribe(this.REDIS_CHANNEL);
            this.redisClient.quit();
        }
    }
}

export const wsManager = (global as any).wsManager || new WSConnectionManager();
if (process.env.NODE_ENV !== 'production') (global as any).wsManager = wsManager;