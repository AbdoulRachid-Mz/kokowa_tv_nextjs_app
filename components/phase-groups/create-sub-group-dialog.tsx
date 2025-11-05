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

interface CreateSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onSuccess: () => void;
}

export function CreateSubGroupDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: CreateSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sub_group_order: 1,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/sub-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          group_id: groupId,
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: "",
          sub_group_order: 1,
          description: "",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau sous-groupe</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau sous-groupe à ce groupe. Vous pourrez ensuite assigner des ceintures et créer des matchs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du sous-groupe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom du sous-groupe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_group_order">Ordre *</Label>
              <Input
                id="sub_group_order"
                type="number"
                min="1"
                value={formData.sub_group_order}
                onChange={(e) => handleInputChange('sub_group_order', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
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