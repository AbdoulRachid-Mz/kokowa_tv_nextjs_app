"use client";

import { EntityList } from "@/components/shared/entity-list";
import { ArticleCard } from "@/components/entities/article-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { Article } from "@/types";
import { CardStats } from "@/components/entities/card-stats";
import {
  FileText,
  Eye,
  Heart,
  Share2,
  Calendar,
  User,
  Globe,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { StatsCarousel } from "@/components/shared/stats-carousel";

export default function ArticlesPage() {
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
  } = useEntityList<Article>({
    entityType: "articles",
    withRelations: ['author'],
    defaultLimit: 20,
  });

  // Charger les statistiques des articles
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Compter les articles par statut
        const publishedResponse = await fetch("/api/articles?status=published&limit=1");
        const draftResponse = await fetch("/api/articles?status=draft&limit=1");
        const archivedResponse = await fetch("/api/articles?status=archived&limit=1");
        
        const publishedData = publishedResponse.ok ? await publishedResponse.json() : { pagination: { total: 0 } };
        const draftData = draftResponse.ok ? await draftResponse.json() : { pagination: { total: 0 } };
        const archivedData = archivedResponse.ok ? await archivedResponse.json() : { pagination: { total: 0 } };

        // Calculer les totaux
        const totalViews = data.reduce((sum, article) => sum + (article.view_count || 0), 0);
        const totalLikes = data.reduce((sum, article) => sum + (article.like_count || 0), 0);

        setStats({
          total: total,
          published: publishedData.pagination?.total || 0,
          draft: draftData.pagination?.total || 0,
          archived: archivedData.pagination?.total || 0,
          totalViews,
          totalLikes,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      }
    };

    if (data.length > 0) {
      fetchStats();
    }
  }, [data, total]);

  // Statistiques pour les articles
  const renderStats = () => {
    const statsData = [
      {
        label: "Total Articles",
        value: stats.total,
        icon: FileText,
        color: "text-blue-600",
        description: "Tous les articles",
      },
      {
        label: "Publiés",
        value: stats.published,
        icon: Calendar,
        color: "text-green-600",
        description: "Articles publiés",
      },
      {
        label: "Brouillons",
        value: stats.draft,
        icon: FileText,
        color: "text-yellow-600",
        description: "En attente",
      },
      {
        label: "Vues Totales",
        value: stats.totalViews.toLocaleString(),
        icon: Eye,
        color: "text-purple-600",
        description: "Nombre de vues",
      },
    ];

    return (
      <StatsCarousel>
        {statsData.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </StatsCarousel>
    );
  };

  // Filtres disponibles pour les articles
  const availableFilters = [
    // {
    //   key: "status",
    //   label: "Statut",
    //   options: [
    //     { value: "all", label: "Tous" },
    //     { value: "published", label: "Publiés" },
    //     { value: "draft", label: "Brouillons" },
    //     { value: "archived", label: "Archivés" },
    //   ],
    // },
    // {
    //   key: "language",
    //   label: "Langue",
    //   options: [
    //     { value: "all", label: "Toutes" },
    //     { value: "fr", label: "Français" },
    //     { value: "ha", label: "Hausa" },
    //     { value: "en", label: "Anglais" },
    //   ],
    // },
    {
      key: "sort",
      label: "Trier par",
      options: [
        { value: "recent", label: "Plus récents" },
        { value: "popular", label: "Plus populaires" },
        { value: "views", label: "Plus de vues" },
        { value: "likes", label: "Plus de likes" },
      ],
    },
  ];

  // Gestionnaire pour publier un article
  const handlePublish = async (article: Article) => {
    try {
      const formData = new FormData();
      formData.append("status", "published");
      
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        onRefresh?.();
      } else {
        console.error("Erreur lors de la publication");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Gestionnaire pour visualiser un article
  const handleView = (article: Article) => {
    if (article.status === "published") {
      // Ouvrir l'article publié
      window.open(`/articles/${article.slug}`, "_blank");
    } else {
      // Ouvrir l'aperçu de l'article
      onView?.(article);
    }
  };

  return (
    <EntityList
      title="Gestion des Articles"
      description="Gérez l'ensemble des articles et publications"
      entityType="article"
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
      renderCard={(article, viewMode) => (
        <ArticleCard
          item={article}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={handleView}
          onPublish={handlePublish}
        />
      )}
    />
  );
}