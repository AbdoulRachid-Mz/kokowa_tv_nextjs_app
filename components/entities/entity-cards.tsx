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
} from "@/types";
import {
  MapPin,
  Trophy,
  Users,
  Calendar,
  Shield,
  Award,
  Star,
  Swords,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Carte pour les Lutteurs
interface FighterCardProps {
  fighter: Fighter;
  viewMode: "grid" | "list";
  onEdit?: (fighter: Fighter) => void;
  onView?: (fighter: Fighter) => void;
}

export function FighterCard({
  fighter,
  viewMode,
  onEdit,
  onView,
}: FighterCardProps) {
  const isListView = viewMode === "list";

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex"
      )}
    >
      <div
        className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}
      >
        {/* Avatar/Image */}
        <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {fighter.first_name[0]}
            {fighter.last_name[0]}
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          {/* Informations principales */}
          <div className={cn(isListView && "flex items-center gap-6")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {fighter.first_name} {fighter.last_name}
              </CardTitle>
              {fighter.nickname && (
                <Typography variant="body-sm" theme="muted" className="italic">
                  "{fighter.nickname}"
                </Typography>
              )}

              <div className="flex items-center gap-2 mt-2">
                {fighter.region && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {fighter.region.name}
                  </Badge>
                )}

                {fighter.is_champion && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    Champion
                  </Badge>
                )}

                <Badge variant={fighter.is_active ? "default" : "secondary"}>
                  {fighter.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            {isListView && (
              <div className="text-right">
                <Typography variant="h4" weight="bold" className="text-primary">
                  #{fighter.ranking}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Classement
                </Typography>
              </div>
            )}
          </div>

          {/* Informations secondaires */}
          {!isListView && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Classement:</span>
                <span className="font-semibold">#{fighter.ranking}</span>
              </div>

              {fighter.debut_year && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Début:</span>
                  <span>{fighter.debut_year}</span>
                </div>
              )}

              {fighter.fighting_style && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Style:</span>
                  <span className="text-right">{fighter.fighting_style}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(fighter);
              }}
            >
              Voir
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(fighter);
              }}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Carte pour les Régions
interface RegionCardProps {
  region: Region;
  viewMode: "grid" | "list";
  onEdit?: (region: Region) => void;
  onView?: (region: Region) => void;
}

export function RegionCard({
  region,
  viewMode,
  onEdit,
  onView,
}: RegionCardProps) {
  const isListView = viewMode === "list";

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4",
        isListView && "flex"
      )}
      style={{ borderLeftColor: region.color || "#3b82f6" }}
    >
      <div
        className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}
      >
        {/* Icône */}
        <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: region.color || "#3b82f6" }}
          >
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-6")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {region.name}
              </CardTitle>
              <Typography variant="body-sm" theme="muted">
                Code: {region.code}
              </Typography>

              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {region.total_fighters} lutteurs
                </Badge>

                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {region.total_champions} champions
                </Badge>
              </div>
            </div>

            {isListView && region.description && (
              <Typography variant="body-sm" className="max-w-md">
                {region.description}
              </Typography>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(region);
              }}
            >
              Voir
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(region);
              }}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Carte pour les Compétitions
interface CompetitionCardProps {
  competition: Competition;
  viewMode: "grid" | "list";
  onEdit?: (competition: Competition) => void;
  onView?: (competition: Competition) => void;
}

