"use client";

import { useState, useEffect, useCallback } from "react";
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
  Plus,
  Trash2,
  Users,
  MapPin,
  Award,
  Shield,
  Flag,
  Search,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Hash,
  Star,
  Medal,
} from "lucide-react";
import { Typography } from "../ui/typography";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createSubGroup } from "@/actions/sub-groups";

interface SubGroupFormData {
  id?: number;
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

interface SubGroupFormV2Props {
  groupId: number;
  subGroup?: SubGroupFormData;
  groupData?: any; // Données du groupe préchargées
  onSuccess?: () => void;
}

export default function SubGroupFormV2({
  groupId,
  subGroup,
  groupData: initialGroupData,
  onSuccess,
}: SubGroupFormV2Props) {
  const router = useRouter();

  // États principaux
  const [groupData, setGroupData] = useState<any>(initialGroupData || null);
  const [subGroups, setSubGroups] = useState<SubGroupFormData[]>([]);
  const [newSubGroups, setNewSubGroups] = useState<SubGroupFormData[]>([]);

  // États pour les données de référence
  const [regions, setRegions] = useState<any[]>([]);
  const [belts, setBelts] = useState<any[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [editionRegions, setEditionRegions] = useState<any[]>([]);

  // États de chargement
  const [loading, setLoading] = useState({
    group: !initialGroupData,
    regions: true,
    belts: true,
    referees: true,
    editionRegions: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculer le prochain ordre disponible
  const calculateNextOrder = useCallback(() => {
    if (subGroups.length === 0) return 1;

    // Trouver le plus grand ordre parmi les sous-groupes existants
    const maxOrder = Math.max(
      ...subGroups.map((sg) => sg.sub_group_order || 0)
    );
    return maxOrder + 1;
  }, [subGroups]);

  // Initialiser les nouveaux sous-groupes
  useEffect(() => {
    if (subGroups.length > 0) {
      const nextOrder = calculateNextOrder();
      setNewSubGroups([
        {
          name: `Combat ${nextOrder}`,
          sub_group_order: nextOrder,
          description: "",
          is_completed: false,
          is_active: true,
        },
      ]);
    } else {
      setNewSubGroups([
        {
          name: "Combat 1",
          sub_group_order: 1,
          description: "",
          is_completed: false,
          is_active: true,
        },
      ]);
    }
  }, [subGroups, calculateNextOrder]);

  // Charger les données du groupe et de l'édition
  useEffect(() => {
    const loadGroupData = async () => {
      if (initialGroupData) return;

      setLoading((prev) => ({ ...prev, group: true }));
      try {
        const response = await fetch(
          `/api/phase-groups/${groupId}?with_relations=true`
        );
        if (response.ok) {
          const data = await response.json();
          setGroupData(data);

          // Charger les sous-groupes existants
          if (data.sub_groups) {
            setSubGroups(data.sub_groups);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du groupe:", error);
      } finally {
        setLoading((prev) => ({ ...prev, group: false }));
      }
    };

    if (groupId) {
      loadGroupData();
    }
  }, [groupId, initialGroupData]);

  // Charger les données de référence
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        // Charger toutes les régions
        const regionsResponse = await fetch(
          "/api/regions?is_active=true&limit=1000"
        );
        if (regionsResponse.ok) {
          const regionsData = await regionsResponse.json();
          setRegions(regionsData.data || regionsData || []);
        }

        // Charger les ceintures
        const beltsResponse = await fetch("/api/belts?is_active=true");
        if (beltsResponse.ok) {
          const beltsData = await beltsResponse.json();
          setBelts(beltsData.data || beltsData || []);
        }

        // Charger les arbitres
        const refereesResponse = await fetch(
          "/api/referees?is_active=true&limit=1000"
        );
        if (refereesResponse.ok) {
          const refereesData = await refereesResponse.json();
          setReferees(refereesData.data || refereesData || []);
        }

        // Charger les régions de l'édition si on a les données du groupe
        if (groupData?.phase?.edition?.id) {
          const editionId = groupData.phase.edition.id;
          const editionRegionsResponse = await fetch(
            `/api/editions/${editionId}/regions/list?status=approved&with_region=true&limit=1000`
          );
          if (editionRegionsResponse.ok) {
            const editionRegionsData = await editionRegionsResponse.json();
            setEditionRegions(
              editionRegionsData.data || editionRegionsData || []
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données de référence:",
          error
        );
      } finally {
        setLoading({
          group: false,
          regions: false,
          belts: false,
          referees: false,
          editionRegions: false,
        });
      }
    };

    loadReferenceData();
  }, [groupData?.phase?.edition?.id]);

  // Ajouter un nouveau sous-groupe
  const handleAddSubGroup = () => {
    const nextOrder = calculateNextOrder() + newSubGroups.length;
    setNewSubGroups((prev) => [
      ...prev,
      {
        name: `Combat ${nextOrder}`,
        sub_group_order: nextOrder,
        description: "",
        is_completed: false,
        is_active: true,
      },
    ]);
  };

  // Supprimer un sous-groupe en cours de création
  const handleRemoveSubGroup = (index: number) => {
    setNewSubGroups((prev) => prev.filter((_, i) => i !== index));
    // Réorganiser les ordres après suppression
    setNewSubGroups((prev) =>
      prev.map((sg, i) => ({
        ...sg,
        sub_group_order: calculateNextOrder() + i,
        name: `Combat ${calculateNextOrder() + i}`,
      }))
    );
  };

  // Mettre à jour un champ d'un sous-groupe
  const handleUpdateSubGroup = (
    index: number,
    field: keyof SubGroupFormData,
    value: any
  ) => {
    setNewSubGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Si on met à jour une région, on peut mettre à jour le nom
      if (field === "region1_id" || field === "region2_id") {
        const region1 = regions.find((r) => r.id === updated[index].region1_id);
        const region2 = regions.find((r) => r.id === updated[index].region2_id);

        if (region1 && region2) {
          updated[index].name = `${region1.name} vs ${region2.name}`;
        } else if (region1) {
          updated[index].name = `${region1.name} vs ?`;
        } else if (region2) {
          updated[index].name = `? vs ${region2.name}`;
        } else {
          // Si aucune région n'est sélectionnée, remettre le nom par défaut
          updated[index].name = `Combat ${updated[index].sub_group_order}`;
        }
      }

      return updated;
    });

    // Effacer l'erreur pour ce champ
    if (errors[`${index}_${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${index}_${field}`];
        return newErrors;
      });
    }
  };

