"use client";

import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  RefreshCw,
  AlertCircle,
  Swords,
  Globe,
  Newspaper,
  Video,
  MessageSquare,
  Bell,
  ArrowRightLeft,
  BarChart3,
  PieChart,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TabContent } from "@/components/dashboard/tab-content";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GlobalStats {
  total_fighters: number;
  active_fighters: number;
  champions: number;
  total_regions: number;
  total_competitions: number;
  active_competitions: number;
  upcoming_matches: number;
  completed_matches: number;
  active_users: number;
  total_users: number;
  total_transfers: number;
  published_articles: number;
  total_videos: number;
  total_messages: number;
  unread_notifications: number;
}

interface tablistTypes {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const tablist: tablistTypes[] = [
  { value: "overview", label: "Vue d'ensemble", icon: BarChart3 },
  { value: "competitions", label: "Compétitions", icon: Trophy },
  { value: "fighters", label: "Lutteurs", icon: Swords },
  { value: "regions", label: "Régions", icon: Globe },
  { value: "matches", label: "Matchs", icon: Swords },
  { value: "transfers", label: "Transferts", icon: ArrowRightLeft },
  { value: "media", label: "Médias", icon: Video },
  { value: "users", label: "Utilisateurs", icon: Users },
];

export default function AdminPage() {
  const { user, hasRole } = useAuthContext();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Charger uniquement les stats globales
  useEffect(() => {
    const loadGlobalStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/stats?entity=global");
        const data = await response.json();

        if (data.success) {
          setGlobalStats(data.data);
        } else {
          setError(data.error || "Erreur inconnue");
        }
      } catch (err) {
        console.error("Erreur chargement stats globales:", err);
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };

    loadGlobalStats();
  }, []); // Pas de dépendances pour éviter les ré-rendus infinis

