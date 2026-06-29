// components/editions/quick-add-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { createFighter, updateFighter } from "@/actions/fighters";
import { createRegion, updateRegion } from "@/actions/regions";
import { addFighterToEdition, addRegionToEdition } from "@/actions/editions";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "fighter" | "region";
  editionId: number;
  onSuccess: () => void;
  regions?: { id: number; name: string; code: string }[];
}

export function QuickAddDialog({
  open,
  onOpenChange,
  type,
  editionId,
  onSuccess,
  regions = [],
}: QuickAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [addToEdition, setAddToEdition] = useState(true);
  const [formData, setFormData] = useState({
    // Fighter fields
    first_name: "",
    last_name: "",
    nickname: "",
    region_id: "",
    is_champion: false,
    profile_image: "",
    cover_image: "",
    is_active: true,
    ranking: 0,
    // Region fields
    name: "",
    code: "",
    flag_image: "",
    color: "",
    description: "",
  });

  const isFighter = type === "fighter";

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      nickname: "",
      region_id: "",
      is_champion: false,
      profile_image: "",
      cover_image: "",
      is_active: true,
      ranking: 0,
      name: "",
      code: "",
      flag_image: "",
      color: "",
      description: "",
    });
    setAddToEdition(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let createdId: number;
      
      if (isFighter) {
        // Validation des champs requis
        if (!formData.first_name || !formData.last_name) {
          toast.error("Le prénom et le nom sont requis");
          setIsLoading(false);
          return;
        }
        
        if (!formData.region_id) {
          toast.error("Veuillez sélectionner une région");
          setIsLoading(false);
          return;
        }

        // Création du lutteur via l'action server
        const fighterData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          nickname: formData.nickname || undefined,
          region_id: Number(formData.region_id),
          is_champion: formData.is_champion,
          profile_image: formData.profile_image || undefined,
          cover_image: formData.cover_image || undefined,
          is_active: true,
          ranking: 0,
        };

        // Créer le lutteur
        const result = await createFighter(fighterData);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la création");
        }
        
        createdId = result.id;

        // Ajouter à l'édition si demandé
        if (addToEdition && createdId) {
          await addFighterToEdition(
            editionId,
            createdId,
            "registered",
            Number(formData.region_id)
          );
        }

        toast.success(`Lutteur "${formData.first_name} ${formData.last_name}" créé avec succès${addToEdition ? " et ajouté à l'édition" : ""}`);
        
      } else {
        // Création de la région via l'action server
        if (!formData.name || !formData.code) {
          toast.error("Le nom et le code sont requis");
          setIsLoading(false);
          return;
        }

        const regionData = {
          name: formData.name,
          code: formData.code.toUpperCase(),
          flag_image: formData.flag_image || undefined,
          color: formData.color || undefined,
          description: formData.description || undefined,
        };

        const formDataForRegion = new FormData();
        formDataForRegion.append('name', regionData.name);
        formDataForRegion.append('code', regionData.code);
        if (regionData.flag_image) formDataForRegion.append('flag_image', regionData.flag_image);
        if (regionData.color) formDataForRegion.append('color', regionData.color);
        if (regionData.description) formDataForRegion.append('description', regionData.description);
        const result = await createRegion(formDataForRegion);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la création");
        }
        
        createdId = result.id;

        // Ajouter à l'édition si demandé
        if (addToEdition && createdId) {
          await addRegionToEdition(editionId, createdId, "approved");
        }

        toast.success(`Région "${formData.name}" créée avec succès${addToEdition ? " et ajoutée à l'édition" : ""}`);
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper pour le rendu des champs spécifiques aux lutteurs
  const renderFighterFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Prénom"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Nom"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Surnom</Label>
        <Input
          id="nickname"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          placeholder="Surnom (optionnel)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region_id">Région *</Label>
        <Select
          value={formData.region_id}
          onValueChange={(value) => setFormData({ ...formData, region_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une région" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.id} value={String(region.id)}>
                {region.name} ({region.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_champion"
          checked={formData.is_champion}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_champion: !!checked })
          }
        />
        <Label htmlFor="is_champion" className="cursor-pointer">
          Champion
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Image de profil</Label>
        <AdvancedUpload
          value={formData.profile_image}
          onChange={(url) => setFormData({ ...formData, profile_image: url })}
          maxSizeMB={2}
          previewClassName="w-24 h-24"
        />
      </div>

      <div className="space-y-2">
        <Label>Image de couverture</Label>
        <AdvancedUpload
          value={formData.cover_image}
          onChange={(url) => setFormData({ ...formData, cover_image: url })}
          maxSizeMB={2}
          previewClassName="w-24 h-24"
        />
      </div>
    </>
  );

  // Helper pour le rendu des champs spécifiques aux régions
  const renderRegionFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nom de la région"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="Code (ex: NI, ZI...)"
          required
          className="uppercase"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Couleur</Label>
        <div className="flex gap-3 items-center">
          <Input
            id="color"
            type="color"
            value={formData.color || "#000000"}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-12 h-12 p-1"
          />
          <Input
            value={formData.color || ""}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Drapeau</Label>
        <AdvancedUpload
          value={formData.flag_image}
          onChange={(url) => setFormData({ ...formData, flag_image: url })}
          maxSizeMB={1}
          previewClassName="w-24 h-16"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description (optionnelle)"
        />
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Ajouter un {isFighter ? "lutteur" : "région"} rapidement
          </DialogTitle>
          <DialogDescription>
            {isFighter
              ? "Créez un nouveau lutteur et ajoutez-le directement à cette édition."
              : "Créez une nouvelle région et ajoutez-la directement à cette édition."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isFighter ? renderFighterFields() : renderRegionFields()}

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox
              id="add_to_edition"
              checked={addToEdition}
              onCheckedChange={(checked) => setAddToEdition(!!checked)}
            />
            <Label htmlFor="add_to_edition" className="cursor-pointer">
              Ajouter à l&apos;édition en cours
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}