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

interface UserStats {
  total?: number;
  active?: number;
  verified?: number;
  admins?: number;
  moderators?: number;
  editors?: number;
  last_month?: number;
}

interface UserChartProps {
  data: UserStats;
  loading?: boolean;
  title?: string;
}

export function UserChart({ data, loading = false, title = "Statistiques des Utilisateurs" }: UserChartProps) {
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
    { name: 'Actifs & Vérifiés', value: data.verified || 0, color: '#10b981' },
    { name: 'Actifs & Non Vérifiés', value: (data.active || 0) - (data.verified || 0), color: '#f59e0b' },
    { name: 'Inactifs', value: (data.total || 0) - (data.active || 0), color: '#6b7280' }
  ].filter(item => item.value > 0);

  const rolesData = [
    { role: 'Admins', count: data.admins || 0 },
    { role: 'Moderators', count: data.moderators || 0 },
    { role: 'Editors', count: data.editors || 0 },
    { role: 'Users', count: (data.total || 0) - (data.admins || 0) - (data.moderators || 0) - (data.editors || 0) }
  ].filter(item => item.count > 0);

  const growthData = [
    { period: 'Mois dernier', count: data.last_month || 0 },
    { period: 'Reste', count: (data.total || 0) - (data.last_month || 0) }
  ];

  return (
    <div className="space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Répartition */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Utilisateurs</CardTitle>
            <CardDescription>Actifs vs Vérifiés vs Inactifs</CardDescription>
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
                    <Tooltip 
                      formatter={(value) => [`${value} utilisateurs`, 'Quantité']}
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

        {/* Bar Chart - Rôles */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Rôles</CardTitle>
            <CardDescription>Nombre d'utilisateurs par rôle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rolesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    name="Utilisateurs" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Total</Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.total || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Actifs</Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.active || 0}
              </Typography>
              {data.total && data.active && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.active / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Vérifiés</Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {data.verified || 0}
              </Typography>
              {data.active && data.verified && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.verified / data.active) * 100)}% des actifs
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Nouveaux (30j)</Typography>
              <Typography variant="h3" weight="bold" className="text-purple-600">
                {data.last_month || 0}
              </Typography>
              {data.total && data.last_month && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.last_month / data.total) * 100)}% du total
                </Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
