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
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

interface TransferStats {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  completed?: number;
  total_fees?: number;
  avg_fee?: number;
  max_fee?: number;
  min_fee?: number;
  avg_duration?: string;
}

interface TransferChartProps {
  data: TransferStats;
  loading?: boolean;
  title?: string;
}

export function TransferChart({ data, loading = false, title = "Statistiques des Transferts" }: TransferChartProps) {
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
    { name: "Approuvés", value: data.approved || 0, color: "#10b981" },
    { name: "En attente", value: data.pending || 0, color: "#f59e0b" },
    { name: "Rejetés", value: data.rejected || 0, color: "#ef4444" },
    { name: "Terminés", value: data.completed || 0, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  const comparisonData = [
    {
      category: "Transferts",
      approuvés: data.approved || 0,
      enAttente: data.pending || 0,
      rejetés: data.rejected || 0,
      total: data.total || 0,
    },
  ];

  const metricsData = [
    {
      name: "Frais moyens",
      value: data.avg_fee || 0,
      unit: "FCFA",
      color: "#3b82f6",
    },
    {
      name: "Durée moyenne",
      value: parseFloat(data.avg_duration || "0"),
      unit: "ans",
      color: "#8b5cf6",
    },
    {
      name: "Frais max",
      value: data.max_fee || 0,
      unit: "FCFA",
      color: "#ef4444",
    },
    {
      name: "Frais min",
      value: data.min_fee || 0,
      unit: "FCFA",
      color: "#10b981",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Répartition */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Transferts</CardTitle>
            <CardDescription>Approuvés vs En attente vs Rejetés vs Terminés</CardDescription>
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
                    <Tooltip formatter={(value) => [`${value} transferts`, "Quantité"]} />
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

        {/* Bar Chart - Comparaison */}
        <Card>
          <CardHeader>
            <CardTitle>Comparaison des Statuts</CardTitle>
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
                  <Bar dataKey="total" name="Total transferts" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approuvés" name="Approuvés" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enAttente" name="En attente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejetés" name="Rejetés" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques moyennes */}
      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques Financières</CardTitle>
          <CardDescription>Montants et durée moyens des transferts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsData.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: metric.color }}
                  >
                    {metric.value.toFixed(0)}
                  </div>
                  <Typography variant="body-sm" className="text-muted-foreground">
                    {metric.name}
                  </Typography>
                </div>
                <Typography variant="h4" weight="bold">
                  {metric.value.toFixed(1)} {metric.unit}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">
                Total
              </Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.total || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">
                Approuvés
              </Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.approved || 0}
              </Typography>
              {data.total && data.approved && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.approved / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">
                En attente
              </Typography>
              <Typography variant="h3" weight="bold" className="text-yellow-600">
                {data.pending || 0}
              </Typography>
              {data.total && data.pending && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.pending / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">
                Rejetés
              </Typography>
              <Typography variant="h3" weight="bold" className="text-red-600">
                {data.rejected || 0}
              </Typography>
              {data.total && data.rejected && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.rejected / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">
                Terminés
              </Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {data.completed || 0}
              </Typography>
              {data.total && data.completed && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.completed / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
