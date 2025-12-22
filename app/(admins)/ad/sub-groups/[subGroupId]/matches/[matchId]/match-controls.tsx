// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-controls.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Match } from "@/types";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  Users,
  Equal
} from "lucide-react";
import { toast } from "sonner";

interface MatchControlsProps {
  match: Match;
  onUpdateMatch: (updates: Partial<Match>) => void;
  onAddBreak: () => void;
  isSaving: boolean;
  isTimerRunning: boolean;
  onTimerToggle: (running: boolean) => void;
}

export function MatchControls({
  match,
  onUpdateMatch,
  onAddBreak,
  isSaving,
  isTimerRunning,
  onTimerToggle
}: MatchControlsProps) {
  const [notes, setNotes] = useState(match.notes || "");
  
  const statusOptions = [
    { value: "scheduled", label: "Programmé", icon: Calendar },
    { value: "live", label: "En direct", icon: Play },
    { value: "round_break", label: "Pause", icon: Pause },
    { value: "completed", label: "Terminé", icon: CheckCircle },
    { value: "cancelled", label: "Annulé", icon: XCircle },
    { value: "postponed", label: "Reporté", icon: RefreshCw },
    { value: "reclamation", label: "Réclamation", icon: AlertTriangle },
  ];

  const resultOptions = [
    { value: "fighter1_win", label: "Victoire Lutteur 1" },
    { value: "fighter2_win", label: "Victoire Lutteur 2" },
    { value: "draw", label: "Match nul", icon: Equal },
    { value: "cancelled", label: "Annulé" },
    { value: "postponed", label: "Reporté" },
  ];
  
  const handleStatusChange = (status: string) => {
    const updates: Partial<Match> = { 
      status: status as Match["status"] 
    };
    
    // Si on démarre le match, enregistrer l'heure de début
    if (status === 'live' && !match.start_time) {
      updates.start_time = new Date().toTimeString().slice(0, 8);
      onTimerToggle(true);
    }
    
    // Si on met en pause, arrêter le timer
    if (status === 'round_break') {
      onTimerToggle(false);
    }
    
    // Si on termine, enregistrer l'heure de fin
    if (status === 'completed' && !match.end_time) {
      updates.end_time = new Date().toTimeString().slice(0, 8);
      onTimerToggle(false);
    }
    
    onUpdateMatch(updates);
    
    // Message selon le statut
    const statusMsg = {
      scheduled: "Match programmé",
      live: "Match démarré",
      round_break: "Match en pause",
      completed: "Match terminé",
      cancelled: "Match annulé",
      postponed: "Match reporté",
      reclamation: "Réclamation enregistrée",
    }[status];
    
    toast.success(statusMsg);
  };
  
  const handleResultChange = (result: string) => {
    const updates: Partial<Match> = {
      match_result: result as Match["match_result"],
      status: "completed",
      end_time: match.end_time || new Date().toTimeString().slice(0, 8)
    };
    
    // Définir vainqueur/perdant selon le résultat
    if (result === "fighter1_win") {
      updates.winner_fighter_id = match.fighter1_id;
      updates.loser_fighter_id = match.fighter2_id;
    } else if (result === "fighter2_win") {
      updates.winner_fighter_id = match.fighter2_id;
      updates.loser_fighter_id = match.fighter1_id;
    } else if (result === "draw") {
      updates.winner_fighter_id = undefined;
      updates.loser_fighter_id = undefined;
    } else {
      updates.winner_fighter_id = undefined;
      updates.loser_fighter_id = undefined;
    }
    
    onUpdateMatch(updates);
    onTimerToggle(false);
    toast.success("Résultat enregistré");
  };
  
  const handleSaveNotes = () => {
    onUpdateMatch({ notes });
    toast.success("Notes sauvegardées");
  };
  
  const handleCompleteMatch = () => {
    if (!match.match_result && match.fighter1 && match.fighter2) {
      toast.error("Veuillez d'abord définir un résultat");
      return;
    }
    
    onUpdateMatch({
      status: "completed",
      end_time: new Date().toTimeString().slice(0, 8),
    });
    onTimerToggle(false);
    toast.success("Match complété avec succès");
  };
  
  const handleToggleTimer = () => {
    const newRunningState = !isTimerRunning;
    onTimerToggle(newRunningState);
    
    if (newRunningState) {
      // Démarrer le match
      const updates: Partial<Match> = {
        status: 'live'
      };
      
      if (!match.start_time) {
        updates.start_time = new Date().toTimeString().slice(0, 8);
      }
      
      onUpdateMatch(updates);
      toast.success("Match démarré");
    } else {
      // Mettre en pause
      onUpdateMatch({ status: 'round_break' });
      toast.info("Match mis en pause");
    }
  };

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contrôles du match
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statut et résultat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Statut du match</Label>
            <Select
              value={match.status}
              onValueChange={handleStatusChange}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Résultat final</Label>
            <Select
              value={match.match_result || ""}
              onValueChange={handleResultChange}
              disabled={isSaving || !match.fighter1 || !match.fighter2}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            onClick={handleToggleTimer}
            variant={isTimerRunning ? "destructive" : "default"}
            size="sm"
            className="gap-1"
            disabled={isSaving || match.status === "completed"}
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Démarrer
              </>
            )}
          </Button>
          
          <Button
            onClick={onAddBreak}
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isSaving || !isTimerRunning}
          >
            <Pause className="h-3 w-3" />
            Pause
          </Button>
          
          <Button
            onClick={() => handleStatusChange('round_break')}
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isSaving || match.status !== 'live'}
          >
            <AlertTriangle className="h-3 w-3" />
            Médicale
          </Button>
          
          <Button
            onClick={handleCompleteMatch}
            variant="default"
            size="sm"
            className="gap-1"
            disabled={isSaving || match.status === "completed"}
          >
            <CheckCircle className="h-3 w-3" />
            Terminer
          </Button>
        </div>
        
        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Notes du match</Label>
            <Button
              onClick={handleSaveNotes}
              size="sm"
              variant="ghost"
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes sur le match, observations, incidents..."
            className="min-h-[100px]"
            disabled={isSaving}
          />
        </div>
        
        {/* Infos de synchronisation */}
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Typography variant="body-sm" weight="medium">
              Synchronisation
            </Typography>
            <Badge variant={isSaving ? "secondary" : "default"}>
              {isSaving ? "Sauvegarde..." : "Synchronisé"}
            </Badge>
          </div>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Les modifications sont automatiquement sauvegardées
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}