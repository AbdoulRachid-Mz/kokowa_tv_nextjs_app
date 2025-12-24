"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phase, PhaseGroup } from "@/types";
import { getPhaseGroupById, updatePhaseGroup } from "@/actions/phase-groups";
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


export default function EditGroupPage() {
  const {groupId} = useParams()
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<PhaseGroup | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PhaseGroupInput>({
    resolver: zodResolver(phaseGroupSchema) as any,
    defaultValues: {
      phase_id: group?.phase?.id ? group.phase.id : 0,
      name: "",
      group_order: 1,
      description: "",
      is_active: true,
      is_completed: false,
    },
  });

  // Charger les données du groupe
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await getPhaseGroupById(parseInt(groupId as string, 10), {
          with_relations: true,
          relations: { with_phase: true },
        });
        if (res) {
          setGroup(res);
          setPhase(res.phase ?? null);
          // Pré-remplir le formulaire
          reset({
            phase_id: res.phase_id,
            name: res.name,
            group_order: res.group_order,
            description: res.description ?? "",
            is_active: res.is_active,
            is_completed: res.is_completed,
          });
        } else {
          toast.error("Erreur lors du chargement du groupe");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement du groupe");
      }
    };

    fetchGroup();
  }, [groupId, reset]);

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

      const res = await updatePhaseGroup(parseInt(groupId as string, 10), formData);

      if (res.success) {
        toast.success("Groupe modifié avec succès");
        router.push(`/ad/phase-groups/${group!.id}`);
      } else {
        throw new Error(res.message || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error ? error.message : "Erreur lors de la modification"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!group || !phase) {
    return (
      <div className="container mx-auto p-6">
        <Typography variant="h3">Chargement...</Typography>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        <Typography variant="h4">Modifier le groupe</Typography>
        <Typography variant="body-base" theme="muted">
          Modifiez les informations du groupe "{group.name}" de la phase "{phase.name}"
        </Typography>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 grid-cols-2">
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
            <Label htmlFor="group_order">Ordre du groupe *</Label>
            <Input
              id="group_order"
              type="number"
              {...register("group_order", { valueAsNumber: true })}
              placeholder="Ordre"
            />
            {errors.group_order && (
              <Typography variant="caption2" theme="destructive">
                {errors.group_order.message}
              </Typography>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Description du groupe (optionnel)"
            rows={4}
          />
          {errors.description && (
            <Typography variant="caption2" theme="destructive">
              {errors.description.message}
            </Typography>
          )}
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="is_active">Statut actif</Label>
            <Select
              value={group.is_active?.toString()}
              onValueChange={(value) => setValue("is_active", value === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_completed">Complété</Label>
            <Select
              value={group.is_completed.toString()}
              onValueChange={(value) => setValue("is_completed", value === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="État" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">En cours</SelectItem>
                <SelectItem value="true">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/ad/phase-groups${group.id}`)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Modification..." : "Modifier le groupe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
