"use client";

import React from "react";
import Image from "next/image";
import { 
  MiniFighter, 
  MiniRegion, 
  MiniCompetition, 
  MiniCoach, 
  MiniReferee 
} from "@/types/mini-entities";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Trophy, MapPin, User, Star, MoreHorizontal, Eye, Pencil, Trash2, AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseCardProps, CardActionMenu } from "./entity-cards";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const getStatusBorder = (status?: string) => {
  switch (status) {
    case "success": return "border-l-4 border-l-green-500";
    case "warning": return "border-l-4 border-l-yellow-500";
    case "error": return "border-l-4 border-l-red-500";
    case "info": return "border-l-4 border-l-blue-500";
    case "default": return "border-l-4 border-l-gray-300";
    default: return status?.startsWith("#") ? "border-l-4" : "";
  }
};

export function MiniFighterCard({
  item: fighter,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = true,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<MiniFighter>) {
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
        "overflow-hidden transition-all relative duration-300 group",
        isCliquable && "cursor-pointer active:scale-95 hover:border-primary",
        getStatusBorder(status),
        className
      )}
      style={status?.startsWith("#") ? { borderLeftColor: status } : {}}
      onClick={handleMainAction}
    >
      <CardContent className="p-2 flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted border shadow-sm">
          <Image
            src={fighter?.profile_image || "/placeholder-profile.jpg"}
            alt={`${fighter?.first_name} ${fighter?.last_name}`}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {fighter?.first_name} {fighter?.last_name}
            </Typography>
            {hasActions && (
              <div onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(fighter)} onView={() => onView?.(fighter)} onDelete={() => onDelete?.(fighter)} entityName={`le lutteur ${fighter.first_name} ${fighter.last_name}`} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {fighter.is_champion && (
              <Trophy className="h-3 w-3 text-yellow-500 flex-shrink-0" />
            )}
            <Badge variant="outline" className="h-3.5 text-[9px] px-1 border-primary/20 bg-primary/5">
              R#{fighter.ranking}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniRegionCard({
  item: region,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = true,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<MiniRegion>) {
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
        "overflow-hidden transition-all relative duration-300 group",
        isCliquable && "cursor-pointer active:scale-95 hover:border-primary",
        getStatusBorder(status || region?.color),
        className
      )}
      style={status?.startsWith("#") ? { borderLeftColor: status } : region?.color ? { borderLeftColor: region.color } : {}}
      onClick={handleMainAction}
    >
      <CardContent className="p-2 flex items-center gap-2">
        <div 
          className="w-9 h-9 rounded flex items-center justify-center text-white flex-shrink-0 shadow-sm font-bold text-xs"
          style={{ backgroundColor: region?.color || "#3b82f6" }}
        >
          {region.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {region.name}
            </Typography>
            {hasActions && (
              <div onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(region)} onView={() => onView?.(region)} onDelete={() => onDelete?.(region)} entityName={`la région ${region.name}`} />
              </div>
            )}
          </div>
          <Typography variant="caption2" theme="muted" className="truncate uppercase tracking-wider font-medium">
            Code: {region.code}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniCompetitionCard({
  item: competition,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = true,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<MiniCompetition>) {
  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(competition);
    else if (activeAction === "edit" && onEdit) onEdit(competition);
    else if (activeAction === "delete" && onDelete) onDelete(competition);
    else if (onView) onView(competition);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all relative duration-300 group",
        isCliquable && "cursor-pointer active:scale-95 hover:border-primary",
        getStatusBorder(status),
        className
      )}
      onClick={handleMainAction}
    >
      <CardContent className="p-2 flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted border shadow-sm">
          <Image
            src={competition.featured_image || "/placeholder-competition.jpg"}
            alt={competition.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {competition.name}
            </Typography>
            {hasActions && (
              <div onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(competition)} onView={() => onView?.(competition)} onDelete={() => onDelete?.(competition)} entityName={`la compétition ${competition.name}`} />
              </div>
            )}
          </div>
          <Badge 
            variant={competition.status === 'ongoing' ? 'default' : 'secondary'} 
            className="h-3.5 text-[8px] px-1 uppercase tracking-tighter"
          >
            {competition.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniCoachCard({
  item: coach,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = true,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<MiniCoach>) {
  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(coach);
    else if (activeAction === "edit" && onEdit) onEdit(coach);
    else if (activeAction === "delete" && onDelete) onDelete(coach);
    else if (onView) onView(coach);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all relative duration-300 group",
        isCliquable && "cursor-pointer active:scale-95 hover:border-primary",
        getStatusBorder(status),
        className
      )}
      onClick={handleMainAction}
    >
      <CardContent className="p-2 flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted border shadow-sm">
          <Image
            src={coach.profile_image || "/placeholder-profile.jpg"}
            alt={`${coach.first_name} ${coach.last_name}`}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {coach.first_name} {coach.last_name}
            </Typography>
            {hasActions && (
              <div onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(coach)} onView={() => onView?.(coach)} onDelete={() => onDelete?.(coach)} entityName={`le coach ${coach.first_name} ${coach.last_name}`} />
              </div>
            )}
          </div>
          <Typography variant="caption2" theme="muted" className="truncate italic">
            Coach
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniRefereeCard({
  item: referee,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = true,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<MiniReferee>) {
  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(referee);
    else if (activeAction === "edit" && onEdit) onEdit(referee);
    else if (activeAction === "delete" && onDelete) onDelete(referee);
    else if (onView) onView(referee);
  };

  const hasActions = onEdit || onView || onDelete;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all relative duration-300 group",
        isCliquable && "cursor-pointer active:scale-95 hover:border-primary",
        getStatusBorder(status),
        className
      )}
      onClick={handleMainAction}
    >
      <CardContent className="p-2 flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted border shadow-sm">
          <Image
            src={referee.profile_image || "/placeholder-profile.jpg"}
            alt={`${referee.first_name} ${referee.last_name}`}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {referee.first_name} {referee.last_name}
            </Typography>
            {hasActions && (
              <div onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(referee)} onView={() => onView?.(referee)} onDelete={() => onDelete?.(referee)} entityName={`l'arbitre ${referee.first_name} ${referee.last_name}`} />
              </div>
            )}
          </div>
          <Typography variant="caption2" theme="muted" className="truncate italic">
            Arbitre
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
