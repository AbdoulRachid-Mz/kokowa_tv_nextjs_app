// app/(admins)/ad/realtime/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRealtimeStats, forceSyncMatch, forceSyncSubGroup } from '@/actions/realtime';
import {
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface RTDBStats {
  firestoreConnected: boolean; // Retained for compatibility but represents RTDB connection
}

export default function RealtimeAdminPage() {
  const [stats, setStats] = useState<RTDBStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncMatchId, setSyncMatchId] = useState('');
  const [syncSubGroupId, setSyncSubGroupId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRealtimeStats();
      setStats(data as RTDBStats);
    } catch (error) {
      console.error('Erreur chargement stats RTDB:', error);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleForceSyncMatch = async () => {
    const id = parseInt(syncMatchId);
    if (isNaN(id)) return toast.error('ID de match invalide');

    setIsSyncing(true);
    try {
      const result = await forceSyncMatch(id);
      if (result.success) {
        toast.success(`✅ Match ${id} synchronisé avec RTDB`);
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
        toast.success(`✅ Sous-groupe ${id} synchronisé avec RTDB`);
        await loadStats();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gateway Temps Réel
          </h1>
          <p className="text-muted-foreground mt-1">
            Architecture Realtime Database (Firebase RTDB)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={stats?.firestoreConnected ? 'default' : 'destructive'}
            className="gap-1"
          >
            {stats?.firestoreConnected ? (
              <><Zap className="h-3 w-3" /> RTDB Connecté</>
            ) : (
              <><ZapOff className="h-3 w-3" /> RTDB Déconnecté</>
            )}
          </Badge>

          <Button size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut RTDB</CardTitle>
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

      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-1">
          <TabsTrigger value="sync">Force Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Re-sync un Match</CardTitle>
                <CardDescription>
                  Force la reconstruction du document RTDB depuis PostgreSQL
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
                  Force la reconstruction du document RTDB depuis PostgreSQL
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
              <CardTitle className="text-sm">Architecture RTDB</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-semibold">Nœuds :</p>
              <p>📁 subGroups/<span className="text-primary">{'{subGroupId}'}</span></p>
              <p>📁 subGroups/<span className="text-primary">{'{subGroupId}'}</span>/matches/<span className="text-primary">{'{matchId}'}</span></p>
              <p className="mt-3 text-foreground font-semibold">Flow :</p>
              <p>Admin Action → PostgreSQL COMMIT → syncMatchRealtime()</p>
              <p className="pl-4">→ RTDB ref.update()</p>
              <p className="pl-8">→ onValue() → UI synchronisée ✅</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}