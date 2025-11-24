// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Shield, 
  Activity, 
  Trophy, 
  Eye,
  MessageSquare,
  Heart,
  Share2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserStats } from "@/types/user";


export default function ProfilePage() {
  const { user, userDocument, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState("informations");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Simuler le chargement des statistiques
  useEffect(() => {
    if (userDocument) {
      setStatsLoading(true);
      // Simuler un appel API pour les stats
      setTimeout(() => {
        setUserStats({
          total_matches: 45,
          total_wins: 32,
          total_losses: 13,
          total_comments: 127,
          total_likes: 456,
          total_shares: 23,
          achievements_count: 8,
        });
        setStatsLoading(false);
      }, 1000);
    }
  }, [userDocument]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user || !userDocument) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Typography variant="h3" className="mb-4">
              Profil non trouvé
            </Typography>
            <Typography variant="body-base" theme="muted" className="mb-6">
              Vous devez être connecté pour voir votre profil
            </Typography>
            <Button asChild>
              <Link href="/auth/signin">
                Se connecter
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrateur", variant: "destructive" as const },
      editor: { label: "Éditeur", variant: "default" as const },
      moderator: { label: "Modérateur", variant: "secondary" as const },
      fighter_manager: { label: "Manager Lutteurs", variant: "outline" as const },
      user: { label: "Utilisateur", variant: "outline" as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return username ? username[0].toUpperCase() : "U";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête du profil */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage 
                src={userDocument.profile_picture || ""} 
                alt={userDocument.username}
              />
              <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/70 text-white">
                {getInitials(userDocument.first_name, userDocument.last_name, userDocument.username)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <Typography variant="h2" className="mb-2">
                    {userDocument.first_name && userDocument.last_name 
                      ? `${userDocument.first_name} ${userDocument.last_name}`
                      : userDocument.username
                    }
                  </Typography>
                  {userDocument.first_name && userDocument.last_name && (
                    <Typography variant="h4" theme="muted" weight="medium">
                      @{userDocument.username}
                    </Typography>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {getRoleBadge(userDocument.role)}
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>
                </div>
              </div>

              {userDocument.bio && (
                <Typography variant="body-base" className="mb-4">
                  {userDocument.bio}
                </Typography>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis {new Date(userDocument.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {userDocument.last_login && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>
                      Dernière connexion {new Date(userDocument.last_login).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="informations" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="activite" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="recompenses" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Récompenses
          </TabsTrigger>
        </TabsList>

        {/* Tab Informations */}
        <TabsContent value="informations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Vos informations de profil principales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow 
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={userDocument.email}
                />
                <InfoRow 
                  icon={<User className="h-4 w-4" />}
                  label="Nom d'utilisateur"
                  value={userDocument.username}
                />
                {userDocument.phone_number && (
                  <InfoRow 
                    icon={<Phone className="h-4 w-4" />}
                    label="Téléphone"
                    value={userDocument.phone_number}
                  />
                )}
                {/* {userDocument.country && (
                  <InfoRow 
                    icon={<MapPin className="h-4 w-4" />}
                    label="Pays"
                    value={userDocument.country}
                  />
                )} */}
              </CardContent>
            </Card>

            {/* Statut du compte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Statut du compte
                </CardTitle>
                <CardDescription>
                  Informations sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Statut</Typography>
                  <Badge variant={userDocument.is_active ? "default" : "secondary"}>
                    {userDocument.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Vérification</Typography>
                  <Badge variant={userDocument.is_verified ? "default" : "outline"}>
                    {userDocument.is_verified ? "Vérifié" : "Non vérifié"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Rôle</Typography>
                  {getRoleBadge(userDocument.role)}
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Date d'inscription</Typography>
                  <Typography variant="body-sm">
                    {new Date(userDocument.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </div>
              </CardContent>
            </Card>

            {/* À propos */}
            {userDocument.bio && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>À propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="body-base">
                    {userDocument.bio}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Statistiques */}
        <TabsContent value="statistiques" className="space-y-6">
          {statsLoading ? (
            <StatsSkeleton />
          ) : userStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Matchs"
                value={userStats.total_matches}
                description="Total des matchs suivis"
                icon={<Activity className="h-6 w-6" />}
                color="text-blue-600"
              />
              <StatCard
                title="Victoires"
                value={userStats.total_wins}
                description="Matchs gagnés"
                icon={<Trophy className="h-6 w-6" />}
                color="text-green-600"
              />
              <StatCard
                title="Commentaires"
                value={userStats.total_comments}
                description="Total des commentaires"
                icon={<MessageSquare className="h-6 w-6" />}
                color="text-purple-600"
              />
              <StatCard
                title="J'aime"
                value={userStats.total_likes}
                description="Total des likes donnés"
                icon={<Heart className="h-6 w-6" />}
                color="text-red-600"
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Typography variant="body-base" theme="muted">
                  Aucune statistique disponible pour le moment
                </Typography>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Activité */}
        <TabsContent value="activite">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Votre activité sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  title="Vous avez commenté un match"
                  description="Finale du championnat national 2024"
                  time="Il y a 2 heures"
                  icon={<MessageSquare className="h-4 w-4" />}
                />
                <ActivityItem
                  title="Vous avez aimé un combat"
                  description="Bakary vs. Mamadou - Quart de finale"
                  time="Il y a 1 jour"
                  icon={<Heart className="h-4 w-4" />}
                />
                <ActivityItem
                  title="Nouvel ami ajouté"
                  description="Vous êtes maintenant ami avec @souleymane"
                  time="Il y a 2 jours"
                  icon={<User className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Récompenses */}
        <TabsContent value="recompenses">
          <Card>
            <CardHeader>
              <CardTitle>Vos récompenses</CardTitle>
              <CardDescription>
                Badges et accomplissements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AchievementCard
                  title="Premier pas"
                  description="Inscription complétée"
                  unlocked={true}
                  icon="🎯"
                />
                <AchievementCard
                  title="Commentateur"
                  description="10 commentaires publiés"
                  unlocked={true}
                  icon="💬"
                />
                <AchievementCard
                  title="Fan de lutte"
                  description="50 matchs suivis"
                  unlocked={userStats ? userStats.total_matches >= 50 : false}
                  icon="👑"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composants utilitaires
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">
        {icon}
      </div>
      <Typography variant="body-sm" weight="medium">
        {label}
      </Typography>
    </div>
    <Typography variant="body-sm" theme="muted">
      {value}
    </Typography>
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  color 
}: { 
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="body-sm" theme="muted" className="uppercase tracking-wide">
          {title}
        </Typography>
        <div className={color}>
          {icon}
        </div>
      </div>
      <Typography variant="h3" weight="bold" className="mb-2">
        {value}
      </Typography>
      <Typography variant="body-sm" theme="muted">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const ActivityItem = ({ 
  title, 
  description, 
  time, 
  icon 
}: { 
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-4 p-4 rounded-lg border">
    <div className="p-2 bg-primary/10 rounded-full text-primary">
      {icon}
    </div>
    <div className="flex-1">
      <Typography variant="body-base" weight="medium" className="mb-1">
        {title}
      </Typography>
      <Typography variant="body-sm" theme="muted" className="mb-2">
        {description}
      </Typography>
      <Typography variant="caption2" theme="muted">
        {time}
      </Typography>
    </div>
  </div>
);

const AchievementCard = ({ 
  title, 
  description, 
  unlocked, 
  icon 
}: { 
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}) => (
  <Card className={cn(
    "transition-all duration-300",
    unlocked 
      ? "border-primary/20 bg-primary/5" 
      : "border-muted bg-muted/20 opacity-50"
  )}>
    <CardContent className="p-6 text-center">
      <div className="text-3xl mb-3">
        {icon}
      </div>
      <Typography variant="body-base" weight="medium" className="mb-2">
        {title}
      </Typography>
      <Typography variant="body-sm" theme="muted">
        {description}
      </Typography>
      <div className="mt-3">
        <Badge variant={unlocked ? "default" : "outline"}>
          {unlocked ? "Débloqué" : "Verrouillé"}
        </Badge>
      </div>
    </CardContent>
  </Card>
);

const ProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
);