export function CompetitionCard({
  competition,
  viewMode,
  onEdit,
  onView,
}: CompetitionCardProps) {
  const isListView = viewMode === "list";

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: {
        label: "À venir",
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800",
      },
      ongoing: {
        label: "En cours",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      completed: { label: "Terminée", variant: "outline" as const },
      cancelled: {
        label: "Annulée",
        variant: "secondary" as const,
        color: "bg-red-100 text-red-800",
      },
      postponed: {
        label: "Reportée",
        variant: "secondary" as const,
        color: "bg-orange-100 text-orange-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.upcoming;

    return (
      <Badge
        variant={config.variant}
        className={"color" in config ? config.color : ""}
      >
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      sabre_national: "Sabre National",
      coupe_regionale: "Coupe Régionale",
      halarou_bakwai: "Halarou Bakwai",
      aes: "AES",
      friendly: "Amical",
      ministre: "Ministre",
      coupe_airtel: "Coupe Airtel",
      other: "Autre",
    };

    return typeLabels[type] || type;
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex"
      )}
    >
      <div
        className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}
      >
        {/* Icône */}
        <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-6")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {competition.name}
              </CardTitle>

              <div className="flex items-center gap-2 mt-1 mb-2">
                {getStatusBadge(competition.status)}
                <Badge variant="outline">
                  {getTypeLabel(competition.type)}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                {competition.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {competition.location}
                  </div>
                )}

                {competition.region && (
                  <div className="text-muted-foreground">
                    Région: {competition.region.name}
                  </div>
                )}

                {competition.prize_pool && (
                  <div className="font-semibold text-green-600">
                    Prix: {competition.prize_pool.toLocaleString()} FCFA
                  </div>
                )}
              </div>
            </div>

            {isListView && competition.description && (
              <Typography variant="body-sm" className="max-w-md">
                {competition.description}
              </Typography>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(competition);
              }}
            >
              Voir
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(competition);
              }}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface RefereeCardProps {
  referee: Referee;
  viewMode: "grid" | "list";
  onEdit?: (referee: Referee) => void;
  onView?: (referee: Referee) => void;
}

export function RefereeCard({
  referee,
  viewMode,
  onEdit,
  onView,
}: RefereeCardProps) {
  const isListView = viewMode === "list";

  const getCertificationBadge = (level?: string) => {
    const levels: Record<string, { label: string; color: string }> = {
      international: {
        label: "International",
        color: "bg-purple-100 text-purple-800",
      },
      national: { label: "National", color: "bg-blue-100 text-blue-800" },
      regional: { label: "Régional", color: "bg-green-100 text-green-800" },
      local: { label: "Local", color: "bg-gray-100 text-gray-800" },
    };

    const config = level
      ? levels[level]
      : { label: "Non certifié", color: "bg-gray-100 text-gray-600" };
    return config;
  };

  const certificationConfig = getCertificationBadge(
    referee.certification_level
  );

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex"
      )}
    >
      <div
        className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}
      >
        {/* Avatar/Image */}
        <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white">
            <Shield className="h-6 w-6" />
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-6")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {referee.first_name} {referee.last_name}
              </CardTitle>
              {referee.nickname && (
                <Typography variant="body-sm" theme="muted" className="italic">
                  "{referee.nickname}"
                </Typography>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={referee.is_active ? "default" : "secondary"}>
                  {referee.is_active ? "Actif" : "Inactif"}
                </Badge>

                <Badge variant="outline" className={certificationConfig.color}>
                  {certificationConfig.label}
                </Badge>

                {referee.experience_years && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {referee.experience_years} ans
                  </Badge>
                )}

                {referee.region && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {referee.region.name}
                  </Badge>
                )}
              </div>
            </div>

            {isListView && (
              <div className="text-right">
                {referee.license_number && (
                  <>
                    <Typography
                      variant="body-sm"
                      weight="medium"
                      className="text-primary"
                    >
                      {referee.license_number}
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      License
                    </Typography>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Informations secondaires */}
          {!isListView && (
            <div className="mt-3 space-y-2">
              {referee.license_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License:</span>
                  <span className="font-mono">{referee.license_number}</span>
                </div>
              )}

              {referee.experience_years && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expérience:</span>
                  <span>{referee.experience_years} ans</span>
                </div>
              )}

              {referee.birth_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Âge:</span>
                  <span>
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(referee.birth_date).getTime()) /
                        3.15576e10
                    )}{" "}
                    ans
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(referee);
              }}
            >
              Voir
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(referee);
              }}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Export des composants de cartes
export const EntityCards = {
  Fighter: FighterCard,
  Region: RegionCard,
  Competition: CompetitionCard,
  Referee: RefereeCard, // AJOUT
};
