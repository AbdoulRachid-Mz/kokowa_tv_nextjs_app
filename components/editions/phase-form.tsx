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
import { Checkbox } from "@/components/ui/checkbox";
import { PhaseInput } from "@/validation/schemas";
import { createPhase, updatePhase } from "@/actions/phases";
import { createPhaseGroup } from "@/actions/phase-groups";
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
  const [createGroupWithPhase, setCreateGroupWithPhase] = useState(true);
  const [groupName, setGroupName] = useState("");
  
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
      // Pour la modification, on ne crée pas de groupe
      setCreateGroupWithPhase(false);
      setGroupName(phase.name);
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
      setCreateGroupWithPhase(true);
      setGroupName("");
    }
  }, [phase, editionId, edition]);

  // Mettre à jour le nom du groupe lorsque le nom de la phase change
  useEffect(() => {
    if (createGroupWithPhase && !phase) {
      setGroupName(formData.name);
    }
  }, [formData.name, createGroupWithPhase, phase]);

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

      let phaseId: number;

      if (phase?.id) {
        // Mode modification
        await updatePhase(phase.id, formDataToSend);
        toast.success("Phase modifiée avec succès");
        phaseId = phase.id;
      } else {
        // Mode création
        const result = await createPhase(formDataToSend);
        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la création de la phase");
        }
        phaseId = result.id;
        toast.success(result.message);
      }

      // Créer un groupe si demandé et en mode création
      if (!phase?.id && createGroupWithPhase && phaseId) {
        const groupFormData = new FormData();
        groupFormData.append("phase_id", String(phaseId));
        groupFormData.append("name", groupName || formData.name);
        groupFormData.append("group_order", "1");
        groupFormData.append("description", `Groupe principal de ${formData.name}`);
        groupFormData.append("date", formData.start_date || "");
        groupFormData.append("is_active", String(formData.is_active));
        groupFormData.append("is_completed", String(formData.is_completed));

        const groupResult = await createPhaseGroup(groupFormData, { create_sub_groups: 0 });
        if (groupResult.success) {
          toast.success(`Groupe "${groupName || formData.name}" créé avec succès`);
        } else {
          // On ne bloque pas si le groupe échoue, mais on avertit
          toast.warning("Phase créée, mais le groupe n'a pas pu être créé");
        }
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

  const isEditMode = !!phase?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la phase" : "Créer une nouvelle phase"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
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
                  <SelectItem value="third_place">Troisième place</SelectItem>
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

          {/* Section création de groupe - uniquement en mode création */}
          {!isEditMode && (
            <div className="border-t pt-4 mt-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_group"
                  checked={createGroupWithPhase}
                  onCheckedChange={(checked) => {
                    setCreateGroupWithPhase(!!checked);
                    if (checked) {
                      setGroupName(formData.name);
                    }
                  }}
                />
                <Label htmlFor="create_group" className="cursor-pointer font-medium">
                  Créer un groupe avec cette phase
                </Label>
              </div>

              {createGroupWithPhase && (
                <div className="pl-6 border-l-2 border-primary/30 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="group_name">Nom du groupe</Label>
                    <Input
                      id="group_name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Nom du groupe"
                    />
                    <Typography variant="caption2" theme="muted">
                      Par défaut, le nom du groupe sera le même que celui de la phase.
                    </Typography>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="group_order">Ordre du groupe</Label>
                      <Input
                        id="group_order"
                        type="number"
                        min="1"
                        value="1"
                        disabled
                        className="bg-muted"
                      />
                      <Typography variant="caption2" theme="muted">
                        Le premier groupe sera créé avec l'ordre 1.
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group_date">Date du groupe</Label>
                      <Input
                        id="group_date"
                        type="date"
                        value={formData.start_date || ""}
                        disabled
                        className="bg-muted"
                      />
                      <Typography variant="caption2" theme="muted">
                        Utilise la date de début de la phase.
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="group_is_active"
                        checked={formData.is_active}
                        disabled
                      />
                      <Label htmlFor="group_is_active" className="text-muted-foreground">
                        Actif
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="group_is_completed"
                        checked={formData.is_completed}
                        disabled
                      />
                      <Label htmlFor="group_is_completed" className="text-muted-foreground">
                        Terminé
                      </Label>
                    </div>
                  </div>

                  <Typography variant="caption2" theme="muted" className="block">
                    Les statuts du groupe suivent ceux de la phase.
                  </Typography>
                </div>
              )}
            </div>
          )}

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
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  {isEditMode ? "Modification..." : "Création..."}
                </>
              ) : (
                isEditMode ? "Modifier" : "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}