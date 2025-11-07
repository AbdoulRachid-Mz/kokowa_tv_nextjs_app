// app/admin/regions/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityList } from "@/components/shared/entity-list";
import { CityDialog } from "@/components/regions/city-dialog";
import { FighterDialog } from "@/components/regions/fighter-dialog";
import { api } from "@/lib/api";
import { City, Fighter } from "@/types";
import Image from "next/image";
import { FighterCard } from "@/components/entities/entity-cards";

export default function RegionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const regionId = parseInt(params.regionId as string);

  const [region, setRegion] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [fighters, setFighters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [fighterDialogOpen, setFighterDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  useEffect(() => {
    loadRegionData();
  }, [regionId]);

  const loadRegionData = async () => {
    try {
      setLoading(true);
      const [regionData, citiesData, fightersData] = await Promise.all([
        api.get(`/api/regions/${regionId}`),
        api.get(`/api/cities?region_id=${regionId}`),
        api.get(`/api/fighters?region_id=${regionId}`),
      ]);

      setRegion(regionData);
      setCities((citiesData as { data?: City[] }).data || []);
      setFighters((fightersData as { data?: Fighter[] }).data || []);
    } catch (error) {
      console.error("Erreur chargement région:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCity = (city: any) => {
    setSelectedCity(city);
    setCityDialogOpen(true);
  };

  const handleAddCity = () => {
    setSelectedCity(null);
    setCityDialogOpen(true);
  };

  const handleCityDialogClose = () => {
    setCityDialogOpen(false);
    setSelectedCity(null);
    loadRegionData(); // Recharger les données
  };

  const handleFighterDialogClose = () => {
    setFighterDialogOpen(false);
    loadRegionData(); // Recharger les données
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!region) {
    return <div>Région non trouvée</div>;
  }

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {cities.length}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Villes
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

      {/* Tabs */}
      <Tabs defaultValue="cities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cities">Villes ({cities.length})</TabsTrigger>
          <TabsTrigger value="fighters">
            Lutteurs ({fighters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cities">
          <EntityList
            title="Villes de la région"
            entityType="city"
            data={cities}
            total={cities.length}
            loading={loading}
            page={1}
            limit={10}
            onPageChange={() => {}}
            onLimitChange={() => {}}
            searchTerm=""
            onSearchChange={() => {}}
            filters={{}}
            onFilterChange={() => {}}
            onAdd={handleAddCity}
            renderCard={(city: any, viewMode) => (
              <Card key={city.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography variant="h6" className="mb-1">
                        {city.name}
                      </Typography>
                      {city.description && (
                        <Typography variant="body-sm" theme="muted">
                          {city.description}
                        </Typography>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCity(city)}
                    >
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          />
        </TabsContent>

        <TabsContent value="fighters">
          <EntityList
            title="Lutteurs de la région"
            entityType="fighter"
            data={fighters}
            total={fighters.length}
            loading={loading}
            page={1}
            limit={10}
            onPageChange={() => {}}
            onLimitChange={() => {}}
            searchTerm=""
            onSearchChange={() => {}}
            filters={{}}
            onFilterChange={() => {}}
            onAdd={() => setFighterDialogOpen(true)}
            renderCard={(fighter: any, viewMode) => (
              <FighterCard
                fighter={fighter}
                key={fighter.id}
                viewMode={viewMode}
                onView={() => router.push(`/ad/fighters/${fighter.id}`)}
              />
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CityDialog
        open={cityDialogOpen}
        onOpenChange={setCityDialogOpen}
        regionId={regionId}
        city={selectedCity}
        onSuccess={handleCityDialogClose}
      />

      <FighterDialog
        open={fighterDialogOpen}
        onOpenChange={setFighterDialogOpen}
        regionId={regionId}
        onSuccess={handleFighterDialogClose}
      />
    </div>
  );
}
