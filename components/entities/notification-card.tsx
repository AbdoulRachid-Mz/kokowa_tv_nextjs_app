import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Notification } from "@/types";
import {
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
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NotificationCardProps {
  notification: Notification;
  viewMode: "grid" | "list";
  onView?: (notification: Notification) => void;
  onMarkAsRead?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
  onAction?: (notification: Notification) => void;
}

export function NotificationCard({
  notification,
  viewMode,
  onView,
  onMarkAsRead,
  onDelete,
  onAction,
}: NotificationCardProps) {
  const isListView = viewMode === "list";
  const [isRead, setIsRead] = useState(notification.is_read);

  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = () => {
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

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString();
  };

  // Vérifier si la notification est expirée
  const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();

  const NotificationIcon = getNotificationIcon();
  const notificationTypeColor = getNotificationTypeColor();
  const priorityColor = getPriorityColor();

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRead) {
      setIsRead(true);
      onMarkAsRead?.(notification);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.action_url) {
      if (onAction) {
        onAction(notification);
      } else {
        window.open(notification.action_url, "_blank");
      }
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex",
        !isRead && "border-l-4 border-l-blue-500 bg-blue-50/50",
        isExpired && "opacity-60"
      )}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Icône */}
        <div className={cn("flex-shrink-0", isListView && "mb-0")}>
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              isRead
                ? "bg-gray-100 text-gray-600"
                : "bg-blue-100 text-blue-600"
            )}
          >
            <NotificationIcon className="h-6 w-6" />
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-3")}>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <Typography
                  variant="h6"
                  weight={isRead ? "regular" : "bold"}
                  className={cn(
                    "group-hover:text-primary transition-colors line-clamp-1",
                    isRead && "text-muted-foreground"
                  )}
                >
                  {notification.title}
                </Typography>
                
                {notification.created_at && (
                  <Typography
                    variant="caption2"
                    theme="muted"
                    className="whitespace-nowrap ml-2"
                  >
                    {formatDate(notification.created_at)}
                  </Typography>
                )}
              </div>

              <Typography
                variant="body-sm"
                className={cn(
                  "mt-1 line-clamp-2",
                  isRead && "text-muted-foreground"
                )}
              >
                {notification.message}
              </Typography>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={notificationTypeColor}>
                  {notification.notification_type.replace("_", " ")}
                </Badge>

                <Badge variant="outline" className={priorityColor}>
                  {notification.priority}
                </Badge>

                {notification.entity_type && (
                  <Badge variant="outline">
                    {notification.entity_type}
                  </Badge>
                )}

                {!isRead && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Nouveau
                  </Badge>
                )}

                {isExpired && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Expirée
                  </Badge>
                )}

                {notification.expires_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(notification.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Informations de l'utilisateur (grid seulement) */}
              {!isListView && notification.user && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{notification.user.username}</span>
                </div>
              )}
            </div>

            {isListView && notification.user && (
              <div className="text-right">
                <Typography variant="body-sm" theme="muted">
                  {notification.user.username}
                </Typography>
                {notification.user.first_name && (
                  <Typography variant="caption2" theme="muted">
                    {notification.user.first_name} {notification.user.last_name}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
            {!isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                title="Marquer comme lue"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}

            {notification.action_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                title="Ouvrir le lien"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(notification);
              }}
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}