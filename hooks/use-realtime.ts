// hooks/useRealtime.ts - CORRECTION
import { useEffect, useRef, useState, useCallback } from 'react';

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>('');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('🔗 Connexion SSE établie');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            clientIdRef.current = data.clientId;
            console.log('🆔 Client ID:', data.clientId);
          }

          setEvents(prev => [...prev.slice(-49), data]); // Garder les 50 derniers événements
        } catch (error) {
          console.error('❌ Erreur parsing message SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Erreur SSE:', error);
        setIsConnected(false);
        
        // Reconnexion automatique après 3 secondes
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Tentative de reconnexion...');
          connect();
        }, 3000);
      };

    } catch (error) {
      console.error('❌ Erreur connexion SSE:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const subscribeToMatch = useCallback(async (matchId: number) => {
    if (!clientIdRef.current) {
      console.warn('⚠️ Client ID non disponible pour la subscription');
      return;
    }

    try {
      const response = await fetch('/api/realtime/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          subscriptions: { matches: [matchId] }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Abonné au match ${matchId}`, result);
    } catch (error) {
      console.error('❌ Erreur subscription match:', error);
    }
  }, []);

  const subscribeToEdition = useCallback(async (editionId: number) => {
    if (!clientIdRef.current) {
      console.warn('⚠️ Client ID non disponible pour la subscription');
      return;
    }

    try {
      const response = await fetch('/api/realtime/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          subscriptions: { editions: [editionId] }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Abonné à l'édition ${editionId}`, result);
    } catch (error) {
      console.error('❌ Erreur subscription édition:', error);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    events,
    subscribeToMatch,
    subscribeToEdition,
    connect,
    disconnect
  };
}