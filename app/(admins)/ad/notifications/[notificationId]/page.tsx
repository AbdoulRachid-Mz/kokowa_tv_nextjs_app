"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Swords,
  Trophy,
  User,
  MessageSquare,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Copy,
} from "lucide-react";
import { Notification } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CardStats } from "@/components/entities/card-stats";
import { toast } from "sonner";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.notificationId as string;

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRead, setIsRead] = useState(false);

  // Charger les détails de la notification
  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}?with_relations=true`
        );
        if (response.ok) {
          const data = await response.json();
          setNotification(data);
          setIsRead(data.is_read);
        } else {
          toast.error("Erreur lors du chargement de la notification");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        toast.error("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    if (notificationId) {
      fetchNotification();
    }
  }, [notificationId]);

  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = () => {
    if (!notification) return Bell;
    
    switch (notification.notification_type) {
      case "match_update":
        return Swords;
      case "fighter_update":
        return User;
      case "competition_update":
        return Trophy;
      case "achievement":
        return Trophy;
      case "message":
        return MessageSquare;
      case "system_notification":
        return isRead ? Bell : BellRing;
      default:
        return Bell;
    }
  };

  // Obtenir la couleur du badge en fonction du type
  const getNotificationTypeColor = () => {
    if (!notification) return "bg-gray-100 text-gray-800";
    
    switch (notification.notification_type) {
      case "match_update":
        return "bg-blue-100 text-blue-800";
      case "fighter_update":
        return "bg-green-100 text-green-800";
      case "competition_update":
        return "bg-purple-100 text-purple-800";
      case "achievement":
        return "bg-yellow-100 text-yellow-800";
      case "message":
        return "bg-indigo-100 text-indigo-800";
      case "system_notification":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obtenir la couleur du badge de priorité
  const getPriorityColor = () => {
    if (!notification) return "bg-gray-100 text-gray-800";
    
    switch (notification.priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Vérifier si la notification est expirée
  const isExpired = notification?.expires_at && new Date(notification.expires_at) < new Date();

  // Statistiques pour la notification
  const getNotificationStats = () => {
    if (!notification) return [];

    const stats = [
      {
        label: "Type",
        value: notification.notification_type.replace("_", " "),
        icon: getNotificationIcon(),
        color: getNotificationTypeColor().split(" ")[0],
        description: "Type de notification",
      },
      {
        label: "Priorité",
        value: notification.priority,
        icon: notification.priority === "high" ? AlertTriangle : Info,
        color: notification.priority === "high" ? "text-red-600" : 
               notification.priority === "medium" ? "text-orange-600" : "text-gray-600",
        description: "Niveau de priorité",
      },
      {
        label: "Statut",
        value: isRead ? "Lue" : "Non lue",
        icon: isRead ? Eye : EyeOff,
        color: isRead ? "text-green-600" : "text-blue-600",
        description: "État de lecture",
      },
    ];

    if (notification.created_at) {
      stats.push({
        label: "Créée",
        value: format(new Date(notification.created_at), "dd/MM/yyyy"),
        icon: Calendar,
        color: "text-purple-600",
        description: "Date de création",
      });
    }

    return stats;
  };

  // Gestionnaires d'actions
  const handleMarkAsRead = async () => {
    if (!notification) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        setIsRead(true);
        toast.success("Notification marquée comme lue");
      } else {
        toast.error("Erreur lors du marquage comme lue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handleEditNotification = () => {
    router.push(`/ad/notifications/${notificationId}/edit`);
  };

  const handleDeleteNotification = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Notification supprimée avec succès");
        router.push("/ad/notifications");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handleOpenActionUrl = () => {
    if (notification?.action_url) {
      window.open(notification.action_url, "_blank");
    }
  };

  const handleCopyDetails = () => {
    if (!notification) return;
    
    const details = `
