"use client";

import { useState, useEffect } from "react";
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
import { PhaseInput } from "@/validation/schemas";
import { createPhase, updatePhase } from "@/actions/phases";
import { CompetitionEdition } from "@/types";
import { toast } from "sonner";

interface PhaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
  onSuccess: () => void;
  phase?: PhaseInput & { id?: number };
  edition?: CompetitionEdition;
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  editionId,
  onSuccess,
  phase,
  edition,
}: PhaseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PhaseInput>({
    edition_id: editionId,
    name: "",
    phase_order: edition?.phases?.length ? edition.phases.length + 1 : 1,
    phase_type: "group",
    description: "",
    is_active: false,
    start_date: undefined,
    end_date: undefined,
    is_completed: false,
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        edition_id: phase.edition_id,
        name: phase.name,
        phase_order: phase.phase_order,
        phase_type: phase.phase_type,
        description: phase.description,
        is_active: phase.is_active,
        start_date: phase.start_date,
        end_date: phase.end_date,
        is_completed: phase.is_completed,
      });
    } else {
      setFormData({
        edition_id: editionId,
        name: "",
        phase_order: edition?.phases?.length ? edition.phases.length + 1 : 1,
        phase_type: "group",
        description: "",
        is_active: true,
        start_date: undefined,
        end_date: undefined,
        is_completed: false,
      });
    }
  }, [phase, editionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("edition_id", String(formData.edition_id));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phase_order", String(formData.phase_order));
      formDataToSend.append("phase_type", formData.phase_type);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("start_date", formData.start_date || "");
      formDataToSend.append("end_date", formData.end_date || "");
      formDataToSend.append("is_active", String(formData.is_active));
      formDataToSend.append("is_completed", String(formData.is_completed));

      // Client-side actions must be invoked without await in event handlers
      if (phase?.id) {
        updatePhase(phase.id, formDataToSend).catch((err) => {
          console.error("Erreur update:", err);
          toast.error(
            err instanceof Error
              ? err.message
              : "Erreur lors de la modification"
          );
        });
      } else {
        createPhase(formDataToSend).catch((err) => {
          console.error("Erreur create:", err);
          toast.error(
            err instanceof Error ? err.message : "Erreur lors de la création"
          );
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PhaseInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {phase?.id ? "Modifier la phase" : "Créer une nouvelle phase"}
          </DialogTitle>
          <DialogDescription>
            {phase?.id
              ? "Modifiez les informations de cette phase."
              : "Ajoutez une nouvelle phase à cette édition."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la phase *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nom de la phase"
                required
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="phase_order">Ordre *</Label>
              <Input
                id="phase_order"
                type="number"
                min="1"
                value={formData.phase_order}
                onChange={(e) => handleInputChange("phase_order", parseInt(e.target.value))}
                required
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="phase_type">Type de phase *</Label>
              <Select
                value={formData.phase_type}
                onValueChange={(value) =>
                  handleInputChange("phase_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="group">Phase de groupe</SelectItem>
                  <SelectItem value="knockout">Élimination directe</SelectItem>
                  <SelectItem value="quarterfinal">Quart de finale</SelectItem>
                  <SelectItem value="semifinal">Demi-finale</SelectItem>
                  <SelectItem value="final">Finale</SelectItem>
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
              placeholder="Description de la phase (optionnel)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
            />
            <Label htmlFor="is_active">Phase active</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_completed"
              checked={formData.is_completed}
              onChange={(e) =>
                handleInputChange("is_completed", e.target.checked)
              }
            />
            <Label htmlFor="is_completed">Phase terminée</Label>
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
              {loading ? "Enregistrement..." : phase?.id ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