  // Vérification des permissions - CORRIGÉ
  if (hasRole("admin") || hasRole("editor")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Typography variant="h3" theme="danger">
          Accès non autorisé
        </Typography>
        <Typography variant="body-base" theme="muted">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Typography>
      </div>
    );
  }

  // Cartes de statistiques principales
  const mainStatCards = [
    {
      title: "Lutteurs Actifs",
      value: globalStats?.active_fighters || 0,
      icon: Swords,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: `${globalStats?.champions || 0} champions`,
      trend: "+12%",
      trendPositive: true,
    },
    {
      title: "Compétitions",
      value: globalStats?.active_competitions || 0,
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: `${globalStats?.total_competitions || 0} au total`,
      trend: "+5%",
      trendPositive: true,
    },
    {
      title: "Matchs à Venir",
      value: globalStats?.upcoming_matches || 0,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: `${globalStats?.completed_matches || 0} terminés`,
      trend: "+8%",
      trendPositive: true,
    },
    {
      title: "Utilisateurs",
      value: globalStats?.active_users || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: `${globalStats?.total_users || 0} inscrits`,
      trend: "+15%",
      trendPositive: true,
    },
  ];

  // Statistiques secondaires
  const secondaryStats = [
    { label: "Régions", value: globalStats?.total_regions || 0, icon: Globe },
    {
      label: "Transferts",
      value: globalStats?.total_transfers || 0,
      icon: ArrowRightLeft,
    },
    {
      label: "Articles",
      value: globalStats?.published_articles || 0,
      icon: Newspaper,
    },
    { label: "Vidéos", value: globalStats?.total_videos || 0, icon: Video },
    {
      label: "Messages",
      value: globalStats?.total_messages || 0,
      icon: MessageSquare,
    },
    {
      label: "Notifications",
      value: globalStats?.unread_notifications || 0,
      icon: Bell,
    },
  ];

  // Actions rapides
  const quickActions = [
    { label: "Nouvelle Compétition", icon: Trophy, color: "bg-blue-500" },
    { label: "Ajouter Lutteur", icon: Swords, color: "bg-green-500" },
    { label: "Gérer Régions", icon: MapPin, color: "bg-orange-500" },
    { label: "Programmer Match", icon: Calendar, color: "bg-purple-500" },
    { label: "Créer Article", icon: Newspaper, color: "bg-indigo-500" },
    { label: "Upload Vidéo", icon: Video, color: "bg-red-500" },
    { label: "Voir Calendrier", icon: Calendar, color: "bg-cyan-500" },
    { label: "Rapports", icon: BarChart3, color: "bg-emerald-500" },
  ];

  if (loading && !globalStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Typography variant="h4" weight="bold">
            Tableau de Bord
          </Typography>
          <div className="flex items-center gap-2">
            <Typography variant="lead" theme="muted">
              Bienvenue,{" "}
              <span className="font-semibold text-primary">
                {user?.displayName || "Administrateur"}
              </span>
            </Typography>
            <Badge variant="outline" className="ml-2">
              {user?.userDocument?.role ?? "admin"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button size="lg">
            <Trophy className="w-4 h-4 mr-2" />
            Nouvelle Action
          </Button>
        </div>
      </div>

      {/* Tabs de navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 mb-6">
          {tablist.slice(0, 3).map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.icon && <tab.icon className="h-4 w-4 mr-2 inline" />}
              {tab.label}
            </TabsTrigger>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Plus <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {tablist.slice(3).map((tab) => (
                <DropdownMenuItem
                  key={tab.value}
                  onSelect={() => setActiveTab(tab.value)}
                >
                  {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>

        {/* Tab: Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainStatCards.map((card) => (
              <StatsCard key={card.title} {...card} />
            ))}
          </div>

          {/* Section inférieure */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Actions rapides */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex-col justify-center gap-2"
                    >
                      <div
                        className={`p-2 rounded-full ${action.color} text-white`}
                      >
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-center">
                        {action.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiques secondaires */}
            <Card>
              <CardHeader>
                <CardTitle>Autres Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {secondaryStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <stat.icon className="h-4 w-4" />
                        </div>
                        <Typography variant="body-sm">{stat.label}</Typography>
                      </div>
                      <Typography variant="body-lg" weight="bold">
                        {stat.value.toLocaleString()}
                      </Typography>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Typography variant="body-sm" theme="muted">
                      Dernière mise à jour
                    </Typography>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <Typography variant="body-sm" theme="muted">
                      Version
                    </Typography>
                    <span>1.0.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activités récentes */}
          <RecentActivities />
        </TabsContent>

        {/* Tab: Compétitions */}
        <TabsContent value="competitions" className="space-y-6">
          <TabContent
            entity="competitions"
            title="Statistiques des Compétitions"
            description="Analyses détaillées des compétitions et éditions"
          />
        </TabsContent>

        {/* Tab: Lutteurs */}
        <TabsContent value="fighters" className="space-y-6">
          <TabContent
            entity="fighters"
            title="Statistiques des Lutteurs"
            description="Répartition par région, classement et caractéristiques"
          />
        </TabsContent>

        {/* Tab: Régions */}
        <TabsContent value="regions" className="space-y-6">
          <TabContent
            entity="regions"
            title="Statistiques des Régions"
            description="Performance et répartition géographique"
          />
        </TabsContent>

        {/* Tab: Matchs */}
        <TabsContent value="matches" className="space-y-6">
          <TabContent
            entity="matches"
            title="Statistiques des Matchs"
            description="Résultats, durée et analyses des rencontres"
          />
        </TabsContent>

        {/* Tab: Transferts */}
        <TabsContent value="transfers" className="space-y-6">
          <TabContent
            entity="transfers"
            title="Statistiques des Transferts"
            description="Flux de transferts entre régions"
          />
        </TabsContent>

        {/* Tab: Médias */}
        <TabsContent value="media" className="space-y-6">
          <TabContent
            entity="media"
            title="Statistiques des Médias"
            description="Articles, vidéos et contenu publié"
          />
        </TabsContent>

        {/* Tab: Utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <TabContent
            entity="global"
            title="Statistiques des Utilisateurs"
            description="Activation et répartition des utilisateurs"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
