// components/entities/edition-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CompetitionEdition } from "@/types";
import { Calendar, Users, Award, MapPin, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditionCardProps {
  edition: CompetitionEdition;
  viewMode: 'grid' | 'list';
  onEdit?: (edition: CompetitionEdition) => void;
  onView?: (edition: CompetitionEdition) => void;
  onDelete?: (edition: CompetitionEdition) => void;
}

export function EditionCard({ edition, viewMode, onEdit, onView, onDelete }: EditionCardProps) {
  const isListView = viewMode === 'list';
  
  const getEditionStatus = () => {
    if (!edition.start_date || !edition.end_date) return 'upcoming';
    
    const now = new Date();
    const start = new Date(edition.start_date);
    const end = new Date(edition.end_date);
    
    if (now >= start && now <= end) return 'ongoing';
    if (now > end) return 'completed';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: 'À venir', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800 border-l-blue-500' },
      ongoing: { label: 'En cours', variant: 'default' as const, color: 'bg-green-100 text-green-800 border-l-green-500' },
      completed: { label: 'Terminée', variant: 'outline' as const, color: 'border-l-gray-500' },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
  };

  const status = getEditionStatus();
  const statusConfig = getStatusBadge(status);

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4",
      isListView && "flex",
      statusConfig.color
    )}>
      <div className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}>
        {/* Icône */}
        <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center text-white",
            status === 'ongoing' && "bg-gradient-to-br from-green-500 to-emerald-600",
            status === 'completed' && "bg-gradient-to-br from-gray-500 to-gray-600",
            status === 'upcoming' && "bg-gradient-to-br from-blue-500 to-cyan-600",
          )}>
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className={cn("flex-1", isListView && "flex items-center justify-between")}>
          <div className={cn(isListView && "flex items-center gap-6 flex-1")}>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors mb-1">
                Édition {edition.edition_number} - {edition.year}
              </CardTitle>
              
              {edition.theme && (
                <Typography variant="body-sm" theme="muted" className="italic mb-2">
                  "{edition.theme}"
                </Typography>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={statusConfig.variant} className={statusConfig.color?.replace('border-l-', 'bg-')}>
                  {statusConfig.label}
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {edition.total_participants} participants
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {edition.start_date && edition.end_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(edition.start_date).toLocaleDateString()} - {new Date(edition.end_date).toLocaleDateString()}
                  </div>
                )}
                
                {edition.winner_fighter && (
                  <div className="flex items-center gap-1 font-semibold text-green-600">
                    <Award className="h-3 w-3" />
                    Vainqueur: {edition.winner_fighter.first_name} {edition.winner_fighter.last_name}
                  </div>
                )}
                
                {edition.fighters && edition.fighters.length > 0 && (
                  <div className="text-muted-foreground">
                    {edition.fighters.length} lutteurs inscrits
                  </div>
                )}
                
                {edition.regions && edition.regions.length > 0 && (
                  <div className="text-muted-foreground">
                    {edition.regions.length} régions participantes
                  </div>
                )}
              </div>
            </div>

            {isListView && (
              <div className="text-right min-w-32">
                <Typography variant="h4" weight="bold" className="text-primary mb-1">
                  {edition.total_participants}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Participants
                </Typography>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0 ml-4")}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(edition);
              }}
            >
              Voir
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(edition)}>
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(edition)}
                  className="text-red-600"
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}