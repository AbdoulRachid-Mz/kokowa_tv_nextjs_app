// app/ad/realtime/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRealtimeStats } from '@/actions/realtime';
import { useRealtime } from '@/hooks/use-realtime';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Server, Activity, Users, Layers, Lock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { auth } from '@/lib/firebase/client';
import { useAuthContext } from '@/contexts/auth-context';

interface ServerStats {
  totalClients: number;
  clientsByPlatform: {
    web: number;
    flutter: number;
    unknown: number;
  };
  activeSubscriptions: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  authenticatedClients: number;
  rateLimitedClients: number;
  redisConnected: boolean;
  instanceId: string;
}

export default function RealtimeAdminPage() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'anonymous' | 'loading'>('loading');

  const { user, loading: authLoading } = useAuthContext();

  const {
    isConnected,
    subscribe,
    unsubscribe,
    auth: wsAuth,
    lastMessage
  } = useRealtime({
    autoConnect: true,
    onConnect: () => {
      console.log('✅ Connecté à la gateway WebSocket');
      // Si on a un token utilisateur, on s'authentifie
      if (userToken) {
        wsAuth('admin', userToken);
      }
    },
    onDisconnect: () => {
      console.log('❌ Déconnecté de la gateway');
    },
    onMessage: (msg) => {
      console.log('📨 Message reçu:', msg);

      // Gérer les différents types de messages
      switch (msg.type) {
        case 'update':
          setLocalEvents(prev => {
            const newEvent = {
              ...msg.data,
              receivedAt: Date.now()
            };
            return [newEvent, ...prev].slice(0, 20);
          });
          break;

        case 'auth_success':
          console.log('🔐 Authentifié avec succès');
          setAuthStatus('authenticated');
          break;

        case 'error':
          console.error('❌ Erreur WebSocket:', msg.data.message);
          setLocalEvents(prev => [{
            type: 'error',
            message: msg.data.message,
            timestamp: Date.now()
          }, ...prev].slice(0, 20));
          break;

        case 'rate_limit_exceeded':
          console.warn('⚠️ Rate limit dépassé');
          setLocalEvents(prev => [{
            type: 'rate_limit',
            message: msg.data.message,
            timestamp: Date.now()
          }, ...prev].slice(0, 20));
          break;

        case 'subscribed':
          console.log(`📡 Abonné à ${msg.data.entityType}:${msg.data.entityId}`);
          break;
      }
    },
    onError: (err) => {
      console.error('Erreur WebSocket:', err);
    }
  });

  // Récupérer le token Firebase au chargement
  useEffect(() => {
    const fetchToken = async () => {
      if (!authLoading) {
        if (user) {
          try {
            // Utiliser le token d'ID Firebase pour l'authentification WebSocket
            // @ts-ignore - On suppose que la méthode getIdToken existe sur l'objet user de Firebase
            const token = await user.getIdToken?.() || user.userDocument?.fcm_token;
            setUserToken(token ?? null);
            setAuthStatus('authenticated');
          } catch (error) {
            console.error('Erreur récupération ID Token:', error);
            setAuthStatus('anonymous');
          }
        } else {
          setAuthStatus('anonymous');
        }
      }
    };
    
    fetchToken();
  }, [user, authLoading]);

  // Authentifier automatiquement quand connecté
  useEffect(() => {
    if (isConnected && userToken && authStatus === 'authenticated') {
      wsAuth('admin', userToken);
    }
  }, [isConnected, userToken, authStatus, wsAuth]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRealtimeStats();
      setStats(data as ServerStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // const interval = setInterval(loadStats, 5000); // Rafraîchir toutes les 5 secondes
    // return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (type: string, id: number) => {
    subscribe(type as any, id);
    setLocalEvents(prev => [{
      type: 'subscribe',
      entityType: type,
      entityId: id,
      timestamp: Date.now()
    }, ...prev].slice(0, 20));
  };

  const handleUnsubscribe = (type: string, id: number) => {
    unsubscribe(type as any, id);
    setLocalEvents(prev => [{
      type: 'unsubscribe',
      entityType: type,
      entityId: id,
      timestamp: Date.now()
    }, ...prev].slice(0, 20));
  };

  // Calculer le pourcentage de mémoire utilisée
  const memoryPercent = stats?.memoryUsage?.rss
    ? Math.round((stats.memoryUsage.rss / (512 * 1024 * 1024)) * 100) // 512MB max
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gateway Temps Réel
          </h1>
          <p className="text-muted-foreground mt-1">
            Architecture WebSocket Distribuée avec Redis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Statut d'authentification */}
          <Badge variant={authStatus === 'authenticated' ? "default" : "secondary"} className="gap-1">
            <Lock className={`h-3 w-3 ${authStatus === 'authenticated' ? 'text-green-500' : 'text-yellow-500'}`} />
            {authStatus === 'authenticated' ? 'Auth Firebase' : 'Mode Public'}
          </Badge>

          {/* Statut de connexion */}
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            {isConnected ? (
              <><Wifi className="h-3 w-3" /> Gateway Connecté</>
            ) : (
              <><WifiOff className="h-3 w-3" /> Gateway Déconnecté</>
            )}
          </Badge>

          <Button size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Connectés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="outline">Web: {stats?.clientsByPlatform?.web || 0}</Badge>
              <Badge variant="outline">Flutter: {stats?.clientsByPlatform?.flutter || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentifiés</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.authenticatedClients || 0}</div>
            <Progress
              value={stats?.totalClients ? (stats.authenticatedClients / stats.totalClients) * 100 : 0}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Actives</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Une room = une entité suivie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rateLimitedClients || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Clients proches de la limite
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cartes système */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              Mémoire Serveur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>RSS:</span>
                <span className="font-mono">
                  {stats?.memoryUsage?.rss ? Math.round(stats.memoryUsage.rss / 1024 / 1024) : 0} MB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Heap Total:</span>
                <span className="font-mono">
                  {stats?.memoryUsage?.heapTotal ? Math.round(stats.memoryUsage.heapTotal / 1024 / 1024) : 0} MB
                </span>
              </div>
              <Progress value={memoryPercent} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Uptime & Santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uptime:</span>
                <span>
                  {stats?.uptime ? Math.floor(stats.uptime / 60) : 0} min
                  {stats?.uptime ? ` ${Math.floor(stats.uptime % 60)}s` : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Instance ID:</span>
                <span className="font-mono text-xs">
                  {stats?.instanceId || 'local'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Redis Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats?.redisConnected ? "default" : "secondary"} className="mb-2">
              {stats?.redisConnected ? '✅ Redis Connecté' : '❌ Mode Single Instance'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.redisConnected
                ? 'Broadcasting distribué activé'
                : 'Fonctionne sur une seule instance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour les actions et logs */}
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="actions">Actions de Test</TabsTrigger>
          <TabsTrigger value="logs">Flux en Direct</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>S'abonner aux entités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5].map(id => (
                  <div key={id} className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubscribe('match', id)}
                      className="w-full justify-start"
                    >
                      📺 Match #{id}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe('match', id)}
                      className="w-full text-xs"
                    >
                      Se désabonner
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[1, 2, 3, 4, 5].map(id => (
                  <div key={id} className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubscribe('fighter', id)}
                      className="w-full justify-start"
                    >
                      🥊 Lutteur #{id}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe('fighter', id)}
                      className="w-full text-xs"
                    >
                      Se désabonner
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="default"
                  onClick={() => handleSubscribe('edition', 5)}
                >
                  S'abonner Édition #5
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleSubscribe('subGroup', 3)}
                >
                  S'abonner Groupe #3
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleSubscribe('region', 2)}
                >
                  S'abonner Région #2
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Événements Temps Réel</CardTitle>
              <Badge variant="outline">
                {localEvents.length} événements
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {localEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    En attente d'événements...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localEvents.map((event, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-xs font-mono border-l-4 ${event.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                          event.type === 'rate_limit' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                            event.entityType === 'match' ? 'border-blue-500' :
                              event.entityType === 'fighter' ? 'border-green-500' :
                                'border-gray-500'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground shrink-0">
                            [{new Date(event.timestamp || event.receivedAt).toLocaleTimeString()}]
                          </span>
                          <span className="flex-1">
                            {event.type === 'error' && `❌ ${event.message}`}
                            {event.type === 'rate_limit' && `⚠️ ${event.message}`}
                            {event.type === 'subscribe' && `📡 Abonnement à ${event.entityType}:${event.entityId}`}
                            {event.type === 'unsubscribe' && `🔕 Désabonnement de ${event.entityType}:${event.entityId}`}
                            {event.entityType && event.event && (
                              <>
                                <span className="font-bold">{event.entityType}:{event.entityId}</span>
                                {' - '}{event.event}
                                {event.data && (
                                  <pre className="mt-1 text-[8px] bg-muted p-1 rounded overflow-x-auto">
                                    {JSON.stringify(event.data, null, 2)}
                                  </pre>
                                )}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dernier message brut (pour debug) */}
      {lastMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Dernier Message (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}