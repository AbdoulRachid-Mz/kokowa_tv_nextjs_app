// hooks/use-realtime.ts
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeClient, RealtimeOptions } from '../lib/realtime-client';
import { WSMessage, EntityType } from '../server/ws-types';

export function useRealtime(options: RealtimeOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const clientRef = useRef<RealtimeClient | null>(null);
    const subscriptionsRef = useRef<Set<string>>(new Set()); // Store subscriptions
    const optionsRef = useRef(options);

    const getWebSocketURL = () => {
        if (typeof window === 'undefined') {
            return 'ws://localhost:3000';
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;

        return `${protocol}//${host}/ws`;
    };

    // Update optionsRef without triggering effect
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Initialize client once
    useEffect(() => {
        const url = getWebSocketURL();

        const client = new RealtimeClient(url, {
            ...optionsRef.current,
            onConnect: () => {
                setIsConnected(true);
                // Resubscribe to all previous subscriptions
                subscriptionsRef.current.forEach(sub => {
                    const [entityType, entityId] = sub.split(':');
                    clientRef.current?.send('subscribe', { entityType, entityId });
                });
                optionsRef.current.onConnect?.();
            },
            onDisconnect: () => {
                setIsConnected(false);
                optionsRef.current.onDisconnect?.();
            },
            onMessage: (msg) => {
                console.log('📨 [WS Client] Message received:', JSON.stringify(msg, null, 2));
                
                if (msg.type === 'update') {
                    console.log(`🔄 [WS Client] Update for ${msg.data.entityType}:${msg.data.entityId} - ${msg.data.event}`);
                }
                
                if (msg.type === 'auth_success') {
                    console.log('🔐 [WS Client] Authentication successful');
                }
                
                if (msg.type === 'error') {
                    console.error('❌ [WS Client] Server Error:', msg.data);
                }

                setLastMessage(msg);
                optionsRef.current.onMessage?.(msg);
            },
            onError: (err) => {
                optionsRef.current.onError?.(err);
            }
        });

        clientRef.current = client;

        return () => {
            client.disconnect();
            clientRef.current = null;
        };
    }, []); // Empty dependency to create client only once

    const subscribe = useCallback((entityType: EntityType, entityId: string | number) => {
        const subKey = `${entityType}:${entityId}`;
        subscriptionsRef.current.add(subKey);
        clientRef.current?.subscribe(entityType, entityId);
    }, []);

    const unsubscribe = useCallback((entityType: EntityType, entityId: string | number) => {
        const subKey = `${entityType}:${entityId}`;
        subscriptionsRef.current.delete(subKey);
        clientRef.current?.unsubscribe(entityType, entityId);
    }, []);

    const auth = useCallback((userId: string, token: string) => {
        clientRef.current?.auth(userId, token);
    }, []);

    const send = useCallback((type: any, data: any) => {
        clientRef.current?.send(type, data);
    }, []);

    // Helper methods for entities
    const subscribeToMatch = useCallback((id: number | string) => subscribe('match', id), [subscribe]);
    const subscribeToEdition = useCallback((id: number | string) => subscribe('edition', id), [subscribe]);
    const subscribeToSubGroup = useCallback((id: number | string) => subscribe('subGroup', id), [subscribe]);
    const subscribeToFighter = useCallback((id: number | string) => subscribe('fighter', id), [subscribe]);
    const subscribeToRegion = useCallback((id: number | string) => subscribe('region', id), [subscribe]);

    return {
        isConnected,
        lastMessage,
        subscribe,
        unsubscribe,
        subscribeToMatch,
        subscribeToEdition,
        subscribeToSubGroup,
        subscribeToFighter,
        subscribeToRegion,
        auth,
        send
    };
}
