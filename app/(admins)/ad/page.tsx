// app/admin/page.tsx
"use client";

import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, MapPin, Calendar, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { getCompetitionStats } from "@/actions/competitions";

interface StatsData {
  total_competitions: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  total_prize_pool: number;
  total_editions: number;
}

export default function AdminPage() {
  const { user, hasRole } = useAuthContext();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getCompetitionStats();
        setStats({
          total_competitions: statsData.total_competitions,
          upcoming: statsData.upcoming,
          ongoing: statsData.ongoing,
          completed: statsData.completed,
          total_prize_pool: 0, // default value since it's missing in response
          total_editions: statsData.total_editions,
        });
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Compétitions Total",
      value: stats?.total_competitions || 0,
      icon: Trophy,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Toutes compétitions",
    },
    {
      title: "Éditions Actives",
      value: stats?.ongoing || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "En cours",
    },
    {
      title: "À Venir",
      value: stats?.upcoming || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Programmées",
    },
    {
      title: "Prix Total",
      value: `${(stats?.total_prize_pool || 0).toLocaleString()} FCFA`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Total des gains",
    },
  ];

  if (hasRole("admin") && !hasRole("editor")) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Typography variant="h3" theme="danger">
          Accès non autorisé
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" gradient animated>
            Tableau de Bord Admin
          </Typography>
          <Typography variant="lead" theme="muted">
            Bienvenue, {user?.displayName || "Administrateur"}
          </Typography>
        </div>
        <Button size="lg">
          <Trophy className="w-4 h-4 mr-2" />
          Nouvelle Compétition
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <Typography variant="h3" weight="bold" className="mb-1">
                {card.value}
              </Typography>
              <Typography variant="body-sm" theme="muted">
                {card.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Trophy className="w-5 h-5 mb-1" />
              <span>Nouvelle Compétition</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Users className="w-5 h-5 mb-1" />
              <span>Ajouter Lutteur</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <MapPin className="w-5 h-5 mb-1" />
              <span>Gérer Régions</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="w-5 h-5 mb-1" />
              <span>Calendrier</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dernières Activités */}
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "Nouvelle compétition Sabre National 2025 créée",
              "8 régions ajoutées à l'édition 2025",
              "Phase des groupes configurée",
              "Matchs programmés pour la 1ère journée",
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Typography variant="body-sm">{activity}</Typography>
                <Typography variant="caption2" theme="muted" className="ml-auto">
                  Il y a 2h
                </Typography>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}