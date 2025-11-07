"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { RegionForm } from "@/components/regions/region-form";
import { api } from "@/lib/api";

interface Region {
  id: number;
  name: string;
  code?: string;
  description?: string;
  flag_image?: string;
  color?: string;
}

export default function EditRegionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.regionId as string;
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    flag_image: "",
    color: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegion() {
      try {
        const region = await api.get<Region>(`/api/regions/${id}`);
        setFormData({
          name: region.name,
          code: region.code || "",
          description: region.description || "",
          flag_image: region.flag_image || "",
          color: region.color || "",
        });
      } catch (error: any) {
        console.error('Erreur chargement région:', error);
        alert('Erreur lors du chargement de la région');
        router.push('/regions');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRegion();
    }
  }, [id, router]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <RegionForm region={formData} isEdit={true} />
  );
}