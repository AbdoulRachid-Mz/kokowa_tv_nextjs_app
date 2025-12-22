"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Referee } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { StatsCard } from "@/components/ui/stats-card";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  Award,
  Clock,
  User,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RefereeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [referee, setReferee] = useState<Referee | null>(null);
  const [loading, setLoading] = useState(true);

  const refereeId = params.refereeId as string;

  useEffect(() => {
    const fetchReferee = async () => {
      try {
        const response = await fetch(`/api/referees/${refereeId}`);
        if (response.ok) {
          const data = await response.json();
          setReferee(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    if (refereeId) {
      fetchReferee();
    }
  }, [refereeId]);

  const handleEdit = () => {
    router.push(`/ad/referees/${refereeId}/edit`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!referee) {
    return (
      <div className="container mx-auto py-6">
        <Typography variant="h2">Arbitre non trouvé</Typography>
        <Button onClick={() => router.push("/admin/referees")}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/ad/referees")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Typography variant="h2" className="flex items-center gap-2">
              {referee.first_name} {referee.last_name}
              {referee.nickname && (
                <Typography variant="body-lg" theme="muted" weight="medium">
                  "{referee.nickname}"
                </Typography>
              )}
            </Typography>
            <Typography variant="body-sm" theme="muted">
              Arbitre {referee.certification_level || "Professionnel"}
            </Typography>
          </div>
        </div>
        <Button onClick={handleEdit} className="gap-2">
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          {/* Photo de profil */}
          <Card className="p-3">
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage
                  src={referee.profile_image || ""}
                  alt={`${referee.first_name} ${referee.last_name}`}
                />
                <AvatarFallback>
                  {referee.first_name?.[0]}
                  {referee.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Prénom
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.first_name}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Nom
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.last_name}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Date de naissance
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.birth_date
                      ? new Date(referee.birth_date).toLocaleDateString("fr-FR")
                      : "Non spécifiée"}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Statut
                  </Typography>
                  <Badge variant={referee.is_active ? "default" : "secondary"}>
                    {referee.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card className="p-3">
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Numéro de licence
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.license_number || "Non spécifié"}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Niveau de certification
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.certification_level || "Non spécifié"}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Années d'expérience
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.experience_years || 0} ans
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Région
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {referee.region?.name || "Non spécifiée"}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Statut */}
          <StatsCard
            title="Statut de l'arbitre"
            value={referee.is_active ? "Actif" : "Inactif"}
            description={referee.is_active ? "En activité" : "Non actif"}
            icon={Shield}
            variant={referee.is_active ? "success" : "danger"}
            size="sm"
          />
          {/* Expérience */}
          <StatsCard
            title="Expérience"
            value={`${referee.experience_years || 0} ans`}
            description="d'expérience en arbitrage"
            icon={Clock}
            variant="primary"
            size="sm"
          />
          {/* Certification */}
          <StatsCard
            title="Certification"
            value={referee.certification_level || "N/A"}
            description="Niveau de certification"
            icon={Award}
            variant="secondary"
            size="sm"
          />
          // Dernières assignations
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dernières assignations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="body-sm" theme="muted">
                Aucune assignation récente
              </Typography>
              <Button variant="outline" className="w-full mt-4" size="sm">
                Voir toutes les assignations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
