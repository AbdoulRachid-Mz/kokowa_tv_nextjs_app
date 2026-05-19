"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeamMemberById, updateTeamMember } from "@/actions/teams";
import { TeamMemberForm } from "@/components/entities/team-member-form";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TeamMember } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTeamMemberPage() {
  const { teamMemberId } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await getTeamMemberById(Number(teamMemberId));
        setMember(data);
      } catch (error) {
        console.error("Error fetching team member:", error);
        toast.error("Erreur lors de la récupération du membre");
      } finally {
        setLoading(false);
      }
    };

    if (teamMemberId) {
      fetchMember();
    }
  }, [teamMemberId]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const result = await updateTeamMember(Number(teamMemberId), data);
      if (result) {
        toast.success("Membre mis à jour avec succès");
        router.push("/ad/teams");
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6 text-center space-y-4">
        <Typography variant="h4">Membre non trouvé</Typography>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }
  const full_name = member.first_name + member.last_name;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Typography variant="h2" weight="bold" className="flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Modifier {full_name}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Mettez à jour les informations de votre collaborateur
          </Typography>
        </div>
      </div>

      <TeamMemberForm 
        initialData={member} 
        onSubmit={handleSubmit} 
        loading={submitting} 
      />
    </div>
  );
}
