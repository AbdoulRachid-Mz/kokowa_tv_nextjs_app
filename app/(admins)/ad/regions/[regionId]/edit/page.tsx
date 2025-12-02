"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { RegionForm } from "@/components/regions/region-form";
import { api } from "@/lib/api";
import { number } from "zod";
import { Region } from "@/types";

// interface Region {
//   id: number;
//   name: string;
//   code?: string;
//   description?: string;
//   flag_image?: string;
//   stadium_image?: string;
//   stadium_name?: string;
//   color?: string;
// }

export default function EditRegionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.regionId as string;
  const [formData, setFormData] = useState({
    id: Number(id),
    name: "",
    code: "",
    description: "",
    flag_image: "",
    stadium_image: "",
    stadium_name: "",
    color: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegion() {
      try {
        const region = await api.get<Region>(`/api/regions/${id}`);
        setFormData({
          id: region.id,
          name: region.name,
          code: region.code || "",
          description: region.description || "",
          flag_image: region.flag_image || "",
          stadium_image: region.stadium_image || "",
          stadium_name: region.stadium_name || "",
          color: region.color || "",
        });
      } catch (error: any) {
        console.error("Erreur chargement région:", error);
        alert("Erreur lors du chargement de la région");
        router.push("/regions");
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
  console.log(formData);
  return <RegionForm region={formData} isEdit={true} />;
}
