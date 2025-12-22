// components/coaches/coach-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ImageIcon, Save, X } from "lucide-react";
import { Region } from "@/types";


interface CoachFormData {
  id?: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  birth_date?: string;
  region_id?: number;
  profile_image?: string;
  license_number?: string;
  certification_level?: string;
  experience_years?: number;
  specialties?: string;
  is_active: boolean;
}

interface CoachFormProps {
  coach?: CoachFormData;
  region?: Region;
  onSuccess?: () => void;
}

const CERTIFICATION_LEVELS = [
  "Régional",
  "National",
  "International"
];

export default function CoachForm({ coach, region, onSuccess }: CoachFormProps) {
  const router = useRouter();
  const regionId = region?.id;

  const [formData, setFormData] = useState<CoachFormData>({
    first_name: "",
    last_name: "",
    nickname: "",
    birth_date: "",
    region_id: regionId ? Number(regionId) : undefined,
    profile_image: "",
    license_number: "",
    certification_level: "",
    experience_years: undefined,
    specialties: "",
    is_active: true,
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CoachFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(true);

  const filtredRegions = regions.filter((region) => region?.coach == null);
  // console.log(filtredRegions)

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (coach) {
      setFormData({
        ...coach,
        birth_date: coach.birth_date ? coach.birth_date.split("T")[0] : "",
      });
    }
  }, [coach]);

  // Charger les régions
  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch("/api/regions?with_coach");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setRegions(result.data);
          } else if (Array.isArray(result)) {
            setRegions(result);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des régions:", error);
      } finally {
        setLoadingRegions(false);
      }
    }
    loadRegions();
  }, []);

  // Quand une région est présélectionnée
  useEffect(() => {
    if (regionId) {
      setFormData((prev) => ({ ...prev, region_id: Number(regionId) }));
    }
  }, [regionId]);

  const handleChange = (field: keyof CoachFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validation
    const newErrors: Partial<Record<keyof CoachFormData, string>> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "Le prénom est requis";
    if (!formData.last_name.trim()) newErrors.last_name = "Le nom est requis";
    if (!formData.license_number?.trim()) newErrors.license_number = "Le numéro de licence est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Champs obligatoires
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("license_number", formData.license_number ?? "");

      // Champs optionnels
      if (formData.nickname) formDataToSend.append("nickname", formData.nickname);
      if (formData.birth_date) formDataToSend.append("birth_date", formData.birth_date);
      if (formData.region_id) formDataToSend.append("region_id", formData.region_id.toString());
      if (formData.profile_image) formDataToSend.append("profile_image", formData.profile_image);
      if (formData.certification_level) formDataToSend.append("certification_level", formData.certification_level);
      if (formData.experience_years) formDataToSend.append("experience_years", formData.experience_years.toString());
      if (formData.specialties) formDataToSend.append("specialties", formData.specialties);

      formDataToSend.append("is_active", formData.is_active.toString());

      const url = coach ? `/api/coaches/${coach.id}` : "/api/coaches";
      const method = coach ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${coach ? "la modification" : "la création"} du coach`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/ad/coaches");
        }
      } else {
        throw new Error(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${coach ? "la modification" : "la création"} du coach`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {coach ? "Modifier le Coach" : "Ajouter un Coach"}
          </CardTitle>
          <CardDescription>
            {coach 
              ? "Modifiez les informations du coach" 
              : "Remplissez les informations pour créer un nouveau coach"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo de profil */}
            <div className="flex flex-col items-center space-y-4">
              <Label htmlFor="profile_image" className="text-sm font-medium">
                Photo de profil
              </Label>
              <AdvancedUpload
                value={formData.profile_image || ""}
                onChange={(url) => handleChange("profile_image", url)}
                maxSizeMB={2}
                uploadPath="coaches/profiles"
                isRounded
                maxWidthOrHeight={150}
                className="w-32 h-32"
                emptyPreview={
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Photo de profil</p>
                  </div>
                }
              />
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="Prénom du coach"
                  className={errors.first_name ? "border-red-500" : ""}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Nom du coach"
                  className={errors.last_name ? "border-red-500" : ""}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nickname">Surnom</Label>
                <Input
                  id="nickname"
                  value={formData.nickname || ""}
                  onChange={(e) => handleChange("nickname", e.target.value)}
                  placeholder="Surnom (optionnel)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ""}
                  onChange={(e) => handleChange("birth_date", e.target.value)}
                />
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license_number">
                  Numéro de licence <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleChange("license_number", e.target.value)}
                  placeholder="Numéro de licence"
                  className={errors.license_number ? "border-red-500" : ""}
                />
                {errors.license_number && (
                  <p className="text-red-500 text-sm">{errors.license_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="certification_level">Niveau de certification</Label>
                <Select
                  value={formData.certification_level || ""}
                  onValueChange={(value) => handleChange("certification_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="experience_years">Années d'expérience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years || ""}
                  onChange={(e) => handleChange("experience_years", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Nombre d'années d'expérience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region_id">Région</Label>
                <Select
                  value={formData.region_id?.toString() || ""}
                  onValueChange={(value) => handleChange("region_id", value ? parseInt(value) : undefined)}
                  disabled={loadingRegions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {filtredRegions.map((region) => (
                      <SelectItem key={region.id} value={region.id.toString()}>
                        {region.name} {region.code ? `(${region.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingRegions && (
                  <p className="text-muted-foreground text-sm">Chargement des régions...</p>
                )}
              </div>
            </div>

            {/* Spécialités */}
            <div className="space-y-2">
              <Label htmlFor="specialties">Spécialités</Label>
              <Textarea
                id="specialties"
                value={formData.specialties || ""}
                onChange={(e) => handleChange("specialties", e.target.value)}
                placeholder="Domaines d'expertise, compétences particulières..."
                rows={3}
              />
            </div>

            {/* Statut */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">
                Coach actif
              </Label>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/ad/coaches")}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? `${coach ? "Modification..." : "Création..."}`
                  : `${coach ? "Modifier le coach" : "Créer le coach"}`
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}