// app/(admins)/ad/phase-groups/[groupId]/organisation/elimination-bulk-match-creator.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Region, Referee } from "@/types";
import {
  Swords,
  Plus,
  Trash2,
  SaveAll,
  Shuffle,
  Loader2,
  UserCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { EliminationFighter } from "./elimination-match-creator";

export interface BulkMatchRow {
  id: string;
  fighter1Id: number | null;
  fighter2Id: number | null;
  period: "matin" | "soir";
  refereeId: number | null;
}

interface EliminationBulkMatchCreatorProps {
  availableFighters: EliminationFighter[];
  allEditionFighters?: EliminationFighter[];
  regions: Region[];
  referees?: Referee[];
  onCreateMatches: (
    matches: {
      fighter1Id: number | null;
      fighter2Id: number | null;
      period: "matin" | "soir";
      refereeId?: number | null;
      isExceptional?: boolean;
    }[]
  ) => Promise<void>;
  isCreating: boolean;
  onCancel?: () => void;
}

export function EliminationBulkMatchCreator({
  availableFighters,
  allEditionFighters = [],
  regions,
  referees = [],
  onCreateMatches,
  isCreating,
  onCancel,
}: EliminationBulkMatchCreatorProps) {
  const [isExceptional, setIsExceptional] = useState(false);
  const [globalRefereeId, setGlobalRefereeId] = useState<string>("none");

  const [rows, setRows] = useState<BulkMatchRow[]>([
    { id: "row-1", fighter1Id: null, fighter2Id: null, period: "matin", refereeId: null },
  ]);

  // Pool de lutteurs selon le mode exceptionnel
  const fightersPool = useMemo(() => {
    if (isExceptional && allEditionFighters.length > 0) {
      return allEditionFighters;
    }
    return availableFighters;
  }, [isExceptional, allEditionFighters, availableFighters]);

  const fighterMap = useMemo(() => {
    const map = new Map<number, EliminationFighter>();
    fightersPool.forEach((f) => map.set(f.id, f));
    return map;
  }, [fightersPool]);

  // Ajouter une ligne de combat
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fighter1Id: null,
        fighter2Id: null,
        period: "matin",
        refereeId: globalRefereeId !== "none" ? parseInt(globalRefereeId) : null,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) {
      setRows([{ id: "row-1", fighter1Id: null, fighter2Id: null, period: "matin", refereeId: null }]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<BulkMatchRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  // Tirage au sort automatique par paires
  const handleAutoPair = () => {
    const pool = [...fightersPool];
    if (pool.length === 0) {
      toast.error("Aucun lutteur disponible pour le tirage");
      return;
    }

    // Mélange de Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const newRows: BulkMatchRow[] = [];
    for (let i = 0; i < pool.length; i += 2) {
      newRows.push({
        id: `auto-${Date.now()}-${i}`,
        fighter1Id: pool[i].id,
        fighter2Id: pool[i + 1] ? pool[i + 1].id : null, // Supporte les combats avec 1 seul lutteur s'il y a un nombre impair !
        period: "matin",
        refereeId: globalRefereeId !== "none" ? parseInt(globalRefereeId) : null,
      });
    }

    setRows(newRows);
    toast.success(`${newRows.length} match(s) généré(s) par tirage au sort !`);
  };

  // Matchs valides : au moins un lutteur (1 seul OU 2 différents)
  const validMatches = useMemo(() => {
    return rows.filter((r) => {
      const hasAtLeastOne = !!(r.fighter1Id || r.fighter2Id);
      const notSame = !(r.fighter1Id && r.fighter2Id && r.fighter1Id === r.fighter2Id);
      return hasAtLeastOne && notSame;
    });
  }, [rows]);

  const handleSubmitAll = async () => {
    if (validMatches.length === 0) {
      toast.error("Veuillez sélectionner au moins un lutteur dans une ligne de match");
      return;
    }

    await onCreateMatches(
      validMatches.map((m) => ({
        fighter1Id: m.fighter1Id,
        fighter2Id: m.fighter2Id,
        period: m.period,
        refereeId: m.refereeId,
        isExceptional,
      }))
    );
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Création Multiple des Combats</CardTitle>
              <Typography variant="body-sm" theme="muted">
                Créez plusieurs matchs à la fois. Chaque combat peut avoir 1 ou 2 lutteurs et son propre arbitre de rencontre.
              </Typography>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={isExceptional ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsExceptional(!isExceptional)}
              className="text-xs gap-1.5 h-8"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {isExceptional ? "Mode Normal" : "Mode Exceptionnel (3e place)"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoPair}
              className="text-xs gap-1.5 h-8"
            >
              <Shuffle className="h-3.5 w-3.5" /> Tirage Automatique
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddRow}
              className="text-xs gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un combat
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Sélecteur d'arbitre global (pour pré-remplir les lignes) */}
        {referees.length > 0 && (
          <div className="p-2.5 bg-muted/30 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold">Arbitre par défaut pour les nouvelles rencontres :</span>
            </div>
            <Select
              value={globalRefereeId}
              onValueChange={(val) => {
                setGlobalRefereeId(val);
                const refNum = val !== "none" ? parseInt(val) : null;
                // Mettre à jour les lignes existantes qui n'ont pas encore d'arbitre
                setRows((prev) =>
                  prev.map((r) => (r.refereeId ? r : { ...r, refereeId: refNum }))
                );
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[220px]">
                <SelectValue placeholder="Choisir un arbitre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun arbitre par défaut</SelectItem>
                {referees
                  .filter((r) => r.is_active)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.first_name} {r.last_name}
                      {r.nickname ? ` (${r.nickname})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tableau / Lignes de matchs */}
        <div className="space-y-3">
          {rows.map((row, index) => {
            const f1 = row.fighter1Id ? fighterMap.get(row.fighter1Id) : null;
            const f2 = row.fighter2Id ? fighterMap.get(row.fighter2Id) : null;

            return (
              <div
                key={row.id}
                className="p-3 rounded-xl border bg-card flex flex-col lg:flex-row items-center gap-3 transition-all hover:border-primary/40"
              >
                {/* Index combat */}
                <Badge variant="outline" className="font-bold self-start lg:self-center">
                  Combat #{index + 1}
                </Badge>

                {/* Sélecteur Lutteur 1 */}
                <div className="flex-1 w-full min-w-0">
                  <Select
                    value={row.fighter1Id ? row.fighter1Id.toString() : "none"}
                    onValueChange={(val) =>
                      updateRow(row.id, {
                        fighter1Id: val !== "none" ? parseInt(val) : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir Lutteur 1 (ou laisser vide)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      <SelectItem value="none">-- Aucun lutteur 1 --</SelectItem>
                      {fightersPool.map((f) => (
                        <SelectItem
                          key={f.id}
                          value={f.id.toString()}
                          disabled={f.id === row.fighter2Id}
                        >
                          {f.first_name} {f.last_name} ({f.region?.name || "Sans région"})
                          {f.is_eliminated ? " [Éliminé]" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <span className="font-bold text-xs text-muted-foreground hidden lg:inline">
                  VS
                </span>

                {/* Sélecteur Lutteur 2 */}
                <div className="flex-1 w-full min-w-0">
                  <Select
                    value={row.fighter2Id ? row.fighter2Id.toString() : "none"}
                    onValueChange={(val) =>
                      updateRow(row.id, {
                        fighter2Id: val !== "none" ? parseInt(val) : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir Lutteur 2 (ou laisser vide)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      <SelectItem value="none">-- Aucun lutteur 2 --</SelectItem>
                      {fightersPool.map((f) => (
                        <SelectItem
                          key={f.id}
                          value={f.id.toString()}
                          disabled={f.id === row.fighter1Id}
                        >
                          {f.first_name} {f.last_name} ({f.region?.name || "Sans région"})
                          {f.is_eliminated ? " [Éliminé]" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Période */}
                <Select
                  value={row.period}
                  onValueChange={(val: "matin" | "soir") =>
                    updateRow(row.id, { period: val })
                  }
                >
                  <SelectTrigger className="w-full lg:w-[105px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matin">🌅 Matin</SelectItem>
                    <SelectItem value="soir">🌙 Soir</SelectItem>
                  </SelectContent>
                </Select>

                {/* Arbitre spécifique à la ligne (rencontre) */}
                {referees.length > 0 && (
                  <Select
                    value={row.refereeId ? row.refereeId.toString() : "none"}
                    onValueChange={(val) =>
                      updateRow(row.id, {
                        refereeId: val !== "none" ? parseInt(val) : null,
                      })
                    }
                  >
                    <SelectTrigger className="w-full lg:w-[160px] h-9 text-xs">
                      <SelectValue placeholder="Arbitre de rencontre" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="none">Aucun arbitre</SelectItem>
                      {referees
                        .filter((r) => r.is_active)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.first_name} {r.last_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Bouton Supprimer Ligne */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRow(row.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 self-end lg:self-center"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Barre d'action finale */}
        <div className="pt-3 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <Typography variant="body-sm" theme="muted">
            {validMatches.length} combat(s) valide(s) sur {rows.length} ligne(s)
          </Typography>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel} className="w-full sm:w-auto">
                Annuler
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitAll}
              disabled={isCreating || validMatches.length === 0}
              className="gap-2 font-semibold shadow-md w-full sm:w-auto"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <SaveAll className="h-4 w-4" /> Enregistrer les {validMatches.length} combat(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
