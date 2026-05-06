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
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BaseCardProps } from "./entity-cards";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function NotificationCard({
  item: notification,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Notification>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;
  const [isRead, setIsRead] = useState(notification.is_read);

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(notification);
    else if (activeAction === "edit" && onEdit) onEdit(notification);
    else if (activeAction === "delete" && onDelete) onDelete(notification);
    else if (onView) onView(notification);
  };

  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case "match_update": return Swords;
      case "fighter_update": return User;
      case "competition_update": return Trophy;
      case "achievement": return Trophy;
      case "message": return MessageSquare;
      case "system_notification": return isRead ? Bell : BellRing;
      default: return Bell;
    }
  };

  const getNotificationTypeColor = () => {
    switch (notification.notification_type) {
      case "match_update": return "bg-blue-100 text-blue-800";
      case "fighter_update": return "bg-green-100 text-green-800";
      case "competition_update": return "bg-purple-100 text-purple-800";
      case "achievement": return "bg-yellow-100 text-yellow-800";
      case "message": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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

  const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
  const NotificationIcon = getNotificationIcon();
  const hasActions = onEdit || onView || onDelete;

  const getStatusBorder = (status?: string) => {
    if (!isRead) return "border-l-4 border-l-blue-500";
    switch (status) {
      case "success": return "border-l-4 border-l-green-500";
      case "warning": return "border-l-4 border-l-yellow-500";
      case "error": return "border-l-4 border-l-red-500";
      case "info": return "border-l-4 border-l-blue-500";
      default: return "";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status),
        !isRead && "bg-blue-50/30",
        isExpired && "opacity-60",
        className
      )}
      onClick={handleMainAction}
    >
      <div className={cn("p-3 flex w-full gap-3", isListView ? "flex-row items-center" : "flex-col")}>
        {/* Header Area */}
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
            isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            <NotificationIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography variant={isCompact ? "body-sm" : "body-lg"} weight={isRead ? "medium" : "bold"} className="truncate group-hover:text-primary transition-colors">
                {notification.title}
              </Typography>
              {!isListView && hasActions && (
                <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <CardActionMenu onEdit={() => onEdit?.(notification)} onView={() => onView?.(notification)} onDelete={() => onDelete?.(notification)} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Typography variant="caption2" theme="muted" className="truncate">
                {formatDate(notification.created_at)}
              </Typography>
              {!isRead && (
                <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-blue-500">Nouveau</Badge>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div className="flex-shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
              <CardActionMenu onEdit={() => onEdit?.(notification)} onView={() => onView?.(notification)} onDelete={() => onDelete?.(notification)} />
            </div>
          )}
        </div>

        {/* Content Area */}
        {!isCompact && (
          <div className={cn("space-y-2", isListView && "flex-1 px-4 border-l border-r border-border/50 mx-4")}>
            <Typography variant="caption1" className={cn("line-clamp-2", isRead ? "text-muted-foreground" : "text-foreground")}>
              {notification.message}
            </Typography>

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className={cn("text-[9px] h-4", getNotificationTypeColor())}>
                {notification.notification_type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={cn("text-[9px] h-4", getPriorityColor())}>
                {notification.priority}
              </Badge>
              {notification.user && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                  <User className="h-3 w-3" />
                  <span>{notification.user.username}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CardActionMenu({ onEdit, onView, onDelete }: { onEdit?: () => void, onView?: () => void, onDelete?: () => void }) {
  if (!onEdit && !onView && !onDelete) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/20 text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" /> Voir
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Modifier
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