Titre: ${notification.title}
Message: ${notification.message}
Type: ${notification.notification_type}
Priorité: ${notification.priority}
Statut: ${isRead ? "Lue" : "Non lue"}
${notification.entity_type ? `Entité: ${notification.entity_type}` : ''}
${notification.entity_id ? `ID Entité: ${notification.entity_id}` : ''}
${notification.action_url ? `URL Action: ${notification.action_url}` : ''}
${notification.expires_at ? `Expire le: ${format(new Date(notification.expires_at), "PPP", { locale: fr })}` : ''}
    `.trim();

    navigator.clipboard.writeText(details);
    toast.success("Détails copiés dans le presse-papier");
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

  if (!notification) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Notification non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/notifications")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux notifications
        </Button>
      </div>
    );
  }

  const NotificationIcon = getNotificationIcon();
  const notificationTypeColor = getNotificationTypeColor();
  const priorityColor = getPriorityColor();

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/ad/notifications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated>
              {notification.title}
            </Typography>
            <Typography variant="body-sm" theme="muted">
              {notification.message.substring(0, 100)}...
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRead && (
            <Button variant="outline" onClick={handleMarkAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marquer comme lue
            </Button>
          )}
          <Button variant="outline" onClick={handleEditNotification}>
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDeleteNotification}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {getNotificationStats().map((stat, index) => (
          <CardStats
            key={index}
            label={stat.label}
            icon={stat.icon}
            value={stat.value}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Détails de la notification */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
                <NotificationIcon className={`h-6 w-6 ${isRead ? 'text-gray-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <CardTitle>{notification.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={notificationTypeColor}>
                    {notification.notification_type.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={priorityColor}>
                    {notification.priority}
                  </Badge>
                  <Badge variant={isRead ? "secondary" : "default"}>
                    {isRead ? "Lue" : "Non lue"}
                  </Badge>
                  {isExpired && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Expirée
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Message */}
            <div>
              <Typography variant="h6" weight="medium" className="mb-2">
                Message
              </Typography>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Typography variant="body-base" className="whitespace-pre-line">
                  {notification.message}
                </Typography>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Typography variant="h6" weight="medium">
                  Informations
                </Typography>
                
                {notification.user && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Destinataire
                    </Typography>
                    <Typography variant="body-base">
                      {notification.user.username}
                      {notification.user.first_name && ` (${notification.user.first_name} ${notification.user.last_name})`}
                    </Typography>
                  </div>
                )}

                {notification.entity_type && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Type d'entité
                    </Typography>
                    <Badge variant="outline">
                      {notification.entity_type}
                    </Badge>
                  </div>
                )}

                {notification.entity_id && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      ID de l'entité
                    </Typography>
                    <Typography variant="body-base">
                      #{notification.entity_id}
                    </Typography>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Typography variant="h6" weight="medium">
                  Dates
                </Typography>
                
                {notification.created_at && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Créée le
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-base">
                        {format(new Date(notification.created_at), "PPP 'à' p", {
                          locale: fr,
                        })}
                      </Typography>
                    </div>
                  </div>
                )}

                {notification.expires_at && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      {isExpired ? "A expiré le" : "Expire le"}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <Typography variant="body-base" className={isExpired ? 'text-red-600' : ''}>
                        {format(new Date(notification.expires_at), "PPP 'à' p", {
                          locale: fr,
                        })}
                      </Typography>
                    </div>
                  </div>
                )}

                {notification.updated_at && notification.updated_at !== notification.created_at && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Modifiée le
                    </Typography>
                    <Typography variant="body-base">
                      {format(new Date(notification.updated_at), "PPP 'à' p", {
                        locale: fr,
                      })}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* URL d'action */}
            {notification.action_url && (
              <div>
                <Typography variant="h6" weight="medium" className="mb-2">
                  Action
                </Typography>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Typography variant="body-sm" theme="muted" className="mb-2">
                    URL de redirection
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="body-base" className="font-mono text-sm break-all flex-1">
                      {notification.action_url}
                    </Typography>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenActionUrl}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isRead && (
              <Button
                className="w-full justify-start"
                onClick={handleMarkAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Marquer comme lue
              </Button>
            )}

            {notification.action_url && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenActionUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le lien
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyDetails}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier les détails
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEditNotification}
            >
              Modifier la notification
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleDeleteNotification}
            >
              Supprimer la notification
            </Button>

            {/* Utilisateur */}
            {notification.user && (
              <div className="pt-4 border-t">
                <Typography variant="body-sm" theme="muted" className="mb-2">
                  Destinataire
                </Typography>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <Typography variant="body-base" weight="medium">
                      {notification.user.username}
                    </Typography>
                    {notification.user.first_name && (
                      <Typography variant="body-sm" theme="muted">
                        {notification.user.first_name} {notification.user.last_name}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}