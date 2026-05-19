// app/ad/realtime/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getRealtimeStats, forceSyncMatch, forceSyncSubGroup } from '@/actions/realtime';
import { useLiveMatches } from '@/hooks/firestore/use-live-matches';
import {
  RefreshCw,
  Zap,
  ZapOff,
  Activity,
  Database,
  Radio,
  CloudLightning,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FirestoreStats {
  liveMatches: number;
  totalMatchDocs: number;
  totalSubGroupDocs: number;
  firestoreConnected: boolean;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RealtimeAdminPage() {
  const [stats, setStats] = useState<FirestoreStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncMatchId, setSyncMatchId] = useState('');
  const [syncSubGroupId, setSyncSubGroupId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [firestoreEvents, setFirestoreEvents] = useState<any[]>([]);

  // ─── Hook live matches (Firestore onSnapshot) ─────────────────────────────
  const { liveMatches, isLoading: liveLoading, count: liveCount } = useLiveMatches();

  // Écouter les changements de liveMatches pour le log d'événements
  useEffect(() => {
    if (liveMatches.length > 0) {
      const newEvent = {
        type: 'snapshot',
        message: `${liveMatches.length} match(s) live détecté(s)`,
        matches: liveMatches.map((m) => ({ id: m.id, status: m.liveState.status })),
        timestamp: Date.now(),
      };
      setFirestoreEvents((prev) => [newEvent, ...prev].slice(0, 30));
    }
  }, [liveMatches]);

  // ─── Chargement des stats Firestore ──────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRealtimeStats();
      setStats(data as FirestoreStats);
    } catch (error) {
      console.error('Erreur chargement stats Firestore:', error);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ─── Force sync ───────────────────────────────────────────────────────────
  const handleForceSyncMatch = async () => {
    const id = parseInt(syncMatchId);
    if (isNaN(id)) return toast.error('ID de match invalide');

    setIsSyncing(true);
    try {
      const result = await forceSyncMatch(id);
      if (result.success) {
        toast.success(`✅ Match ${id} synchronisé avec Firestore`);
        setFirestoreEvents((prev) => [{
          type: 'sync',
          message: `Force sync match ${id}`,
          timestamp: Date.now(),
        }, ...prev].slice(0, 30));
        await loadStats();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceSyncSubGroup = async () => {
    const id = parseInt(syncSubGroupId);
    if (isNaN(id)) return toast.error('ID de sous-groupe invalide');

    setIsSyncing(true);
    try {
      const result = await forceSyncSubGroup(id);
      if (result.success) {
        toast.success(`✅ Sous-groupe ${id} synchronisé avec Firestore`);
        setFirestoreEvents((prev) => [{
          type: 'sync',
          message: `Force sync sous-groupe ${id}`,
          timestamp: Date.now(),
        }, ...prev].slice(0, 30));
        await loadStats();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gateway Temps Réel
          </h1>
          <p className="text-muted-foreground mt-1">
            Architecture Firestore Realtime — Sans WebSocket
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={stats?.firestoreConnected ? 'default' : 'destructive'}
            className="gap-1"
          >
            {stats?.firestoreConnected ? (
              <><Zap className="h-3 w-3" /> Firestore Connecté</>
            ) : (
              <><ZapOff className="h-3 w-3" /> Firestore Déconnecté</>
            )}
          </Badge>

          <Badge
            variant={liveCount > 0 ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            <Radio className="h-3 w-3" />
            {liveCount} live
          </Badge>

          <Button size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques Firestore */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs Live</CardTitle>
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{liveCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Écoute Firestore onSnapshot active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs Matchs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMatchDocs ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              realtime_matches/
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs Sous-Groupes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubGroupDocs ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              realtime_subgroups/
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Firestore</CardTitle>
            <CloudLightning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-1">
              {stats?.firestoreConnected ? (
                <><CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Opérationnel</span></>
              ) : stats === null ? (
                <><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Vérification...</span></>
              ) : (
                <><XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Hors ligne</span></>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Firebase Admin SDK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="live">Matchs Live</TabsTrigger>
          <TabsTrigger value="sync">Force Sync</TabsTrigger>
          <TabsTrigger value="logs">Événements</TabsTrigger>
        </TabsList>

        {/* Onglet : Matchs Live */}
        <TabsContent value="live" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500" />
                Matchs en direct — Firestore
              </CardTitle>
              <CardDescription>
                Données reçues via onSnapshot en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Connexion Firestore...
                </div>
              ) : liveMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun match live actuellement</p>
                  <p className="text-xs mt-1">Démarrez un match depuis le dashboard admin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-medium">Match #{m.match?.match_number ?? m.id}</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {m.liveState.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          ID: {m.id}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Pauses: {m.liveState.breakCount ?? 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(m.updatedAt).toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                      {m.realtime.lastEvent && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          Dernier event: {m.realtime.lastEvent}
                        </p>
                      )}
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">Score: </span>
                        <span className="font-medium">
                          {m.regions.region1.name ?? 'Région 1'} {m.score.score_region1}
                          {' — '}
                          {m.score.score_region2} {m.regions.region2.name ?? 'Région 2'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet : Force Sync */}
        <TabsContent value="sync" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Re-sync un Match</CardTitle>
                <CardDescription>
                  Force la reconstruction du document Firestore depuis PostgreSQL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="number"
                  placeholder="ID du match (ex: 42)"
                  value={syncMatchId}
                  onChange={(e) => setSyncMatchId(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleForceSyncMatch}
                  disabled={isSyncing || !syncMatchId}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Synchroniser Match
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Re-sync un Sous-Groupe</CardTitle>
                <CardDescription>
                  Force la reconstruction du document Firestore depuis PostgreSQL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="number"
                  placeholder="ID du sous-groupe (ex: 7)"
                  value={syncSubGroupId}
                  onChange={(e) => setSyncSubGroupId(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleForceSyncSubGroup}
                  disabled={isSyncing || !syncSubGroupId}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Synchroniser Sous-Groupe
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Architecture Firestore</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-semibold">Collections :</p>
              <p>📁 realtime_matches/<span className="text-primary">{'{matchId}'}</span></p>
              <p>📁 realtime_subgroups/<span className="text-primary">{'{subGroupId}'}</span></p>
              <p className="mt-3 text-foreground font-semibold">Flow :</p>
              <p>Admin Action → PostgreSQL COMMIT → syncMatchRealtime()</p>
              <p className="pl-4">→ Firestore setDoc(merge:true)</p>
              <p className="pl-8">→ onSnapshot() → UI synchronisée ✅</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet : Log événements */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Événements Firestore</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{firestoreEvents.length} événements</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFirestoreEvents([])}
                >
                  Vider
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {firestoreEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Activity className="h-8 w-8 opacity-20" />
                    <p>En attente d'événements Firestore...</p>
                    <p className="text-xs">Les snapshots apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {firestoreEvents.map((event, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-xs font-mono border-l-4 ${
                          event.type === 'sync'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground shrink-0">
                            [{new Date(event.timestamp).toLocaleTimeString('fr-FR')}]
                          </span>
                          <span>
                            {event.type === 'sync' ? '🔄' : '📡'} {event.message}
                          </span>
                        </div>
                        {event.matches && (
                          <pre className="mt-1 text-[10px] text-muted-foreground">
                            {JSON.stringify(event.matches, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}