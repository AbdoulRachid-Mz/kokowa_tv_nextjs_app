// app/ad/sub-groups/[subGroupId]/matches/[matchId]/audience-counter.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Minus, Save } from "lucide-react";
import { toast } from "sonner";

interface AudienceCounterProps {
  matchId: number;
  audienceCount: number;
  onUpdate: (count: number) => void;
}

export function AudienceCounter({ matchId, audienceCount, onUpdate }: AudienceCounterProps) {
  const [localCount, setLocalCount] = useState(audienceCount.toString());
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setLocalCount(audienceCount.toString());
  }, [audienceCount]);
  
  const saveCount = async (count: number) => {
    if (count === audienceCount) return;
    
    setIsSaving(true);
    try {
      onUpdate(count);
      toast.success(`Spectateurs: ${count}`);
    } catch (error) {
      console.error("Erreur mise à jour spectateurs:", error);
      toast.error("Erreur lors de la mise à jour");
      setLocalCount(audienceCount.toString());
    } finally {
      setIsSaving(false);
    }
  };
  
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
          <Input
            value={localCount}
            onChange={(e) => setLocalCount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            type="text"
            className="text-center text-lg"
          />
          
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
      </CardContent>
    </Card>
  );
}