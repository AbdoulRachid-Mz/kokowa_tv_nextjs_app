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
import { Region } from "@/types";
import {
  Swords,
  Plus,
  Trash2,
  SaveAll,
  X,
  Search,
  Filter,
  Check,
  Sparkles,
  Loader2,
  Shuffle,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { EliminationFighter } from "./elimination-match-creator";

interface MatchRow {
  id: string; // unique row id
  fighter1Id: number | null;
  fighter2Id: number | null;
  period: "matin" | "soir";
}

interface EliminationBulkMatchCreatorProps {
  availableFighters: EliminationFighter[];
  regions: Region[];
  onCreateMatches: (
    matches: { fighter1Id: number; fighter2Id: number; period: "matin" | "soir" }[]
  ) => Promise<void>;
  isCreating: boolean;
  onCancel?: () => void;
}

export function EliminationBulkMatchCreator({
  availableFighters,
  regions,
  onCreateMatches,
  isCreating,
  onCancel,
}: EliminationBulkMatchCreatorProps) {
  // Initialize with at least 1 match row
  const [rows, setRows] = useState<MatchRow[]>([
    { id: "row-1", fighter1Id: null, fighter2Id: null, period: "matin" },
  ]);

  // Set of all selected fighter IDs across all rows
  const selectedFighterIds = useMemo(() => {
    const ids = new Set<number>();
    rows.forEach((r) => {
      if (r.fighter1Id) ids.add(r.fighter1Id);
      if (r.fighter2Id) ids.add(r.fighter2Id);
    });
    return ids;
  }, [rows]);

  // Fighter lookup map
  const fighterMap = useMemo(() => {
    const map = new Map<number, EliminationFighter>();
    availableFighters.forEach((f) => map.set(f.id, f));
    return map;
  }, [availableFighters]);

  // Add a new row
  const handleAddRow = () => {
    const remainingCount = availableFighters.length - selectedFighterIds.size;
    if (remainingCount < 2) {
      toast.error(
        "Pas assez de lutteurs disponibles pour créer un nouveau match",
      );
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fighter1Id: null,
        fighter2Id: null,
        period: "matin",
      },
    ]);
  };

  // Remove a row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([{ id: "row-1", fighter1Id: null, fighter2Id: null, period: "matin" }]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Set fighter in row
  const handleSetFighter = (
    rowId: string,
    slot: "fighter1Id" | "fighter2Id",
    fighterId: number | null
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [slot]: fighterId } : r))
    );
  };

  // Set period in row
  const handleSetPeriod = (rowId: string, period: "matin" | "soir") => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, period } : r))
    );
  };

  // Auto-pair all available fighters
  const handleAutoPair = () => {
    const unselected = availableFighters.filter(
      (f) => !selectedFighterIds.has(f.id)
    );
    if (unselected.length < 2) {
      toast.error("Moins de 2 lutteurs disponibles pour l'appariement");
      return;
    }

    const newRows: MatchRow[] = [];
    for (let i = 0; i < unselected.length - 1; i += 2) {
      newRows.push({
        id: `auto-${Date.now()}-${i}`,
        fighter1Id: unselected[i].id,
        fighter2Id: unselected[i + 1].id,
        period: "matin",
      });
    }

    setRows((prev) => {
      // keep complete rows from prev, append new
      const completePrev = prev.filter(
        (r) => r.fighter1Id !== null && r.fighter2Id !== null
      );
      return completePrev.length > 0 ? [...completePrev, ...newRows] : newRows;
    });

    toast.success(`${newRows.length} match(s) généré(s) automatiquement !`);
  };

  // Clear all
  const handleClear = () => {
    setRows([{ id: "row-1", fighter1Id: null, fighter2Id: null, period: "matin" }]);
  };

  // Validate and submit
  const validMatches = useMemo(() => {
    return rows.filter(
      (r) =>
        r.fighter1Id !== null &&
        r.fighter2Id !== null &&
        r.fighter1Id !== r.fighter2Id
    ) as {
      id: string;
      fighter1Id: number;
      fighter2Id: number;
      period: "matin" | "soir";
    }[];
  }, [rows]);

  const handleSubmitAll = async () => {
    if (validMatches.length === 0) {
      toast.error("Veuillez sélectionner au moins un match complet");
      return;
    }

    if (validMatches.length !== rows.length) {
      toast.warning(
        `Certains matchs sont incomplets (${rows.length - validMatches.length}). Seuls les ${validMatches.length} matchs complets seront créés.`
      );
    }

    await onCreateMatches(
      validMatches.map((m) => ({
        fighter1Id: m.fighter1Id,
        fighter2Id: m.fighter2Id,
        period: m.period || "matin",
      }))
    );
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Création Multiple de Combats
              </CardTitle>
              <Typography variant="body-sm" theme="muted">
                Créez plusieurs matchs d'élimination en une seule opération.
              </Typography>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              {availableFighters.length - selectedFighterIds.size} restant(s)
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoPair}
              className="gap-1.5 text-xs"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Générer auto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter match
            </Button>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Match Rows */}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <BulkMatchRowCard
              key={row.id}
              matchIndex={index + 1}
              row={row}
              regions={regions}
              availableFighters={availableFighters}
              selectedFighterIds={selectedFighterIds}
              fighterMap={fighterMap}
              onSelectFighter1={(fid) =>
                handleSetFighter(row.id, "fighter1Id", fid)
              }
              onSelectFighter2={(fid) =>
                handleSetFighter(row.id, "fighter2Id", fid)
              }
              onSelectPeriod={(period) =>
                handleSetPeriod(row.id, period)
              }
              onRemove={() => handleRemoveRow(row.id)}
              canRemove={
                rows.length > 1 ||
                row.fighter1Id !== null ||
                row.fighter2Id !== null
              }
            />
          ))}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              {validMatches.length} / {rows.length} match(s) prêt(s) à être
              enregistré(s)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter match
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isCreating}
              className="text-xs"
            >
              Vider tout
            </Button>
            <Button
              onClick={handleSubmitAll}
              disabled={validMatches.length === 0 || isCreating}
              className="gap-2 flex-1 sm:flex-initial"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <SaveAll className="h-4 w-4" />
                  Enregistrer {validMatches.length} match(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Single Row Component
interface BulkMatchRowCardProps {
  matchIndex: number;
  row: MatchRow;
  regions: Region[];
  availableFighters: EliminationFighter[];
  selectedFighterIds: Set<number>;
  fighterMap: Map<number, EliminationFighter>;
  onSelectFighter1: (id: number | null) => void;
  onSelectFighter2: (id: number | null) => void;
  onSelectPeriod: (period: "matin" | "soir") => void;
  onRemove: () => void;
  canRemove: boolean;
}

function BulkMatchRowCard({
  matchIndex,
  row,
  regions,
  availableFighters,
  selectedFighterIds,
  fighterMap,
  onSelectFighter1,
  onSelectFighter2,
  onSelectPeriod,
  onRemove,
  canRemove,
}: BulkMatchRowCardProps) {
  const f1 = row.fighter1Id ? fighterMap.get(row.fighter1Id) : null;
  const f2 = row.fighter2Id ? fighterMap.get(row.fighter2Id) : null;

  return (
    <div className="p-3 sm:p-4 rounded-xl border bg-card/60 hover:border-primary/30 transition-colors space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
            #{matchIndex}
          </span>
          <Typography variant="body-sm" weight="bold">
            Combat {matchIndex}
          </Typography>
          {f1 && f2 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-green-50 text-green-700 border-green-200"
            >
              Prêt
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={row.period || "matin"}
            onValueChange={(val: "matin" | "soir") => onSelectPeriod(val)}
          >
            <SelectTrigger className="w-[105px] h-7 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matin">🌅 Matin</SelectItem>
              <SelectItem value="soir">🌙 Soir</SelectItem>
            </SelectContent>
          </Select>

          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center relative">
        {/* Fighter 1 Selector */}
        <FighterSlot
          label="Lutteur 1"
          selectedFighter={f1 ?? null}
          otherSelectedId={row.fighter2Id}
          regions={regions}
          availableFighters={availableFighters}
          selectedFighterIds={selectedFighterIds}
          onSelect={onSelectFighter1}
          colorBadge="bg-blue-500"
        />

        {/* VS Indicator */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-muted border border-border items-center justify-center shadow-xs">
          <span className="text-[10px] font-black italic text-muted-foreground">
            VS
          </span>
        </div>

        {/* Fighter 2 Selector */}
        <FighterSlot
          label="Lutteur 2"
          selectedFighter={f2 ?? null}
          otherSelectedId={row.fighter1Id}
          regions={regions}
          availableFighters={availableFighters}
          selectedFighterIds={selectedFighterIds}
          onSelect={onSelectFighter2}
          colorBadge="bg-red-500"
        />
      </div>
    </div>
  );
}

// Fighter Slot Dropdown & Search
interface FighterSlotProps {
  label: string;
  selectedFighter: EliminationFighter | null;
  otherSelectedId: number | null;
  regions: Region[];
  availableFighters: EliminationFighter[];
  selectedFighterIds: Set<number>;
  onSelect: (id: number | null) => void;
  colorBadge: string;
}

function FighterSlot({
  label,
  selectedFighter,
  otherSelectedId,
  regions,
  availableFighters,
  selectedFighterIds,
  onSelect,
  colorBadge,
}: FighterSlotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  // Filtered fighters for this slot
  const candidates = useMemo(() => {
    return availableFighters.filter((f) => {
      // Exclude fighter in the other slot of this match
      if (otherSelectedId && f.id === otherSelectedId) return false;

      // Exclude fighter selected in another match row, unless it's currently selected here
      if (selectedFighterIds.has(f.id) && f.id !== selectedFighter?.id) {
        return false;
      }

      // Filter by region
      if (selectedRegion !== "all") {
        const rId = f.region_id ?? f.region?.id;
        if (
          rId === undefined ||
          rId === null ||
          String(rId) !== String(selectedRegion)
        ) {
          return false;
        }
      }

      // Filter by search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nickname = (f.nickname || "").toLowerCase();
        return fullName.includes(query) || nickname.includes(query);
      }

      return true;
    });
  }, [
    availableFighters,
    otherSelectedId,
    selectedFighterIds,
    selectedFighter,
    selectedRegion,
    search,
  ]);

  if (selectedFighter) {
    return (
      <div className="p-2.5 rounded-lg border bg-background flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-9 w-9 border flex-shrink-0">
            <AvatarImage src={selectedFighter.profile_image} />
            <AvatarFallback className="text-xs font-bold">
              {selectedFighter.first_name?.[0]}
              {selectedFighter.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">
              {selectedFighter.first_name} {selectedFighter.last_name}
              {selectedFighter.nickname && (
                <span className="font-normal italic text-muted-foreground ml-1">
                  "{selectedFighter.nickname}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {selectedFighter.region && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded font-medium text-white"
                  style={{
                    backgroundColor: selectedFighter.region.color || "#3b82f6",
                  }}
                >
                  {selectedFighter.region.name}
                </span>
              )}
              {selectedFighter.ranking !== undefined && (
                <span className="text-[10px] text-muted-foreground">
                  Rang #{selectedFighter.ranking}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(null)}
          className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
        >
          <X className="h-3.5 w-3.5 mr-1" /> Changer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border rounded-lg p-2.5 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom, surnom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs bg-background"
          />
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes régions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 bg-background rounded-md border p-1">
        {candidates.length > 0 ? (
          candidates.map((f) => (
            <div
              key={f.id}
              onClick={() => {
                onSelect(f.id);
                setSearch("");
              }}
              className="p-1.5 rounded hover:bg-muted cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 text-[10px]">
                  <AvatarImage src={f.profile_image} />
                  <AvatarFallback>
                    {f.first_name?.[0]}
                    {f.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <span className="font-semibold">
                    {f.first_name} {f.last_name}
                  </span>
                  {f.region && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({f.region.name})
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
              >
                Choisir
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-3 text-[11px] text-muted-foreground">
            Aucun lutteur disponible pour ces critères
          </div>
        )}
      </div>
    </div>
  );
}
