// lib/realtime-client.ts
import { WSMessage, WSMessageType, SubscriptionData } from '../server/ws-types';

export interface RealtimeOptions {
    autoConnect?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onMessage?: (message: WSMessage) => void;
    onError?: (error: any) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export class RealtimeClient {
    private ws: WebSocket | null = null;
    private url: string;
    private options: RealtimeOptions;
    private reconnectAttempts = 0;
    private subscriptions: Set<string> = new Set();
    private isManuallyClosed = false;

    constructor(url: string, options: RealtimeOptions = {}) {
        this.url = url;
        this.options = {
            autoConnect: true,
            reconnectInterval: 1000,
            maxReconnectAttempts: 10,
            ...options
        };

        if (this.options.autoConnect) {
            this.connect();
        }
    }

    public connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.isManuallyClosed = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[Realtime] Connected');
            this.reconnectAttempts = 0;
            this.options.onConnect?.();
            this.resubscribe();
        };

        this.ws.onmessage = (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                this.options.onMessage?.(message);
            } catch (err) {
                console.error('[Realtime] Message parse error:', err);
            }
        };

        this.ws.onclose = () => {
            console.log('[Realtime] Disconnected');
            this.options.onDisconnect?.();
            if (!this.isManuallyClosed) {
                this.reconnect();
            }
        };

        this.ws.onerror = (err) => {
            console.error('[Realtime] WebSocket error:', err);
            this.options.onError?.(err);
        };
    }

    private reconnect() {
        if (this.isManuallyClosed) return;
        
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 10)) {
            console.error('[Realtime] Max reconnect attempts reached');
            return;
        }

        const delay = Math.min(
            (this.options.reconnectInterval || 1000) * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30s
        );

        console.log(`[Realtime] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`);
        
        // Nettoyer l'ancien timeout s'il existe
        if ((this as any).reconnectTimeout) {
            clearTimeout((this as any).reconnectTimeout);
        }

        (this as any).reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    private resubscribe() {
        this.subscriptions.forEach(sub => {
            const [entityType, entityId] = sub.split(':');
            this.send('subscribe', { entityType, entityId });
        });
    }

    public subscribe(entityType: string, entityId: string | number) {
        const subKey = `${entityType}:${entityId}`;
        this.subscriptions.add(subKey);
        this.send('subscribe', { entityType, entityId });
    }

    public unsubscribe(entityType: string, entityId: string | number) {
        const subKey = `${entityType}:${entityId}`;
        this.subscriptions.delete(subKey);
        this.send('unsubscribe', { entityType, entityId });
    }

    public auth(userId: string, token: string) {
        this.send('auth', { userId, token });
    }

    public send(type: WSMessageType, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.warn(`[Realtime] Message not sent, socket not open: ${type}`);
        }
    }

    public disconnect() {
        this.isManuallyClosed = true;
        if ((this as any).reconnectTimeout) {
            clearTimeout((this as any).reconnectTimeout);
        }
        this.ws?.close();
        this.ws = null;
    }
}
