"use client";

import { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhaseGroup } from "@/types";

interface CreateSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onSuccess: () => void;
  group?: PhaseGroup;
}

export function CreateSubGroupDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
  group,
}: CreateSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sub_group_order: group?.sub_groups?.length
      ? group.sub_groups.length + 1
      : 1,
    description: "",
    period: "matin" as "matin" | "soir",
    score_region1: 0,
    score_region2: 0,
    nulls: 0,
    status: "upcoming" as
      | "upcoming"
      | "ongoing"
      | "completed"
      | "cancelled"
      | "postponed",
    region1_id: undefined as number | undefined,
    region2_id: undefined as number | undefined,
    belt_region1: undefined as number | undefined,
    belt_region2: undefined as number | undefined,
    main_referee_id: undefined as number | undefined,
    is_completed: false,
    is_active: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append(
        "sub_group_order",
        String(formData.sub_group_order)
      );
      formDataToSend.append("description", formData.description);
      formDataToSend.append("group_id", String(groupId));
      formDataToSend.append("period", formData.period);
      formDataToSend.append("score_region1", String(formData.score_region1));
      formDataToSend.append("score_region2", String(formData.score_region2));
      formDataToSend.append("nulls", String(formData.nulls));
      formDataToSend.append("status", formData.status);
      if (formData.region1_id)
        formDataToSend.append("region1_id", String(formData.region1_id));
      if (formData.region2_id)
        formDataToSend.append("region2_id", String(formData.region2_id));
      if (formData.belt_region1)
        formDataToSend.append("belt_region1", String(formData.belt_region1));
      if (formData.belt_region2)
        formDataToSend.append("belt_region2", String(formData.belt_region2));
      if (formData.main_referee_id)
        formDataToSend.append(
          "main_referee_id",
          String(formData.main_referee_id)
        );
      formDataToSend.append("is_completed", String(formData.is_completed));
      formDataToSend.append("is_active", String(formData.is_active));

      const response = await fetch("/api/sub-groups", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: "",
          sub_group_order: group?.sub_groups?.length
            ? group.sub_groups.length + 1
            : 1,
          description: "",
          period: "matin",
          score_region1: 0,
          score_region2: 0,
          nulls: 0,
          status: "upcoming",
          region1_id: undefined,
          region2_id: undefined,
          belt_region1: undefined,
          belt_region2: undefined,
          main_referee_id: undefined,
          is_completed: false,
          is_active: false,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau sous-groupe</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau sous-groupe à ce groupe. Vous pourrez ensuite
            assigner des ceintures et créer des matchs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du sous-groupe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nom du sous-groupe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Période *</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleInputChange("period", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matin">Matin</SelectItem>
                  <SelectItem value="soir">Soir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description du sous-groupe (optionnel)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer le sous-groupe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
