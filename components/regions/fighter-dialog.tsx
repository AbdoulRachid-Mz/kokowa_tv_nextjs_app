// components/regions/fighter-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { createFighter } from "@/actions/fighters";

interface FighterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionId: number;
  onSuccess: () => void;
}

export function FighterDialog({ open, onOpenChange, regionId, onSuccess }: FighterDialogProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    nickname: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('region_id', regionId.toString());
      if (formData.nickname) formDataToSend.append('nickname', formData.nickname);
      if (profileImage) formDataToSend.append('profile_image', profileImage);

      const result = await createFighter(formDataToSend);

      if (result.success) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({ first_name: "", last_name: "", nickname: "" });
        setProfileImage("");
      } else {
        setErrors({ submit: result.message || "Une erreur est survenue" });
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "Erreur lors de la création" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un lutteur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo de profil */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Photo de profil
            </label>
            <AdvancedUpload
              value={profileImage}
              onChange={setProfileImage}
              maxSizeMB={2}
              isRounded={true}
              className="w-32 h-32 mx-auto"
            />
          </div>

          {/* Prénom */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1">
              Prénom *
            </label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="Prénom"
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1">
              Nom *
            </label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Nom"
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
          </div>

          {/* Surnom */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-1">
              Surnom
            </label>
            <Input
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Surnom (optionnel)"
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-500 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}