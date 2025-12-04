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
import { Phase } from "@/types";
import { createPhaseGroup } from "@/actions/phase-groups";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: number;
  phase?: Phase;
  onSuccess: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  phaseId,
  phase,
  onSuccess,
}: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    group_order: phase?.groups?.length ? phase.groups.length + 1 : 1,
    description: "",
    create_sub_groups: 0,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("phase_id", phaseId.toString());
      formData.set(
        "group_order",
        (phase?.groups?.length ? phase.groups.length + 1 : 1).toString()
      );

      const res = await createPhaseGroup(formData, {
        create_sub_groups: Number(formData.get("create_sub_groups")),
      });

      if (res.success) {
        toast.success("Groupe créé avec succès:", res);
        onSuccess();
        setFormData({
          name: "",
          group_order: 1,
          description: "",
          create_sub_groups: 0,
        });
        onOpenChange(false);
      } else {
        throw new Error(res.message || "Erreur lors de la création");
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
          <DialogTitle>Créer un nouveau groupe de la phase</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau groupe à cette phase. Vous pouvez optionnellement
            créer des sous-groupes automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du groupe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nom du groupe"
                required
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="group_order">Ordre *</Label>
              <Input
                id="group_order"
                type="number"
                min="1"
                value={formData.group_order}
                onChange={(e) => handleInputChange('group_order', parseInt(e.target.value))}
                required
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="create_sub_groups">Créer des sous-groupes</Label>
              <Select
                value={formData.create_sub_groups.toString()}
                onValueChange={(value) =>
                  handleInputChange("create_sub_groups", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nombre de sous-groupes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucun sous-groupe</SelectItem>
                  <SelectItem value="2">2 sous-groupes</SelectItem>
                  <SelectItem value="4">4 sous-groupes</SelectItem>
                  <SelectItem value="8">8 sous-groupes</SelectItem>
                  <SelectItem value="16">16 sous-groupes</SelectItem>
                </SelectContent>
              </Select>
              <Typography variant="caption2" theme="muted">
                {formData.create_sub_groups > 0
                  ? `${formData.create_sub_groups} sous-groupe(s) seront créés automatiquement`
                  : "Vous pourrez ajouter des sous-groupes manuellement plus tard"}
              </Typography>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description du groupe (optionnel)"
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
              {loading ? "Création..." : "Créer le groupe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
