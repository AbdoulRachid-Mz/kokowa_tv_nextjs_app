// app/admin/competitions/[competitionId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Edit, 
  Plus,
  ArrowLeft,
  Eye,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Competition, CompetitionEdition } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import Image from "next/image"
import { EditionCard } from "@/components/entities/edition-card";

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);

  // Utiliser les éditions déjà chargées avec la compétition
  const editionsList = {
    data: competition?.editions || [],
    total: competition?.editions?.length || 0,
    loading: false,
    page: 1,
    limit: 50,
    searchTerm: '',
    filters: {},
    setPage: () => {},
    setLimit: () => {},
    setSearchTerm: () => {},
    setFilters: () => {},
    refetch: () => {},
    onRefresh: () => {},
    viewMode: 'grid' as const,
    setViewMode: () => {},
  };

  // Charger les détails de la compétition
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const response = await fetch(`/api/competitions/${competitionId}`);
        if (response.ok) {
          const data = await response.json();
          setCompetition(data);
        } else {
          console.error("Erreur lors du chargement de la compétition");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  // Statistiques pour la compétition
  const getCompetitionStats = () => {
    if (!competition) return [];

    const totalEditions = editionsList.data.length;
    const totalParticipants = editionsList.data.reduce((sum, edition) => 
      sum + (edition.total_participants || 0), 0
    );
    const ongoingEditions = editionsList.data.filter(e => {
      if (!e.start_date || !e.end_date) return false;
      const now = new Date();
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      return now >= start && now <= end;
    }).length;

    return [
      {
        label: "Éditions Total",
        value: totalEditions,
        icon: Trophy,
        color: "text-blue-600",
        description: "Nombre d'éditions organisées",
      },
      {
        label: "Participants Total",
        value: totalParticipants,
        icon: Users,
        color: "text-green-600",
        description: "Lutteurs et régions participants",
      },
      {
        label: "Éditions en Cours",
        value: ongoingEditions,
        icon: Calendar,
        color: "text-orange-600",
        description: "Éditions actuellement en cours",
      },
    ];
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: 'À venir', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'En cours', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminée', variant: 'outline' as const },
      cancelled: { label: 'Annulée', variant: 'secondary' as const, color: 'bg-red-100 text-red-800' },
      postponed: { label: 'Reportée', variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
    return config;
  };


  // Gestionnaires d'actions pour les éditions
  const handleViewEdition = (edition: CompetitionEdition) => {
    // Ouvrir un drawer ou naviguer vers la page détail
    router.push(`/ad/editions/${edition.id}`);
  };

  const handleEditEdition = (edition: CompetitionEdition) => {
    router.push(`/ad/editions/${edition.id}/edit`);
  };

  const handleDeleteEdition = async (edition: CompetitionEdition) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'édition ${edition.edition_number} ?`)) {
      try {
        const response = await fetch(`/api/editions/${edition.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          editionsList.refetch();
        } else {
          alert('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleAddEdition = () => {
    router.push(`/ad/competitions/${competitionId}/editions/new`);
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Compétition non trouvée
        </Typography>
        <Button 
          onClick={() => router.push('/ad/competitions')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux compétitions
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusBadge(competition.status);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/ad/competitions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h4" weight="bold" animated>
              {competition.name}
            </Typography>
            {/* <Typography variant="lead" theme="muted">
              Détails de la compétition
            </Typography> */}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/ad/competitions/${competitionId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={handleAddEdition}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Édition
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <StatsCarousel>
        {getCompetitionStats().map((stat, index) => (
          <CardStats key={index} label={stat.label} icon={stat.icon} value={stat.value} color={stat.color} />
        ))}
      </StatsCarousel>

      {/* Informations de la compétition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Informations principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations de la Compétition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="body-sm" theme="muted" className="mb-1">
                  Statut
                </Typography>
                <Badge variant={statusConfig.variant} className={'color' in statusConfig ? statusConfig.color : undefined}>
                  {statusConfig.label}
                </Badge>
              </div>
              
              {competition.featured_image && (
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    Image de couverture
                  </Typography>
                  <Image
                    src={competition.featured_image}
                    alt="Image de couverture"
                    className="w-full h-32 object-cover rounded-md"
                    width={400}
                    height={128}
                  />
                </div>
              )}
              
              <div>
                <Typography variant="body-sm" theme="muted" className="mb-1">
                  Activé
                </Typography>
                <Typography variant="body-base">
                  {competition.is_active ? 'Oui' : 'Non'}
                </Typography>
              </div>
            </div>
            
            {competition.description && (
              <div>
                <Typography variant="body-sm" theme="muted" className="mb-1">
                  Description
                </Typography>
                <Typography variant="body-base" className="text-justify">
                  {competition.description}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="p-3">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleAddEdition}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Édition
            </Button>
             <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push(`/ad/competitions/${competitionId}/phases`)}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Gérer les Phases
            </Button> 
          </CardContent>
        </Card>
      </div>

      {/* Liste des éditions */}
      <EntityList
        title="Éditions de la Compétition"
        description={`Editions pour ${competition.name}`}
        entityType="edition"
        data={editionsList.data}
        total={editionsList.total}
        loading={editionsList.loading}
        page={editionsList.page}
        limit={editionsList.limit}
        onPageChange={editionsList.setPage}
        onLimitChange={editionsList.setLimit}
        searchTerm={editionsList.searchTerm}
        onSearchChange={editionsList.setSearchTerm}
        filters={editionsList.filters}
        onFilterChange={editionsList.setFilters}
        onAdd={handleAddEdition}
        onRefresh={editionsList.onRefresh}
        viewMode={editionsList.viewMode}
        onViewModeChange={editionsList.setViewMode}
        renderCard={(edition, viewMode) => (
          <EditionCard
            item={edition}
            isCliquable={true}
            viewMode={viewMode}
            onView={handleViewEdition}
            onEdit={handleEditEdition}
            onDelete={handleDeleteEdition}
          />
        )}
      />
    </div>
  );
}
