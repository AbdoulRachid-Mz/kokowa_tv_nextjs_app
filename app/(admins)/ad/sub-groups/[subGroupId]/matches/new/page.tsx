// app/admin/sub-groups/[subGroupId]/matches/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MatchForm from "@/components/matches/match-form";
import { SubGroup } from "@/types";

export default function CreateMatchInSubGroupPage() {
  const { subGroupId } = useParams();
  const router = useRouter();
  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subGroupId) {
      loadSubGroup();
    }
  }, [subGroupId]);

  const loadSubGroup = async () => {
    try {
      const response = await fetch(`/api/sub-groups/${subGroupId}`);
      if (response.ok) {
        const result = await response.json();
        setSubGroup(result);
      }
    } catch (error) {
      console.error("Erreur chargement sous-groupe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/ad/sub-groups/${subGroupId}`);
  };

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  if (!subGroup) {
    return <div className="text-center py-20">Sous-groupe non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MatchForm
        subGroupId={parseInt(subGroupId as string)}
        subGroup={subGroup}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
