"use client";

import { EntityList } from "@/components/shared/entity-list";
import { NotificationCard } from "@/components/entities/notification-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { Notification } from "@/types";
import { CardStats } from "@/components/entities/card-stats";
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NotificationsPage() {
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
  } = useEntityList<Notification>({
    entityType: "notifications",
    defaultFilters: {
      with_user: true,
      limit: 20,
    },
    defaultLimit: 20,
  });

  // Charger les statistiques des notifications
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    expired: 0,
    highPriority: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Statistiques générales
        const response = await fetch("/api/notifications/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      }
    };
    fetchStats();
  }, [data]);

  // Statistiques pour les notifications
  const renderStats = () => {
    const statsData = [
      {
        label: "Total",
        value: stats.total,
        icon: Bell,
        color: "text-blue-600",
        description: "Notifications",
      },
      {
        label: "Non lues",
        value: stats.unread,
        icon: BellRing,
        color: "text-red-600",
        description: "À lire",
      },
      {
        label: "Lues",
        value: stats.read,
        icon: CheckCircle,
        color: "text-green-600",
        description: "Consultées",
      },
      {
        label: "Haute priorité",
        value: stats.highPriority,
        icon: AlertTriangle,
        color: "text-orange-600",
        description: "Urgentes",
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

  // Filtres disponibles pour les notifications
  const availableFilters = [
    {
      key: "notification_type",
      label: "Type",
      options: [
        { value: "all", label: "Tous" },
        { value: "match_update", label: "Match" },
        { value: "fighter_update", label: "Lutteur" },
        { value: "competition_update", label: "Compétition" },
        { value: "system_notification", label: "Système" },
        { value: "achievement", label: "Récompense" },
        { value: "message", label: "Message" },
      ],
    },
    {
      key: "is_read",
      label: "Statut",
      options: [
        { value: "all", label: "Tous" },
        { value: "false", label: "Non lues" },
        { value: "true", label: "Lues" },
      ],
    },
    {
      key: "priority",
      label: "Priorité",
      options: [
        { value: "all", label: "Toutes" },
        { value: "high", label: "Haute" },
        { value: "medium", label: "Moyenne" },
        { value: "low", label: "Basse" },
      ],
    },
    {
      key: "user_id",
      label: "Utilisateur",
      options: [
        { value: "all", label: "Tous" },
        { value: "1", label: "Admin" },
        // Ajouter d'autres utilisateurs dynamiquement
      ],
    },
  ];

  // Gestionnaire pour marquer une notification comme lue
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const response = await fetch(
        `/api/notifications/${notification.id}/read`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        toast.success("Notification marquée comme lue");
        onRefresh?.(); // Rafraîchir la liste
      } else {
        toast.error("Erreur lors du marquage comme lue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  // Gestionnaire pour marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Toutes les notifications ont été marquées comme lues");
        onRefresh?.(); // Rafraîchir la liste
      } else {
        toast.error("Erreur lors du marquage des notifications");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  // Gestionnaire pour supprimer une notification
  const handleDelete = async (notification: Notification) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Notification supprimée avec succès");
        onRefresh?.(); // Rafraîchir la liste
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  // Gestionnaire pour ouvrir l'action d'une notification
  const handleAction = (notification: Notification) => {
    if (notification.action_url) {
      window.open(notification.action_url, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec actions globales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Notifications
          </h1>
          <p className="text-gray-600">
            Gérez l'ensemble des notifications du système
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={stats.unread === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
          <Button onClick={onAdd}>
            <Bell className="h-4 w-4 mr-2" />
            Nouvelle notification
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {renderStats()}

      {/* Liste des notifications */}
      <EntityList
        title="Notifications"
        description={`${total} notification${total > 1 ? "s" : ""} trouvée${
          total > 1 ? "s" : ""
        }`}
        entityType="notification"
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
        availableFilters={availableFilters}
        renderCard={(notification, viewMode) => (
          <NotificationCard
            notification={notification}
            viewMode={viewMode}
            onView={onView}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            onAction={handleAction}
          />
        )}
      />
    </div>
  );
}
