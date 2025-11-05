"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ParticipantsManager } from "@/components/editions/participants-manager";
import { CompetitionEdition } from "@/types";

export default function EditionRegionsPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params.editionId as string;
  const [edition, setEdition] = useState<CompetitionEdition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEdition = async () => {
      try {
        const response = await fetch(`/api/editions/${editionId}?with_relations=true`);
        if (response.ok) {
          const data = await response.json();
          setEdition(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'édition:", error);
      } finally {
        setLoading(false);
      }
    };

    if (editionId) {
      fetchEdition();
    }
  }, [editionId]);

  const handleParticipantsUpdate = () => {
    // Recharger les données de l'édition
    fetch(`/api/editions/${editionId}?with_relations=true`)
      .then(res => res.json())
      .then(data => setEdition(data))
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="container mx-auto py-6">
        <Typography variant="h2">Édition non trouvée</Typography>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/admin/editions/${editionId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Typography variant="h2">
              Gestion des Régions - Édition {edition.edition_number}
            </Typography>
            <Typography variant="body-lg" theme="muted">
              {edition.competition?.name} • {edition.year}
            </Typography>
          </div>
        </div>
      </div>

      {/* Gestionnaire de régions */}
      <ParticipantsManager
        editionId={parseInt(editionId)}
        type="regions"
        currentParticipants={edition.regions || []}
        onParticipantsUpdate={handleParticipantsUpdate}
      />
    </div>
  );
}