  // Valider les sous-groupes
  const validateSubGroups = () => {
    const newErrors: Record<string, string> = {};

    newSubGroups.forEach((sg, index) => {
      if (!sg.name.trim()) {
        newErrors[`${index}_name`] = "Le nom est requis";
      }

      if (sg.region1_id && sg.region2_id && sg.region1_id === sg.region2_id) {
        newErrors[`${index}_region2_id`] =
          "Les deux régions doivent être différentes";
      }

      if (!sg.region1_id && !sg.region2_id) {
        newErrors[`${index}_region1_id`] = "Au moins une région est requise";
      }
    });

    return newErrors;
  };


  // Soumettre tous les sous-groupes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateSubGroups();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Créer un FormData pour chaque sous-groupe et appeler createSubGroup
      const promises = newSubGroups.map((sg) => {
        const formData = new FormData();
        formData.append("group_id", String(groupId));
        formData.append("name", sg.name);
        formData.append("sub_group_order", String(sg.sub_group_order));
        formData.append("description", sg.description || "");

        // Ajouter les régions seulement si elles sont définies
        if (sg.region1_id) {
          formData.append("region1_id", String(sg.region1_id));
        }
        if (sg.region2_id) {
          formData.append("region2_id", String(sg.region2_id));
        }

        formData.append("is_active", String(sg.is_active || true));
        formData.append("is_completed", String(sg.is_completed || false));



        // Ceintures - seulement si disponibles
        if (sg.belt_region1 || belts[0]?.id) {
          formData.append(
            "belt_region1",
            String(sg.belt_region1 || belts[0]?.id || "")
          );
        }
        if (sg.belt_region2 || belts[0]?.id) {
          formData.append(
            "belt_region2",
            String(sg.belt_region2 || belts[0]?.id || "")
          );
        }

        // Arbitre - seulement si disponible
        if (sg.main_referee_id || referees[0]?.id) {
          formData.append(
            "main_referee_id",
            String(sg.main_referee_id || referees[0]?.id || "")
          );
        }

        // Call the server action createSubGroup directly
        return createSubGroup(formData);
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every((res) => res.success);

      if (allSuccess) {
        toast.success(
          `${newSubGroups.length} sous-groupe(s) créé(s) avec succès`
        );

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/ad/phase-groups/${groupId}`);
          router.refresh();
        }
      } else {
        throw new Error("Certains sous-groupes n'ont pas pu être créés");
      }
    } catch (error) {
      console.error("Erreur lors de la création des sous-groupes:", error);
      toast.error("Erreur lors de la création des sous-groupes");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendre une option de région
  const renderRegionOption = (region: any) => (
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10 border-2 border-background">
        <AvatarImage src={region.flag_image} alt={region.name} />
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
          <Flag className="h-5 w-5 text-blue-600" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{region.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {region.code} • {region.total_fighters || 0} lutteurs
        </p>
      </div>
    </div>
  );

  // Rendre une option de ceinture
  const renderBeltOption = (belt: any) => (
    <div className="flex items-center space-x-3">
      <div
        className="h-8 w-8 rounded-full border-2 border-background"
        style={{ backgroundColor: belt.color }}
      />
      <div>
        <p className="font-medium">Ceinture {belt.color}</p>
        <p className="text-xs text-muted-foreground">Couleur de ceinture</p>
      </div>
    </div>
  );

  // Rendre une option d'arbitre
  const renderRefereeOption = (referee: any) => (
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={referee.profile_image}
          alt={`${referee.first_name} ${referee.last_name}`}
        />
        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200">
          {referee.first_name?.[0]}
          {referee.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {referee.first_name} {referee.last_name}
          {referee.nickname && (
            <span className="text-muted-foreground"> "{referee.nickname}"</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {referee.certification_level || "Arbitre"}
          {referee.license_number && ` • ${referee.license_number}`}
        </p>
      </div>
    </div>
  );

  // Rendre le formulaire pour un sous-groupe
  const renderSubGroupForm = (sg: SubGroupFormData, index: number) => {
    const region1 = regions.find((r) => r.id === sg.region1_id);
    const region2 = regions.find((r) => r.id === sg.region2_id);
    const belt1 = belts.find((b) => b.id === sg.belt_region1) || belts[1];
    const belt2 = belts.find((b) => b.id === sg.belt_region2) || belts[0];
    const referee =
      referees.find((r) => r.id === sg.main_referee_id) || referees[0];

    return (
      <Card key={index} className="border-2 p-2 border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Typography variant="body-sm" weight="bold">
                  {index + 1}
                </Typography>
              </div>
              <Input
                value={sg.name}
                onChange={(e) =>
                  handleUpdateSubGroup(index, "name", e.target.value)
                }
                className={cn(
                  "text-lg font-semibold border-none shadow-none focus-visible:ring-0",
                  errors[`${index}_name`] && "border-red-500"
                )}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSubGroup(index)}
              disabled={newSubGroups.length === 1}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {errors[`${index}_name`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${index}_name`]}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sélection des régions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Région 1 */}
            <div className="space-y-2">
              <Label htmlFor={`region1-${index}`}>
                Région 1{" "}
                {errors[`${index}_region1_id`] && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Select
                value={sg.region1_id?.toString() || ""}
                onValueChange={(value) =>
                  handleUpdateSubGroup(index, "region1_id", Number(value))
                }
                disabled={loading.regions}
              >
                <SelectTrigger
                  className={cn(
                    errors[`${index}_region1_id`] && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Sélectionnez une région">
                    {region1
                      ? renderRegionOption(region1)
                      : "Sélectionnez une région"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une région..."
                        className="pl-9"
                        onChange={(e) => {
                          // Implémenter la recherche si nécessaire
                        }}
                      />
                    </div>
                    {editionRegions.length > 0
                      ? editionRegions.map((er) => (
                          <SelectItem
                            key={er.region?.id || er.id}
                            value={
                              er.region?.id?.toString() || er.id.toString()
                            }
                          >
                            {renderRegionOption(er.region || er)}
                          </SelectItem>
                        ))
                      : regions.map((region) => (
                          <SelectItem
                            key={region.id}
                            value={region.id.toString()}
                          >
                            {renderRegionOption(region)}
                          </SelectItem>
                        ))}
                  </div>
                </SelectContent>
              </Select>

              {/* Ceinture pour région 1 */}
              <Select
                value={
                  sg.belt_region1?.toString() || belt1?.id?.toString() || ""
                }
                onValueChange={(value) =>
                  handleUpdateSubGroup(index, "belt_region1", Number(value))
                }
                disabled={loading.belts || belts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ceinture">
                    {belt1
                      ? renderBeltOption(belt1)
                      : "Sélectionnez une ceinture"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {belts.map((belt) => (
                    <SelectItem key={belt.id} value={belt.id.toString()}>
                      {renderBeltOption(belt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Région 2 */}
            <div className="space-y-2">
              <Label htmlFor={`region2-${index}`}>Région 2</Label>
              <Select
                value={sg.region2_id?.toString() || ""}
                onValueChange={(value) =>
                  handleUpdateSubGroup(index, "region2_id", Number(value))
                }
                disabled={loading.regions}
              >
                <SelectTrigger
                  className={cn(
                    errors[`${index}_region2_id`] && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Sélectionnez une région">
                    {region2
                      ? renderRegionOption(region2)
                      : "Sélectionnez une région"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une région..."
                        className="pl-9"
                      />
                    </div>
                    {editionRegions.length > 0
                      ? editionRegions.map((er) => (
                          <SelectItem
                            key={er.region?.id || er.id}
                            value={
                              er.region?.id?.toString() || er.id.toString()
                            }
                          >
                            {renderRegionOption(er.region || er)}
                          </SelectItem>
                        ))
                      : regions.map((region) => (
                          <SelectItem
                            key={region.id}
                            value={region.id.toString()}
                          >
                            {renderRegionOption(region)}
                          </SelectItem>
                        ))}
                  </div>
                </SelectContent>
              </Select>
              {errors[`${index}_region2_id`] && (
                <p className="text-red-500 text-sm">
                  {errors[`${index}_region2_id`]}
                </p>
              )}

              {/* Ceinture pour région 2 */}
              <Select
                value={
                  sg.belt_region2?.toString() || belt2?.id?.toString() || ""
                }
                onValueChange={(value) =>
                  handleUpdateSubGroup(index, "belt_region2", Number(value))
                }
                disabled={loading.belts || belts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ceinture">
                    {belt2
                      ? renderBeltOption(belt2)
                      : "Sélectionnez une ceinture"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {belts.map((belt) => (
                    <SelectItem key={belt.id} value={belt.id.toString()}>
                      {renderBeltOption(belt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Arbitre principal */}
          <div className="space-y-2">
            <Label htmlFor={`referee-${index}`}>Arbitre Principal</Label>
            <Select
              value={
                sg.main_referee_id?.toString() || referee?.id?.toString() || ""
              }
              onValueChange={(value) =>
                handleUpdateSubGroup(index, "main_referee_id", Number(value))
              }
              disabled={loading.referees || referees.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un arbitre">
                  {referee
                    ? renderRefereeOption(referee)
                    : "Sélectionnez un arbitre"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {referees.map((referee) => (
                  <SelectItem key={referee.id} value={referee.id.toString()}>
                    {renderRefereeOption(referee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={`description-${index}`}>Description</Label>
            <Textarea
              id={`description-${index}`}
              value={sg.description || ""}
              onChange={(e) =>
                handleUpdateSubGroup(index, "description", e.target.value)
              }
              placeholder="Description de la rencontre..."
              rows={2}
            />
          </div>

          {/* Statuts */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`active-${index}`}
                  checked={sg.is_active}
                  onCheckedChange={(checked) =>
                    handleUpdateSubGroup(index, "is_active", checked)
                  }
                />
                <Label htmlFor={`active-${index}`} className="text-sm">
                  Actif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`completed-${index}`}
                  checked={sg.is_completed}
                  onCheckedChange={(checked) =>
                    handleUpdateSubGroup(index, "is_completed", checked)
                  }
                />
                <Label htmlFor={`completed-${index}`} className="text-sm">
                  Terminé
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <Typography variant="caption1" theme="muted">
                Ordre:{" "}
                <span className="font-semibold">{sg.sub_group_order}</span>
              </Typography>
            </div>
          </div>

          {/* Aperçu visuel */}
          {(sg.region1_id || sg.region2_id) && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
              <div className="flex items-center justify-between">
                {/* Région 1 */}
                {region1 && (
                  <div className="flex flex-col items-center space-y-2 flex-1">
                    <Avatar className="h-16 w-16 border-4 border-background">
                      <AvatarImage
                        src={region1.flag_image}
                        alt={region1.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                        <Flag className="h-8 w-8 text-blue-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Typography variant="body-sm" weight="medium">
                        {region1.name}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        {region1.code}
                      </Typography>
                    </div>
                    {belt1 && (
                      <Badge
                        className="px-2 py-1"
                        style={{ backgroundColor: belt1.color, color: "white" }}
                      >
                        Ceinture {belt1.color}
                      </Badge>
                    )}
                  </div>
                )}

                {/* VS */}
                <div className="flex flex-col items-center px-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="text-white"
                    >
                      VS
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted" className="mt-2">
                    Rencontre
                  </Typography>
                </div>

                {/* Région 2 */}
                {region2 && (
                  <div className="flex flex-col items-center space-y-2 flex-1">
                    <Avatar className="h-16 w-16 border-4 border-background">
                      <AvatarImage
                        src={region2.flag_image}
                        alt={region2.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200">
                        <Flag className="h-8 w-8 text-green-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Typography variant="body-sm" weight="medium">
                        {region2.name}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        {region2.code}
                      </Typography>
                    </div>
                    {belt2 && (
                      <Badge
                        className="px-2 py-1"
                        style={{ backgroundColor: belt2.color, color: "white" }}
                      >
                        Ceinture {belt2.color}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Arbitre */}
              {referee && (
                <div className="mt-4 pt-4 border-t flex items-center justify-center space-x-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="caption1" theme="muted">
                    Arbitre:{" "}
                    <span className="font-medium">
                      {referee.first_name} {referee.last_name}
                    </span>
                  </Typography>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Afficher le loading
  if (loading.group) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        <Typography variant="body-lg" className="mt-4">
          Chargement des données du groupe...
        </Typography>
      </div>
    );
  }

  if (!groupData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Typography variant="h4" className="mb-2">
            Groupe non trouvé
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Le groupe spécifié n'existe pas ou n'est pas accessible.
          </Typography>
          <Button onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tête avec informations du groupe */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 p-2 to-primary/10">
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <Typography variant="h3">{groupData.name}</Typography>
                  <div className="flex items-center gap-2 mt-1">
                    <Typography
                      variant="caption1"
                      className="bg-background px-2 py-1 rounded-md"
                    >
                      Phase: {groupData.phase?.name || "N/A"}
                    </Typography>
                    <Typography
                      variant="caption1"
                      className="bg-background px-2 py-1 rounded-md"
                    >
                      Ordre: {groupData.group_order}
                    </Typography>
                    <Badge
                      variant={groupData.is_active ? "default" : "secondary"}
                    >
                      {groupData.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

              {groupData.phase?.edition && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>
                      {groupData.phase.edition.competition?.name ||
                        "Compétition"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Édition {groupData.phase.edition.edition_number} (
                      {groupData.phase.edition.year})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{editionRegions.length} régions participantes</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/phase-groups/${groupId}`)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour au groupe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nouveaux sous-groupes */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center justify-between">
          <Typography variant="h4" className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            Nouvelles rencontres ({newSubGroups.length})
          </Typography>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddSubGroup}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une rencontre
          </Button>
        </div>

        {/* Liste des nouveaux sous-groupes */}
        <div className="space-y-4">
          {newSubGroups.map((sg, index) => renderSubGroupForm(sg, index))}
        </div>

        <div className="flex items-center justify-center my-3">
          <Button
            type="button"
            variant="default"
            onClick={handleAddSubGroup}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une rencontre
          </Button>
        </div>

        {/* Sous-groupes existants */}
        {subGroups.length > 0 && (
          <div className="space-y-4">
            <Typography variant="h4" className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Rencontres existantes ({subGroups.length})
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subGroups.map((sg, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Typography variant="body-base" weight="medium">
                        {sg.name}
                      </Typography>
                      <Badge variant="outline">#{sg.sub_group_order}</Badge>
                    </div>

                    {sg.region1_id && sg.region2_id && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                regions.find((r) => r.id === sg.region1_id)
                                  ?.flag_image
                              }
                              alt="Région 1"
                            />
                            <AvatarFallback>R1</AvatarFallback>
                          </Avatar>
                          <Typography
                            variant="caption1"
                            className="font-medium"
                          >
                            {regions.find((r) => r.id === sg.region1_id)
                              ?.name || "Région 1"}
                          </Typography>
                        </div>

                        <Typography
                          variant="caption1"
                          weight="bold"
                          className="mx-2"
                        >
                          VS
                        </Typography>

                        <div className="flex items-center space-x-2">
                          <Typography
                            variant="caption1"
                            className="font-medium"
                          >
                            {regions.find((r) => r.id === sg.region2_id)
                              ?.name || "Région 2"}
                          </Typography>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                regions.find((r) => r.id === sg.region2_id)
                                  ?.flag_image
                              }
                              alt="Région 2"
                            />
                            <AvatarFallback>R2</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {sg.is_active ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>Actif</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            <span>Inactif</span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/sub-groups/${sg.id}/edit`)
                        }
                      >
                        Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="sticky bottom-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="body-base" weight="medium">
                {newSubGroups.length} rencontre(s) à créer
              </Typography>
              <Typography variant="caption1" theme="muted">
                Tous les champs marqués d'une * sont requis
              </Typography>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || newSubGroups.length === 0}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer {newSubGroups.length} rencontre(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
