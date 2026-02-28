// components/matches/match-stats.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { Trophy, Calendar, Clock, Users, AlertCircle } from 'lucide-react';

interface MatchStatsProps {
  stats: {
    total: number;
    scheduled: number;
    live: number;
    completed: number;
    today: number;
  };
}

export function MatchStats({ stats }: MatchStatsProps) {
  // Données pour le graphique en camembert
  const pieData = [
    { name: 'Programmés', value: stats.scheduled, color: '#3b82f6' },
    { name: 'En direct', value: stats.live, color: '#ef4444' },
    { name: 'Terminés', value: stats.completed, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Données pour la répartition par heure (simulées)
  const hourlyData = [
    { hour: '08h', matches: 2 },
    { hour: '10h', matches: 5 },
    { hour: '12h', matches: 8 },
    { hour: '14h', matches: 12 },
    { hour: '16h', matches: 15 },
    { hour: '18h', matches: 10 },
    { hour: '20h', matches: 6 },
  ];

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de complétion</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <Progress value={completionRate} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matchs aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En direct</p>
                <p className="text-2xl font-bold">{stats.live}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Programmés</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Répartition des matchs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Matchs par heure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="matches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}