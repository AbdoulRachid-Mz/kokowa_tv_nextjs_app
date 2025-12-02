// app/admin/sub-groups/[subGroupId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SubGroupForm from "@/components/sub-groups/sub-group-form";
import { SubGroup } from "@/types";

export default function EditSubGroupPage() {
  const { subGroupId } = useParams();
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
        setSubGroup(result.subGroup);
      }
    } catch (error) {
      console.error("Erreur chargement sous-groupe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  if (!subGroup) {
    return <div className="text-center py-20">Sous-groupe non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SubGroupForm
        subGroup={{ ...subGroup, is_active: subGroup.is_active ?? true }}
      />
    </div>
  );
}
