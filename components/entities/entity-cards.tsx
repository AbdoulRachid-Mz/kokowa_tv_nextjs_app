// components/entities/entity-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Fighter,
  Region,
  Competition,
  CompetitionEdition,
  Referee,
  Coach,
  FighterTransfer,
  SubGroup,
  User,
  Advertisement,
  Phase,
  PhaseGroup,
  TeamMember,
} from "@/types";
import {
  MapPin,
  Trophy,
  Users,
  Calendar,
  Shield,
  Award,
  User as UserIcon,
  Star,
  Swords,
  Clock,
  Edit,
  Eye,
  ArrowRight,
  DollarSign,
  Phone,
  Mail,
  Pencil,
  MousePointer,
  TrendingUp,
  CodeIcon,
  VideoIcon,
  ImageIcon,
  Building,
  MoreHorizontal,
  Trash2,
  Folder,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "../ui/progress";
import {
  DynamicActionMenu,
  MenuItemAction,
} from "../shared/dynamic-action-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Common Card Props Pattern
export interface BaseCardProps<T> {
  item: T; // ← CHANGER de 'item' générique
  viewMode?: "grid" | "list" | "compact";
  status?: "default" | "success" | "warning" | "error" | "info" | string;
  isCliquable?: boolean;
  isMini?: boolean;
  activeAction?: "view" | "edit" | "delete";
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;
  className?: string;
}

const getStatusBorder = (status?: string) => {
  switch (status) {
    case "success":
      return "border-l-4 border-l-green-500";
    case "warning":
      return "border-l-4 border-l-yellow-500";
    case "error":
      return "border-l-4 border-l-red-500";
    case "info":
      return "border-l-4 border-l-blue-500";
    case "default":
      return "border-l-4 border-l-gray-300";
    default:
      return status?.startsWith("#") ? "border-l-4" : "";
  }
};

// Carte pour les Lutteurs
export function FighterCard({
  item: fighter,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Fighter>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(fighter);
    else if (activeAction === "edit" && onEdit) onEdit(fighter);
    else if (activeAction === "delete" && onDelete) onDelete(fighter);
    else if (onView) onView(fighter);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status),
        className,
      )}
      style={status?.startsWith("#") ? { borderLeftColor: status } : {}}
      onClick={handleMainAction}
    >
      <div
        className={cn(
          "p-3 flex w-full gap-3",
          isListView ? "flex-row items-center" : "flex-col",
        )}
      >
        {/* Header/Avatar Area */}
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div className="relative flex-shrink-0">
            {fighter.profile_image ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <Image
                  src={fighter.profile_image}
                  alt={fighter.first_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {fighter.first_name[0]}
                {fighter.last_name[0]}
              </div>
            )}
            {fighter.is_champion && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {fighter.first_name} {fighter.last_name}
              </Typography>

              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(fighter)}
                    onView={() => onView?.(fighter)}
                    onDelete={() => onDelete?.(fighter)}
                  />
                </div>
              )}
            </div>
            {fighter.nickname && (
              <Typography
                variant="caption2"
                theme="muted"
                className="italic truncate"
              >
                "{fighter.nickname}"
              </Typography>
            )}
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(fighter)}
                onView={() => onView?.(fighter)}
                onDelete={() => onDelete?.(fighter)}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        {!isCompact && (
          <div
            className={cn(
              "space-y-2",
              isListView &&
              "flex-1 px-4 border-l border-r border-border/50 mx-4",
            )}
          >
            <div className="flex flex-wrap gap-2">
              {fighter.region && (
                <Badge variant="outline" className="text-[10px] h-5">
                  <MapPin className="h-3 w-3 mr-1" /> {fighter.region.name}
                </Badge>
              )}
              <Badge
                variant={fighter.is_active ? "default" : "secondary"}
                className="text-[10px] h-5"
              >
                {fighter.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Classement</span>
                <span className="font-bold text-primary">
                  #{fighter.ranking}
                </span>
              </div>
              {fighter.debut_year && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Début</span>
                  <span>{fighter.debut_year}</span>
                </div>
              )}
            </div>
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
  extraActions = [],
}: {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  extraActions?: {
    id: string;
    label: string;
    icon: any;
    onClick: () => void;
    className?: string;
  }[];
}) {
  if (!onEdit && !onView && !onDelete && extraActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary/20 text-primary"
        >
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
        {extraActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={action.onClick}
            className={action.className}
          >
            <action.icon className="h-4 w-4 mr-2" /> {action.label}
          </DropdownMenuItem>
        ))}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Carte pour les Sous-Groupes (Rencontres)
