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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  X,
  Users,
  MapPin,
  Award,
  Shield,
  Flag,
  Clock,
  Activity,
  Target,
  Divide,
} from "lucide-react";
import { Typography } from "../ui/typography";
import { cn } from "@/lib/utils";
import { createSubGroup, updateSubGroup } from "@/actions/sub-groups";
import { PhaseGroup } from "@/types";
import { toast } from "sonner";

interface SubGroupFormData {
  id?: number;
  group_id: number;
  name: string;
  sub_group_order: number;
  description?: string;
  period: "matin" | "soir";
  score_region1?: number;
  score_region2?: number;
  nulls?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "postponed";
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
  group?: PhaseGroup;
  onSuccess?: () => void;
}

export default function SubGroupForm({
  subGroup,
  group,
  onSuccess,
}: SubGroupFormProps) {
  const router = useRouter();

  // États pour les données
  const [regions, setRegions] = useState<any[]>([]);
  const [belts, setBelts] = useState<any[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [subGroups, setSubGroups] = useState<any[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SubGroupFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    regions: true,
    belts: true,
    referees: true,
    subGroups: true,
  });

  // Charger les sous-groupes existants pour calculer l'ordre
  useEffect(() => {
    const loadSubGroups = async () => {
      if (group?.id) {
        try {
          const response = await fetch(`/api/sub-groups?group_id=${group.id}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setSubGroups(result.data || []);
            } else {
              setSubGroups(result || []);
            }
          }
        } catch (error) {
          console.error("Erreur chargement des sous-groupes:", error);
        } finally {
          setLoading((prev) => ({ ...prev, subGroups: false }));
        }
      }
    };

    loadSubGroups();
  }, [group?.id]);

  // Calculer l'ordre automatique
  const calculateAutoOrder = () => {
    if (subGroup?.sub_group_order) return subGroup.sub_group_order;

    if (subGroups.length === 0) return 1;

    const maxOrder = Math.max(
      ...subGroups.map((sg) => sg.sub_group_order || 0)
    );
    return maxOrder + 1;
  };

  // Données initiales du formulaire
  const [formData, setFormData] = useState<SubGroupFormData>({
    group_id: group?.id || 0,
    name: subGroup?.name || `Rencontre ${calculateAutoOrder()}`,
    sub_group_order: subGroup?.sub_group_order || calculateAutoOrder(),
    description: subGroup?.description || "",
    period: subGroup?.period || "matin",
    score_region1: subGroup?.score_region1 || undefined,
    score_region2: subGroup?.score_region2 || undefined,
    nulls: subGroup?.nulls || undefined,
    status: subGroup?.status || "upcoming",
    region1_id: subGroup?.region1_id || undefined,
    region2_id: subGroup?.region2_id || undefined,
    belt_region1: subGroup?.belt_region1 || undefined,
    belt_region2: subGroup?.belt_region2 || undefined,
    main_referee_id: subGroup?.main_referee_id || undefined,
    is_completed: subGroup?.is_completed || false,
    is_active: subGroup?.is_active !== undefined ? subGroup.is_active : true,
  });

  // Charger les données complémentaires
  useEffect(() => {
    async function loadData() {
      try {
        // Charger les régions
        const regionsResponse = await fetch("/api/regions?is_active=true");
        if (regionsResponse.ok) {
          const regionsResult = await regionsResponse.json();
          setRegions(regionsResult.data || regionsResult || []);
        }

        // Charger les ceintures
        const beltsResponse = await fetch("/api/belts");
        if (beltsResponse.ok) {
          const beltsResult = await beltsResponse.json();
          setBelts(beltsResult.data || beltsResult || []);
        }

        // Charger les arbitres actifs
        const refereesResponse = await fetch("/api/referees?is_active=true");
        if (refereesResponse.ok) {
          const refereesResult = await refereesResponse.json();
          setReferees(refereesResult.data || refereesResult || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading({
          regions: false,
          belts: false,
          referees: false,
          subGroups: false,
        });
      }
    }
    loadData();
  }, []);

  // Mettre à jour group_id si group change
  useEffect(() => {
    if (group?.id && group.id !== formData.group_id) {
      setFormData((prev) => ({ ...prev, group_id: group.id }));
    }
  }, [group?.id, formData.group_id]);

  const handleChange = (field: keyof SubGroupFormData, value: any) => {
    // Conversion des valeurs numériques pour les scores et nulls
    if (
      field === "score_region1" ||
      field === "score_region2" ||
      field === "nulls"
    ) {
      setFormData((prev) => ({
        ...prev,
        [field]: value === "" ? undefined : Number(value),
      }));
    } else if (field === "period" || field === "status") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof SubGroupFormData, string>> = {};

    if (!formData.group_id) newErrors.group_id = "Le groupe est requis";
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";

    if (formData.sub_group_order < 1) {
      newErrors.sub_group_order = "L'ordre doit être supérieur à 0";
    }

    if (
      formData.region1_id &&
      formData.region2_id &&
      formData.region1_id === formData.region2_id
    ) {
      newErrors.region2_id = "Les deux régions doivent être différentes";
    }

    // Validation des scores (facultatif mais positif si fourni)
    if (formData.score_region1 !== undefined && formData.score_region1 < 0) {
      newErrors.score_region1 = "Le score doit être positif";
    }

    if (formData.score_region2 !== undefined && formData.score_region2 < 0) {
      newErrors.score_region2 = "Le score doit être positif";
    }

    if (formData.nulls !== undefined && formData.nulls < 0) {
      newErrors.nulls = "Le nombre de nulls doit être positif";
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
      // Créer FormData pour envoyer aux actions serveur
      const serverFormData = new FormData();
      serverFormData.set("group_id", String(formData.group_id));
      serverFormData.set("name", formData.name);
      serverFormData.set("sub_group_order", String(formData.sub_group_order));
      serverFormData.set("description", formData.description || "");

      // Nouveaux champs
      serverFormData.set("period", formData.period);
      if (formData.score_region1 !== undefined) {
        serverFormData.set("score_region1", String(formData.score_region1));
      }
      if (formData.score_region2 !== undefined) {
        serverFormData.set("score_region2", String(formData.score_region2));
      }
      if (formData.nulls !== undefined) {
        serverFormData.set("nulls", String(formData.nulls));
      }
      serverFormData.set("status", formData.status);

      serverFormData.set(
        "region1_id",
        formData.region1_id ? String(formData.region1_id) : ""
      );
      serverFormData.set(
        "region2_id",
        formData.region2_id ? String(formData.region2_id) : ""
      );
      serverFormData.set(
        "belt_region1",
        formData.belt_region1 ? String(formData.belt_region1) : ""
      );
      serverFormData.set(
        "belt_region2",
        formData.belt_region2 ? String(formData.belt_region2) : ""
      );
      serverFormData.set(
        "main_referee_id",
        formData.main_referee_id ? String(formData.main_referee_id) : ""
      );
      serverFormData.set("is_completed", String(formData.is_completed));
      serverFormData.set("is_active", String(formData.is_active));

      let result: { success: boolean; id?: number; message?: string };

      if (subGroup?.id) {
        // Mise à jour
        result = await updateSubGroup(subGroup.id, serverFormData);
      } else {
        // Création
        result = await createSubGroup(serverFormData);
      }

      if (!result.success) {
        throw new Error(result.message || "Erreur inconnue");
      }

      // Succès
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la page du groupe
        setTimeout(() => {
          toast.success(result.message);
          router.push(`/ad/sub-groups/${formData.id || 1}`);
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
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

  // Fonction pour obtenir la couleur d'une ceinture
  const getBeltColor = (beltId?: number) => {
    if (!beltId) return "#6b7280"; // Gris par défaut
    const belt = belts.find((b) => b.id === beltId);
    return belt?.color || "#6b7280";
  };

  // Rendu d'une région avec drapeau et ceinture
  const renderRegionOption = (region: any, beltColor?: string) => (
    <div className="flex items-center space-x-1">
      <div className="relative">
        <Avatar
          className="h-10 w-10 border-2"
          style={{ borderColor: beltColor }}
        >
          <AvatarImage src={region?.flag_image} alt={region.name} />
          <AvatarFallback className="bg-muted">
            <Flag className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        {beltColor && (
          <div
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background"
            style={{ backgroundColor: beltColor }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{region.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {region.code} • {region.total_fighters || 0} lutteurs
        </p>
      </div>
    </div>
  );

  // Rendu d'un arbitre avec avatar
  const renderRefereeOption = (referee: any) => (
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={referee.profile_image}
          alt={`${referee.first_name} ${referee.last_name}`}
        />
        <AvatarFallback className="bg-primary/10">
          {referee.first_name?.[0]}
          {referee.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {referee.first_name} {referee.last_name}
          {referee.nickname && ` "${referee.nickname}"`}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {referee.license_number && `Licence: ${referee.license_number}`}
          {referee.certification_level && ` • ${referee.certification_level}`}
        </p>
      </div>
    </div>
  );

  // Informations du groupe parent
  const getGroupInfo = () => {
    if (!group) return "Groupe non spécifié";

    const phaseName = group.phase?.name || "Phase inconnue";
    const editionNumber = group.phase?.edition?.edition_number;
    const editionYear = group.phase?.edition?.year;
    const competitionName =
      group.phase?.edition?.competition?.name || "Compétition inconnue";

    if (editionNumber && editionYear) {
      return `Compétition: ${competitionName} • Édition ${editionNumber} (${editionYear})`;
    }

    return `Groupe: ${group.name} (Ordre: ${group.group_order || 1})`;
  };

  return (
    <div className="mx-auto">
      <Card className="p-2">
        <CardHeader>
          <CardTitle>
            {subGroup?.id ? "Modifier la Rencontre" : "Nouvelle Rencontre"}
          </CardTitle>
          <CardDescription>
            {subGroup?.id
              ? "Modifiez les informations de la rencontre"
              : `Créez une nouvelle rencontre dans ${getGroupInfo()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations du groupe parent */}
            {group && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="body-base" weight="medium">
                      {group.name || "Groupe sans nom"}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      {getGroupInfo()}
                    </Typography>
                    {group.description && (
                      <Typography variant="body-sm" className="mt-1">
                        {group.description}
                      </Typography>
                    )}
                  </div>
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            )}

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

            {/* Nouveaux champs : Période, Scores et Statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              {/* Période */}
              <div className="space-y-2">
                <Label htmlFor="period" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Période
                </Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) =>
                    handleChange("period", value as "matin" | "soir")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matin">Matin</SelectItem>
                    <SelectItem value="soir">Soir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Score Région 1 */}
              <div className="space-y-2">
                <Label
                  htmlFor="score_region1"
                  className="flex items-center gap-1"
                >
                  <Target className="h-4 w-4" />
                  Score Région 1
                </Label>
                <Input
                  id="score_region1"
                  type="number"
                  min="0"
                  value={
                    formData.score_region1 === undefined
                      ? ""
                      : formData.score_region1
                  }
                  onChange={(e) =>
                    handleChange("score_region1", e.target.value)
                  }
                  placeholder="0"
                  className={errors.score_region1 ? "border-red-500" : ""}
                />
                {errors.score_region1 && (
                  <p className="text-red-500 text-xs">{errors.score_region1}</p>
                )}
              </div>

              {/* Score Région 2 */}
              <div className="space-y-2">
                <Label
                  htmlFor="score_region2"
                  className="flex items-center gap-1"
                >
                  <Target className="h-4 w-4" />
                  Score Région 2
                </Label>
                <Input
                  id="score_region2"
                  type="number"
                  min="0"
                  value={
                    formData.score_region2 === undefined
                      ? ""
                      : formData.score_region2
                  }
                  onChange={(e) =>
                    handleChange("score_region2", e.target.value)
                  }
                  placeholder="0"
                  className={errors.score_region2 ? "border-red-500" : ""}
                />
                {errors.score_region2 && (
                  <p className="text-red-500 text-xs">{errors.score_region2}</p>
                )}
              </div>

              {/* Nulls */}
              <div className="space-y-2">
                <Label htmlFor="nulls" className="flex items-center gap-1">
                  <Divide className="h-4 w-4" />
                  Matchs Nuls
                </Label>
                <Input
                  id="nulls"
                  type="number"
                  min="0"
                  value={formData.nulls === undefined ? "" : formData.nulls}
                  onChange={(e) => handleChange("nulls", e.target.value)}
                  placeholder="0"
                  className={errors.nulls ? "border-red-500" : ""}
                />
                {errors.nulls && (
                  <p className="text-red-500 text-xs">{errors.nulls}</p>
                )}
              </div>
            </div>

            {/* Configuration des régions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Région 1 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div
                      className="h-4 w-4 rounded-full border-2 border-background"
                      style={{
                        backgroundColor: getBeltColor(formData.belt_region1),
                      }}
                    />
                  </div>
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
                      <SelectValue placeholder="Sélectionnez une région">
                        {formData.region1_id && regions.length > 0 ? (
                          renderRegionOption(
                            regions.find((r) => r.id === formData.region1_id),
                            getBeltColor(formData.belt_region1)
                          )
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-muted">
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <span>Sélectionnez une région</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem
                          key={region.id}
                          value={region.id.toString()}
                        >
                          {renderRegionOption(
                            region,
                            getBeltColor(formData.belt_region1)
                          )}
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
                      <SelectValue placeholder="Ceinture de la région 1">
                        {formData.belt_region1 && belts.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>
                              Ceinture{" "}
                              {
                                belts.find(
                                  (b) => b.id === formData.belt_region1
                                )?.color
                              }
                            </span>
                          </div>
                        ) : (
                          "Sélectionnez une ceinture"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {belts.map((belt) => (
                        <SelectItem key={belt.id} value={belt.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: belt.color }}
                            />
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
                  <div className="relative">
                    <div
                      className="h-4 w-4 rounded-full border-2 border-background"
                      style={{
                        backgroundColor: getBeltColor(formData.belt_region2),
                      }}
                    />
                  </div>
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
                      <SelectValue placeholder="Sélectionnez une région">
                        {formData.region2_id && regions.length > 0 ? (
                          renderRegionOption(
                            regions.find((r) => r.id === formData.region2_id),
                            getBeltColor(formData.belt_region2)
                          )
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-muted">
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <span>Sélectionnez une région</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem
                          key={region.id}
                          value={region.id.toString()}
                        >
                          {renderRegionOption(
                            region,
                            getBeltColor(formData.belt_region2)
                          )}
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
                      <SelectValue placeholder="Ceinture de la région 2">
                        {formData.belt_region2 && belts.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>
                              Ceinture{" "}
                              {
                                belts.find(
                                  (b) => b.id === formData.belt_region2
                                )?.color
                              }
                            </span>
                          </div>
                        ) : (
                          "Sélectionnez une ceinture"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {belts.map((belt) => (
                        <SelectItem key={belt.id} value={belt.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: belt.color }}
                            />
                            <span>Ceinture {belt.color}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Statut de la rencontre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Statut de la rencontre
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as SubGroupFormData["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">À venir</SelectItem>
                    <SelectItem value="ongoing">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="postponed">Reporté</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectValue placeholder="Sélectionnez un arbitre principal">
                      {formData.main_referee_id && referees.length > 0 ? (
                        renderRefereeOption(
                          referees.find(
                            (r) => r.id === formData.main_referee_id
                          )
                        )
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted">
                              <Users className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <span>Sélectionnez un arbitre</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {referees.map((referee) => (
                      <SelectItem
                        key={referee.id}
                        value={referee.id.toString()}
                      >
                        {renderRefereeOption(referee)}
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

            {/* Résumé visuel */}
            {(formData.region1_id || formData.region2_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Résumé de la rencontre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {/* Région 1 */}
                    <div className="flex flex-col items-center space-y-2">
                      {formData.region1_id && (
                        <>
                          <div className="relative">
                            <Avatar
                              className="h-16 w-16 border-4"
                              style={{
                                borderColor: getBeltColor(
                                  formData.belt_region1
                                ),
                              }}
                            >
                              <AvatarImage
                                src={
                                  regions.find(
                                    (r) => r.id === formData.region1_id
                                  )?.flag_image
                                }
                                alt={
                                  regions.find(
                                    (r) => r.id === formData.region1_id
                                  )?.name
                                }
                              />
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                            {formData.belt_region1 && (
                              <Badge
                                className="absolute -bottom-1 -right-1 px-2 py-1"
                                style={{
                                  backgroundColor: getBeltColor(
                                    formData.belt_region1
                                  ),
                                }}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Ceinture
                              </Badge>
                            )}
                          </div>
                          <Typography variant="body-base" weight="medium">
                            {regions.find((r) => r.id === formData.region1_id)
                              ?.name || "Région inconnue"}
                          </Typography>
                        </>
                      )}
                    </div>

                    {/* VS avec informations */}
                    <div className="flex flex-col items-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        VS
                      </Badge>
                      <div className="mt-2 text-center">
                        <Typography variant="caption2" theme="muted">
                          Période:{" "}
                          <span className="font-semibold">
                            {formData.period === "matin" ? "Matin" : "Soir"}
                          </span>
                        </Typography>
                        <Typography variant="caption2" theme="muted">
                          Statut:{" "}
                          <Badge
                            variant={
                              formData.status === "completed"
                                ? "default"
                                : formData.status === "ongoing"
                                ? "secondary"
                                : formData.status === "cancelled"
                                ? "destructive"
                                : formData.status === "postponed"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {formData.status === "upcoming"
                              ? "À venir"
                              : formData.status === "ongoing"
                              ? "En cours"
                              : formData.status === "completed"
                              ? "Terminé"
                              : formData.status === "cancelled"
                              ? "Annulé"
                              : "Reporté"}
                          </Badge>
                        </Typography>
                        {(formData.score_region1 !== undefined ||
                          formData.score_region2 !== undefined) && (
                          <Typography variant="caption2" theme="muted">
                            Score:{" "}
                            <span className="font-semibold">
                              {formData.score_region1 || 0} -{" "}
                              {formData.score_region2 || 0}
                              {formData.nulls !== undefined &&
                                ` (${formData.nulls} nuls)`}
                            </span>
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Région 2 */}
                    <div className="flex flex-col items-center space-y-2">
                      {formData.region2_id && (
                        <>
                          <div className="relative">
                            <Avatar
                              className="h-16 w-16 border-4"
                              style={{
                                borderColor: getBeltColor(
                                  formData.belt_region2
                                ),
                              }}
                            >
                              <AvatarImage
                                src={
                                  regions.find(
                                    (r) => r.id === formData.region2_id
                                  )?.flag_image
                                }
                                alt={
                                  regions.find(
                                    (r) => r.id === formData.region2_id
                                  )?.name
                                }
                              />
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                            {formData.belt_region2 && (
                              <Badge
                                className="absolute -bottom-1 -right-1 px-2 py-1"
                                style={{
                                  backgroundColor: getBeltColor(
                                    formData.belt_region2
                                  ),
                                }}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Ceinture
                              </Badge>
                            )}
                          </div>
                          <Typography variant="body-base" weight="medium">
                            {regions.find((r) => r.id === formData.region2_id)
                              ?.name || "Région inconnue"}
                          </Typography>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arbitre */}
                  {formData.main_referee_id && (
                    <div className="mt-6 pt-4 border-t flex items-center justify-center space-x-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm" theme="muted">
                        Arbitre:{" "}
                        <span className="font-medium">
                          {
                            referees.find(
                              (r) => r.id === formData.main_referee_id
                            )?.first_name
                          }{" "}
                          {
                            referees.find(
                              (r) => r.id === formData.main_referee_id
                            )?.last_name
                          }
                        </span>
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {subGroup?.id ? "Modification..." : "Création..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {subGroup?.id
                      ? "Modifier la rencontre"
                      : "Créer la rencontre"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
