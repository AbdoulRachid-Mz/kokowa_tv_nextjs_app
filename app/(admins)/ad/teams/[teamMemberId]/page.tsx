// @/ad/teams/[teamMemberId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeamMemberById } from "@/actions/teams";
import {
  addTeamAchievement,
  deleteTeamAchievement,
  updateTeamAchievement,
} from "@/actions/teams";
import { TeamMember, TeamAchievement } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Award,
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Star,
  MapPin,
  Globe,
  Layers,
  Plus,
  Eye,
  Edit3,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TeamAchievementDialog } from "@/components/entities/team-member-archive-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteButton } from "@/components/shared/delete-button";

export default function TeamMemberDetailPage() {
  const { teamMemberId } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  // États pour le dialogue des accomplissements
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<TeamAchievement | null>(null);
  const [achievementLoading, setAchievementLoading] = useState(false);

  // État pour le dialogue de confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] =
    useState<TeamAchievement | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await getTeamMemberById(Number(teamMemberId), true);
        setMember(data);
      } catch (error) {
        console.error("Error fetching team member:", error);
        toast.error("Erreur lors du chargement du membre");
      } finally {
        setLoading(false);
      }
    };

    if (teamMemberId) {
      fetchMember();
    }
  }, [teamMemberId]);

  // Gestionnaires pour les accomplissements
  const handleAddAchievement = () => {
    setEditingAchievement(null);
    setIsAchievementDialogOpen(true);
  };

  const handleEditAchievement = (achievement: TeamAchievement) => {
    setEditingAchievement(achievement);
    setIsAchievementDialogOpen(true);
  };

  const handleDeleteAchievement = (achievement: TeamAchievement) => {
    setAchievementToDelete(achievement);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAchievement = async () => {
    if (!achievementToDelete) return;

    setAchievementLoading(true);
    try {
      await deleteTeamAchievement(achievementToDelete.id);
      toast.success("Accomplissement supprimé");

      // Rafraîchir les données
      const refreshed = await getTeamMemberById(Number(teamMemberId), true);
      setMember(refreshed);
    } catch (error) {
      console.error("Error deleting achievement:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setAchievementLoading(false);
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    }
  };

  const handleAchievementSubmit = async (values: any) => {
    setAchievementLoading(true);
    try {
      if (editingAchievement) {
        // Mise à jour
        await updateTeamAchievement(editingAchievement.id, values);
        toast.success("Accomplissement mis à jour");
      } else {
        // Création
        await addTeamAchievement(values);
        toast.success("Accomplissement ajouté");
      }

      // Rafraîchir les données
      const refreshed = await getTeamMemberById(Number(teamMemberId), true);
      setMember(refreshed);
      setIsAchievementDialogOpen(false);
      setEditingAchievement(null);
    } catch (error) {
      console.error("Error saving achievement:", error);
      toast.error("Erreur lors de l'enregistrement");
      throw error;
    } finally {
      setAchievementLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Typography variant="h4">Membre non trouvé</Typography>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  const fullName = `${member.first_name} ${member.last_name}`.trim();
  const achievements = member.achievements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Typography variant="h2" weight="bold">
              Détails du Membre
            </Typography>
            <Typography variant="body-sm" theme="muted">
              Consultez et gérez les informations de {fullName}
            </Typography>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/ad/teams/${teamMemberId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <DeleteButton
            entityType="team-member"
            entityId={Number(teamMemberId)}
            entityName={fullName}
            redirectPath="/ad/teams"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - inchangé */}
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-lg">
                {member.profile_image ? (
                  <Image
                    src={member.profile_image}
                    alt={fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold">
                    {member.first_name?.[0] || member.last_name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Typography variant="h4" weight="bold">
                    {fullName}
                  </Typography>
                  {member.is_lead && (
                    <Badge variant="default" className="h-5">
                      Lead
                    </Badge>
                  )}
                </div>
                <Typography variant="body-sm" theme="muted">
                  {member.role}
                </Typography>
                {member.nickname && (
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="italic"
                  >
                    "{member.nickname}"
                  </Typography>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant={member.is_active ? "default" : "destructive"}>
                  {member.is_active ? "Actif" : "Inactif"}
                </Badge>
                {member.years_experience > 0 && (
                  <Badge variant="outline">
                    {member.years_experience} ans exp.
                  </Badge>
                )}
                {member.availability && (
                  <Badge variant="secondary" className="capitalize">
                    {member.availability === "full-time"
                      ? "Temps plein"
                      : member.availability === "part-time"
                        ? "Temps partiel"
                        : member.availability === "contract"
                          ? "Contractuel"
                          : "Freelance"}
                  </Badge>
                )}
              </div>

              <div className="w-full pt-4 space-y-2 border-t text-left">
                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <a
                      href={`mailto:${member.email}`}
                      className="hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${member.phone}`} className="hover:underline">
                      {member.phone}
                    </a>
                  </div>
                )}
                {member.joined_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      Rejoint le{" "}
                      {new Date(member.joined_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.last_active && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      Dernière activité:{" "}
                      {new Date(member.last_active).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details & Achievements */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Professionnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {member.bio && (
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Biographie
                  </Typography>
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="italic"
                  >
                    "{member.bio}"
                  </Typography>
                </div>
              )}

              {member.quote && (
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Citation
                  </Typography>
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="italic"
                  >
                    "{member.quote}"
                  </Typography>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Expertise
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise &&
                      Array.isArray(member.expertise) &&
                      member.expertise.map((item, i) => (
                        <Badge key={i} variant="secondary">
                          {typeof item === "string"
                            ? item
                            : item.name || item.label || JSON.stringify(item)}
                        </Badge>
                      ))}
                  </div>
                </div>
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Langues
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {member.languages &&
                      Array.isArray(member.languages) &&
                      member.languages.map((item, i) => (
                        <Badge key={i} variant="outline">
                          {typeof item === "string"
                            ? item
                            : item.name || item.label || JSON.stringify(item)}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              {member.specialization && (
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Spécialisation
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    {member.specialization}
                  </Typography>
                </div>
              )}

              {member.department && (
                <div>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-2"
                  >
                    Département
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    {member.department}
                  </Typography>
                </div>
              )}

              <div>
                <Typography
                  variant="body-sm"
                  weight="semibold"
                  className="mb-2"
                >
                  Badges & Distinctions
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {member.badges &&
                    Array.isArray(member.badges) &&
                    member.badges.map((badge, i) => (
                      <Badge
                        key={i}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {typeof badge === "string"
                          ? badge
                          : badge.name || badge.label || JSON.stringify(badge)}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Typography variant="h4" weight="bold">
                    {member.projects_count || 0}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Projets
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h4" weight="bold">
                    {member.contributions_count || 0}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Contributions
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h4" weight="bold">
                    {member.years_experience || 0}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Années exp.
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          {member.social_links &&
            Object.keys(member.social_links).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Liens sociaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(member.social_links).map(
                      ([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Achievements Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Accomplissements
              </CardTitle>
              <Button size="sm" onClick={handleAddAchievement}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic">
                  Aucun accomplissement enregistré. Cliquez sur "Ajouter" pour
                  en créer.
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onEdit={() => handleEditAchievement(achievement)}
                      onDelete={() => handleDeleteAchievement(achievement)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogue d'ajout/modification d'accomplissement */}
      <TeamAchievementDialog
        open={isAchievementDialogOpen}
        onOpenChange={setIsAchievementDialogOpen}
        teamMemberId={member.id}
        initialData={editingAchievement}
        onSubmit={handleAchievementSubmit}
        loading={achievementLoading}
      />

      {/* Dialogue de confirmation de suppression d'accomplissement */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer l'accomplissement "
              {achievementToDelete?.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAchievement}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
}

// Helper function to get status border class, following entity-cards.tsx pattern
function getStatusBorder(status?: string) {
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
      return status?.startsWith("#")
        ? "border-l-4"
        : "border-l-4 border-l-primary";
  }
}

// Reusable action menu component following entity-cards.tsx pattern
function CardActionMenu({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!onEdit && !onDelete) return null;

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

// Composant pour afficher un accomplissement
function AchievementCard({
  achievement,
  onEdit,
  onDelete,
}: {
  achievement: TeamAchievement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasActions = !!onEdit || !!onDelete;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        "cursor-pointer active:scale-[0.98]",
        getStatusBorder(achievement.color),
      )}
      style={
        achievement.color?.startsWith("#")
          ? { borderLeftColor: achievement.color }
          : {}
      }
    >
      <div className="p-3 flex w-full gap-3 flex-col">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-primary">
            <Award className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant="body-base"
                weight="semibold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {achievement.title}
              </Typography>
              {hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu onEdit={onEdit} onDelete={onDelete} />
                </div>
              )}
            </div>
            {achievement.category && (
              <Badge variant="outline" className="text-xs h-5 mt-1">
                {achievement.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {achievement.description && (
            <Typography variant="body-sm" theme="muted" className="mb-2">
              {achievement.description}
            </Typography>
          )}
          {achievement.achievement_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(achievement.achievement_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
