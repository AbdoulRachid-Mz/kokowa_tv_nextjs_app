// app/ad/sub-groups/[subGroupId]/matches/[matchId]/audience-counter.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus, Minus, Users } from "lucide-react";
import { toast } from "sonner";

interface AudienceCounterProps {
  audienceCount: number;
  onUpdate: (count: number) => void;
  isSaving: boolean;
}

export function AudienceCounter({ 
  audienceCount, 
  onUpdate, 
  isSaving 
}: AudienceCounterProps) {
  const [localCount, setLocalCount] = useState(audienceCount);
  
  const increment = () => {
    const newCount = localCount + 1;
    setLocalCount(newCount);
    onUpdate(newCount);
    toast.success("Spectateur ajouté");
  };
  
  const decrement = () => {
    if (localCount > 0) {
      const newCount = localCount - 1;
      setLocalCount(newCount);
      onUpdate(newCount);
      toast.success("Spectateur retiré");
    }
  };
  
  const handleManualUpdate = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalCount(numValue);
      onUpdate(numValue);
    }
  };
  
  const resetCount = () => {
    setLocalCount(0);
    onUpdate(0);
    toast.info("Compteur remis à zéro");
  };

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Spectateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compteur principal */}
        <div className="text-center">
          <Typography variant="h1" className="font-bold text-6xl">
            {localCount}
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-2">
            Personnes dans l'audience
          </Typography>
        </div>
        
        {/* Contrôles */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={decrement}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={isSaving || localCount <= 0}
          >
            <Minus className="h-5 w-5" />
            -1
          </Button>
          
          <div className="flex items-center justify-center">
            <input
              type="number"
              value={localCount}
              onChange={(e) => handleManualUpdate(e.target.value)}
              className="w-full p-2 border rounded text-center text-lg"
              min="0"
              disabled={isSaving}
            />
          </div>
          
          <Button
            onClick={increment}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={isSaving}
          >
            <Plus className="h-5 w-5" />
            +1
          </Button>
        </div>
        
        {/* Actions supplémentaires */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleManualUpdate("100")}
            variant="ghost"
            size="sm"
            className="gap-1"
            disabled={isSaving}
          >
            <Eye className="h-3 w-3" />
            100
          </Button>
          
          <Button
            onClick={() => handleManualUpdate("500")}
            variant="ghost"
            size="sm"
            className="gap-1"
            disabled={isSaving}
          >
            <Eye className="h-3 w-3" />
            500
          </Button>
        </div>
        
        <Button
          onClick={resetCount}
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-destructive"
          disabled={isSaving || localCount === 0}
        >
          <Minus className="h-4 w-4" />
          Réinitialiser
        </Button>
        
        {/* Statistiques */}
        <div className="border-t pt-3 mt-2">
          <div className="flex items-center justify-between text-sm">
            <Typography variant="body-sm" theme="muted">
              Dernière mise à jour
            </Typography>
            <Badge variant="outline">
              {new Date().toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}