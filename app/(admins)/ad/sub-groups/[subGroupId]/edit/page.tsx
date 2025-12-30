// app/admin/sub-groups/[subGroupId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SubGroupForm from "@/components/sub-groups/sub-group-form";

export default function EditSubGroupPage() {
  const { subGroupId } = useParams();
  const [subGroup, setSubGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subGroupId) {
      loadSubGroup();
    }
  }, [subGroupId]);

  const loadSubGroup = async () => {
    try {
      const response = await fetch(`/api/sub-groups/${subGroupId}?with_relations=true`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (result.success) {
        setSubGroup(result.data);
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        setSubGroup(result);
      }
    } catch (error: any) {
      console.error("Erreur chargement sous-groupe:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la rencontre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-20">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!subGroup) {
    return (
      <div className="container mx-auto py-20">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sous-groupe non trouvé</h1>
          <p className="text-muted-foreground">
            Le sous-groupe avec l'ID {subGroupId} n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données du formulaire
  const formData = {
    id: subGroup.id,
    group_id: subGroup.group_id,
    name: subGroup.name,
    sub_group_order: subGroup.sub_group_order,
    description: subGroup.description,
    period: subGroup.period || 'matin',
    score_region1: subGroup.score_region1,
    score_region2: subGroup.score_region2,
    nulls: subGroup.nulls,
    status: subGroup.status || 'upcoming',
    region1_id: subGroup.region1_id,
    region2_id: subGroup.region2_id,
    belt_region1: subGroup.belt_region1,
    belt_region2: subGroup.belt_region2,
    main_referee_id: subGroup.main_referee_id,
    is_completed: subGroup.is_completed || false,
    is_active: subGroup.is_active ?? true,
  };


  // Préparer les données du groupe
  const groupData = subGroup.group || {
    id: subGroup.group_id,
    name: "Groupe inconnu",
    group_order: 1,
    phase: subGroup.group?.phase || {
      name: "Phase inconnue",
      edition: subGroup.group?.phase?.edition || {
        edition_number: 1,
        year: new Date().getFullYear(),
        competition: { name: "Compétition inconnue" }
      }
    }
  };

  console.log('Données chargées:', { formData, groupData });

  return (
    <div className="min-h-screen bg-gray-50">
      <SubGroupForm
        subGroup={formData}
        group={groupData}
      />
    </div>
  );
}