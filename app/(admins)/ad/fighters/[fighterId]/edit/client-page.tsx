"use client";

import FighterForm from "@/components/lutteurs/figther-form";
import { api } from "@/lib/api";
import { Fighter } from "@/types";
import { useEffect, useState } from "react";

interface Props {
  fighterId: string;
}

const ClienttFigtherPage = ({ fighterId }: Props) => {
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const parsedFighterId = parseInt(fighterId, 10);
  const [loading, setLoading] = useState(false);

  const loadFighter = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>(`/api/fighters/${parsedFighterId}?with_relations=true`);
      setFighter(response);
    } catch (error) {
      console.error("Erreur chargement lutteur:", error);
      setFighter(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!parsedFighterId) return;
    loadFighter();
  }, [parsedFighterId]);

  if(loading) {
    return <div>Chargement...</div>;
  }

  if (!fighter) {
    return <div>Erreur: Lutteur non trouvé</div>;
  }

  return <FighterForm fighter={fighter} region={fighter.region} />;
};

export default ClienttFigtherPage;
