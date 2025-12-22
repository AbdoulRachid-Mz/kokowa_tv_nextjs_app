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

interface SimpleChartProps {
  data: any;
  loading?: boolean;
  title?: string;
  description?: string;
  type?: 'bar' | 'pie' | 'summary';
  dataKey?: string;
  nameKey?: string;
}

export function SimpleChart({ 
  data, 
  loading = false, 
  title = "Graphique", 
  description,
  type = 'bar',
  dataKey = 'value',
  nameKey = 'name'
}: SimpleChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <Typography variant="body-sm" theme="muted">{description}</Typography>}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Si pas de données
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <Typography variant="body-sm" theme="muted">{description}</Typography>}
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Typography theme="muted">Aucune donnée disponible</Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Couleurs par défaut
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

  // Fonction pour formater les données
  const formatData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si c'est un objet, le transformer en tableau
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([name, value]) => ({
        [nameKey]: name,
        [dataKey]: typeof value === 'number' ? value : 0
      }));
    }
    
    return [];
  };

  const chartData = formatData(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <Typography variant="body-sm" theme="muted">{description}</Typography>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ [nameKey]: name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={dataKey}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}`, 'Quantité']}
                />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={nameKey}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}`, 'Quantité']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar 
                  dataKey={dataKey} 
                  name={title}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}