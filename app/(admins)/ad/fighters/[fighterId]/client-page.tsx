// app/admin/fighters/[fighterId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { api } from "@/lib/api";
import { Fighter } from "@/types";
import { FileArchive, Pin } from "lucide-react";
import Image from "next/image";
import { useScreenSize } from "@/hooks/use-screen";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getFighterById } from "@/actions/fighters";

export default function ClientFighterDetailPage({
  fighterId,
}: {
  fighterId: number;
}) {
  const router = useRouter();

  const id = fighterId;
  const { isSmallScreen: isMobile } = useScreenSize();

  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!isNaN(id)) loadFighter();
  }, [id]);

  const loadFighter = async () => {
    try {
      setLoading(true);
      const fighterData = await getFighterById(id, { with_relations: true });
      setFighter(fighterData);
    } catch (error) {
      console.error("Erreur chargement lutteur:", error);
      setFighter(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton type="profile" />;
  }

  if (!fighter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 opacity-20 animate-pulse" />
          <svg
            className="w-full h-full text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5"
              className="text-red-600"
            />
          </svg>
        </div>

        <Typography variant="h3" weight="semibold" className="mb-2">
          Lutteur introuvable
        </Typography>
        <Typography
          variant="body-base"
          theme="muted"
          className="mb-6 text-center max-w-sm"
        >
          Il semble que ce lutteur n’existe pas ou ait été supprimé.
        </Typography>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            {/* <span className="inline-block animate-spin"> */}
            <Spinner width={24} height={24} />
            {/* </span> */}
            Actualiser
          </Button>
          <Button onClick={() => router.push("/ad/fighters")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* ✅ Image de couverture */}
      <div className="relative w-full h-50 rounded-2xl  shadow-md">
        <div className="flex justify-center gap-2 mt-4 absolute top-4 right-4">
          <Badge variant={fighter.is_active ? "default" : "outline"}>
            {fighter.is_active ? "Actif" : "Inactif"}
          </Badge>
          <Badge variant={fighter.is_champion ? "default" : "secondary"}>
            {fighter.is_champion ? "Champion" : "Lutteur"}
          </Badge>
          {fighter.ranking && (
            <Badge variant="outline">Classement: {fighter.ranking}</Badge>
          )}
        </div>
        <Image
          src={fighter.cover_image || "/placeholder-cover.jpg"}
          alt="Cover"
          fill
          className="w-full h-full relative object-cover"
        />
        {/* ✅ Image de profil superposée */}
        <div className="absolute -bottom-16 left-1/5 -translate-x-1/2">
          <div
            className={`w-${isMobile ? 20 : 36} h-${
              isMobile ? 20 : 36
            } relative rounded-full border-4 border-background overflow-hidden shadow-lg`}
          >
            <Image
              src={fighter.profile_image || "/placeholder-profile.jpg"}
              alt="Profile"
              width={isMobile ? 20 : 36}
              height={isMobile ? 20 : 36}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ✅ Nom et badges */}
      <div className="pt-12">
        <div className="flex items-center justify-between">
          <div className="">
            <Typography variant="h3" weight="bold">
              {fighter.first_name} {fighter.last_name}
            </Typography>

            {fighter.nickname && (
              <Typography variant="h5" theme="muted" className="mt-1">
                "{fighter.nickname}"
              </Typography>
            )}
          </div>
          <div className="">
            <Button onClick={() => router.push(`/ad/fighters/${id}/edit`)}>
              <Pin /> Modifier le profil
            </Button>
          </div>
        </div>

        {/* <div className="flex justify-center gap-2 mt-4">
          <Badge variant={fighter.is_active ? "default" : "outline"}>
            {fighter.is_active ? "Actif" : "Inactif"}
          </Badge>
          <Badge variant={fighter.is_champion ? "default" : "secondary"}>
            {fighter.is_champion ? "Champion" : "Lutteur"}
          </Badge>
          {fighter.ranking && (
            <Badge variant="outline">Classement: {fighter.ranking}</Badge>
          )}
        </div> */}
      </div>

      {/* ✅ Contenu (onglets) */}
      <Card className="max-w-5xl mx-auto p-4">
        <CardHeader>
          <CardTitle>Détails du lutteur</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex justify-center mb-3 border-primary border bg-primary">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
              <TabsTrigger value="achievements">Palmarès</TabsTrigger>
            </TabsList>

            {/* ✅ Onglet Profil */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Région" value={fighter.region?.name} />
                <Info
                  label="Date de naissance"
                  value={
                    fighter.birth_date &&
                    new Date(fighter.birth_date).toLocaleDateString()
                  }
                />
                <Info label="Lieu de naissance" value={fighter.birth_place} />
                <Info
                  label="Taille"
                  value={fighter.height && `${fighter.height} m`}
                />
                <Info
                  label="Poids"
                  value={fighter.weight && `${fighter.weight} kg`}
                />
                <Info label="Année de début" value={fighter.debut_year} />
                <Info label="Style de combat" value={fighter.fighting_style} />
              </div>

              {fighter.bio && (
                <div className="mt-4">
                  <Typography variant="h5" className="mb-2">
                    Biographie
                  </Typography>
                  <Typography>{fighter.bio}</Typography>
                </div>
              )}
            </TabsContent>

            {/* ✅ Onglet Statistiques */}
            <TabsContent value="stats">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat
                  label="Matchs totaux"
                  value={fighter.total_matches || 0}
                />
                <Stat label="Victoires" value={fighter.total_wins || 0} />
                <Stat label="Défaites" value={fighter.total_losses || 0} />
                <Stat
                  label="Taux de victoire"
                  value={
                    fighter.total_matches
                      ? `${Math.round(
                          (fighter.total_matches / fighter.total_matches) * 100
                        )}%`
                      : "0%"
                  }
                />
              </div>
            </TabsContent>

            {/* ✅ Onglet Palmarès */}
            <TabsContent value="achievements">
              {fighter.achievements?.length ? (
                <div className="space-y-3">
                  {fighter.achievements.map((a) => (
                    <Card key={a.id} className="p-3">
                      <CardContent className="p-2 flex justify-between items-center">
                        <div>
                          <Typography variant="h5">{a.title}</Typography>
                          <Typography variant="body-sm" theme="muted">
                            {a.edition?.theme || "N/A"} • {a.year}
                          </Typography>
                          {a.description && (
                            <Typography variant="body-sm" className="mt-2">
                              {a.description}
                            </Typography>
                          )}
                        </div>
                        <Badge
                          variant={
                            a.position === "1st"
                              ? "default"
                              : a.position === "2nd"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {a.position}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileArchive size={48} />
                    </EmptyMedia>
                    <EmptyTitle>Aucun palmarès</EmptyTitle>
                    <EmptyDescription>
                      Aucune réalisation enregistrée pour ce lutteur.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() =>
                          router.push(
                            `/ad/achievements/create?fighterId=${fighterId}`
                          )
                        }
                      >
                        Ajouter palmares
                      </Button>
                    </div>
                  </EmptyContent>
                </Empty>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ Petits composants pour réduire la répétition
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-2 border-t-primary border-b-green-500 border-2">
      <CardContent className="text-center p-2">
        <Typography variant="h4" weight="bold">
          {value}
        </Typography>
        <Typography variant="body-sm" theme="muted">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
