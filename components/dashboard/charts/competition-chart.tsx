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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

interface CompetitionData {
  total?: number;
  upcoming?: number;
  ongoing?: number;
  completed?: number;
  cancelled?: number;
  postponed?: number;
}

interface CompetitionChartProps {
  data: CompetitionData;
  loading?: boolean;
  title?: string;
}

export function CompetitionChart({ data, loading = false, title = "Statut des Compétitions" }: CompetitionChartProps) {
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

  // Préparer les données pour le pie chart
  const pieData = [
    { name: 'À venir', value: data.upcoming || 0, color: '#3b82f6' },
    { name: 'En cours', value: data.ongoing || 0, color: '#10b981' },
    { name: 'Terminées', value: data.completed || 0, color: '#8b5cf6' },
    { name: 'Annulées', value: data.cancelled || 0, color: '#ef4444' },
    { name: 'Reportées', value: data.postponed || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Préparer les données pour le bar chart
  const barData = [
    { name: 'À venir', count: data.upcoming || 0 },
    { name: 'En cours', count: data.ongoing || 0 },
    { name: 'Terminées', count: data.completed || 0 },
    { name: 'Annulées', count: data.cancelled || 0 },
    { name: 'Reportées', count: data.postponed || 0 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Statut</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} compétitions`, 'Quantité']}
                  />
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

      <Card>
        <CardHeader>
          <CardTitle>Détails par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} compétitions`, 'Quantité']}
                  labelFormatter={(label) => `Statut: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Nombre de compétitions" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Résumé statistique */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Typography variant="body-sm" className="mb-2">Total</Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.total || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2">À venir</Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {data.upcoming || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2">En cours</Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.ongoing || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Typography variant="body-sm" className="mb-2">Terminées</Typography>
              <Typography variant="h3" weight="bold" className="text-purple-600">
                {data.completed || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <Typography variant="body-sm" className="mb-2">Annulées</Typography>
              <Typography variant="h3" weight="bold" className="text-red-600">
                {data.cancelled || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Typography variant="body-sm" className="mb-2">Reportées</Typography>
              <Typography variant="h3" weight="bold" className="text-orange-600">
                {data.postponed || 0}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}