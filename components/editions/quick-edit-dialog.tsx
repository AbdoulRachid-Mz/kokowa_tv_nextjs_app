// components/editions/quick-edit-dialog.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Edit2 } from "lucide-react";
import { updateFighter } from "@/actions/fighters";
import { updateRegion } from "@/actions/regions";

interface QuickEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  type: "fighter" | "region";
  onSuccess: () => void;
}

export function QuickEditDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess,
}: QuickEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    nickname: "",
    is_champion: false,
    region_id: "",
    // Region
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    if (item) {
      const data = type === "fighter" 
        ? (item.fighter || item)
        : (item.region || item);
      
      if (type === "fighter") {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          nickname: data.nickname || "",
          is_champion: data.is_champion || false,
          region_id: data.region_id || data.region?.id || "",
          name: "",
          code: "",
          description: "",
        });
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          nickname: "",
          is_champion: false,
          region_id: "",
          name: data.name || "",
          code: data.code || "",
          description: data.description || "",
        });
      }
    }
  }, [item, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const id = type === "fighter"
        ? (item.fighter?.id || item.fighter_id || item.id)
        : (item.region?.id || item.region_id || item.id);

      if (type === "fighter") {
        const formDataToSend = new FormData();
        formDataToSend.append("first_name", formData.first_name);
        formDataToSend.append("last_name", formData.last_name);
        formDataToSend.append("nickname", formData.nickname || "");
        formDataToSend.append("is_champion", String(formData.is_champion));
        formDataToSend.append("region_id", formData.region_id);

        const result = await updateFighter(id, formDataToSend);
        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la mise à jour");
        }
        toast.success("Lutteur modifié avec succès");
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("code", formData.code);
        formDataToSend.append("description", formData.description || "");

        const result = await updateRegion(id, formDataToSend);
        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la mise à jour");
        }
        toast.success("Région modifiée avec succès");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null;

  const isFighter = type === "fighter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Modifier {isFighter ? "le lutteur" : "la région"}
          </DialogTitle>
          <DialogDescription>
            Double-cliquez pour modifier rapidement les informations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isFighter ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">Prénom</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Nom</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_nickname">Surnom</Label>
                <Input
                  id="edit_nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_champion"
                  checked={formData.is_champion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_champion: !!checked })
                  }
                />
                <Label htmlFor="edit_is_champion" className="cursor-pointer">
                  Champion
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nom</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_code">Code</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}