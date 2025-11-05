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

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: number;
  onSuccess: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  phaseId,
  onSuccess,
}: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    group_order: 1,
    description: "",
    create_sub_groups: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/phase-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phase_id: phaseId,
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: "",
          group_order: 1,
          description: "",
          create_sub_groups: 0,
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
          <DialogTitle>Créer un nouveau groupe</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau groupe à cette phase. Vous pouvez optionnellement créer des sous-groupes automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du groupe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom du groupe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_order">Ordre *</Label>
              <Input
                id="group_order"
                type="number"
                min="1"
                value={formData.group_order}
                onChange={(e) => handleInputChange('group_order', parseInt(e.target.value))}
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
              placeholder="Description du groupe (optionnel)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_sub_groups">Créer des sous-groupes</Label>
            <Select
              value={formData.create_sub_groups.toString()}
              onValueChange={(value) => handleInputChange('create_sub_groups', parseInt(value))}
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
                : "Vous pourrez ajouter des sous-groupes manuellement plus tard"
              }
            </Typography>
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