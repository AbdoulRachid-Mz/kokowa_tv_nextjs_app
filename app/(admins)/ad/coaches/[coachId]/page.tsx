// app/admin/coaches/[coachId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Coach } from "@/types";
import { Edit, MapPin, Award, Calendar, User } from "lucide-react";
import Image from "next/image";
import { useScreenSize } from "@/hooks/use-screen";

export default function CoachDetailPage() {
  const { coachId } = useParams();
  const router = useRouter();
  const id = parseInt(coachId as string);
  const { isSmallScreen: isMobile } = useScreenSize();

  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!isNaN(id)) loadCoach();
  }, [id]);

  const loadCoach = async () => {
    try {
      setLoading(true);
      const coachData = await api.get<any>(`/api/coaches/${id}`);
      setCoach(coachData.coach);
    } catch (error) {
      console.error("Erreur chargement coach:", error);
      setCoach(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Chargement du profil...</div>;
  }

  if (!coach) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Coach non trouvé
        </Typography>
        <Button onClick={() => window.location.reload()}>🔄 Actualiser</Button>
      </div>
    );
  }

  return (
    <div className="">
      {/* En-tête avec photo de profil */}
      <Card className="p-2">
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background">
              <Image
                src={coach.profile_image || "/placeholder-profile.jpg"}
                alt={`${coach.first_name} ${coach.last_name}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <Typography variant="h4" weight="bold">
                    {coach.first_name} {coach.last_name}
                  </Typography>
                  {coach.nickname && (
                    <Typography variant="h5" theme="muted" className="mt-1">
                      "{coach.nickname}"
                    </Typography>
                  )}
                </div>
                <Button 
                  onClick={() => router.push(`/ad/coaches/${id}/edit`)}
                  className="mt-4 md:mt-0"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le profil
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <Badge variant={coach.is_active ? "default" : "outline"}>
                  {coach.is_active ? "Actif" : "Inactif"}
                </Badge>
                {coach.certification_level && (
                  <Badge variant="secondary">
                    {coach.certification_level}
                  </Badge>
                )}
                {coach.license_number && (
                  <Badge variant="outline">
                    Licence: {coach.license_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu (onglets) */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du coach</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex justify-center mb-4">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="experience">Expérience</TabsTrigger>
            </TabsList>

            {/* Onglet Profil */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Info label="Région" value={coach.region?.name} />
                <Info
                  label="Date de naissance"
                  value={
                    coach.birth_date &&
                    new Date(coach.birth_date).toLocaleDateString()
                  }
                />
                <Info label="Niveau de certification" value={coach.certification_level} />
                <Info label="Numéro de licence" value={coach.license_number} />
                <Info
                  label="Années d'expérience"
                  value={coach.experience_years}
                />
              </div>

              {coach.specialties && (
                <div className="mt-6">
                  <Typography variant="h5" className="mb-2">
                    Spécialités
                  </Typography>
                  <Typography>{coach.specialties}</Typography>
                </div>
              )}
            </TabsContent>

            {/* Onglet Expérience */}
            <TabsContent value="experience">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat
                  label="Années d'expérience"
                  value={coach.experience_years || 0}
                  suffix="ans"
                />
                <Stat
                  label="Statut"
                  value={coach.is_active ? "Actif" : "Inactif"}
                />
                <Stat
                  label="Niveau"
                  value={coach.certification_level || "Non spécifié"}
                />
              </div>
              
              {coach.specialties && (
                <div className="mt-6">
                  <Typography variant="h5" className="mb-2">
                    Domaines d'expertise
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.split(',').map((specialty, index) => (
                      <Badge key={index} variant="outline">
                        {specialty.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Composants utilitaires
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <Typography variant="body-sm" weight="medium" theme="muted">
        {label}
      </Typography>
      <Typography>{value || "Non spécifié"}</Typography>
    </div>
  );
}

function Stat({ 
  label, 
  value, 
  suffix = "" 
}: { 
  label: string; 
  value: string | number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="text-center p-4">
        <Typography variant="h4" weight="bold">
          {value} {suffix}
        </Typography>
        <Typography variant="body-sm" theme="muted">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}