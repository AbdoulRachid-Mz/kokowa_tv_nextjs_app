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
import { Save, X, Users, MapPin, Award, Shield, Flag } from "lucide-react";
import { Typography } from "../ui/typography";
import { cn } from "@/lib/utils";

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
  group?: any; // Utilisation de any pour simplifier
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
          setLoading(prev => ({ ...prev, subGroups: false }));
        }
      }
    };
    
    loadSubGroups();
  }, [group?.id]);

  // Calculer l'ordre automatique
  const calculateAutoOrder = () => {
    if (subGroup?.sub_group_order) return subGroup.sub_group_order;
    
    if (subGroups.length === 0) return 1;
    
    const maxOrder = Math.max(...subGroups.map(sg => sg.sub_group_order || 0));
    return maxOrder + 1;
  };

  // Données initiales du formulaire
  const [formData, setFormData] = useState<SubGroupFormData>({
    group_id: group?.id || 0,
    name: subGroup?.name || `Rencontre ${calculateAutoOrder()}`,
    sub_group_order: subGroup?.sub_group_order || calculateAutoOrder(),
    description: subGroup?.description || "",
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
        const beltsResponse = await fetch("/api/belts?is_active=true");
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
      setFormData(prev => ({ ...prev, group_id: group.id }));
    }
  }, [group?.id, formData.group_id]);

  const handleChange = (field: keyof SubGroupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const url = subGroup?.id 
        ? `/api/sub-groups/${subGroup.id}`
        : "/api/sub-groups";
      
      const method = subGroup?.id ? "PUT" : "POST";

      const cleanedData = {
        ...formData,
        description: formData.description || null,
        region1_id: formData.region1_id || null,
        region2_id: formData.region2_id || null,
        belt_region1: formData.belt_region1 || null,
        belt_region2: formData.belt_region2 || null,
        main_referee_id: formData.main_referee_id || null,
        sub_group_order: Number(formData.sub_group_order),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message ||
            `Erreur lors de ${
              subGroup ? "la modification" : "la création"
            } de la rencontre`
        );
      }

      // Succès
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la page du groupe
        setTimeout(() => {
          router.push(`/admin/groups/${formData.group_id}`);
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
    const belt = belts.find(b => b.id === beltId);
    return belt?.color || "#6b7280";
  };

  // Rendu d'une région avec drapeau et ceinture
  const renderRegionOption = (region: any, beltColor?: string) => (
    <div className="flex items-center space-x-1">
      <div className="relative">
        <Avatar className="h-10 w-10 border-2" style={{ borderColor: beltColor }}>
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
        <AvatarImage src={referee.profile_image} alt={`${referee.first_name} ${referee.last_name}`} />
        <AvatarFallback className="bg-primary/10">
          {referee.first_name?.[0]}{referee.last_name?.[0]}
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
    const competitionName = group.phase?.edition?.competition?.name || "Compétition inconnue";
    
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

            {/* Ordre du sous-groupe */}
            <div className="space-y-2">
              <Label htmlFor="sub_group_order">Ordre dans le groupe</Label>
              <div className="relative">
                <Input
                  id="sub_group_order"
                  type="number"
                  min="1"
                  value={formData.sub_group_order}
                  onChange={(e) =>
                    handleChange("sub_group_order", Number(e.target.value))
                  }
                  className={cn(
                    errors.sub_group_order ? "border-red-500" : "",
                    "bg-muted"
                  )}
                  readOnly
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Typography variant="caption2" theme="muted">
                    Automatique
                  </Typography>
                </div>
              </div>
              {errors.sub_group_order && (
                <p className="text-red-500 text-sm">
                  {errors.sub_group_order}
                </p>
              )}
              <Typography variant="caption2" theme="muted">
                Basé sur le nombre de rencontres existantes dans le groupe
              </Typography>
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
                  <div className="relative">
                    <div 
                      className="h-4 w-4 rounded-full border-2 border-background"
                      style={{ backgroundColor: getBeltColor(formData.belt_region1) }}
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
                            regions.find(r => r.id === formData.region1_id),
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
                          {renderRegionOption(region, getBeltColor(formData.belt_region1))}
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
                            <span>Ceinture {belts.find(b => b.id === formData.belt_region1)?.color}</span>
                          </div>
                        ) : "Sélectionnez une ceinture"}
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
                      style={{ backgroundColor: getBeltColor(formData.belt_region2) }}
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
                    <SelectTrigger className={errors.region2_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionnez une région">
                        {formData.region2_id && regions.length > 0 ? (
                          renderRegionOption(
                            regions.find(r => r.id === formData.region2_id),
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
                          {renderRegionOption(region, getBeltColor(formData.belt_region2))}
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
                            <span>Ceinture {belts.find(b => b.id === formData.belt_region2)?.color}</span>
                          </div>
                        ) : "Sélectionnez une ceinture"}
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
                      renderRefereeOption(referees.find(r => r.id === formData.main_referee_id))
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
                    <SelectItem key={referee.id} value={referee.id.toString()}>
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
                            <Avatar className="h-16 w-16 border-4" style={{ 
                              borderColor: getBeltColor(formData.belt_region1) 
                            }}>
                              <AvatarImage 
                                src={regions.find(r => r.id === formData.region1_id)?.flag_image} 
                                alt={regions.find(r => r.id === formData.region1_id)?.name} 
                              />
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                            {formData.belt_region1 && (
                              <Badge 
                                className="absolute -bottom-1 -right-1 px-2 py-1"
                                style={{ backgroundColor: getBeltColor(formData.belt_region1) }}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Ceinture
                              </Badge>
                            )}
                          </div>
                          <Typography variant="body-base" weight="medium">
                            {regions.find(r => r.id === formData.region1_id)?.name || "Région inconnue"}
                          </Typography>
                        </>
                      )}
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        VS
                      </Badge>
                      <Typography variant="caption2" theme="muted" className="mt-2">
                        Rencontre
                      </Typography>
                    </div>

                    {/* Région 2 */}
                    <div className="flex flex-col items-center space-y-2">
                      {formData.region2_id && (
                        <>
                          <div className="relative">
                            <Avatar className="h-16 w-16 border-4" style={{ 
                              borderColor: getBeltColor(formData.belt_region2) 
                            }}>
                              <AvatarImage 
                                src={regions.find(r => r.id === formData.region2_id)?.flag_image} 
                                alt={regions.find(r => r.id === formData.region2_id)?.name} 
                              />
                              <AvatarFallback className="bg-muted">
                                <Flag className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                            {formData.belt_region2 && (
                              <Badge 
                                className="absolute -bottom-1 -right-1 px-2 py-1"
                                style={{ backgroundColor: getBeltColor(formData.belt_region2) }}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Ceinture
                              </Badge>
                            )}
                          </div>
                          <Typography variant="body-base" weight="medium">
                            {regions.find(r => r.id === formData.region2_id)?.name || "Région inconnue"}
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
                          {referees.find(r => r.id === formData.main_referee_id)?.first_name}{" "}
                          {referees.find(r => r.id === formData.main_referee_id)?.last_name}
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
                    {subGroup?.id ? "Modifier la rencontre" : "Créer la rencontre"}
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