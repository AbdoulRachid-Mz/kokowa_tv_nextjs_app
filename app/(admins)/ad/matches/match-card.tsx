// components/matches/match-card.tsx
'use client';

import { Match } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy, 
  Video,
  Eye,
  Edit,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MatchCardProps {
  match: Match;
  viewMode: 'grid' | 'list' | 'compact';
}

export function MatchCard({ match, viewMode }: MatchCardProps) {
  const router = useRouter();

  const getStatusBadge = (status: Match['status']) => {
    const statusConfig = {
      scheduled: { label: 'Programmé', variant: 'outline', icon: Calendar },
      live: { label: 'EN DIRECT', variant: 'destructive', icon: Play },
      round_break: { label: 'Pause', variant: 'warning', icon: Clock },
      completed: { label: 'Terminé', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Annulé', variant: 'secondary', icon: XCircle },
      postponed: { label: 'Reporté', variant: 'secondary', icon: AlertCircle },
      reclamation: { label: 'Réclamation', variant: 'warning', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (result: Match['match_result']) => {
    if (!result) return null;

    const resultConfig = {
      fighter1_win: { label: 'Victoire F1', variant: 'success' },
      fighter2_win: { label: 'Victoire F2', variant: 'success' },
      draw: { label: 'Match nul', variant: 'secondary' },
      cancelled: { label: 'Annulé', variant: 'destructive' },
      postponed: { label: 'Reporté', variant: 'warning' },
    };

    const config = resultConfig[result];
    if (!config) return null;

    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const formatMatchDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch {
      return date;
    }
  };

  const formatMatchTime = (time?: string) => {
    if (!time) return 'Horaire non défini';
    return time;
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Statut */}
            <div className="w-24">
              {getStatusBadge(match.status)}
            </div>

            {/* Date et heure */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground w-40">
              <Calendar className="h-4 w-4" />
              <span>{formatMatchDate(match.match_date)}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{formatMatchTime(match.start_time)}</span>
            </div>

            {/* VS */}
            <div className="flex-1 flex items-center justify-center gap-4">
              {/* Fighter 1 */}
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={match.fighter1?.profile_image} />
                  <AvatarFallback>
                    {match.fighter1?.first_name?.[0]}
                    {match.fighter1?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {match.fighter1?.first_name} {match.fighter1?.last_name}
                  </p>
                  {match.fighter1?.nickname && (
                    <p className="text-xs text-muted-foreground">
                      "{match.fighter1.nickname}"
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xl font-bold text-primary">VS</div>

              {/* Fighter 2 */}
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={match.fighter2?.profile_image} />
                  <AvatarFallback>
                    {match.fighter2?.first_name?.[0]}
                    {match.fighter2?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {match.fighter2?.first_name} {match.fighter2?.last_name}
                  </p>
                  {match.fighter2?.nickname && (
                    <p className="text-xs text-muted-foreground">
                      "{match.fighter2.nickname}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sous-groupe */}
            <div className="text-sm text-muted-foreground w-48 truncate">
              {match.sub_group?.name || 'Groupe non défini'}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/ad/matches/${match.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/ad/matches/${match.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {match.status === 'scheduled' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer le match
                    </DropdownMenuItem>
                  </>
                )}
                {match.video_url && (
                  <DropdownMenuItem onClick={() => window.open(match.video_url, '_blank')}>
                    <Video className="h-4 w-4 mr-2" />
                    Voir la vidéo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mode grille
  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* En-tête avec statut et date */}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {getStatusBadge(match.status)}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatMatchDate(match.match_date)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatMatchTime(match.start_time)}</span>
          </div>
          {match.sub_group && (
            <Badge variant="outline" className="text-xs">
              {match.sub_group.name}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Contenu principal - VS */}
      <CardContent className="pb-3">
        <div className="flex items-center justify-between gap-2">
          {/* Fighter 1 */}
          <div className="flex-1 text-center">
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarImage src={match.fighter1?.profile_image} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {match.fighter1?.first_name?.[0]}
                {match.fighter1?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm truncate">
              {match.fighter1?.first_name} {match.fighter1?.last_name}
            </p>
            {match.fighter1?.nickname && (
              <p className="text-xs text-muted-foreground truncate">
                "{match.fighter1.nickname}"
              </p>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-primary">VS</div>
            {getResultBadge(match.match_result)}
            {match.winner_fighter_id && (
              <Badge variant="default" className="mt-1 text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Vainqueur
              </Badge>
            )}
          </div>

          {/* Fighter 2 */}
          <div className="flex-1 text-center">
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarImage src={match.fighter2?.profile_image} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {match.fighter2?.first_name?.[0]}
                {match.fighter2?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm truncate">
              {match.fighter2?.first_name} {match.fighter2?.last_name}
            </p>
            {match.fighter2?.nickname && (
              <p className="text-xs text-muted-foreground truncate">
                "{match.fighter2.nickname}"
              </p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Pied de carte avec actions */}
      <CardFooter className="border-t pt-3 flex justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{match.audience_count || 0}</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/ad/matches/${match.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/ad/matches/${match.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {match.video_url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => window.open(match.video_url, '_blank')}
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}