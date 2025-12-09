"use client";

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchStats {
  total?: number;
  scheduled?: number;
  live?: number;
  completed?: number;
  cancelled?: number;
  postponed?: number;
  avg_audience?: string;
  total_audience?: string;
  timeline?: Array<{ period: string; count: number; avg_duration: string }>;
  results?: Array<{ result: string; count: number; percentage: number }>;
  duration?: Array<{ range: string; count: number }>;
  regions?: Array<{ region: string; matches: number; wins: number; win_rate: number }>;
}

interface MatchChartProps {
  data: MatchStats;
  loading?: boolean;
  title?: string;
}

export function MatchChart({ data, loading = false, title = "Statistiques des Matchs" }: MatchChartProps) {
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

  // Données pour les graphiques
  const statusData = [
    { name: "Planifiés", value: data.scheduled || 0, color: "#3b82f6" },
    { name: "En direct", value: data.live || 0, color: "#ef4444" },
    { name: "Terminés", value: data.completed || 0, color: "#10b981" },
    { name: "Annulés", value: data.cancelled || 0, color: "#6b7280" },
    { name: "Reportés", value: data.postponed || 0, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  const comparisonData = [
    { category: "Matchs", scheduled: data.scheduled || 0, live: data.live || 0, completed: data.completed || 0 },
  ];

  const audienceData = [
    { name: "Audience moyenne", value: parseFloat(data.avg_audience || "0"), unit: "spectateurs", color: "#8b5cf6" },
    { name: "Audience totale", value: parseFloat(data.total_audience || "0"), unit: "spectateurs", color: "#06b6d4" }
  ];

  return (
    <div className="space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Répartition des statuts */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Matchs</CardTitle>
            <CardDescription>Statuts des matchs</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} matchs`, "Quantité"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Typography theme="muted">Aucune donnée disponible</Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Comparaison des statuts */}
        <Card>
          <CardHeader>
            <CardTitle>Comparaison par Statut</CardTitle>
            <CardDescription>Répartition quantitative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" name="Planifiés" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="live" name="En direct" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Terminés" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques d'Audience</CardTitle>
          <CardDescription>Données d'audience des matchs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {audienceData.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: metric.color }}
                  >
                    {metric.value.toLocaleString()}
                  </div>
                  <Typography variant="body-sm" className="text-muted-foreground">
                    {metric.name}
                  </Typography>
                </div>
                <Typography variant="h4" weight="bold">
                  {metric.value.toLocaleString()} {metric.unit}
                </Typography>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résumé détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Total</Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.total || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Planifiés</Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {data.scheduled || 0}
              </Typography>
              {data.total && data.scheduled && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.scheduled / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">En direct</Typography>
              <Typography variant="h3" weight="bold" className="text-red-600">
                {data.live || 0}
              </Typography>
              {data.total && data.live && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.live / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Terminés</Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.completed || 0}
              </Typography>
              {data.total && data.completed && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.completed / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Reportés</Typography>
              <Typography variant="h3" weight="bold" className="text-yellow-600">
                {data.postponed || 0}
              </Typography>
              {data.total && data.postponed && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.postponed / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-gray-100 dark:bg-gray-800/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Annulés</Typography>
              <Typography variant="h3" weight="bold" className="text-gray-600">
                {data.cancelled || 0}
              </Typography>
              {data.total && data.cancelled && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.cancelled / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique de la timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Matchs</CardTitle>
            <CardDescription>Nombre de matchs et durée moyenne par période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Nombre de matchs" fill="#3b82f6" />
                  <Line yAxisId="right" type="monotone" dataKey="avg_duration" name="Durée moyenne (min)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats des matchs */}
      {data.results && data.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des Matchs</CardTitle>
            <CardDescription>Répartition des résultats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="result" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Nombre" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Répartition par durée */}
      {data.duration && data.duration.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Durée des Matchs</CardTitle>
            <CardDescription>Répartition par tranches de durée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.duration}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.duration.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} matchs`, "Quantité"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance par région */}
      {data.regions && data.regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance par Région</CardTitle>
            <CardDescription>Taux de victoire par région</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.regions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="matches" name="Matchs joués" fill="#3b82f6" />
                  <Bar dataKey="wins" name="Victoires" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
