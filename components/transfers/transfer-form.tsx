// components/transfers/transfer-form.tsx
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
import { Badge } from "@/components/ui/badge";
import { Save, X, ArrowRight, User, MapPin } from "lucide-react";
import { Typography } from "../ui/typography";

interface Fighter {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  profile_image?: string;
  region_id: number;
  is_active: boolean;
}

interface Region {
  id: number;
  name: string;
  code?: string;
}

interface FighterTransferFormData {
  id?: number;
  fighter_id: number;
  from_region_id: number;
  to_region_id: number;
  transfer_date: string;
  transfer_reason?: string;
  transfer_fee?: number;
  contract_duration?: number;
  is_permanent: boolean;
  status: "pending" | "approved" | "rejected" | "completed";
}

interface TransferFormProps {
  transfer?: FighterTransferFormData;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "approved",
    label: "Approuvé",
    color: "bg-green-100 text-green-800",
  },
  { value: "rejected", label: "Rejeté", color: "bg-red-100 text-red-800" },
  { value: "completed", label: "Terminé", color: "bg-blue-100 text-blue-800" },
];

export default function TransferForm({
  transfer,
  onSuccess,
}: TransferFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<FighterTransferFormData>({
    fighter_id: 0,
    from_region_id: 0,
    to_region_id: 0,
    transfer_date: new Date().toISOString().split("T")[0],
    transfer_reason: "",
    transfer_fee: undefined,
    contract_duration: undefined,
    is_permanent: true,
    status: "pending",
  });

  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FighterTransferFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    fighters: true,
    regions: true,
  });

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (transfer) {
      setFormData({
        ...transfer,
        transfer_date: transfer.transfer_date
          ? transfer.transfer_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  }, [transfer]);

  // Charger les lutteurs et régions
  useEffect(() => {
    async function loadData() {
      try {
        // Charger les lutteurs actifs
        const fightersResponse = await fetch("/api/fighters/select");
        if (fightersResponse.ok) {
          const fightersResult = await fightersResponse.json();
          setFighters(fightersResult || []);
        }

        // Charger les régions
        const regionsResponse = await fetch("/api/regions");
        if (regionsResponse.ok) {
          const regionsResult = await regionsResponse.json();
          setRegions(regionsResult.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading({ fighters: false, regions: false });
      }
    }
    loadData();
  }, []);

  // Mettre à jour la région d'origine quand un lutteur est sélectionné
  useEffect(() => {
    if (formData.fighter_id > 0) {
      const fighter = fighters.find((f) => f.id === formData.fighter_id);
      if (fighter) {
        setSelectedFighter(fighter);
        setFormData((prev) => ({
          ...prev,
          from_region_id: fighter.region_id,
        }));
      }
    } else {
      setSelectedFighter(null);
    }
  }, [formData.fighter_id, fighters]);

  const handleChange = (field: keyof FighterTransferFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFighterChange = (fighterId: number) => {
    handleChange("fighter_id", fighterId);
    // Réinitialiser la région de destination si c'est la même que l'origine
    if (formData.to_region_id === formData.from_region_id) {
      handleChange("to_region_id", 0);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FighterTransferFormData, string>> =
      {};

    if (!formData.fighter_id) newErrors.fighter_id = "Le lutteur est requis";
    if (!formData.from_region_id)
      newErrors.from_region_id = "La région d'origine est requise";
    if (!formData.to_region_id)
      newErrors.to_region_id = "La région de destination est requise";
    if (!formData.transfer_date)
      newErrors.transfer_date = "La date de transfert est requise";

    if (formData.from_region_id === formData.to_region_id) {
      newErrors.to_region_id =
        "Les régions d'origine et de destination doivent être différentes";
    }

    if (formData.transfer_fee !== undefined && formData.transfer_fee < 0) {
      newErrors.transfer_fee =
        "Les frais de transfert ne peuvent pas être négatifs";
    }

    if (
      formData.contract_duration !== undefined &&
      formData.contract_duration < 1
    ) {
      newErrors.contract_duration =
        "La durée du contrat doit être d'au moins 1 mois";
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
      formDataToSend.append("fighter_id", formData.fighter_id.toString());
      formDataToSend.append(
        "from_region_id",
        formData.from_region_id.toString()
      );
      formDataToSend.append("to_region_id", formData.to_region_id.toString());
      formDataToSend.append("transfer_date", formData.transfer_date);
      formDataToSend.append("is_permanent", formData.is_permanent.toString());
      formDataToSend.append("status", formData.status);

      // Champs optionnels
      if (formData.transfer_reason)
        formDataToSend.append("transfer_reason", formData.transfer_reason);
      if (formData.transfer_fee)
        formDataToSend.append("transfer_fee", formData.transfer_fee.toString());
      if (formData.contract_duration)
        formDataToSend.append(
          "contract_duration",
          formData.contract_duration.toString()
        );

      const url = transfer ? `/api/transfers/${transfer.id}` : "/api/transfers";
      const method = transfer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${
              transfer ? "la modification" : "la création"
            } du transfert`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/ad/fighters/transfers");
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
              transfer ? "la modification" : "la création"
            } du transfert`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegionName = (regionId: number) => {
    return regions.find((r) => r.id === regionId)?.name || "Non spécifiée";
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {transfer
              ? "Modifier le Transfert"
              : "Nouveau Transfert de Lutteur"}
          </CardTitle>
          <CardDescription>
            {transfer
              ? "Modifiez les informations du transfert"
              : "Remplissez les informations pour créer un nouveau transfert"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du lutteur */}
            <div className="space-y-2">
              <Label htmlFor="fighter_id">
                Lutteur <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.fighter_id.toString()}
                onValueChange={(value) => handleFighterChange(Number(value))}
                disabled={loading.fighters}
              >
                <SelectTrigger
                  className={errors.fighter_id ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionnez un lutteur" />
                </SelectTrigger>
                <SelectContent>
                  {fighters.map((fighter) => (
                    <SelectItem key={fighter.id} value={fighter.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          {fighter.first_name} {fighter.last_name}
                          {fighter.nickname && ` "${fighter.nickname}"`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fighter_id && (
                <p className="text-red-500 text-sm">{errors.fighter_id}</p>
              )}
              {loading.fighters && (
                <p className="text-muted-foreground text-sm">
                  Chargement des lutteurs...
                </p>
              )}
            </div>

            {/* Informations sur le transfert */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Région d'origine */}
              <div className="space-y-2">
                <Label
                  htmlFor="from_region_id"
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Région d'origine</span>
                </Label>
                <div className="p-3 bg-background border rounded-md">
                  <Typography variant="body-sm" weight="medium">
                    {selectedFighter
                      ? getRegionName(formData.from_region_id)
                      : "Sélectionnez un lutteur"}
                  </Typography>
                  {selectedFighter && (
                    <Typography variant="body-base" theme="muted">
                      Région actuelle du lutteur
                    </Typography>
                  )}
                </div>
                {errors.from_region_id && (
                  <p className="text-red-500 text-sm">
                    {errors.from_region_id}
                  </p>
                )}
              </div>

              {/* Flèche */}
              <div className="flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* Région de destination */}
              <div className="space-y-2">
                <Label htmlFor="to_region_id">
                  Région de destination <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.to_region_id.toString()}
                  onValueChange={(value) =>
                    handleChange("to_region_id", Number(value))
                  }
                  disabled={loading.regions || !selectedFighter}
                >
                  <SelectTrigger
                    className={errors.to_region_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions
                      .filter((region) => region.id !== formData.from_region_id)
                      .map((region) => (
                        <SelectItem
                          key={region.id}
                          value={region.id.toString()}
                        >
                          {region.name} {region.code ? `(${region.code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.to_region_id && (
                  <p className="text-red-500 text-sm">{errors.to_region_id}</p>
                )}
                {loading.regions && (
                  <p className="text-muted-foreground text-sm">
                    Chargement des régions...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date de transfert */}
              <div className="space-y-2">
                <Label htmlFor="transfer_date">
                  Date de transfert <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transfer_date"
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) =>
                    handleChange("transfer_date", e.target.value)
                  }
                  className={errors.transfer_date ? "border-red-500" : ""}
                />
                {errors.transfer_date && (
                  <p className="text-red-500 text-sm">{errors.transfer_date}</p>
                )}
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label htmlFor="status">Statut du transfert</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={option.color}>
                            {option.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frais de transfert */}
              <div className="space-y-2">
                <Label htmlFor="transfer_fee">Frais de transfert (FCFA)</Label>
                <Input
                  id="transfer_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.transfer_fee || ""}
                  onChange={(e) =>
                    handleChange(
                      "transfer_fee",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="0.00"
                  className={errors.transfer_fee ? "border-red-500" : ""}
                />
                {errors.transfer_fee && (
                  <p className="text-red-500 text-sm">{errors.transfer_fee}</p>
                )}
              </div>

              {/* Durée du contrat */}
              <div className="space-y-2">
                <Label htmlFor="contract_duration">
                  Durée du contrat (mois)
                </Label>
                <Input
                  id="contract_duration"
                  type="number"
                  min="1"
                  max="240"
                  value={formData.contract_duration || ""}
                  onChange={(e) =>
                    handleChange(
                      "contract_duration",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="12"
                  className={errors.contract_duration ? "border-red-500" : ""}
                  disabled={formData.is_permanent}
                />
                {errors.contract_duration && (
                  <p className="text-red-500 text-sm">
                    {errors.contract_duration}
                  </p>
                )}
              </div>
            </div>

            {/* Raison du transfert */}
            <div className="space-y-2">
              <Label htmlFor="transfer_reason">Raison du transfert</Label>
              <Textarea
                id="transfer_reason"
                value={formData.transfer_reason || ""}
                onChange={(e) =>
                  handleChange("transfer_reason", e.target.value)
                }
                placeholder="Décrivez la raison de ce transfert..."
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_permanent"
                  checked={formData.is_permanent}
                  onCheckedChange={(checked) =>
                    handleChange("is_permanent", checked)
                  }
                />
                <Label htmlFor="is_permanent" className="text-sm font-medium">
                  Transfert permanent
                </Label>
              </div>

              {!formData.is_permanent && (
                <div className="ml-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Typography variant="body-sm" className="text-blue-800">
                    💡 Transfert temporaire : spécifiez une durée de contrat en
                    mois
                  </Typography>
                </div>
              )}
            </div>

            {/* Résumé */}
            {selectedFighter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé du transfert</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Lutteur
                      </Typography>
                      <Typography>
                        {selectedFighter.first_name} {selectedFighter.last_name}
                        {selectedFighter.nickname &&
                          ` "${selectedFighter.nickname}"`}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Transfert
                      </Typography>
                      <Typography>
                        {getRegionName(formData.from_region_id)} →{" "}
                        {getRegionName(formData.to_region_id)}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Type
                      </Typography>
                      <Typography>
                        {formData.is_permanent ? "Permanent" : "Temporaire"}
                        {!formData.is_permanent &&
                          formData.contract_duration &&
                          ` (${formData.contract_duration} mois)`}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        theme="muted"
                      >
                        Coût
                      </Typography>
                      <Typography>
                        {formData.transfer_fee
                          ? `${formData.transfer_fee.toLocaleString()} FCFA`
                          : "Gratuit"}
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
                onClick={() => router.push("/ad/fighters/transfers")}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedFighter}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? `${transfer ? "Modification..." : "Création..."}`
                  : `${
                      transfer ? "Modifier le transfert" : "Créer le transfert"
                    }`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
