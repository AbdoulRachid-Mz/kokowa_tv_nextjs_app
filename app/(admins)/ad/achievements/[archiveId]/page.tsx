// app/admin/archives/[archiveId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { ArchiveFighterAchievement } from "@/types";
import {
  Edit,
  ArrowRight,
  Calendar,
  User,
  MapPin,
  Trophy,
  History,
  RotateCcw,
  Pen,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function ArchiveDetailPage() {
  const { archiveId } = useParams();
  const router = useRouter();
  const id = parseInt(archiveId as string);

  const [archive, setArchive] = useState<ArchiveFighterAchievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!isNaN(id)) loadArchive();
  }, [id]);

  const loadArchive = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/archives/${id}?with_fighter=true&with_region=true&with_edition=true`);
      if (response.ok) {
        const data = await response.json();
        setArchive(data);
      } else {
        throw new Error("Archive non trouvée");
      }
    } catch (error) {
      console.error("Erreur chargement archive:", error);
      setArchive(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm("Voulez-vous vraiment restaurer ce palmarès ?")) return;
    
    try {
      setRestoring(true);
      const response = await fetch(`/api/archives/${id}/restore`, {
        method: "POST",
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Palmarès restauré avec succès");
        router.push("/ad/archives");
      } else {
        throw new Error(result.message || "Erreur lors de la restauration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la restauration");
    } finally {
      setRestoring(false);
    }
  };

  const handleEdit = () => {
    router.push(`/ad/achievements/${id}/edit`)
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "1st": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "2nd": return "bg-gray-100 text-gray-800 border-gray-300";
      case "3rd": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <Typography variant="h3" className="mt-4">
          Chargement de l'archive...
        </Typography>
      </div>
    );
  }

  if (!archive) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Archive non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/archives")}>
          Retour aux archives
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête avec actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            <div>
              <Typography variant="h2" weight="bold" className="mb-2">
                {archive.title}
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <History className="h-3 w-3 mr-1" />
                  Archive
                </Badge>
                <Badge className={getPositionColor(archive.position)}>
                  <Trophy className="h-3 w-3 mr-1" />
                  {archive.position === "1st" ? "🥇 1er" :
                   archive.position === "2nd" ? "🥈 2ème" :
                   archive.position === "3rd" ? "🥉 3ème" : archive.position}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {archive.year}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleRestore}
                disabled={restoring}
                variant="default"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {restoring ? "Restauration..." : "Restaurer"}
              </Button>
              <Button
                onClick={handleEdit}
                variant="default"
              >
                <Pen className="h-4 w-4 mr-2" />
                modifier
              </Button>
              <Button
                onClick={() => router.push("/ad/archives")}
                variant="outline"
              >
                Retour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte Lutteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lutteur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {archive.fighter ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                    <Image
                      src={archive.fighter.profile_image || "/placeholder-profile.jpg"}
                      alt={`${archive.fighter.first_name} ${archive.fighter.last_name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <Typography variant="body-lg" weight="medium">
                      {archive.fighter.first_name} {archive.fighter.last_name}
                    </Typography>
                    {archive.fighter.nickname && (
                      <Typography variant="body-sm" theme="muted">
                        "{archive.fighter.nickname}"
                      </Typography>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Info label="ID" value={archive.fighter_id} />
                  {archive.fighter.is_champion && (
                    <Badge variant="default" className="w-fit">
                      Champion
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <Typography theme="muted">Lutteur non disponible</Typography>
            )}
          </CardContent>
        </Card>

        {/* Carte Région */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Région
            </CardTitle>
          </CardHeader>
          <CardContent>
            {archive.region ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {archive.region.flag_image && (
                    <div className="relative w-12 h-9 overflow-hidden rounded border">
                      <Image
                        src={archive.region.flag_image}
                        alt={archive.region.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Typography variant="body-lg" weight="medium">
                      {archive.region.name}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      {archive.region.code}
                    </Typography>
                  </div>
                </div>
                <Info label="ID" value={archive.region_id} />
              </div>
            ) : (
              <Typography theme="muted">Région non disponible</Typography>
            )}
          </CardContent>
        </Card>

        {/* Carte Archive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Informations d'archive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info label="ID original" value={archive.original_id} />
            <Info label="Date d'archivage" value={new Date(archive.archived_at).toLocaleDateString()} />
            <Info label="Raison" value={archive.archive_reason || "Non spécifiée"} />
            <div>
              <Typography variant="body-sm" weight="medium" theme="muted" className="mb-1">
                Créé le
              </Typography>
              <Typography>
                {new Date(archive.created_at).toLocaleString()}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails et description */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du palmarès</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Titre" value={archive.title} />
                <Info label="Année" value={archive.year} />
                <Info label="Position" value={archive.position} />
                <Info label="Édition ID" value={archive.edition_id} />
              </div>
            </TabsContent>

            <TabsContent value="description" className="pt-4">
              {archive.description ? (
                <div className="prose max-w-none">
                  <Typography>{archive.description}</Typography>
                </div>
              ) : (
                <Typography theme="muted">Aucune description disponible</Typography>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image du médaillon */}
      {archive.medal_image && (
        <Card>
          <CardHeader>
            <CardTitle>Médaillon</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
              <Image
                src={archive.medal_image}
                alt="Médaillon"
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant Info réutilisable
function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <Typography variant="body-sm" weight="medium" theme="muted" className="mb-1">
        {label}
      </Typography>
      <Typography className={!value ? "text-muted-foreground" : ""}>
        {value || "Non spécifié"}
      </Typography>
    </div>
  );
}