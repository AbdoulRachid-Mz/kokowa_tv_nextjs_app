"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface RegionData {
  summary?: {
    total: number;
    avg_fighters: string;
    max_fighters: number;
    min_fighters: number;
    total_champions: number;
  };
  top_regions?: Array<{
    name: string;
    fighters: number;
    champions: number;
    code: string;
  }>;
}

interface RegionChartProps {
  data: RegionData;
  loading?: boolean;
  title?: string;
}

export function RegionChart({ data, loading = false, title = "Statistiques des Régions" }: RegionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour les graphiques
  const regionChartData = data.top_regions?.slice(0, 8) || [];
  
  const fightersData = regionChartData.map(region => ({
    name: region.name,
    fighters: region.fighters,
    champions: region.champions,
    code: region.code
  }));

  const championsData = regionChartData
    .filter(r => r.champions > 0)
    .map(region => ({
      name: region.name,
      champions: region.champions,
      code: region.code
    }));

  // Couleurs pour les graphiques
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Top régions - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Régions par Nombre de Lutteurs</CardTitle>
          <CardDescription>Les 8 premières régions</CardDescription>
        </CardHeader>
        <CardContent>
          {fightersData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fightersData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'fighters') return [`${value} lutteurs`, 'Lutteurs'];
                      if (name === 'champions') return [`${value} champions`, 'Champions'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Région: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="fighters" 
                    name="Lutteurs" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="champions" 
                    name="Champions" 
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Typography theme="muted">Aucune donnée disponible</Typography>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart - Champions par région */}
      {championsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Champions par Région</CardTitle>
            <CardDescription>Régions ayant produit des champions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={championsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, champions }) => 
                        `${name}: ${champions} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="champions"
                    >
                      {championsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} champions`, 'Quantité']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {championsData.map((region, index) => (
                  <div key={region.code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {region.code}
                      </div>
                      <div>
                        <Typography variant="body-sm" weight="medium">{region.name}</Typography>
                        <Typography variant="caption2" theme="muted">
                          {region.champions} champion{region.champions !== 1 ? 's' : ''}
                        </Typography>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {((region.champions / (data.summary?.total_champions || 1)) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé statistique */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Globales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Typography variant="body-sm" className="mb-2">Total Régions</Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.summary?.total || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2">Moyenne lutteurs/région</Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {parseFloat(data.summary?.avg_fighters || '0').toFixed(1)}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2">Région la plus peuplée</Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.summary?.max_fighters || 0}
              </Typography>
              <Typography variant="caption2" theme="muted" className="mt-1">
                lutteurs
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Typography variant="body-sm" className="mb-2">Total Champions</Typography>
              <Typography variant="h3" weight="bold" className="text-purple-600">
                {data.summary?.total_champions || 0}
              </Typography>
            </div>
          </div>
          
          {/* Détail des régions */}
          {data.top_regions && data.top_regions.length > 0 && (
            <div className="mt-6">
              <Typography variant="h4" className="mb-4">Détail par Région</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.top_regions.map((region, index) => (
                  <div key={region.code} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Typography variant="body-sm" weight="medium">{region.name}</Typography>
                        <Typography variant="caption2" theme="muted">{region.code}</Typography>
                      </div>
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Typography variant="caption2" theme="muted">Lutteurs</Typography>
                        <Typography weight="bold">{region.fighters}</Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="caption2" theme="muted">Champions</Typography>
                        <Typography weight="bold" className={region.champions > 0 ? "text-yellow-600" : ""}>
                          {region.champions}
                        </Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="caption2" theme="muted">% du total</Typography>
                        <Typography weight="bold">
                          {data.summary?.total ? ((region.fighters / data.summary.total) * 100).toFixed(1) : '0'}%
                        </Typography>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}