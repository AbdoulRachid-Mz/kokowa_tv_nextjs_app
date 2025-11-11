"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Fighter, Region } from "@/types";
import { FighterCard } from "@/components/entities/entity-cards";
import { FighterDialog } from "@/components/regions/fighter-dialog";
import Link from "next/link";

export default function RegionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const regionId = parseInt(params.regionId as string);

  const [region, setRegion] = useState<Region | null>(null);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fighterDialogOpen, setFighterDialogOpen] = useState(false);

  useEffect(() => {
    loadRegionData();
  }, [regionId]);

  const loadRegionData = async () => {
    try {
      setLoading(true);
      const regionData = await api.get(`/api/regions/${regionId}`);
      setRegion(regionData as Region);
      setFighters((regionData as Region).fighters || []);
    } catch (error) {
      console.error("Erreur chargement région:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFighterDialogClose = () => {
    setFighterDialogOpen(false);
    loadRegionData(); // recharger les données après ajout/modif
  };

  if (loading) return <div>Chargement...</div>;
  if (!region) return <div>Région non trouvée</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Typography variant="h2" className="mb-2">
            {region.name}
          </Typography>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">{region.code}</Badge>
            <Badge variant="outline">{fighters.length} lutteurs</Badge>
            {region.total_champions > 0 && (
              <Badge variant="default">
                {region.total_champions} champions
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => router.push(`/ad/regions/${regionId}/edit`)}>
          Modifier la région
        </Button>
      </div>

      {/* Drapeau et informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            {region.flag_image && (
              <div className="mb-4">
                <img
                  src={region.flag_image}
                  alt={`Drapeau ${region.name}`}
                  className="w-full h-32 object-contain rounded"
                />
              </div>
            )}
            {region.color && (
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: region.color }}
                />
                <Typography variant="body-sm">{region.color}</Typography>
              </div>
            )}
            {region.description && (
              <Typography variant="body-sm" theme="muted">
                {region.description}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Typography variant="h4" weight="bold">
                  {fighters.length}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Lutteurs
                </Typography>
              </div>
              <div className="text-center">
                <Typography variant="h4" weight="bold">
                  {region.total_champions}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Champions
                </Typography>
              </div>
              <div className="text-center">
                <Typography variant="h4" weight="bold">
                  {new Date(region.created_at).getFullYear()}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Création
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des lutteurs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h3">Lutteurs</Typography>
          <Link href={`/fighters/create`}>
            Ajouter un lutteur
          </Link>
        </div>

        {fighters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fighters.map((fighter) => (
              <FighterCard
                key={fighter.id}
                viewMode="grid"
                fighter={fighter}
                onView={() => router.push(`/ad/fighters/${fighter.id}`)}
              />
            ))}
          </div>
        ) : (
          <Typography theme="muted">
            Aucun lutteur enregistré pour cette région.
          </Typography>
        )}
      </div>

      {/* Dialog pour lutteur */}
      <FighterDialog
        open={fighterDialogOpen}
        onOpenChange={setFighterDialogOpen}
        regionId={regionId}
        onSuccess={handleFighterDialogClose}
      />
    </div>
  );
}
