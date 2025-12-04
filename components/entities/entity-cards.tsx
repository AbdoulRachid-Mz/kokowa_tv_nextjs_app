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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Carte pour les Lutteurs
interface FighterCardProps {
  fighter: Fighter;
  viewMode: "grid" | "list";
  onEdit?: (fighter: Fighter) => void;
  onView?: (fighter: Fighter) => void;
}

// interface CoachCardProps {
//   coach: Coach;
//   viewMode: 'grid' | 'list';
//   onEdit: (coach: Coach) => void;
//   onView: (coach: Coach) => void;
// }

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
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Avatar/Image */}
        <div className={cn("flex-shrink-0 mb-2", isListView && "mb-0")}>
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
          <div className={cn(isListView && "flex items-center gap-3")}>
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
            <div className="mt-2 space-y-2">
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
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
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
        "hover:shadow-lg p-2 gap-2 transition-all duration-300 cursor-pointer group border-l-4",
        isListView && "flex"
      )}
      style={{ borderLeftColor: region.color || "#3b82f6" }}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Icône */}
        <div className={cn("flex-shrink-0 mb-2", isListView && "mb-0")}>
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
          <div className={cn(isListView && "flex items-center gap-2")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {region.name}
              </CardTitle>
              <Typography variant="body-sm" theme="muted">
                Code: {region.code}
              </Typography>

              <div className="flex items-center gap-2 mt-1">
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
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
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

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer p-2 group",
        isListView && "flex"
      )}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Icône */}
        <div className={cn("flex-shrink-0 mb-2", isListView && "mb-0")}>
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
          <div className={cn(isListView && "flex items-center gap-3")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {competition.name}
              </CardTitle>
            </div>

            {isListView && competition.description && (
              <Typography variant="body-sm" className="max-w-md">
                {competition.description}
              </Typography>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
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
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Avatar/Image */}
        <div className={cn("flex-shrink-0 mb-2", isListView && "mb-0")}>
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
          <div className={cn(isListView && "flex items-center gap-3")}>
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
            <div className="mt-2 space-y-2">
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
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
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

interface CoachCardProps {
  coach: Coach;
  viewMode: "grid" | "list";
  onEdit: (coach: Coach) => void;
  onView: (coach: Coach) => void;
}

export const CoachCard = ({
  coach,
  viewMode,
  onEdit,
  onView,
}: CoachCardProps) => {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow p-2">
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={coach.profile_image || "/placeholder-profile.jpg"}
                  alt={`${coach.first_name} ${coach.last_name}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <Typography variant="h4" weight="medium">
                  {coach.first_name} {coach.last_name}
                </Typography>
                {coach.nickname && (
                  <Typography variant="body-sm" theme="muted">
                    "{coach.nickname}"
                  </Typography>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  {coach.region && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <Typography variant="body-sm" theme="muted">
                        {coach.region.name}
                      </Typography>
                    </div>
                  )}
                  {coach.certification_level && (
                    <Badge variant="secondary" className="text-xs">
                      {coach.certification_level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {coach.experience_years && (
                <div className="text-right">
                  <Typography variant="body-sm" weight="medium">
                    {coach.experience_years} ans
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    d'expérience
                  </Typography>
                </div>
              )}
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(coach)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(coach)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue grid
  return (
    <Card className="hover:shadow-lg transition-shadow">
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
              <CardTitle className="text-lg">
                {coach.first_name} {coach.last_name}
              </CardTitle>
              {coach.nickname && (
                <Typography variant="body-sm" theme="muted">
                  "{coach.nickname}"
                </Typography>
              )}
            </div>
          </div>
          <Badge variant={coach.is_active ? "default" : "outline"}>
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
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => onView(coach)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(coach)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TransferCardProps {
  transfer: FighterTransfer;
  viewMode: "grid" | "list";
  onEdit: (transfer: FighterTransfer) => void;
  onView: (transfer: FighterTransfer) => void;
}

export const TransferCard = ({
  transfer,
  viewMode,
  onEdit,
  onView,
}: TransferCardProps) => {
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

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Lutteur */}
              {transfer.fighter && (
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
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
                  <div className="min-w-0 flex-1">
                    <Typography
                      variant="h4"
                      weight="medium"
                      className="truncate"
                    >
                      {transfer.fighter.first_name} {transfer.fighter.last_name}
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
                </div>
              )}

              {/* Transfert */}
              <div className="flex items-center space-x-4 mx-4">
                {transfer.from_region && (
                  <Typography variant="body-sm" weight="medium">
                    {transfer.from_region.name}
                  </Typography>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {transfer.to_region && (
                  <Typography variant="body-sm" weight="medium">
                    {transfer.to_region.name}
                  </Typography>
                )}
              </div>

              {/* Informations supplémentaires */}
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
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
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Badge
                variant={getStatusVariant(transfer.status)}
                className="capitalize"
              >
                {transfer.status}
              </Badge>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(transfer)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(transfer)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue grid
  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
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
                  <CardTitle className="text-base">
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
            className="capitalize"
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
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(transfer)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(transfer)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SubGroupCardProps {
  subGroup: SubGroup;
  viewMode: "grid" | "list";
  onEdit: (subGroup: SubGroup) => void;
  onView: (subGroup: SubGroup) => void;
}

export const SubGroupCard = ({
  subGroup,
  viewMode,
  onEdit,
  onView,
}: SubGroupCardProps) => {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Typography variant="h4" weight="medium">
                    {subGroup.name}
                  </Typography>
                  <Badge variant="outline">
                    Ordre: {subGroup.sub_group_order}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 mt-2">
                  {subGroup.region1 && subGroup.region2 && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <Typography variant="body-sm">
                        {subGroup.region1.name} vs {subGroup.region2.name}
                      </Typography>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <Typography variant="body-sm">
                      {subGroup.matches?.length || 0} match(s)
                    </Typography>
                  </div>

                  {subGroup.group && (
                    <Typography variant="body-sm" theme="muted">
                      {subGroup.group.name}
                    </Typography>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Badge variant={subGroup.is_active ? "default" : "outline"}>
                {subGroup.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={subGroup.is_completed ? "default" : "secondary"}>
                {subGroup.is_completed ? "Terminée" : "En cours"}
              </Badge>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(subGroup)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(subGroup)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue grid
  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="p-2 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{subGroup.name}</CardTitle>
            <Typography variant="body-sm" theme="muted" className="mt-1">
              Ordre: {subGroup.sub_group_order}
            </Typography>
          </div>
          <div className="flex gap-1">
            <Badge variant={subGroup.is_active ? "default" : "outline"}>
              {subGroup.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={subGroup.is_completed ? "default" : "secondary"}>
              {subGroup.is_completed ? "Terminée" : "En cours"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-2">
        <div className="space-y-3">
          {/* Régions */}
          {subGroup.region1 && subGroup.region2 && (
            <div className="text-center py-2">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-center">
                  <Typography variant="body-sm" weight="medium">
                    {subGroup.region1.name}
                  </Typography>
                  {subGroup.belt1 && (
                    <Typography variant="body-base" theme="muted">
                      Ceinture {subGroup.belt1.color}
                    </Typography>
                  )}
                </div>
                <div className="text-muted-foreground">VS</div>
                <div className="text-center">
                  <Typography variant="body-sm" weight="medium">
                    {subGroup.region2.name}
                  </Typography>
                  {subGroup.belt2 && (
                    <Typography variant="body-base" theme="muted">
                      Ceinture {subGroup.belt2.color}
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Matchs:</span>
              <span className="font-medium">
                {subGroup.matches?.length || 0}
              </span>
            </div>

            {subGroup.group && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Groupe:</span>
                <span>{subGroup.group.name}</span>
              </div>
            )}

            {subGroup.main_referee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Arbitre:</span>
                <span className="truncate max-w-[120px]">
                  {subGroup.main_referee.first_name}{" "}
                  {subGroup.main_referee.last_name}
                </span>
              </div>
            )}
          </div>

          {subGroup.description && (
            <Typography
              variant="body-sm"
              theme="muted"
              className="line-clamp-2 border-t pt-2"
            >
              {subGroup.description}
            </Typography>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <Typography variant="body-base" theme="muted">
            {subGroup.group?.phase?.edition?.year}
          </Typography>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(subGroup)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(subGroup)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface UserCardProps {
  user: User;
  viewMode: "grid" | "list";
  onEdit?: (user: User) => void;
  onView?: (user: User) => void;
}

export function UserCard({ user, viewMode, onEdit, onView }: UserCardProps) {
  const isListView = viewMode === "list";

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
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex"
      )}
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
            isListView && "flex items-center justify-between"
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

          {/* Actions */}
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(user);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(user);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
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
  Coach: CoachCard, // AJOUT
  Transfer: TransferCard, // AJOUT
  SubGroup: SubGroupCard,
  User: UserCard,
};
