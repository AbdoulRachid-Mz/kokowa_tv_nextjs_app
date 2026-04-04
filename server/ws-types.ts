// @/server/ws-types.ts
import { WebSocket } from 'ws';

export type EntityType = 'edition' | 'subGroup' | 'match' | 'fighter' | 'region' | 'admin';
export type Platform = 'web' | 'flutter' | 'unknown';

export interface RateLimitInfo {
    messageCount: number;
    lastReset: number;
    subscribeCount: number;
}

export interface WSClient {
    ws: WebSocket;
    id: string;
    userId?: string;
    authenticated: boolean;
    subscriptions: Set<string>; // Format: "entityType:entityId"
    connectedAt: Date;
    userAgent?: string;
    platform: Platform;
    lastPing: number;
    roles?: string[]; // Pour sécuriser l'accès aux flux admin
    rateLimit: RateLimitInfo;
}

export interface WSMessage<T = any> {
    type: WSMessageType;
    data: T;
}

export type WSMessageType = 
    | 'auth' 
    | 'auth_success' 
    | 'subscribe' 
    | 'unsubscribe' 
    | 'subscribed' 
    | 'unsubscribed' 
    | 'update' 
    | 'ping' 
    | 'pong' 
    | 'error' 
    | 'connected' 
    | 'stats'
    | 'rate_limit_exceeded';

export interface SubscriptionData {
    entityType: EntityType;
    entityId: string | number;
}

export interface RealtimeUpdatePayload {
    entityType: EntityType;
    entityId: string | number;
    event: string;
    data: any;
    timestamp: number;
    // Optionnel : pour le broadcasting distribué
    origin?: string; // Identifiant de l'instance qui a émis
}

export interface ServerStats {
    totalClients: number;
    clientsByPlatform: Record<Platform, number>;
    activeSubscriptions: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    authenticatedClients: number;
    rateLimitedClients: number;
    redisConnected: boolean;
    instanceId: string;
}

export interface RedisMessage {
    type: 'broadcast';
    payload: RealtimeUpdatePayload;
    timestamp: number;
    instanceId: string;
}