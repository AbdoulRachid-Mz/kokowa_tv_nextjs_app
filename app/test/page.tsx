// app/test/api/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/auth-context';
import { api } from '@/lib/client/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, Plus, RefreshCw } from 'lucide-react';

interface TestResult {
  success?: boolean;
  message?: string;
  data?: any;
  error?: any;
  timestamp?: string;
}

export default function ApiTestPage() {
  const { user, userDocument, loading: authLoading } = useAuthContext();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [newRegion, setNewRegion] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
  });

  // Vérifier l'authentification au chargement
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth state:', { user: user?.uid, userDocument: userDocument?.role });
    }
  }, [user, userDocument, authLoading]);

  const testPublic = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/test/public?limit=5');
      setResult({ success: true, data: res, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({ success: false, error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/test/auth?limit=10');
      setResult({ success: true, data: res, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({ success: false, error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const testAdmin = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/test/admin?limit=15&stats=true');
      setResult({ success: true, data: res, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({ success: false, error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const getRegionById = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/test/regions/${id}`);
      setResult({ success: true, data: res, timestamp: new Date().toISOString() });
    } catch (error) {
      setResult({ success: false, error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const createNewRegion = async () => {
    if (!newRegion.name || !newRegion.code) {
      setResult({ success: false, error: 'Nom et code requis', timestamp: new Date().toISOString() });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/test/admin', newRegion);
      setResult({ success: true, data: res, timestamp: new Date().toISOString() });
      // Réinitialiser le formulaire
      setNewRegion({ name: '', code: '', description: '', color: '#3b82f6' });
    } catch (error) {
      setResult({ success: false, error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Test API Gateway</h1>
          <p className="text-muted-foreground">
            Test des protections API (Auth, App Check, Rate Limiting)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user ? "default" : "secondary"}>
            {user ? `Connecté: ${user.email}` : 'Non connecté'}
          </Badge>
          <Badge variant={userDocument?.role === 'admin' ? "default" : "outline"}>
            Rôle: {userDocument?.role || 'aucun'}
          </Badge>
        </div>
      </div>

      {/* Status d'authentification */}
      <Card>
        <CardHeader>
          <CardTitle>Status d'authentification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Firebase User:</p>
              <pre className="text-xs bg-muted p-2 rounded mt-1">
                {user ? JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  emailVerified: user.emailVerified,
                }, null, 2) : 'null'}
              </pre>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Database User:</p>
              <pre className="text-xs bg-muted p-2 rounded mt-1">
                {userDocument ? JSON.stringify({
                  id: userDocument.id,
                  username: userDocument.username,
                  role: userDocument.role,
                  is_active: userDocument.is_active,
                }, null, 2) : 'null'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions de test */}
      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="create">Créer Région</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={testPublic} disabled={loading} variant="outline" className="h-20 flex-col gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-lg">🌐</span>}
              <span>Public API</span>
              <span className="text-xs text-muted-foreground">GET /api/test/public</span>
            </Button>

            <Button onClick={testAuth} disabled={loading || !user} variant="outline" className="h-20 flex-col gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-lg">🔐</span>}
              <span>Auth API</span>
              <span className="text-xs text-muted-foreground">GET /api/test/auth</span>
            </Button>

            <Button onClick={testAdmin} disabled={loading || userDocument?.role !== 'admin'} variant="outline" className="h-20 flex-col gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-lg">👑</span>}
              <span>Admin API</span>
              <span className="text-xs text-muted-foreground">GET /api/test/admin</span>
            </Button>
          </div>

          {/* Test région par ID */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>ID de la région</Label>
              <Input 
                type="number" 
                placeholder="1" 
                id="regionId"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    getRegionById(parseInt((e.target as HTMLInputElement).value));
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => {
                const input = document.getElementById('regionId') as HTMLInputElement;
                if (input.value) getRegionById(parseInt(input.value));
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Récupérer région
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle région (Admin uniquement)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la région *</Label>
                  <Input 
                    value={newRegion.name}
                    onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                    placeholder="Ex: Dakar"
                  />
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input 
                    value={newRegion.code}
                    onChange={(e) => setNewRegion({ ...newRegion, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: DK"
                    maxLength={10}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input 
                    value={newRegion.description}
                    onChange={(e) => setNewRegion({ ...newRegion, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>
                <div>
                  <Label>Couleur</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color"
                      value={newRegion.color}
                      onChange={(e) => setNewRegion({ ...newRegion, color: e.target.value })}
                      className="w-16"
                    />
                    <Input 
                      value={newRegion.color}
                      onChange={(e) => setNewRegion({ ...newRegion, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={createNewRegion} 
                disabled={loading || !newRegion.name || !newRegion.code || userDocument?.role !== 'admin'}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la région
              </Button>
              {userDocument?.role !== 'admin' && (
                <p className="text-sm text-yellow-600 text-center">
                  ⚠️ Seuls les administrateurs peuvent créer des régions
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation des endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-mono text-sm">GET /api/test/public?limit=5</p>
                  <p className="text-sm text-muted-foreground">Public - Sans authentification, rate limit: 30/min</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-mono text-sm">GET /api/test/auth?limit=10</p>
                  <p className="text-sm text-muted-foreground">Authentifié - Token Firebase requis</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="font-mono text-sm">GET /api/test/admin?limit=15&amp;stats=true</p>
                  <p className="text-sm text-muted-foreground">Admin - Rôle admin requis, rate limit: 100/min</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="font-mono text-sm">GET /api/test/regions/:id</p>
                  <p className="text-sm text-muted-foreground">Authentifié - Récupère une région par ID</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="font-mono text-sm">POST /api/test/admin</p>
                  <p className="text-sm text-muted-foreground">Admin - Crée une nouvelle région</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résultat */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Résultat de l'appel</CardTitle>
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Succès</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Échec</>
              )}
            </Badge>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}