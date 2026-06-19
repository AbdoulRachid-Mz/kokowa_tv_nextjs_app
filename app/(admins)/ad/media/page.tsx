"use client";

import { EntityList } from "@/components/shared/entity-list";
import { MediaCard } from "@/components/entities/media-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { Media } from "@/types";
import { CardStats } from "@/components/entities/card-stats";
import {
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  HardDrive,
  FileUp,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function MediaPage() {
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
  } = useEntityList<Media>({
    entityType: "media",
    withRelations: ['uploader'],
    defaultLimit: 20,
  });

  // Charger les statistiques des médias
  const [stats, setStats] = useState({
    images: 0,
    videos: 0,
    documents: 0,
    audio: 0,
    totalSize: 0,
    featured: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/media/stats");
        if (response.ok) {
          const data = await response.json();
          
          // Transformer les données pour correspondre à notre interface
          const formattedStats = {
            images: 0,
            videos: 0,
            documents: 0,
            audio: 0,
            totalSize: 0,
            featured: 0,
          };

          data.forEach((stat: any) => {
            switch (stat.file_type) {
              case "image":
                formattedStats.images = stat.total;
                break;
              case "video":
                formattedStats.videos = stat.total;
                break;
              case "document":
                formattedStats.documents = stat.total;
                break;
              case "audio":
                formattedStats.audio = stat.total;
                break;
            }
            formattedStats.totalSize += stat.total_size || 0;
          });

          // Compter les médias en vedette
          const featuredResponse = await fetch("/api/media?is_featured=true&limit=1");
          if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json();
            formattedStats.featured = featuredData.pagination?.total || 0;
          }

          setStats(formattedStats);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      }
    };
    fetchStats();
  }, []);

  // Formater la taille totale
  const formatTotalSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Statistiques pour les médias
  const renderStats = () => {
    const statsData = [
      {
        label: "Images",
        value: stats.images,
        icon: ImageIcon,
        color: "text-green-600",
        description: "Fichiers image",
      },
      {
        label: "Vidéos",
        value: stats.videos,
        icon: Video,
        color: "text-blue-600",
        description: "Fichiers vidéo",
      },
      {
        label: "Documents",
        value: stats.documents,
        icon: FileText,
        color: "text-orange-600",
        description: "Documents",
      },
      {
        label: "Taille totale",
        value: formatTotalSize(stats.totalSize),
        icon: HardDrive,
        color: "text-purple-600",
        description: "Stockage utilisé",
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

  // Filtres disponibles pour les médias
  const availableFilters = [
    // {
    //   key: "file_type",
    //   label: "Type de fichier",
    //   options: [
    //     { value: "all", label: "Tous" },
    //     { value: "image", label: "Images" },
    //     { value: "video", label: "Vidéos" },
    //     { value: "document", label: "Documents" },
    //     { value: "audio", label: "Audio" },
    //   ],
    // },
    {
      key: "is_featured",
      label: "En vedette",
      options: [
        { value: "all", label: "Tous" },
        { value: "true", label: "En vedette" },
        { value: "false", label: "Non vedette" },
      ],
    },
    {
      key: "entity_type",
      label: "Type d'entité",
      options: [
        { value: "all", label: "Tous" },
        { value: "fighter", label: "Lutteur" },
        { value: "competition", label: "Compétition" },
        { value: "article", label: "Article" },
        { value: "user", label: "Utilisateur" },
      ],
    },
  ];

  // Gestionnaire de téléchargement
  const handleDownload = (media: Media) => {
    const link = document.createElement("a");
    link.href = media.file_path;
    link.download = media.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gestionnaire de visualisation
  const handleView = (media: Media) => {
    // Ouvrir dans un nouvel onglet pour les images et vidéos
    if (media.file_type === "image" || media.file_type === "video") {
      window.open(media.file_path, "_blank");
    } else {
      onView?.(media);
    }
  };

  return (
    <EntityList
      title="Gestion des Médias"
      description="Gérez l'ensemble des fichiers multimédias"
      entityType="media"
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
      onFilterChange={setFilters}
      onAdd={onAdd}
      onExport={onExport}
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      availableFilters={availableFilters}
      renderCard={(media, viewMode) => (
        <MediaCard
          item={media}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={handleView}
          onDownload={handleDownload}
        />
      )}
    />
  );
}