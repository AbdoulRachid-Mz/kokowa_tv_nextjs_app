"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeamMemberById } from "@/actions/teams";
import { TeamMember } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Mail, 
  Globe, 
  Award, 
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Star
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function TeamMemberDetailPage() {
  const { teamMemberId } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await getTeamMemberById(Number(teamMemberId));
        setMember(data);
      } catch (error) {
        console.error("Error fetching team member:", error);
      } finally {
        setLoading(false);
      }
    };

    if (teamMemberId) {
      fetchMember();
    }
  }, [teamMemberId]);

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
              Consultez et gérez les informations de {member.full_name}
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
          <Button 
            variant="destructive"
            onClick={async () => {
              if (confirm("Voulez-vous vraiment supprimer ce membre ?")) {
                // Import and call delete action (not shown here but should be in actions/teams.ts)
                router.push("/ad/teams");
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-lg">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold">
                    {member.full_name[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Typography variant="h4" weight="bold">
                    {member.full_name}
                  </Typography>
                  {member.is_lead && (
                    <Badge variant="default" className="h-5">Lead</Badge>
                  )}
                </div>
                <Typography variant="body-sm" theme="muted">
                  {member.role}
                </Typography>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant={member.is_active ? "default" : "destructive"}>
                  {member.is_active ? "Actif" : "Inactif"}
                </Badge>
                {member.years_experience && (
                  <Badge variant="outline">{member.years_experience} ans exp.</Badge>
                )}
              </div>

              <div className="w-full pt-4 space-y-2 border-t text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Rejoint le {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                {member.last_active && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Dernière activité: {new Date(member.last_active).toLocaleDateString()}</span>
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
                  <Typography variant="body-sm" weight="semibold" className="mb-2">Biographie</Typography>
                  <Typography variant="body-sm" theme="muted" className="italic">
                    "{member.bio}"
                  </Typography>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Typography variant="body-sm" weight="semibold" className="mb-2">Expertise</Typography>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise && Array.isArray(member.expertise) && member.expertise.map((item, i) => (
                      <Badge key={i} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Typography variant="body-sm" weight="semibold" className="mb-2">Langues</Typography>
                  <div className="flex flex-wrap gap-2">
                    {member.languages && Array.isArray(member.languages) && member.languages.map((item, i) => (
                      <Badge key={i} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Typography variant="body-sm" weight="semibold" className="mb-2">Badges & Distinctions</Typography>
                <div className="flex flex-wrap gap-2">
                  {member.badges && Array.isArray(member.badges) && member.badges.map((badge, i) => (
                    <Badge key={i} className="bg-yellow-500 hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1 fill-current" /> {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Accomplissements</CardTitle>
              <Button size="sm">Ajouter</Button>
            </CardHeader>
            <CardContent>
              {member.achievements && member.achievements.length > 0 ? (
                <div className="space-y-4">
                  {member.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                        achievement.color || "bg-primary"
                      )}>
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <Typography variant="body-lg" weight="bold">{achievement.title}</Typography>
                          <Typography variant="caption2" theme="muted">
                            {achievement.achievement_date ? new Date(achievement.achievement_date).toLocaleDateString() : ''}
                          </Typography>
                        </div>
                        <Typography variant="body-sm" theme="muted" className="mt-1">
                          {achievement.description}
                        </Typography>
                        {achievement.category && (
                          <Badge variant="outline" className="mt-2 text-[10px]">{achievement.category}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground italic">
                  Aucun accomplissement enregistré.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
