// team-member-archive-form.tsx - Version corrigée

"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamAchievementSchema } from "@/validation/schemas";
import { TeamAchievement } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  Calendar,
  Tag,
  Palette,
  Plus,
  Edit3,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";

interface TeamAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMemberId: number;
  initialData?: TeamAchievement | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function TeamAchievementDialog({
  open,
  onOpenChange,
  teamMemberId,
  initialData,
  onSubmit,
  loading,
}: TeamAchievementDialogProps) {
  const form = useForm<z.infer<typeof teamAchievementSchema>>({
    resolver: zodResolver(teamAchievementSchema),
    defaultValues: {
      team_member_id: teamMemberId,
      title: "",
      description: "",
      achievement_date: new Date().toISOString().split("T")[0],
      category: "",
      icon: "",
      color: "",
    },
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          team_member_id: initialData.team_member_id,
          title: initialData.title || "",
          description: initialData.description || "",
          achievement_date: initialData.achievement_date
            ? new Date(initialData.achievement_date).toISOString().split("T")[0]
            : "",
          category: initialData.category || "",
          icon: initialData.icon || "",
          color: initialData.color || "",
        });
      } else {
        form.reset({
          team_member_id: teamMemberId,
          title: "",
          description: "",
          achievement_date: new Date().toISOString().split("T")[0],
          category: "",
          icon: "",
          color: "",
        });
      }
    }
  }, [open, initialData, teamMemberId, form]);

  const { errors } = form.formState;
  const isEditing = !!initialData;

  const handleFormSubmit = async (values: z.infer<typeof teamAchievementSchema>) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submit error:", error);
      // L'erreur est déjà gérée dans le parent
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error("Form validation errors:", formErrors);
    toast.error(
      "Le formulaire contient des erreurs. Veuillez vérifier les champs soulignés en rouge.",
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditing ? (
              <Edit3 className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            {isEditing ? "Modifier l'accomplissement" : "Ajouter un accomplissement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de cet accomplissement d'équipe"
              : "Ajoutez un nouvel accomplissement pour ce membre de l'équipe"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)}
            className="space-y-6"
          >
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur de validation</AlertTitle>
                <AlertDescription>
                  Certains champs obligatoires sont manquants ou invalides.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Titre *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de l'accomplissement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Catégorie
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Projet, Innovation, Performance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="achievement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date de l'accomplissement
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Icône
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'icône (optionnel)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Couleur
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Code couleur (optionnel)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez cet accomplissement en détail..."
                        className="min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {isEditing ? (
                  <Edit3 className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {loading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}