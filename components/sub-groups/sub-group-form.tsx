// components/sub-groups/sub-group-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Save, X, Users, MapPin, Award } from "lucide-react";
import { Typography } from "../ui/typography";

interface PhaseGroup {
  id: number;
  name: string;
  group_order: number;
  phase?: {
    id: number;
    name: string;
    edition?: {
      id: number;
      edition_number: number;
      year: number;
    };
  };
}

interface Region {
  id: number;
  name: string;
  code: string;
}

interface Belt {
  id: number;
  color: string;
}

interface Referee {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
}

interface SubGroupFormData {
  id?: number;
  group_id: number;
  name: string;
  sub_group_order: number;
  description?: string;
  region1_id?: number;
  region2_id?: number;
  belt_region1?: number;
  belt_region2?: number;
  main_referee_id?: number;
  is_completed: boolean;
  is_active: boolean;
}

interface SubGroupFormProps {
  subGroup?: SubGroupFormData;
  onSuccess?: () => void;
}

export default function SubGroupForm({
  subGroup,
  onSuccess,
}: SubGroupFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<SubGroupFormData>({
    group_id: 0,
    name: "",
    sub_group_order: 1,
    description: "",
    region1_id: undefined,
    region2_id: undefined,
    belt_region1: undefined,
    belt_region2: undefined,
    main_referee_id: undefined,
    is_completed: false,
    is_active: true,
  });

  const [phaseGroups, setPhaseGroups] = useState<PhaseGroup[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SubGroupFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    phaseGroups: true,
    regions: true,
    belts: true,
    referees: true,
  });

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (subGroup) {
      setFormData({
        ...subGroup,
      });
    }
  }, [subGroup]);

  // Charger les données
  useEffect(() => {
    async function loadData() {
      try {
        // Charger les groupes de phase
        const groupsResponse = await fetch("/api/phase-groups?with_phase=true");
        if (groupsResponse.ok) {
          const groupsResult = await groupsResponse.json();
          setPhaseGroups(groupsResult.data || []);
        }

        // Charger les régions
        const regionsResponse = await fetch("/api/regions");
        if (regionsResponse.ok) {
          const regionsResult = await regionsResponse.json();
          setRegions(regionsResult.data || []);
        }

        // Charger les ceintures
        const beltsResponse = await fetch("/api/belts");
        if (beltsResponse.ok) {
          const beltsResult = await beltsResponse.json();
          setBelts(beltsResult.data || []);
        }

        // Charger les arbitres actifs
        const refereesResponse = await fetch("/api/referees?is_active=true");
        if (refereesResponse.ok) {
          const refereesResult = await refereesResponse.json();
          setReferees(refereesResult.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading({
          phaseGroups: false,
          regions: false,
          belts: false,
          referees: false,
        });
      }
    }
    loadData();
  }, []);

  const handleChange = (field: keyof SubGroupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof SubGroupFormData, string>> = {};

    if (!formData.group_id)
      newErrors.group_id = "Le groupe de phase est requis";
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.sub_group_order || formData.sub_group_order < 1) {
      newErrors.sub_group_order = "L'ordre doit être supérieur à 0";
    }

    if (
      formData.region1_id &&
      formData.region2_id &&
      formData.region1_id === formData.region2_id
    ) {
      newErrors.region2_id = "Les deux régions doivent être différentes";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Champs obligatoires
      formDataToSend.append("group_id", formData.group_id.toString());
      formDataToSend.append("name", formData.name);
      formDataToSend.append(
        "sub_group_order",
        formData.sub_group_order.toString()
      );
      formDataToSend.append("is_completed", formData.is_completed.toString());
      formDataToSend.append("is_active", formData.is_active.toString());

      // Champs optionnels
      if (formData.description)
        formDataToSend.append("description", formData.description);
      if (formData.region1_id)
        formDataToSend.append("region1_id", formData.region1_id.toString());
      if (formData.region2_id)
        formDataToSend.append("region2_id", formData.region2_id.toString());
      if (formData.belt_region1)
        formDataToSend.append("belt_region1", formData.belt_region1.toString());
      if (formData.belt_region2)
        formDataToSend.append("belt_region2", formData.belt_region2.toString());
      if (formData.main_referee_id)
        formDataToSend.append(
          "main_referee_id",
          formData.main_referee_id.toString()
        );

      const url = subGroup
        ? `/api/sub-groups/${subGroup.id}`
        : "/api/sub-groups";
      const method = subGroup ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${
              subGroup ? "la modification" : "la création"
            } de la rencontre`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/ad/sub-groups");
        }
      } else {
        throw new Error(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${
              subGroup ? "la modification" : "la création"
            } de la rencontre`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPhaseGroupDescription = (groupId: number) => {
    const group = phaseGroups.find((g) => g.id === groupId);
    if (!group) return "";

    return `Groupe ${group.group_order} - ${group.phase?.name} (Édition ${group.phase?.edition?.edition_number} - ${group.phase?.edition?.year})`;
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {subGroup ? "Modifier la Rencontre" : "Nouvelle Rencontre"}
          </CardTitle>
          <CardDescription>
            {subGroup
              ? "Modifiez les informations de la rencontre"
              : "Créez une nouvelle rencontre entre deux régions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Groupe de phase */}
              <div className="space-y-2">
                <Label htmlFor="group_id">
                  Groupe de Phase <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.group_id.toString()}
                  onValueChange={(value) =>
                    handleChange("group_id", Number(value))
                  }
                  disabled={loading.phaseGroups}
                >
                  <SelectTrigger
                    className={errors.group_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getPhaseGroupDescription(group.id)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.group_id && (
                  <p className="text-red-500 text-sm">{errors.group_id}</p>
                )}
                {loading.phaseGroups && (
                  <p className="text-muted-foreground text-sm">
                    Chargement des groupes...
                  </p>
                )}
              </div>

              {/* Ordre du sous-groupe */}
              <div className="space-y-2">
                <Label htmlFor="sub_group_order">
                  Ordre dans le groupe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sub_group_order"
                  type="number"
                  min="1"
                  value={formData.sub_group_order}
                  onChange={(e) =>
                    handleChange("sub_group_order", Number(e.target.value))
                  }
                  className={errors.sub_group_order ? "border-red-500" : ""}
                />
                {errors.sub_group_order && (
                  <p className="text-red-500 text-sm">
                    {errors.sub_group_order}
                  </p>
                )}
              </div>
            </div>

            {/* Nom et description */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de la rencontre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Rencontre A1 - Tahoua vs Maradi"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description de la rencontre..."
                rows={3}
              />
            </div>

            {/* Configuration des régions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Région 1 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <Label htmlFor="region1_id">Région 1</Label>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.region1_id?.toString() || ""}
                    onValueChange={(value) =>
                      handleChange("region1_id", Number(value))
                    }
                    disabled={loading.regions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem
                          key={region.id}
                          value={region.id.toString()}
                        >
                          {region.name} ({region.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.belt_region1?.toString() || ""}
                    onValueChange={(value) =>
                      handleChange("belt_region1", Number(value))
                    }
                    disabled={loading.belts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ceinture de la région 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {belts.map((belt) => (
                        <SelectItem key={belt.id} value={belt.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>Ceinture {belt.color}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Région 2 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <Label htmlFor="region2_id">Région 2</Label>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.region2_id?.toString() || ""}
                    onValueChange={(value) =>
                      handleChange("region2_id", Number(value))
                    }
                    disabled={loading.regions}
                  >
                    <SelectTrigger
                      className={errors.region2_id ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Sélectionnez une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem
                          key={region.id}
                          value={region.id.toString()}
                        >
                          {region.name} ({region.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region2_id && (
                    <p className="text-red-500 text-sm">{errors.region2_id}</p>
                  )}

                  <Select
                    value={formData.belt_region2?.toString() || ""}
                    onValueChange={(value) =>
                      handleChange("belt_region2", Number(value))
                    }
                    disabled={loading.belts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ceinture de la région 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {belts.map((belt) => (
                        <SelectItem key={belt.id} value={belt.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>Ceinture {belt.color}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Arbitre principal */}
            <div className="space-y-2">
              <Label htmlFor="main_referee_id">Arbitre Principal</Label>
              <Select
                value={formData.main_referee_id?.toString() || ""}
                onValueChange={(value) =>
                  handleChange("main_referee_id", Number(value))
                }
                disabled={loading.referees}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un arbitre principal" />
                </SelectTrigger>
                <SelectContent>
                  {referees.map((referee) => (
                    <SelectItem key={referee.id} value={referee.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {referee.first_name} {referee.last_name}
                          {referee.nickname && ` "${referee.nickname}"`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading.referees && (
                <p className="text-muted-foreground text-sm">
                  Chargement des arbitres...
                </p>
              )}
            </div>

            {/* Statuts */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleChange("is_active", checked)
                  }
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Rencontre active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_completed"
                  checked={formData.is_completed}
                  onCheckedChange={(checked) =>
                    handleChange("is_completed", checked)
                  }
                />
                <Label htmlFor="is_completed" className="text-sm font-medium">
                  Rencontre terminée
                </Label>
              </div>
            </div>

            {/* Résumé */}
            {(formData.region1_id || formData.region2_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Résumé de la rencontre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Région 1
                      </Typography>
                      <Typography>
                        {regions.find((r) => r.id === formData.region1_id)
                          ?.name || "Non sélectionnée"}
                        {formData.belt_region1 &&
                          ` - Ceinture ${
                            belts.find((b) => b.id === formData.belt_region1)
                              ?.color
                          }`}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Région 2
                      </Typography>
                      <Typography>
                        {regions.find((r) => r.id === formData.region2_id)
                          ?.name || "Non sélectionnée"}
                        {formData.belt_region2 &&
                          ` - Ceinture ${
                            belts.find((b) => b.id === formData.belt_region2)
                              ?.color
                          }`}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Arbitre
                      </Typography>
                      <Typography>
                        {referees.find((r) => r.id === formData.main_referee_id)
                          ? `${
                              referees.find(
                                (r) => r.id === formData.main_referee_id
                              )?.first_name
                            } ${
                              referees.find(
                                (r) => r.id === formData.main_referee_id
                              )?.last_name
                            }`
                          : "Non assigné"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Statut
                      </Typography>
                      <Typography>
                        {formData.is_active ? "Active" : "Inactive"} -{" "}
                        {formData.is_completed ? "Terminée" : "En cours"}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/ad/sub-groups")}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? `${subGroup ? "Modification..." : "Création..."}`
                  : `${
                      subGroup ? "Modifier la rencontre" : "Créer la rencontre"
                    }`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
