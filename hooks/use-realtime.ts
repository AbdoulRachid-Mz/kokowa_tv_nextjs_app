// hooks/use-realtime.ts
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeClient, RealtimeOptions } from '../lib/realtime-client';
import { WSMessage, EntityType } from '../server/ws-types';

export function useRealtime(options: RealtimeOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const clientRef = useRef<RealtimeClient | null>(null);
    const optionsRef = useRef(options);

    const getWebSocketURL = () => {
        const isBrowser = typeof window !== 'undefined';

        if (isBrowser) {
            const { protocol, host } = window.location;
            const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

            if (host.includes('localhost')) {
                return 'ws://localhost:3001'; // dev local
            }

            // Production sur Railway → utiliser la route API
            return `${wsProtocol}//${host}/api/ws`;
        }

        // fallback serveur
        return 'ws://localhost:3001';
    };

    // Mettre à jour optionsRef sans déclencher d'effet
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
                optionsRef.current.onConnect?.();
            },
            onDisconnect: () => {
                setIsConnected(false);
                optionsRef.current.onDisconnect?.();
            },
            onMessage: (msg) => {
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
    }, []); // Dépendance vide pour ne créer le client qu'une fois

    const subscribe = useCallback((entityType: EntityType, entityId: string | number) => {
        clientRef.current?.subscribe(entityType, entityId);
    }, []);

    const unsubscribe = useCallback((entityType: EntityType, entityId: string | number) => {
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
