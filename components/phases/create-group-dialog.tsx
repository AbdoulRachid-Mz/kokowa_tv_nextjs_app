"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import z from "zod";

// Schema pour les groupes de phase
export const phaseGroupSchema = z.object({
  phase_id: z.number().int().positive("Phase invalide"),
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  is_active: z.boolean().default(true),
  group_order: z.number().int().min(1, "L'ordre doit être positif"),
  description: z.string().optional(),
  is_completed: z.boolean().default(false),
});

export type PhaseGroupInput = z.infer<typeof phaseGroupSchema>;

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
  const [createSubGroups, setCreateSubGroups] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PhaseGroupInput>({
    resolver: zodResolver(phaseGroupSchema) as any,
    defaultValues: {
      phase_id: phaseId,
      name: "",
      group_order: phase?.groups?.length ? phase.groups.length + 1 : 1,
      description: "",
      is_active: true,
      is_completed: false,
    },
  });

  const onSubmit = async (data: PhaseGroupInput) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("phase_id", data.phase_id.toString());
      formData.set("name", data.name);
      formData.set("group_order", data.group_order.toString());
      formData.set("description", data.description ?? "");
      formData.set("is_active", data.is_active.toString());
      formData.set("is_completed", data.is_completed.toString());

      const res = await createPhaseGroup(formData, {
        create_sub_groups: createSubGroups,
      });

      if (res.success) {
        toast.success("Groupe créé avec succès:", res);
        onSuccess();
        reset();
        setCreateSubGroups(0);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du groupe *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nom du groupe"
              />
              {errors.name && (
                <Typography variant="caption2" theme="destructive">
                  {errors.name.message}
                </Typography>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_sub_groups">Créer des sous-groupes</Label>
              <Select
                value={createSubGroups.toString()}
                onValueChange={(value) => setCreateSubGroups(parseInt(value))}
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
                {createSubGroups > 0
                  ? `${createSubGroups} sous-groupe(s) seront créés automatiquement`
                  : "Vous pourrez ajouter des sous-groupes manuellement plus tard"}
              </Typography>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description du groupe (optionnel)"
              rows={3}
            />
            {errors.description && (
              <Typography variant="caption2" theme="destructive">
                {errors.description.message}
              </Typography>
            )}
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
