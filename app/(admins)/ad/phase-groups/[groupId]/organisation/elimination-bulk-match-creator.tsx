// app/(admins)/ad/phase-groups/[groupId]/organisation/elimination-bulk-match-creator.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Check,
  X,
  Sparkles,
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
  phaseType?: string | null;
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

/**
 * Sous-composant pour une ligne de combat avec recherche et filtres de régions indépendants
 */
function BulkMatchRowItem({
  row,
  index,
  fightersPool,
  regions,
  referees,
  isGroupPhase,
  globalRefereeId,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: BulkMatchRow;
  index: number;
  fightersPool: EliminationFighter[];
  regions: Region[];
  referees: Referee[];
  isGroupPhase: boolean;
  globalRefereeId: string;
  onUpdate: (updates: Partial<BulkMatchRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  // Filtres de recherche pour Lutteur 1
  const [search1, setSearch1] = useState("");
  const [selectedRegion1, setSelectedRegion1] = useState<string>("all");

  // Filtres de recherche pour Lutteur 2
  const [search2, setSearch2] = useState("");
  const [selectedRegion2, setSelectedRegion2] = useState<string>("all");

  const fighter1 = useMemo(
    () => fightersPool.find((f) => f.id === row.fighter1Id),
    [fightersPool, row.fighter1Id]
  );

  const fighter2 = useMemo(
    () => fightersPool.find((f) => f.id === row.fighter2Id),
    [fightersPool, row.fighter2Id]
  );

  // Filtrage Lutteur 1
  const filteredFighters1 = useMemo(() => {
    return fightersPool.filter((f) => {
      if (row.fighter2Id && f.id === row.fighter2Id) return false;

      if (selectedRegion1 !== "all") {
        const rId = f.region_id ?? f.region?.id;
        if (rId === undefined || rId === null || String(rId) !== String(selectedRegion1)) {
          return false;
        }
      }

      if (search1.trim()) {
        const q = search1.toLowerCase().trim();
        const full = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nick = (f.nickname || "").toLowerCase();
        return full.includes(q) || nick.includes(q);
      }

      return true;
    });
  }, [fightersPool, row.fighter2Id, selectedRegion1, search1]);

  // Filtrage Lutteur 2
  const filteredFighters2 = useMemo(() => {
    return fightersPool.filter((f) => {
      if (row.fighter1Id && f.id === row.fighter1Id) return false;

      if (selectedRegion2 !== "all") {
        const rId = f.region_id ?? f.region?.id;
        if (rId === undefined || rId === null || String(rId) !== String(selectedRegion2)) {
          return false;
        }
      }

      if (search2.trim()) {
        const q = search2.toLowerCase().trim();
        const full = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nick = (f.nickname || "").toLowerCase();
        return full.includes(q) || nick.includes(q);
      }

      return true;
    });
  }, [fightersPool, row.fighter1Id, selectedRegion2, search2]);

  return (
    <div className="p-3.5 rounded-xl border-2 border-border/70 bg-card/60 shadow-sm space-y-3 transition-all hover:border-primary/40">
      {/* En-tête de la ligne de match */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-bold text-xs px-2.5 py-0.5 bg-muted">
            Combat #{index + 1}
          </Badge>

          {/* Toggle Période */}
          <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border text-xs">
            <Button
              type="button"
              variant={row.period === "matin" ? "default" : "ghost"}
              size="sm"
              onClick={() => onUpdate({ period: "matin" })}
              className="h-6 text-[11px] px-2"
            >
              🌅 Matin
            </Button>
            <Button
              type="button"
              variant={row.period === "soir" ? "default" : "ghost"}
              size="sm"
              onClick={() => onUpdate({ period: "soir" })}
              className="h-6 text-[11px] px-2"
            >
              🌙 Soir
            </Button>
          </div>
        </div>

        {/* Arbitre de ce match ou indicateur poule */}
        <div className="flex items-center gap-2">
          {isGroupPhase ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <UserCheck className="h-3 w-3 text-primary" />
              <span>Arbitre sous-groupe (Poule)</span>
            </div>
          ) : (
            referees.length > 0 && (
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <Select
                  value={row.refereeId ? row.refereeId.toString() : "none"}
                  onValueChange={(val) =>
                    onUpdate({ refereeId: val !== "none" ? parseInt(val) : null })
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-[170px]">
                    <SelectValue placeholder="Arbitre du combat" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    <SelectItem value="none">-- Sans arbitre --</SelectItem>
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
            )
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={!canRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
            title="Supprimer cette ligne"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Les deux panneaux de sélection des lutteurs (style identique à EliminationMatchCreator) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Lutteur 1 */}
        <div className="space-y-2 p-2.5 rounded-lg border border-blue-500/25 bg-blue-50/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Lutteur 1 {fighter1 ? "" : "(Optionnel si lutteur 2 choisi)"}
              </span>
            </div>
            {fighter1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ fighter1Id: null })}
                className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {fighter1 ? (
            <div className="p-2 bg-background rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={fighter1.profile_image} />
                  <AvatarFallback className="text-[10px]">
                    {fighter1.first_name?.[0]}
                    {fighter1.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">
                    {fighter1.first_name} {fighter1.last_name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {fighter1.region && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {fighter1.region.name}
                      </Badge>
                    )}
                    {fighter1.is_eliminated && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                        Éliminé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-1 bg-blue-500 text-white rounded-full">
                <Check className="h-3 w-3" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Nom ou surnom..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="pl-7 text-xs h-7"
                  />
                </div>
                <Select value={selectedRegion1} onValueChange={setSelectedRegion1}>
                  <SelectTrigger className="w-[110px] text-xs h-7">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[140px] overflow-y-auto space-y-1 border rounded-md p-1 bg-background">
                {filteredFighters1.length > 0 ? (
                  filteredFighters1.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onUpdate({ fighter1Id: f.id })}
                      className="p-1.5 rounded hover:bg-muted/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={f.profile_image} />
                          <AvatarFallback className="text-[9px]">
                            {f.first_name?.[0]}
                            {f.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <span className="font-semibold text-[11px]">{f.first_name} {f.last_name}</span>
                          <span className="text-muted-foreground text-[10px] ml-1">
                            ({f.region?.name || "Sans région"})
                          </span>
                          {f.is_eliminated && (
                            <Badge variant="outline" className="text-[8px] text-red-500 ml-1 h-3.5 px-1">
                              Éliminé
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-[11px] text-muted-foreground">
                    Aucun lutteur disponible
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lutteur 2 */}
        <div className="space-y-2 p-2.5 rounded-lg border border-amber-500/25 bg-amber-50/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Lutteur 2 {fighter2 ? "" : "(Optionnel si lutteur 1 choisi)"}
              </span>
            </div>
            {fighter2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ fighter2Id: null })}
                className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {fighter2 ? (
            <div className="p-2 bg-background rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={fighter2.profile_image} />
                  <AvatarFallback className="text-[10px]">
                    {fighter2.first_name?.[0]}
                    {fighter2.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">
                    {fighter2.first_name} {fighter2.last_name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {fighter2.region && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {fighter2.region.name}
                      </Badge>
                    )}
                    {fighter2.is_eliminated && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                        Éliminé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-1 bg-amber-500 text-white rounded-full">
                <Check className="h-3 w-3" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Nom ou surnom..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="pl-7 text-xs h-7"
                  />
                </div>
                <Select value={selectedRegion2} onValueChange={setSelectedRegion2}>
                  <SelectTrigger className="w-[110px] text-xs h-7">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[140px] overflow-y-auto space-y-1 border rounded-md p-1 bg-background">
                {filteredFighters2.length > 0 ? (
                  filteredFighters2.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onUpdate({ fighter2Id: f.id })}
                      className="p-1.5 rounded hover:bg-muted/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={f.profile_image} />
                          <AvatarFallback className="text-[9px]">
                            {f.first_name?.[0]}
                            {f.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <span className="font-semibold text-[11px]">{f.first_name} {f.last_name}</span>
                          <span className="text-muted-foreground text-[10px] ml-1">
                            ({f.region?.name || "Sans région"})
                          </span>
                          {f.is_eliminated && (
                            <Badge variant="outline" className="text-[8px] text-red-500 ml-1 h-3.5 px-1">
                              Éliminé
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-[11px] text-muted-foreground">
                    Aucun lutteur disponible
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EliminationBulkMatchCreator({
  availableFighters,
  allEditionFighters = [],
  regions,
  referees = [],
  phaseType,
  onCreateMatches,
  isCreating,
  onCancel,
}: EliminationBulkMatchCreatorProps) {
  const [isExceptional, setIsExceptional] = useState(false);
  const [globalRefereeId, setGlobalRefereeId] = useState<string>("none");

  const isGroupPhase = phaseType === "group";

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

  // Ajouter une ligne de combat
  const handleAddRow = () => {
    const defaultRef = globalRefereeId !== "none" ? parseInt(globalRefereeId) : null;
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fighter1Id: null,
        fighter2Id: null,
        period: "matin",
        refereeId: defaultRef,
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

    const defaultRef = globalRefereeId !== "none" ? parseInt(globalRefereeId) : null;
    const newRows: BulkMatchRow[] = [];
    for (let i = 0; i < pool.length; i += 2) {
      newRows.push({
        id: `auto-${Date.now()}-${i}`,
        fighter1Id: pool[i].id,
        fighter2Id: pool[i + 1] ? pool[i + 1].id : null,
        period: "matin",
        refereeId: defaultRef,
      });
    }

    setRows(newRows);
    toast.success(`${newRows.length} combat(s) généré(s) par tirage au sort !`);
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
                Programmez plusieurs combats avec filtres de recherche et sélection individuelle par lutteur.
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

            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-xs">
                Annuler
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Barre d'outils d'arbitrage global */}
        {referees.length > 0 && (
          <div className="p-2.5 bg-muted/30 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {isGroupPhase
                  ? "Arbitre de la rencontre (phase de poule) :"
                  : "Arbitre par défaut pour les combats créés :"}
              </span>
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

        {/* Lignes de combats avec recherche et filtres */}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <BulkMatchRowItem
              key={row.id}
              row={row}
              index={index}
              fightersPool={fightersPool}
              regions={regions}
              referees={referees}
              isGroupPhase={isGroupPhase}
              globalRefereeId={globalRefereeId}
              onUpdate={(updates) => updateRow(row.id, updates)}
              onRemove={() => handleRemoveRow(row.id)}
              canRemove={rows.length > 1}
            />
          ))}
        </div>

        {/* Pied de page avec bouton d'enregistrement global */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {validMatches.length} combat(s) prêt(s) à être enregistré(s)
            </Badge>
            {isExceptional && (
              <Badge variant="destructive" className="text-xs">
                Mode Exceptionnel actif
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs gap-1 h-9 flex-1 sm:flex-none"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un autre combat
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSubmitAll}
              disabled={validMatches.length === 0 || isCreating}
              className="text-xs gap-2 h-9 flex-1 sm:flex-none font-semibold px-4"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <SaveAll className="h-4 w-4" />
                  Enregistrer {validMatches.length} combat(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