export function SubGroupCard({
  item: subGroup, // ← CHANGER de 'subGroup' à 'item'
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onManageMatches,
  className,
}: BaseCardProps<SubGroup> & { onManageMatches?: (item: SubGroup) => void }) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(subGroup);
    else if (activeAction === "edit" && onEdit) onEdit(subGroup);
    else if (activeAction === "delete" && onDelete) onDelete(subGroup);
    else if (onView) onView(subGroup);
  };

  const hasActions = onEdit || onView || onDelete || onManageMatches;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(
          status || (subGroup.is_completed ? "success" : "warning"),
        ),
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
              subGroup.is_completed ? "bg-green-500" : "bg-orange-500",
            )}
          >
            <Layers className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {subGroup.name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(subGroup)}
                    onView={() => onView?.(subGroup)}
                    onDelete={() => onDelete?.(subGroup)}
                    extraActions={
                      onManageMatches
                        ? [
                          {
                            id: "matches",
                            label: "Matchs",
                            icon: Swords,
                            onClick: () => onManageMatches(subGroup),
                          },
                        ]
                        : []
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={subGroup.is_completed ? "default" : "secondary"}
                className="text-[9px] h-4 px-1"
              >
                {subGroup.is_completed ? "Terminé" : "En cours"}
              </Badge>
              {subGroup.matches_count !== undefined && (
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {subGroup.matches_count} match(s)
                </Badge>
              )}
              {subGroup.period && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1 capitalize"
                >
                  {subGroup.period}
                </Badge>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(subGroup)}
                onView={() => onView?.(subGroup)}
                onDelete={() => onDelete?.(subGroup)}
                extraActions={
                  onManageMatches
                    ? [
                      {
                        id: "matches",
                        label: "Matchs",
                        icon: Swords,
                        onClick: () => onManageMatches(subGroup),
                      },
                    ]
                    : []
                }
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Ordre: {subGroup.sub_group_order}</span>
              </div>
              {(subGroup.belt_region1 || subGroup.belt_region2) && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span>Ceintures en jeu</span>
                </div>
              )}
            </div>
            {subGroup.description && (
              <Typography
                variant="caption1"
                theme="muted"
                className="line-clamp-2 italic"
              >
                {subGroup.description}
              </Typography>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Carte pour les Groupes de Phase
export function PhaseGroupCard({
  item: group,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<PhaseGroup>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(group);
    else if (activeAction === "edit" && onEdit) onEdit(group);
    else if (activeAction === "delete" && onDelete) onDelete(group);
    else if (onView) onView(group);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status || (group.is_completed ? "success" : "warning")),
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
              group.is_completed ? "bg-green-500" : "bg-blue-500",
            )}
          >
            <Folder className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {group.name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(group)}
                    onView={() => onView?.(group)}
                    onDelete={() => onDelete?.(group)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={group.is_completed ? "default" : "secondary"}
                className="text-[9px] h-4 px-1"
              >
                {group.is_completed ? "Terminé" : "En cours"}
              </Badge>
              {group.sub_groups_count !== undefined && (
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {group.sub_groups_count} rencontre(s)
                </Badge>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(group)}
                onView={() => onView?.(group)}
                onDelete={() => onDelete?.(group)}
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {group.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Date: {new Date(group.date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Ordre: {group.group_order}</span>
              </div>
            </div>
            {group.description && (
              <Typography
                variant="caption1"
                theme="muted"
                className="line-clamp-2 italic"
              >
                {group.description}
              </Typography>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Reusable Action Menu for Cards
// Carte pour les Phases
export function PhaseCard({
  item: phase,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Phase>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(phase);
    else if (activeAction === "edit" && onEdit) onEdit(phase);
    else if (activeAction === "delete" && onDelete) onDelete(phase);
    else if (onView) onView(phase);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status || (phase.is_completed ? "success" : "warning")),
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
              phase.is_completed ? "bg-green-500" : "bg-orange-500",
            )}
          >
            <Trophy className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {phase.name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(phase)}
                    onView={() => onView?.(phase)}
                    onDelete={() => onDelete?.(phase)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={phase.is_completed ? "default" : "secondary"}
                className="text-[9px] h-4 px-1"
              >
                {phase.is_completed ? "Terminée" : "En cours"}
              </Badge>
              <Typography
                variant="caption2"
                theme="muted"
                className="truncate font-mono"
              >
                {phase.phase_type}
              </Typography>
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(phase)}
                onView={() => onView?.(phase)}
                onDelete={() => onDelete?.(phase)}
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {phase.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Début: {new Date(phase.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Ordre: {phase.phase_order}</span>
              </div>
            </div>
            {phase.description && (
              <Typography
                variant="caption1"
                theme="muted"
                className="line-clamp-2 italic"
              >
                {phase.description}
              </Typography>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Carte pour les Régions
export function RegionCard({
  item: region,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Region>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(region);
    else if (activeAction === "edit" && onEdit) onEdit(region);
    else if (activeAction === "delete" && onDelete) onDelete(region);
    else if (onView) onView(region);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status || region.color),
        className,
      )}
      style={
        status?.startsWith("#")
          ? { borderLeftColor: status }
          : region.color
            ? { borderLeftColor: region.color }
            : {}
      }
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
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            style={{ backgroundColor: region.color || "#3b82f6" }}
          >
            <MapPin className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {region.name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(region)}
                    onView={() => onView?.(region)}
                    onDelete={() => onDelete?.(region)}
                  />
                </div>
              )}
            </div>
            <Typography
              variant="caption2"
              theme="muted"
              className="truncate font-mono"
            >
              CODE: {region.code}
            </Typography>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(region)}
                onView={() => onView?.(region)}
                onDelete={() => onDelete?.(region)}
              />
            </div>
          )}
        </div>

        {!isCompact && (
          <div
            className={cn(
              "grid grid-cols-2 gap-2",
              isListView &&
              "flex-1 px-4 border-l border-r border-border/50 mx-4",
            )}
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                Lutteurs
              </span>
              <span className="text-sm font-bold">
                {region.total_fighters || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                Champions
              </span>
              <span className="text-sm font-bold text-yellow-600">
                {region.total_champions || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Carte pour les Compétitions
export function CompetitionCard({
  item: competition,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Competition>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(competition);
    else if (activeAction === "edit" && onEdit) onEdit(competition);
    else if (activeAction === "delete" && onDelete) onDelete(competition);
    else if (onView) onView(competition);
  };

  const hasActions = onEdit || onView || onDelete;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(
          status || (competition.status === "ongoing" ? "success" : "default"),
        ),
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Trophy className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {competition.name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(competition)}
                    onView={() => onView?.(competition)}
                    onDelete={() => onDelete?.(competition)}
                  />
                </div>
              )}
            </div>
            <Badge
              className={cn(
                "text-[9px] h-4 px-1.5",
                getStatusColor(competition.status),
              )}
            >
              {competition.status}
            </Badge>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(competition)}
                onView={() => onView?.(competition)}
                onDelete={() => onDelete?.(competition)}
              />
            </div>
          )}
        </div>

        {!isCompact && competition.description && (
          <div
            className={cn(
              "space-y-1",
              isListView &&
              "flex-1 px-4 border-l border-r border-border/50 mx-4",
            )}
          >
            <Typography
              variant="caption1"
              theme="muted"
              className="line-clamp-2"
            >
              {competition.description}
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
}

// Carte pour les Arbitres
export function RefereeCard({
  item: referee,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Referee>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(referee);
    else if (activeAction === "edit" && onEdit) onEdit(referee);
    else if (activeAction === "delete" && onDelete) onDelete(referee);
    else if (onView) onView(referee);
  };

  const hasActions = onEdit || onView || onDelete;

  const getCertificationColor = (level?: string) => {
    switch (level) {
      case "international":
        return "bg-purple-100 text-purple-800";
      case "national":
        return "bg-blue-100 text-blue-800";
      case "regional":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status),
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
          <div className="relative flex-shrink-0">
            {referee.profile_image ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border shadow-sm">
                <Image
                  src={referee.profile_image}
                  alt={referee.first_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold border">
                {referee.first_name[0]}
                {referee.last_name[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {referee.first_name} {referee.last_name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(referee)}
                    onView={() => onView?.(referee)}
                    onDelete={() => onDelete?.(referee)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-[9px] h-4 px-1.5",
                  getCertificationColor(referee.certification_level),
                )}
              >
                {referee.certification_level || "Certifié"}
              </Badge>
              {referee.license_number && (
                <Typography
                  variant="caption2"
                  theme="muted"
                  className="font-mono"
                >
                  #{referee.license_number}
                </Typography>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(referee)}
                onView={() => onView?.(referee)}
                onDelete={() => onDelete?.(referee)}
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
              {referee.region && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{referee.region.name}</span>
                </div>
              )}
              {referee.experience_years && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{referee.experience_years} ans exp.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export const CoachCard = ({
  item: coach, // ← CHANGER de 'coach' à 'item'
  viewMode = "grid",
  onEdit,
  onView,
  onDelete,
  isCliquable = true,
}: BaseCardProps<Coach>) => {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact";

  const actions: MenuItemAction[] = [];
  if (onView)
    actions.push({
      id: "view",
      label: "Voir",
      icon: Eye,
      onClick: () => onView(coach),
    });
  if (onEdit)
    actions.push({
      id: "edit",
      label: "Modifier",
      icon: Pencil,
      onClick: () => onEdit(coach),
    });
  if (onDelete)
    actions.push({
      id: "delete",
      label: "Supprimer",
      icon: Trash2,
      onClick: () => onDelete(coach),
      className: "text-red-500",
    });

  if (isListView || isCompact) {
    return (
      <Card
        className={cn(
          "hover:shadow-lg transition-shadow group relative cursor-pointer active:scale-[0.98]",
          isCompact ? "p-1" : "p-2",
        )}
        onClick={() => isCliquable && onView?.(coach)}
      >
        <div className="absolute top-2 right-2 z-10">
          {actions.length > 0 && (
            <DynamicActionMenu
              variant="inline"
              actions={actions}
              menuTitle="Actions"
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:bg-muted",
                  isCompact ? "h-6 w-6" : "h-8 w-8",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal
                  className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")}
                />
              </Button>
            </DynamicActionMenu>
          )}
        </div>
        <CardContent className={isCompact ? "p-1" : "p-2"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "relative rounded-full overflow-hidden flex-shrink-0",
                  isCompact ? "w-8 h-8" : "w-12 h-12",
                )}
              >
                <Image
                  src={coach.profile_image || "/placeholder-profile.jpg"}
                  alt={`${coach.first_name} ${coach.last_name}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <Typography
                  variant={isCompact ? "body-sm" : "h4"}
                  weight="medium"
                  className="pr-8 truncate"
                >
                  {coach.first_name} {coach.last_name}
                </Typography>
                {!isCompact && coach.nickname && (
                  <Typography variant="body-sm" theme="muted">
                    "{coach.nickname}"
                  </Typography>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  {coach.region && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="truncate max-w-[100px]"
                      >
                        {coach.region.name}
                      </Typography>
                    </div>
                  )}
                  {!isCompact && coach.certification_level && (
                    <Badge variant="secondary" className="text-xs">
                      {coach.certification_level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isCompact && coach.experience_years && (
              <div className="flex items-center space-x-2 mr-6">
                <div className="text-right">
                  <Typography variant="body-sm" weight="medium">
                    {coach.experience_years} ans
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    d'expérience
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue grid
  return (
    <Card
      className="hover:shadow-lg transition-shadow group relative cursor-pointer active:scale-[0.98]"
      onClick={() => isCliquable && onView?.(coach)}
    >
      <div className="absolute top-2 right-2 z-10">
        {actions.length > 0 && (
          <DynamicActionMenu
            variant="inline"
            actions={actions}
            menuTitle="Actions"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DynamicActionMenu>
        )}
      </div>
      <CardHeader className="p-2 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={coach.profile_image || "/placeholder-profile.jpg"}
                alt={`${coach.first_name} ${coach.last_name}`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-lg pr-8">
                {coach.first_name} {coach.last_name}
              </CardTitle>
              {coach.nickname && (
                <Typography variant="body-sm" theme="muted">
                  "{coach.nickname}"
                </Typography>
              )}
            </div>
          </div>
          <Badge
            variant={coach.is_active ? "default" : "outline"}
            className="mr-6"
          >
            {coach.is_active ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-2">
        <div className="space-y-2">
          {coach.region && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">{coach.region.name}</Typography>
            </div>
          )}
          {coach.certification_level && (
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">
                {coach.certification_level}
              </Typography>
            </div>
          )}
          {coach.experience_years && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">
                {coach.experience_years} ans d'expérience
              </Typography>
            </div>
          )}
          {coach.specialties && (
            <Typography
              variant="body-sm"
              theme="muted"
              className="line-clamp-2"
            >
              {coach.specialties}
            </Typography>
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Typography variant="body-sm" theme="muted">
            Licence: {coach.license_number}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
};

export const TransferCard = ({
  item: transfer, // ← CHANGER de 'transfer' à 'item'
  viewMode = "grid",
  onEdit,
  onView,
  onDelete,
  isCliquable = true,
}: BaseCardProps<FighterTransfer>) => {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact";

  const actions: MenuItemAction[] = [];
  if (onView)
    actions.push({
      id: "view",
      label: "Voir",
      icon: Eye,
      onClick: () => onView(transfer),
    });
  if (onEdit)
    actions.push({
      id: "edit",
      label: "Modifier",
      icon: Pencil,
      onClick: () => onEdit(transfer),
    });
  if (onDelete)
    actions.push({
      id: "delete",
      label: "Supprimer",
      icon: Trash2,
      onClick: () => onDelete(transfer),
      className: "text-red-500",
    });
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isListView || isCompact) {
    return (
      <Card
        className={cn(
          "hover:shadow-lg transition-shadow relative overflow-hidden",
          isCompact ? "p-1" : "p-2",
        )}
        onClick={() => isCliquable && onView?.(transfer)}
      >
        <CardContent className={isCompact ? "p-1" : "p-2"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Lutteur */}
              {transfer.fighter && (
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={cn(
                      "relative rounded-full overflow-hidden flex-shrink-0",
                      isCompact ? "w-8 h-8" : "w-10 h-10",
                    )}
                  >
                    <Image
                      src={
                        transfer.fighter.profile_image ||
                        "/placeholder-profile.jpg"
                      }
                      alt={`${transfer.fighter.first_name} ${transfer.fighter.last_name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {!isCompact && (
                    <div className="min-w-0 flex-1">
                      <Typography
                        variant="h4"
                        weight="medium"
                        className="truncate"
                      >
                        {transfer.fighter.first_name}{" "}
                        {transfer.fighter.last_name}
                      </Typography>
                      {transfer.fighter.nickname && (
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="truncate"
                        >
                          "{transfer.fighter.nickname}"
                        </Typography>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Transfert */}
              <div className="flex items-center space-x-2 mx-2 truncate min-w-0">
                {transfer.from_region && (
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="truncate"
                  >
                    {transfer.from_region.name}
                  </Typography>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                {transfer.to_region && (
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="truncate"
                  >
                    {transfer.to_region.name}
                  </Typography>
                )}
              </div>

              {/* Informations supplémentaires */}
              {!isCompact && (
                <div className="flex items-center space-x-6 text-sm text-muted-foreground ml-auto">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(transfer.transfer_date).toLocaleDateString()}
                    </span>
                  </div>
                  {transfer.transfer_fee && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{transfer.transfer_fee.toLocaleString()} FCFA</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Badge
                variant={getStatusVariant(transfer.status)}
                className={cn("capitalize", isCompact && "text-[9px] px-1 h-4")}
              >
                {transfer.status}
              </Badge>
              <div className="relative">
                {actions.length > 0 && (
                  <DynamicActionMenu
                    variant="inline"
                    actions={actions}
                    menuTitle="Actions"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full hover:bg-muted",
                        isCompact ? "h-6 w-6" : "h-8 w-8",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal
                        className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")}
                      />
                    </Button>
                  </DynamicActionMenu>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue grid
  return (
    <Card className="hover:shadow-lg transition-shadow h-full relative">
      <div className="absolute top-2 right-2 z-10">
        {actions.length > 0 && (
          <DynamicActionMenu
            variant="inline"
            actions={actions}
            menuTitle="Actions"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DynamicActionMenu>
        )}
      </div>
      <CardHeader className="p-2 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            {transfer.fighter && (
              <>
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={
                      transfer.fighter.profile_image ||
                      "/placeholder-profile.jpg"
                    }
                    alt={`${transfer.fighter.first_name} ${transfer.fighter.last_name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <CardTitle className="text-base pr-8">
                    {transfer.fighter.first_name} {transfer.fighter.last_name}
                  </CardTitle>
                  {transfer.fighter.nickname && (
                    <Typography variant="body-sm" theme="muted">
                      "{transfer.fighter.nickname}"
                    </Typography>
                  )}
                </div>
              </>
            )}
          </div>
          <Badge
            variant={getStatusVariant(transfer.status)}
            className="capitalize mr-6"
          >
            {transfer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-2">
        <div className="space-y-3">
          {/* Transfert */}
          <div className="flex items-center justify-center space-x-3 py-2">
            {transfer.from_region && (
              <div className="text-center">
                <Typography variant="body-sm" weight="medium">
                  {transfer.from_region.name}
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Origine
                </Typography>
              </div>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            {transfer.to_region && (
              <div className="text-center">
                <Typography variant="body-sm" weight="medium">
                  {transfer.to_region.name}
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Destination
                </Typography>
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span>
                {new Date(transfer.transfer_date).toLocaleDateString()}
              </span>
            </div>

            {transfer.transfer_fee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frais:</span>
                <span className="font-medium">
                  {transfer.transfer_fee.toLocaleString()} FCFA
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span>{transfer.is_permanent ? "Permanent" : "Temporaire"}</span>
            </div>
          </div>

          {transfer.transfer_reason && (
            <Typography
              variant="body-sm"
              theme="muted"
              className="line-clamp-2 border-t pt-2"
            >
              {transfer.transfer_reason}
            </Typography>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <Typography variant="body-base" theme="muted">
            {new Date(transfer.created_at).toLocaleDateString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
};

interface UserCardProps {
  user: User;
  viewMode: "grid" | "list" | "compact";
  onEdit?: (user: User) => void;
  onView?: (user: User) => void;
  onDelete?: (user: User) => void;
  isCliquable?: boolean;
}

export function UserCard({
  user,
  viewMode,
  onEdit,
  onView,
  onDelete,
  isCliquable = true,
}: UserCardProps) {
  const isListView = viewMode === "list";

  const actions: MenuItemAction[] = [];
  if (onView)
    actions.push({
      id: "view",
      label: "Voir",
      icon: Eye,
      onClick: () => onView(user),
    });
  if (onEdit)
    actions.push({
      id: "edit",
      label: "Modifier",
      icon: Pencil,
      onClick: () => onEdit(user),
    });
  if (onDelete)
    actions.push({
      id: "delete",
      label: "Supprimer",
      icon: Trash2,
      onClick: () => onDelete(user),
      className: "text-red-500",
    });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrateur", color: "bg-red-100 text-red-800" },
      editor: { label: "Éditeur", color: "bg-blue-100 text-blue-800" },
      moderator: { label: "Modérateur", color: "bg-green-100 text-green-800" },
      fighter_manager: {
        label: "Manager Lutteurs",
        color: "bg-purple-100 text-purple-800",
      },
      user: { label: "Utilisateur", color: "bg-gray-100 text-gray-800" },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return config;
  };

  const roleConfig = getRoleBadge(user.role);

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 group relative",
        isListView && "flex",
        isCliquable && "cursor-pointer active:scale-[0.98]",
      )}
      onClick={() => isCliquable && onView?.(user)}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Avatar */}
        <div className={cn("flex-shrink-0 mb-2", isListView && "mb-0")}>
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            {user.profile_picture ? (
              <Image
                src={user.profile_picture}
                alt={user.username}
                fill
                className="object-cover"
              />
            ) : (
              <UserIcon className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between",
          )}
        >
          <div className={cn(isListView && "flex items-center gap-3")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {user.username}
              </CardTitle>

              {(user.first_name || user.last_name) && (
                <Typography variant="body-sm" className="text-muted-foreground">
                  {user.first_name} {user.last_name}
                </Typography>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={roleConfig.color}>
                  {roleConfig.label}
                </Badge>

                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Actif" : "Inactif"}
                </Badge>

                {user.is_verified && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Vérifié
                  </Badge>
                )}

                {user.country && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {user.country}
                  </Badge>
                )}
              </div>
            </div>

            {isListView && (
              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 justify-end text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <Typography variant="body-sm">{user.email}</Typography>
                </div>

                {user.phone_number && (
                  <div className="flex items-center gap-1 justify-end text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <Typography variant="body-sm">
                      {user.phone_number}
                    </Typography>
                  </div>
                )}

                {user.last_login && (
                  <Typography variant="caption2" theme="muted">
                    Dernière connexion:{" "}
                    {new Date(user.last_login).toLocaleDateString()}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Informations secondaires (grid seulement) */}
          {!isListView && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <Typography variant="body-sm" className="truncate">
                  {user.email}
                </Typography>
              </div>

              {user.phone_number && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <Typography variant="body-sm">{user.phone_number}</Typography>
                </div>
              )}

              {user.last_login && (
                <div className="text-sm text-muted-foreground">
                  Connecté le {new Date(user.last_login).toLocaleDateString()}
                </div>
              )}

              {user.bio && (
                <Typography
                  variant="body-sm"
                  theme="muted"
                  className="line-clamp-2"
                >
                  {user.bio}
                </Typography>
              )}
            </div>
          )}

          {/* Actions Menu */}
          <div
            className={cn(
              "absolute top-2 right-2 z-10",
              isListView && "relative top-0 right-0",
            )}
          >
            {actions.length > 0 && (
              <DynamicActionMenu
                variant="inline"
                actions={actions}
                menuTitle="Actions"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DynamicActionMenu>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export const AdvertisementCard: React.FC<{
  advertisement: Advertisement;
  viewMode: "grid" | "list" | "compact";
  onEdit?: (ad: Advertisement) => void;
  onView?: (ad: Advertisement) => void;
  onDelete?: (ad: Advertisement) => void;
  isCliquable?: boolean;
}> = ({
  advertisement,
  viewMode,
  onEdit,
  onView,
  onDelete,
  isCliquable = true,
}) => {
    const actions: MenuItemAction[] = [];
    if (onView)
      actions.push({
        id: "view",
        label: "Voir",
        icon: Eye,
        onClick: () => onView(advertisement),
      });
    if (onEdit)
      actions.push({
        id: "edit",
        label: "Modifier",
        icon: Pencil,
        onClick: () => onEdit(advertisement),
      });
    if (onDelete)
      actions.push({
        id: "delete",
        label: "Supprimer",
        icon: Trash2,
        onClick: () => onDelete(advertisement),
        className: "text-red-500",
      });
    const isActive = advertisement.is_active;
    const now = new Date();
    const startDate = advertisement.start_date
      ? new Date(advertisement.start_date)
      : null;
    const endDate = advertisement.end_date
      ? new Date(advertisement.end_date)
      : null;
    const isScheduled = startDate && startDate > now;
    const isExpired = endDate && endDate < now;

    const getStatusBadge = () => {
      if (!isActive)
        return (
          <Badge variant="outline" className="bg-gray-100">
            Inactive
          </Badge>
        );
      if (isExpired)
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Expirée
          </Badge>
        );
      if (isScheduled)
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Planifiée
          </Badge>
        );
      return (
        <Badge variant="default" className="bg-green-600">
          Active
        </Badge>
      );
    };

    const getMediaTypeIcon = () => {
      switch (advertisement.media_type) {
        case "image":
          return <ImageIcon className="h-4 w-4" />;
        case "video":
          return <VideoIcon className="h-4 w-4" />;
        case "html":
          return <CodeIcon className="h-4 w-4" />;
        default:
          return null;
      }
    };

    const formatPosition = (position: string) => {
      const positions: Record<string, string> = {
        header: "En-tête",
        sidebar: "Barre latérale",
        footer: "Pied de page",
        in_content: "Dans le contenu",
        popup: "Pop-up",
        banner_top: "Bannière haut",
        banner_bottom: "Bannière bas",
        mobile_sticky: "Mobile collant",
      };
      return positions[position] || position;
    };

    const effectiveViewMode = viewMode === "compact" ? "list" : viewMode;

    if (effectiveViewMode === "list") {
      return (
        <Card
          className="hover:shadow-md transition-shadow group relative cursor-pointer active:scale-[0.98]"
          onClick={() => isCliquable && onView?.(advertisement)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Media preview */}
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {advertisement.media && advertisement.media_type === "image" ? (
                    <div className="w-full h-full relative">
                      <img
                        src={advertisement.media}
                        alt={advertisement.title}
                        className="w-full h-full absolute object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      {getMediaTypeIcon()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Typography variant="body-base" weight="medium">
                      {advertisement.title}
                    </Typography>
                    {getStatusBadge()}
                  </div>
                  {advertisement.cta_text && (
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-3 line-clamp-2"
                    >
                      {advertisement.cta_text}
                    </Typography>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatPosition(advertisement.position)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Priorité {advertisement.priority}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {advertisement.impression_count} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {advertisement.click_count} clics
                    </span>
                  </div>
                  {advertisement.advertiser_name && (
                    <Typography variant="body-sm" theme="muted" className="mt-1">
                      Annonceur: {advertisement.advertiser_name}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="relative">
                {actions.length > 0 && (
                  <DynamicActionMenu
                    variant="inline"
                    actions={actions}
                    menuTitle="Actions"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DynamicActionMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Mode compact
    if (viewMode === "compact") {
      return (
        <Card
          className="hover:shadow-md transition-shadow group relative cursor-pointer active:scale-[0.98]"
          onClick={() => isCliquable && onView?.(advertisement)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Media preview */}
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                  {advertisement.media && advertisement.media_type === "image" ? (
                    <img
                      src={advertisement.media}
                      alt={advertisement.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      {getMediaTypeIcon()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Typography
                      variant="body-sm"
                      weight="medium"
                      className="truncate"
                    >
                      {advertisement.title}
                    </Typography>
                    {getStatusBadge()}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatPosition(advertisement.position)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {advertisement.impression_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {advertisement.click_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="relative">
                {actions.length > 0 && (
                  <DynamicActionMenu
                    variant="inline"
                    actions={actions}
                    menuTitle="Actions"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DynamicActionMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Mode grille
    return (
      <Card
        className="hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative cursor-pointer active:scale-[0.98]"
        onClick={() => isCliquable && onView?.(advertisement)}
      >
        {/* Media header */}
        <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg overflow-hidden">
          {advertisement.media && advertisement.media_type === "image" ? (
            <div className="w-full h-hull relative">
              <Image
                src={advertisement.media}
                alt={advertisement.title}
                fill
                className="w-full h-full absolute object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2 text-primary/30">
                  {getMediaTypeIcon()}
                </div>
                <Typography variant="body-sm" theme="muted">
                  {advertisement.media_type === "video"
                    ? "Vidéo"
                    : advertisement.media_type === "html"
                      ? "HTML"
                      : "Image"}
                </Typography>
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 right-2">{getStatusBadge()}</div>

          {/* Position badge */}
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="secondary"
              className="bg-black/50 text-white border-0"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {formatPosition(advertisement.position)}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <Typography
              variant="body-base"
              weight="bold"
              className="line-clamp-1"
            >
              {advertisement.title}
            </Typography>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                P{advertisement.priority}
              </Badge>
            </div>
          </div>

          {advertisement.cta_text && (
            <Typography
              variant="body-sm"
              theme="muted"
              className="mb-3 line-clamp-2"
            >
              {advertisement.cta_text}
            </Typography>
          )}
          {advertisement.description && (
            <Typography
              variant="body-sm"
              theme="muted"
              className="mb-3 line-clamp-2"
            >
              {advertisement.description}
            </Typography>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 bg-muted/30 rounded">
              <Typography variant="body-sm" weight="bold">
                {advertisement.impression_count}
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Vues
              </Typography>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <Typography variant="body-sm" weight="bold">
                {advertisement.click_count}
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Clics
              </Typography>
            </div>
          </div>

          {/* CTR */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>CTR</span>
              <span className="font-medium">
                {advertisement.impression_count > 0
                  ? (
                    (advertisement.click_count /
                      advertisement.impression_count) *
                    100
                  ).toFixed(2)
                  : 0}
                %
              </span>
            </div>
            <Progress
              value={
                advertisement.impression_count > 0
                  ? (advertisement.click_count / advertisement.impression_count) *
                  100
                  : 0
              }
              className="h-1"
            />
          </div>

          {/* Annonceur et Actions */}
          <div className="flex justify-between items-center mt-auto">
            {advertisement.advertiser_name && (
              <Typography
                variant="body-sm"
                theme="muted"
                className="truncate flex-1 mr-2"
              >
                {advertisement.advertiser_name}
              </Typography>
            )}
            <div className="relative">
              {actions.length > 0 && (
                <DynamicActionMenu
                  variant="inline"
                  actions={actions}
                  menuTitle="Actions"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DynamicActionMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

// Export des composants de cartes
export const EntityCards = {
  Fighter: FighterCard,
  Region: RegionCard,
  Competition: CompetitionCard,
  Referee: RefereeCard,
  Coach: CoachCard,
  Transfer: TransferCard,
  SubGroup: SubGroupCard,
  User: UserCard,
  Advertisement: AdvertisementCard, // Nouveau
  TeamMember: TeamMemberCard,
};

// Carte pour les membres de l'équipe
export function TeamMemberCard({
  item: member,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<TeamMember>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(member);
    else if (activeAction === "edit" && onEdit) onEdit(member);
    else if (activeAction === "delete" && onDelete) onDelete(member);
    else if (onView) onView(member);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status || (member.is_active ? "success" : "default")),
        className
      )}
      onClick={handleMainAction}
    >
      <div
        className={cn(
          "p-3 flex w-full gap-3",
          isListView ? "flex-row items-center" : "flex-col"
        )}
      >
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div className="relative flex-shrink-0">
            {(member.profile_image || member.avatar_url) ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-sm relative">
                <Image
                  src={member.profile_image || member.avatar_url || ''}
                  alt={member.full_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {member.full_name[0]}
              </div>
            )}
            {member.is_lead && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-sm">
                <Shield className="h-3 w-3 text-black" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {member.full_name}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(member)}
                    onView={() => onView?.(member)}
                    onDelete={() => onDelete?.(member)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Typography variant="caption1" theme="muted" className="truncate">
                {member.role}
              </Typography>
              {member.department && (
                <Badge variant="outline" className="text-[8px] h-3 px-1">
                  {member.department}
                </Badge>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(member)}
                onView={() => onView?.(member)}
                onDelete={() => onDelete?.(member)}
              />
            </div>
          )}
        </div>

        {!isCompact && (
          <div
            className={cn(
              "space-y-2",
              isListView &&
                "flex-1 px-4 border-l border-r border-border/50 mx-4"
            )}
          >
            <div className="flex flex-wrap gap-2">
              {member.expertise && Array.isArray(member.expertise) && member.expertise.slice(0, 3).map((exp, idx) => (
                <Badge key={idx} variant="outline" className="text-[9px] h-4 px-1">
                  {exp}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {member.years_experience !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{member.years_experience} ans exp.</span>
                </div>
              )}
              {member.projects_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  <span>{member.projects_count} projets</span>
                </div>
              )}
            </div>

            {member.bio && (
              <Typography
                variant="caption1"
                theme="muted"
                className="line-clamp-2 italic"
              >
                {member.bio}
              </Typography>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
