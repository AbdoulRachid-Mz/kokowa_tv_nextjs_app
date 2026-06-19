"use client";

import { EntityList } from "@/components/shared/entity-list";
import { VideoCard } from "@/components/entities/video-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { Video } from "@/types";
import { CardStats } from "@/components/entities/card-stats";
import {
  Video as VideoIcon,
  Youtube,
  TvMinimalPlay,
  Eye,
  Heart,
  Award,
  TrendingUp,
  Film,
  Play,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function VideosPage() {
  const {
    data,
    total,
    loading,
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
    onResetFilters,
  } = useEntityList<Video>({
    entityType: "videos",
    defaultLimit: 20,
  });

  // Charger les statistiques des vidéos
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    totalViews: 0,
    totalLikes: 0,
    featured: 0,
    avgViews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/videos/stats");
        if (response.ok) {
          const data = await response.json();
          
          // Calculer les totaux
          const total = data.reduce((sum: number, stat: any) => sum + stat.total, 0);
          const totalViews = data.reduce((sum: number, stat: any) => sum + stat.total_views, 0);
          const totalLikes = data.reduce((sum: number, stat: any) => sum + stat.total_likes, 0);
          const avgViews = total > 0 ? totalViews / total : 0;

          // Récupérer les lives
          const liveResponse = await fetch("/api/videos?is_live=true&limit=1");
          let liveCount = 0;
          if (liveResponse.ok) {
            const liveData = await liveResponse.json();
            liveCount = liveData.pagination?.total || 0;
          }

          // Récupérer les vidéos en vedette
          const featuredResponse = await fetch("/api/videos?is_featured=true&limit=1");
          let featuredCount = 0;
          if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json();
            featuredCount = featuredData.pagination?.total || 0;
          }

          setStats({
            total,
            live: liveCount,
            totalViews,
            totalLikes,
            featured: featuredCount,
            avgViews: Math.round(avgViews),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      }
    };
    fetchStats();
  }, []);

  // Formater les grands nombres
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Statistiques pour les vidéos
  const renderStats = () => {
    const statsData = [
      {
        label: "Total Vidéos",
        value: stats.total,
        icon: VideoIcon,
        color: "text-blue-600",
        description: `${stats.live} en direct`,
      },
      {
        label: "Vues Total",
        value: formatLargeNumber(stats.totalViews),
        icon: Eye,
        color: "text-green-600",
        description: `${stats.avgViews} en moyenne`,
      },
      {
        label: "Likes Total",
        value: formatLargeNumber(stats.totalLikes),
        icon: Heart,
        color: "text-red-600",
        description: "Engagement",
      },
      {
        label: "En Vedette",
        value: stats.featured,
        icon: Award,
        color: "text-yellow-600",
        description: "Vidéos mises en avant",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </div>
    );
  };

  // Filtres disponibles pour les vidéos
  const availableFilters = [
    {
      key: "type",
      label: "Plateforme",
      options: [
        { value: "all", label: "Toutes" },
        { value: "youtube", label: "YouTube" },
        { value: "facebook", label: "Facebook" },
        { value: "tiktok", label: "TikTok" },
        { value: "vimeo", label: "Vimeo" },
        { value: "upload", label: "Upload" },
        { value: "rtmp", label: "RTMP/Live" },
      ],
    },
    {
      key: "category",
      label: "Catégorie",
      options: [
        { value: "all", label: "Toutes" },
        { value: "match", label: "Matchs" },
        { value: "interview", label: "Interviews" },
        { value: "highlights", label: "Highlights" },
        { value: "training", label: "Entraînements" },
        { value: "documentary", label: "Documentaires" },
        { value: "ceremony", label: "Cérémonies" },
      ],
    },
    {
      key: "status",
      label: "Statut",
      options: [
        { value: "all", label: "Tous" },
        { value: "live", label: "En direct" },
        { value: "featured", label: "En vedette" },
        { value: "regular", label: "Réguliers" },
      ],
    },
  ];

  // Gestionnaire de filtres
  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...newFilters };
    
    // Gérer le filtre de statut spécial
    if (updatedFilters.status === "live") {
      updatedFilters.is_live = true;
      delete updatedFilters.is_featured;
    } else if (updatedFilters.status === "featured") {
      updatedFilters.is_featured = true;
      delete updatedFilters.is_live;
    } else if (updatedFilters.status === "regular") {
      updatedFilters.is_live = false;
      updatedFilters.is_featured = false;
    } else {
      delete updatedFilters.is_live;
      delete updatedFilters.is_featured;
    }
    
    delete updatedFilters.status; // Retirer le filtre temporaire
    setFilters(updatedFilters);
  };

  // Gestionnaire de lecture
  const handlePlay = (video: Video) => {
    if (video.is_live && video.type === "rtmp") {
      // Pour les streams RTMP, on pourrait utiliser un player spécial
      toast.info("Lecture du stream en direct...");
    }
    
    // Ouvrir la vidéo dans un nouvel onglet
    window.open(video.video_url, "_blank");
  };

  // Gestionnaire de like
  const handleLike = async (videoId: number) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Vidéo likée !");
        onRefresh?.();
      }
    } catch (error) {
      console.error("Erreur lors du like:", error);
      toast.error("Erreur lors du like");
    }
  };

  return (
    <EntityList
      title="Gestion des Vidéos"
      description="Gérez l'ensemble des vidéos et contenus vidéo"
      entityType="video"
      data={data}
      total={total}
      loading={loading}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFilterChange={handleFilterChange}
      onAdd={onAdd}
      onExport={onExport}
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      availableFilters={availableFilters}
      renderCard={(video, viewMode) => (
        <VideoCard
          item={video}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
          // onPlay={handlePlay}
        />
      )}
    />
  );
}