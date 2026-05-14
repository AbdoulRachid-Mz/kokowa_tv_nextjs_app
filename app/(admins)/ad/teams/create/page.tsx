"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamMember } from "@/actions/teams";
import { TeamMemberForm } from "@/components/entities/team-member-form";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const result = await createTeamMember(data);
      if (result) {
        toast.success("Membre créé avec succès");
        router.push("/ad/teams");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating team member:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Typography variant="h2" weight="bold" className="flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Nouveau Membre
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Ajoutez un nouveau talent à l'équipe Kokowa TV
          </Typography>
        </div>
      </div>

      <TeamMemberForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
