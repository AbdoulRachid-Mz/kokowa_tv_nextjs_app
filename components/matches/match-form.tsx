// components/matches/match-form.tsx
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Users, Calendar, Clock } from "lucide-react";
import { Typography } from "../ui/typography";

interface Fighter {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  region_id: number;
}

interface Region {
  id: number;
  name: string;
  code: string;
}

interface SubGroup {
  id: number;
  name: string;
  region1?: Region;
  region2?: Region;
}

interface MatchFormData {
  id?: number;
  sub_group_id: number;
  match_number?: number;
  match_date: string;
  start_time?: string;
  fighter1_id?: number;
  fighter2_id?: number;
  region1_id?: number;
  region2_id?: number;
  notes?: string;
  status: string;
}

interface MatchFormProps {
  match?: MatchFormData;
  subGroupId?: number;
  subGroup?: SubGroup;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programmé' },
  { value: 'live', label: 'En direct' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'postponed', label: 'Reporté' },
];

export default function MatchForm({ match, subGroupId, subGroup, onSuccess }: MatchFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<MatchFormData>({
    sub_group_id: subGroupId || 0,
    match_number: undefined,
    match_date: new Date().toISOString().split('T')[0],
    start_time: "15:00",
    fighter1_id: undefined,
    fighter2_id: undefined,
    region1_id: subGroup?.region1?.id,
    region2_id: subGroup?.region2?.id,
    notes: "",
    status: 'scheduled',
  });

  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof MatchFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    fighters: true,
    regions: true,
    subGroups: true,
  });

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (match) {
      setFormData({
        ...match,
        match_date: match.match_date ? match.match_date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  }, [match]);

  // Charger les données
  useEffect(() => {
    async function loadData() {
      try {
        // Charger les lutteurs actifs
        const fightersResponse = await fetch('/api/fighters?is_active=true&with_region=true');
        if (fightersResponse.ok) {
          const fightersResult = await fightersResponse.json();
          setFighters(fightersResult.data || []);
        }

        // Charger les régions
        const regionsResponse = await fetch('/api/regions');
        if (regionsResponse.ok) {
          const regionsResult = await regionsResponse.json();
          setRegions(regionsResult.data || []);
        }

        // Charger les sous-groupes si pas fourni
        if (!subGroupId) {
          const subGroupsResponse = await fetch('/api/sub-groups?with_regions=true');
          if (subGroupsResponse.ok) {
            const subGroupsResult = await subGroupsResponse.json();
            setSubGroups(subGroupsResult.data || []);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading({ fighters: false, regions: false, subGroups: false });
      }
    }
    loadData();
  }, [subGroupId]);

  const handleChange = (field: keyof MatchFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof MatchFormData, string>> = {};

    if (!formData.sub_group_id) newErrors.sub_group_id = "Le sous-groupe est requis";
    if (!formData.match_date) newErrors.match_date = "La date du match est requise";

    if (formData.fighter1_id && formData.fighter2_id && formData.fighter1_id === formData.fighter2_id) {
      newErrors.fighter2_id = "Les deux lutteurs doivent être différents";
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
      formDataToSend.append("sub_group_id", formData.sub_group_id.toString());
      formDataToSend.append("match_date", formData.match_date);
      formDataToSend.append("status", formData.status);

      // Champs optionnels
      if (formData.match_number) formDataToSend.append("match_number", formData.match_number.toString());
      if (formData.start_time) formDataToSend.append("start_time", formData.start_time);
      if (formData.fighter1_id) formDataToSend.append("fighter1_id", formData.fighter1_id.toString());
      if (formData.fighter2_id) formDataToSend.append("fighter2_id", formData.fighter2_id.toString());
      if (formData.region1_id) formDataToSend.append("region1_id", formData.region1_id.toString());
      if (formData.region2_id) formDataToSend.append("region2_id", formData.region2_id.toString());
      if (formData.notes) formDataToSend.append("notes", formData.notes);

      const url = match ? `/api/matches/${match.id}` : "/api/matches";
      const method = match ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${match ? "la modification" : "la création"} du match`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/ad/matches");
        }
      } else {
        throw new Error(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${match ? "la modification" : "la création"} du match`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFightersByRegion = (regionId?: number) => {
    if (!regionId) return [];
    return fighters.filter(fighter => fighter.region_id === regionId);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {match ? "Modifier le Match" : "Nouveau Match"}
          </CardTitle>
          <CardDescription>
            {match 
              ? "Modifiez les informations du match" 
              : "Programmez un nouveau match entre deux lutteurs"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du sous-groupe */}
            {!subGroupId && (
              <div className="space-y-2">
                <Label htmlFor="sub_group_id">
                  Rencontre <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sub_group_id.toString()}
                  onValueChange={(value) => handleChange('sub_group_id', Number(value))}
                  disabled={loading.subGroups}
                >
                  <SelectTrigger className={errors.sub_group_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionnez une rencontre" />
                  </SelectTrigger>
                  <SelectContent>
                    {subGroups.map((sg) => (
                      <SelectItem key={sg.id} value={sg.id.toString()}>
                        {sg.name}
                        {sg.region1 && sg.region2 && ` (${sg.region1.name} vs ${sg.region2.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sub_group_id && (
                  <p className="text-red-500 text-sm">{errors.sub_group_id}</p>
                )}
                {loading.subGroups && (
                  <p className="text-muted-foreground text-sm">Chargement des rencontres...</p>
                )}
              </div>
            )}

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Numéro du match */}
              {/* <div className="space-y-2">
                <Label htmlFor="match_number">Numéro du match</Label>
                <Input
                  id="match_number"
                  type="number"
                  min="1"
                  value={formData.match_number || ''}
                  onChange={(e) => handleChange('match_number', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1"
                />
              </div> */}

              {/* Date du match */}
              {/* <div className="space-y-2">
                <Label htmlFor="match_date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="match_date"
                  type="date"
                  value={formData.match_date}
                  onChange={(e) => handleChange('match_date', e.target.value)}
                  className={errors.match_date ? "border-red-500" : ""}
                />
                {errors.match_date && (
                  <p className="text-red-500 text-sm">{errors.match_date}</p>
                )}
              </div> */}

              {/* Heure de début */}
              {/* <div className="space-y-2">
                <Label htmlFor="start_time">Heure de début</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                />
              </div> */}
            </div>

            {/* Configuration des participants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Lutteur 1 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <Label htmlFor="fighter1_id">Lutteur 1</Label>
                </div>
                
                <div className="space-y-2">
                  <Select
                    value={formData.fighter1_id?.toString() || ""}
                    onValueChange={(value) => handleChange('fighter1_id', Number(value))}
                    disabled={loading.fighters}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un lutteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFightersByRegion(formData.region1_id).map((fighter) => (
                        <SelectItem key={fighter.id} value={fighter.id.toString()}>
                          {fighter.first_name} {fighter.last_name}
                          {fighter.nickname && ` "${fighter.nickname}"`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.region1_id?.toString() || ""}
                    onValueChange={(value) => {
                      handleChange('region1_id', Number(value));
                      handleChange('fighter1_id', undefined); // Réinitialiser le lutteur
                    }}
                    disabled={loading.regions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Région du lutteur 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id.toString()}>
                          {region.name} ({region.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lutteur 2 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <Label htmlFor="fighter2_id">Lutteur 2</Label>
                </div>
                
                <div className="space-y-2">
                  <Select
                    value={formData.fighter2_id?.toString() || ""}
                    onValueChange={(value) => handleChange('fighter2_id', Number(value))}
                    disabled={loading.fighters}
                  >
                    <SelectTrigger className={errors.fighter2_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionnez un lutteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFightersByRegion(formData.region2_id).map((fighter) => (
                        <SelectItem key={fighter.id} value={fighter.id.toString()}>
                          {fighter.first_name} {fighter.last_name}
                          {fighter.nickname && ` "${fighter.nickname}"`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fighter2_id && (
                    <p className="text-red-500 text-sm">{errors.fighter2_id}</p>
                  )}

                  <Select
                    value={formData.region2_id?.toString() || ""}
                    onValueChange={(value) => {
                      handleChange('region2_id', Number(value));
                      handleChange('fighter2_id', undefined); // Réinitialiser le lutteur
                    }}
                    disabled={loading.regions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Région du lutteur 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id.toString()}>
                          {region.name} ({region.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut du match</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            {/* <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Informations supplémentaires sur le match..."
                rows={3}
              />
            </div> */}

            {/* Résumé */}
            {(formData.fighter1_id || formData.fighter2_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé du match</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Lutteur 1
                      </Typography>
                      <Typography>
                        {fighters.find(f => f.id === formData.fighter1_id) 
                          ? `${fighters.find(f => f.id === formData.fighter1_id)?.first_name} ${fighters.find(f => f.id === formData.fighter1_id)?.last_name}`
                          : "Non sélectionné"
                        }
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Lutteur 2
                      </Typography>
                      <Typography>
                        {fighters.find(f => f.id === formData.fighter2_id) 
                          ? `${fighters.find(f => f.id === formData.fighter2_id)?.first_name} ${fighters.find(f => f.id === formData.fighter2_id)?.last_name}`
                          : "Non sélectionné"
                        }
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Date et heure
                      </Typography>
                      <Typography>
                        {new Date(formData.match_date).toLocaleDateString()} à {formData.start_time}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Statut
                      </Typography>
                      <Typography>
                        {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
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
                onClick={() => {
                  if (subGroupId) {
                    router.push(`/ad/sub-groups/${subGroupId}`);
                  } else {
                    router.push("/ad/matches");
                  }
                }}
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
                  ? `${match ? "Modification..." : "Création..."}`
                  : `${match ? "Modifier le match" : "Créer le match"}`
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}