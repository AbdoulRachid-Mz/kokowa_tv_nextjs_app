// app/admin/coaches/[coachId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CoachForm from "@/components/coaches/coach-form";
import { Coach } from "@/types";

export default function EditCoachPage() {
  const { coachId } = useParams();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      loadCoach();
    }
  }, [coachId]);

  const loadCoach = async () => {
    try {
      const response = await fetch(`/api/coaches/${coachId}`);
      if (response.ok) {
        const result = await response.json();
        setCoach(result.coach);
      }
    } catch (error) {
      console.error("Erreur chargement coach:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  if (!coach) {
    return <div className="text-center py-20">Coach non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachForm coach={coach} />
    </div>
  );
}