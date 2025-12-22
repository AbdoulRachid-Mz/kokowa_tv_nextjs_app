"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Referee } from "@/types";
import { RefereeForm } from "@/components/referees/referee-form";

export default function EditRefereePage() {
  const params = useParams();
  const [referee, setReferee] = useState<Referee | null>(null);
  const [loading, setLoading] = useState(true);

  const refereeId = params.refereeId as string;

  useEffect(() => {
    const fetchReferee = async () => {
      try {
        const response = await fetch(`/api/referees/${refereeId}`);
        if (response.ok) {
          const data = await response.json();
          setReferee(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    if (refereeId) {
      fetchReferee();
    }
  }, [refereeId]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!referee) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold">Arbitre non trouvé</h1>
      </div>
    );
  }

  return <RefereeForm referee={referee} isEditing={true} />;
}