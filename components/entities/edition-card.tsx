import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CompetitionEdition } from "@/types";
import {
  Calendar,
  Users,
  Award,
  MapPin,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BaseCardProps } from "./entity-cards";

export function EditionCard({
  item: edition,
  viewMode = "grid",
  status: propStatus,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<CompetitionEdition>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const getEditionStatus = () => {
    if (!edition.start_date || !edition.end_date) return "upcoming";

    const now = new Date();
    const start = new Date(edition.start_date);
    const end = new Date(edition.end_date);

    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";
    return "upcoming";
  };

  const getStatusConfig = (status: string) => {
    const config = {
      upcoming: {
        label: "À venir",
        variant: "secondary" as const,
        color: "border-l-blue-500",
        bg: "bg-blue-50",
      },
      ongoing: {
        label: "En cours",
        variant: "default" as const,
        color: "border-l-green-500",
        bg: "bg-green-50",
      },
      completed: {
        label: "Terminée",
        variant: "outline" as const,
        color: "border-l-gray-500",
        bg: "bg-gray-50",
      },
    };
    return config[status as keyof typeof config] || config.upcoming;
  };

  const currentStatus = getEditionStatus();
  const config = getStatusConfig(currentStatus);

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(edition);
    else if (activeAction === "edit" && onEdit) onEdit(edition);
    else if (activeAction === "delete" && onDelete) onDelete(edition);
    else if (onView) onView(edition);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden border-l-4",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        config.color,
        className,
      )}
      onClick={handleMainAction}
    >
      <div
        className={cn(
          "p-3 flex w-full gap-3",
          isListView ? "flex-row items-center" : "flex-col",
        )}
      >
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm",
              currentStatus === "ongoing"
                ? "bg-green-500"
                : currentStatus === "completed"
                  ? "bg-gray-500"
                  : "bg-blue-500",
            )}
          >
            <Calendar className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h5"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                Édition {edition.edition_number} - {edition.year}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(edition)}
                    onView={() => onView?.(edition)}
                    onDelete={() => onDelete?.(edition)}
                  />
                </div>
              )}
            </div>
            {edition.theme && (
              <Typography
                variant="caption2"
                theme="muted"
                className="italic truncate"
              >
                "{edition.theme}"
              </Typography>
            )}
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(edition)}
                onView={() => onView?.(edition)}
                onDelete={() => onDelete?.(edition)}
              />
            </div>
          )}
        </div>

        {!isCompact && (
          <div
            className={cn(
              "space-y-2",
              isListView &&
                "flex-1 px-4 border-l border-r border-border/50 mx-4",
            )}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant={config.variant} className="text-[10px] h-5">
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                <Users className="h-3 w-3 mr-1" /> {edition.total_participants}{" "}
                part.
              </Badge>
            </div>

            {edition.winner_fighter && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-green-600 truncate">
                <Award className="h-3 w-3" /> Vainqueur:{" "}
                {edition.winner_fighter.first_name}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function CardActionMenu({
  onEdit,
  onView,
  onDelete,
}: {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary/20 text-primary"
        >
          <MoreHorizontal className="h-4 w-4 bg-primary/20 text-primary" />
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
