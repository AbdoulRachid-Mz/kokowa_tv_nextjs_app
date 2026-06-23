"use client";

import { useState, useMemo } from "react";
import { useMessages } from "@/hooks/use-message";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Message, MessageFilters } from "@/types";
import { format, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, Users, TrendingUp, CheckCircle } from "lucide-react";
import { StatsCarousel } from "@/components/shared/stats-carousel";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const AdminMessagesPage = () => {
  const [period, setPeriod] = useState<string>("30");
  const filters: MessageFilters = useMemo(() => ({}), []);
  const { data, isLoading, error } = useMessages(filters);

  const allMessages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data) as Message[];
  }, [data]);

  const chartData = useMemo(() => {
    const days = parseInt(period);
    const lastNDays = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      return {
        date: format(date, "dd/MM"),
        messages: 0,
        read: 0,
        likes: 0,
      };
    });

    allMessages.forEach((message) => {
      if (!message.created_at) return;

      const messageDate = new Date(message.created_at);

      if (isNaN(messageDate.getTime())) return;

      const daysAgo = Math.floor(
        (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysAgo < days) {
        const index = lastNDays.length - 1 - daysAgo;

        if (index >= 0 && index < lastNDays.length) {
          lastNDays[index].messages += 1;

          if (message.is_read) {
            lastNDays[index].read += 1;
          }

          lastNDays[index].likes += message.like_count || 0;
        }
      }
    });

    return lastNDays;
  }, [allMessages, period]);

  const messageTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    allMessages.forEach((message) => {
      types[message.message_type] = (types[message.message_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allMessages]);

  const stats = useMemo(
    () => ({
      total: allMessages.length,
      unread: allMessages.filter((m) => !m.is_read).length,
      totalLikes: allMessages.reduce((sum, m) => sum + (m.like_count || 0), 0),
      activeUsers: new Set(allMessages.map((m) => m.author_id)).size,
    }),
    [allMessages],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erreur de chargement</CardTitle>
            <CardDescription className="text-red-600">
              Impossible de charger les données des messages
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Messages Analytics
          </h1>
          <p className="text-muted-foreground">
            Analysez les flux de messages de votre plateforme
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatsCarousel
        data={[
          {
            title: "Total Messages",
            icon: MessageSquare,
            value: stats.total,
            description: "+12% depuis le mois dernier",
          },
          {
            title: "Messages non lus",
            icon: CheckCircle,
            value: stats.unread,
            description: `${Math.round((stats.unread / stats.total) * 100)}% du total`,
          },
          {
            title: "Utilisateurs actifs",
            icon: Users,
            value: stats.activeUsers,
            description: "Auteurs uniques",
          },
          {
            title: "Total Likes",
            icon: TrendingUp,
            value: stats.totalLikes,
            description: "Interactions sur les messages",
          },
        ]}
        withNavButtons
        mode="auto"
        className="w-full"
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flux des messages</CardTitle>
              <CardDescription>
                Évolution quotidienne des messages et interactions sur la
                plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorMessages"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px" }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                    name="Messages créés"
                  />
                  <Area
                    type="monotone"
                    dataKey="read"
                    stroke="#00C49F"
                    fillOpacity={1}
                    fill="url(#colorRead)"
                    name="Messages lus"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages par jour</CardTitle>
              <CardDescription>
                Comparaison des messages créés et lus sur la période
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="messages"
                    fill="#8884d8"
                    name="Messages créés"
                  />
                  <Bar dataKey="read" fill="#00C49F" name="Messages lus" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type de message</CardTitle>
              <CardDescription>
                Distribution des messages selon leur catégorie
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={messageTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {messageTypeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMessagesPage;
