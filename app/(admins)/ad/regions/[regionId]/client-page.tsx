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
import Image from "next/image";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getRegionById } from "@/actions/regions";
import { useEntityList } from "@/hooks/use-entity-list";
import { EntityList } from "@/components/shared/entity-list";
import { DeleteButton } from "@/components/shared/delete-button";

export default function ClientRegionDetail({ regionId }: { regionId: number }) {
  const router = useRouter();

  const [region, setRegion] = useState<Region | null>(null);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fighterDialogOpen, setFighterDialogOpen] = useState(false);

   const {
      data,
      total,
      loading: fightersLoading,
      page,
      limit,
      searchTerm,
      filters,
      viewMode,
      setPage,
      setLimit,
      setSearchTerm,
      setFilters,
      setViewMode,
      onAdd,
      onEdit,
      onView,
      onExport,
      onRefresh,
    } = useEntityList<Fighter>({
      entityType: 'fighters',
      defaultFilters: {
        with_fighters: true,
        region_id: regionId,
        limit: '20',
      },
    });

  useEffect(() => {
    loadRegionData();
  }, [regionId]);

  const loadRegionData = async () => {
    try {
      setLoading(true);
      const regionData = await getRegionById(regionId, { with_relations: true });
      setRegion(regionData as Region);
      setFighters((regionData as any).fighters || []);
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

  if (loading) {
    return <PageSkeleton type="profile" />;
  }

  if (!region) {
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
          region introuvable
        </Typography>
        <Typography
          variant="body-base"
          theme="muted"
          className="mb-6 text-center max-w-sm"
        >
          Il semble que cette region n’existe pas ou ait été supprimée.
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
          <Button onClick={() => router.push("/ad/regions")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <Typography variant="h4" className="mb-2">
            {region.name}
          </Typography>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">{region.code}</Badge>
            <Badge variant="outline">{fighters.length} lutteurs</Badge>
            {(region.total_champions ?? 0) > 0 && (
              <Badge variant="default">
                {region.total_champions} champions
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <DeleteButton
            entityType="region"
            entityId={regionId}
            entityName={region.name}
            redirectPath="/ad/regions"
          />
          <Button onClick={() => router.push(`/ad/regions/${regionId}/edit`)}>
            Modifier la région
          </Button>
        </div>
      </div>

      {/* Drapeau et informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-3 ">
        <Card
          className={`lg:col-span-1 p-2 border-t-[${
            region.color || "primary"
          }] border-2`}
        >
          <CardContent className="p-4">
            {region.flag_image && (
              <div className="mb-4">
                <Image
                  src={region.flag_image}
                  alt={`Drapeau ${region.name}`}
                  width={320}
                  height={128}
                  className="object-contain rounded"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            )}
            {region.color && (
              <div className="flex items-center gap-2 mb-2 ">
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

        <Card
          className={`lg:col-span-2 p-2 border-t-[${
            region.color || "primary"
          }] border-2`}
        >
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
      <EntityList<Fighter>
        title={`Lutteurs de la région ${region.name}`}
        entityType="fighter"
        data={data}
        total={total}
        loading={fightersLoading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        onAdd={() => router.push(`/ad/fighters/create?regionId=${regionId}`)}
        onRefresh={onRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderCard={(fighter, viewMode) => (
            <FighterCard
              key={fighter.id}
              item={fighter}
              viewMode={viewMode}
              onView={() => router.push(`/ad/fighters/${fighter.id}`)}
              onEdit={() => router.push(`/ad/fighters/${fighter.id}/edit`)}
            />
          )}
      />

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
