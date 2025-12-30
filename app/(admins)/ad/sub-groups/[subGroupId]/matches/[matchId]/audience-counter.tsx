// app/ad/sub-groups/[subGroupId]/matches/[matchId]/audience-counter.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Minus, Save } from "lucide-react";
import { toast } from "sonner";

interface AudienceCounterProps {
  audienceCount: number;
  onUpdate: (count: number) => void;
}

export function AudienceCounter({ audienceCount, onUpdate }: AudienceCounterProps) {
  const [localCount, setLocalCount] = useState(audienceCount.toString());
  const [isSaving, setIsSaving] = useState(false);
  
  // Délai pour sauvegarde automatique
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Synchroniser avec la prop
  useEffect(() => {
    setLocalCount(audienceCount.toString());
  }, [audienceCount]);
  
  const handleChange = (value: string) => {
    // Nettoyer l'entrée
    const cleanValue = value.replace(/[^0-9]/g, '');
    setLocalCount(cleanValue);
    
    // Annuler le timeout précédent
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Mettre en place un nouveau timeout pour sauvegarde automatique
    const newCount = parseInt(cleanValue) || 0;
    if (newCount !== audienceCount) {
      const timeout = setTimeout(() => {
        saveCount(newCount);
      }, 2000); // 2 secondes de délai
      
      setSaveTimeout(timeout);
    }
  };
  
  const saveCount = useCallback(async (count: number) => {
    if (count === audienceCount) return;
    
    setIsSaving(true);
    try {
      onUpdate(count);
      toast.success(`Spectateurs mis à jour: ${count}`);
    } catch (error) {
      console.error("Erreur mise à jour spectateurs:", error);
      toast.error("Erreur lors de la mise à jour");
      setLocalCount(audienceCount.toString());
    } finally {
      setIsSaving(false);
    }
  }, [audienceCount, onUpdate]);
  
  const handleIncrement = () => {
    const newCount = (parseInt(localCount) || 0) + 100;
    setLocalCount(newCount.toString());
    saveCount(newCount);
  };
  
  const handleDecrement = () => {
    const current = parseInt(localCount) || 0;
    if (current >= 100) {
      const newCount = current - 100;
      setLocalCount(newCount.toString());
      saveCount(newCount);
    }
  };
  
  const handleManualSave = () => {
    const count = parseInt(localCount) || 0;
    saveCount(count);
  };
  
  // Nettoyer le timeout à la fermeture
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Spectateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Typography variant="h2" className="font-bold">
            {parseInt(localCount).toLocaleString('fr-FR')}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            spectateurs
          </Typography>
        </div>
        
        <div className="space-y-3">
          <Label>Nombre de spectateurs</Label>
          <div className="flex gap-2">
            <Input
              value={localCount}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="text-center text-lg"
            />
            <Button
              onClick={handleManualSave}
              variant="outline"
              size="icon"
              disabled={isSaving || parseInt(localCount) === audienceCount}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleDecrement}
              variant="outline"
              className="flex-1 gap-2"
              disabled={isSaving || (parseInt(localCount) || 0) < 100}
            >
              <Minus className="h-4 w-4" />
              -100
            </Button>
            <Button
              onClick={handleIncrement}
              variant="outline"
              className="flex-1 gap-2"
              disabled={isSaving}
            >
              <Plus className="h-4 w-4" />
              +100
            </Button>
          </div>
        </div>
        
        {isSaving && (
          <div className="text-center">
            <Typography variant="body-sm" theme="muted">
              Sauvegarde...
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}