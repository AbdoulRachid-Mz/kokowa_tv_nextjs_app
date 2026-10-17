// app/(admins)/ad/phase-groups/[groupId]/organisation/elimination-match-creator.tsx
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
import { Fighter, Region } from "@/types";
import {
  Swords,
  Search,
  Filter,
  Check,
  X,
  User,
  Shield,
  Loader2,
  Sparkles,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface EliminationFighter extends Fighter {
  region?: Region;
  is_eliminated?: boolean;
}

interface EliminationMatchCreatorProps {
  availableFighters: EliminationFighter[];
  regions: Region[];
  onCreateMatch: (
    fighter1Id: number,
    fighter2Id: number,
    period: "matin" | "soir"
  ) => Promise<void>;
  isCreating: boolean;
  onCancel?: () => void;
}

export function EliminationMatchCreator({
  availableFighters,
  regions,
  onCreateMatch,
  isCreating,
  onCancel,
}: EliminationMatchCreatorProps) {
  const [fighter1Id, setFighter1Id] = useState<number | null>(null);
  const [fighter2Id, setFighter2Id] = useState<number | null>(null);
  const [period, setPeriod] = useState<"matin" | "soir">("matin");

  // Filtres de recherche pour le Lutteur 1
  const [search1, setSearch1] = useState("");
  const [selectedRegion1, setSelectedRegion1] = useState<string>("all");

  // Filtres de recherche pour le Lutteur 2
  const [search2, setSearch2] = useState("");
  const [selectedRegion2, setSelectedRegion2] = useState<string>("all");

  // Lutteurs filtrés pour la sélection 1
  const filteredFighters1 = useMemo(() => {
    return availableFighters.filter((f) => {
      // Ne peut pas sélectionner le lutteur déjà sélectionné en 2
      if (fighter2Id && f.id === fighter2Id) return false;

      // Filtre région
      if (selectedRegion1 !== "all") {
        const fighterRegionId = f.region_id ?? f.region?.id;
        if (fighterRegionId === undefined || fighterRegionId === null || String(fighterRegionId) !== String(selectedRegion1)) {
          return false;
        }
      }

      // Filtre texte (nom, prénom, surnom)
      if (search1.trim()) {
        const query = search1.toLowerCase().trim();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nickname = (f.nickname || "").toLowerCase();
        return fullName.includes(query) || nickname.includes(query);
      }

      return true;
    });
  }, [availableFighters, fighter2Id, selectedRegion1, search1]);

  // Lutteurs filtrés pour la sélection 2
  const filteredFighters2 = useMemo(() => {
    return availableFighters.filter((f) => {
      // Ne peut pas sélectionner le lutteur déjà sélectionné en 1
      if (fighter1Id && f.id === fighter1Id) return false;

      // Filtre région
      if (selectedRegion2 !== "all") {
        const fighterRegionId = f.region_id ?? f.region?.id;
        if (fighterRegionId === undefined || fighterRegionId === null || String(fighterRegionId) !== String(selectedRegion2)) {
          return false;
        }
      }

      // Filtre texte (nom, prénom, surnom)
      if (search2.trim()) {
        const query = search2.toLowerCase().trim();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nickname = (f.nickname || "").toLowerCase();
        return fullName.includes(query) || nickname.includes(query);
      }

      return true;
    });
  }, [availableFighters, fighter1Id, selectedRegion2, search2]);

  const fighter1 = useMemo(
    () => availableFighters.find((f) => f.id === fighter1Id),
    [availableFighters, fighter1Id]
  );

  const fighter2 = useMemo(
    () => availableFighters.find((f) => f.id === fighter2Id),
    [availableFighters, fighter2Id]
  );

  const handleCreate = async () => {
    if (!fighter1Id || !fighter2Id) return;
    await onCreateMatch(fighter1Id, fighter2Id, period);
    setFighter1Id(null);
    setFighter2Id(null);
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
              <CardTitle className="text-lg">Créer un Combat d'Élimination</CardTitle>
              <Typography variant="body-sm" theme="muted">
                Sélectionnez deux lutteurs invaincus pour créer automatiquement le match et sa rencontre.
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              {availableFighters.length} lutteur(s) disponible(s)
            </Badge>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Sélecteur de Période du sous-groupe (Matin / Soir) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <span className="text-xs font-semibold block">Période de la rencontre</span>
              <span className="text-[11px] text-muted-foreground">Sélectionnez la période du combat (Matin ou Soir)</span>
            </div>
          </div>
          <Select value={period} onValueChange={(val: "matin" | "soir") => setPeriod(val)}>
            <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matin">🌅 Matin</SelectItem>
              <SelectItem value="soir">🌙 Soir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sélecteurs des deux combattants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* SÉLECTION LUTTEUR 1 */}
          <div className="space-y-3 p-4 rounded-xl border bg-card/60 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <Typography variant="h6" weight="bold">
                  Premier Lutteur
                </Typography>
              </div>
              {fighter1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFighter1Id(null)}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" /> Changer
                </Button>
              )}
            </div>

            {/* Lutteur 1 Sélectionné */}
            {fighter1 ? (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-blue-500 shadow-sm">
                  <AvatarImage src={fighter1.profile_image} />
                  <AvatarFallback className="font-bold">
                    {fighter1.first_name?.[0]}
                    {fighter1.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Typography variant="body-base" weight="bold" className="truncate">
                    {fighter1.first_name} {fighter1.last_name}
                  </Typography>
                  {fighter1.nickname && (
                    <Typography variant="caption1" theme="muted" className="italic">
                      "{fighter1.nickname}"
                    </Typography>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {fighter1.region && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: fighter1.region.color || "#3b82f6",
                          color: fighter1.region.color || "inherit",
                        }}
                      >
                        {fighter1.region.name}
                      </Badge>
                    )}
                    {fighter1.ranking !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Rang #{fighter1.ranking}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-blue-500 text-white rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              /* Recherche & Choix Lutteur 1 */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, prénom ou surnom..."
                      value={search1}
                      onChange={(e) => setSearch1(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                  <Select
                    value={selectedRegion1}
                    onValueChange={setSelectedRegion1}
                  >
                    <SelectTrigger className="w-full sm:w-[150px] text-xs">
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

                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 border rounded-lg p-1.5 bg-background">
                  {filteredFighters1.length > 0 ? (
                    filteredFighters1.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setFighter1Id(f.id)}
                        className="p-2 rounded-md hover:bg-muted/80 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={f.profile_image} />
                            <AvatarFallback className="text-xs">
                              {f.first_name?.[0]}
                              {f.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {f.first_name} {f.last_name}
                              {f.nickname && (
                                <span className="font-normal italic text-muted-foreground ml-1">
                                  "{f.nickname}"
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {f.region?.name || "Région inconnue"}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Choisir
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Aucun lutteur disponible pour ces critères
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SÉLECTION LUTTEUR 2 */}
          <div className="space-y-3 p-4 rounded-xl border bg-card/60 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <Typography variant="h6" weight="bold">
                  Deuxième Lutteur
                </Typography>
              </div>
              {fighter2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFighter2Id(null)}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" /> Changer
                </Button>
              )}
            </div>

            {/* Lutteur 2 Sélectionné */}
            {fighter2 ? (
              <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-red-500 shadow-sm">
                  <AvatarImage src={fighter2.profile_image} />
                  <AvatarFallback className="font-bold">
                    {fighter2.first_name?.[0]}
                    {fighter2.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Typography variant="body-base" weight="bold" className="truncate">
                    {fighter2.first_name} {fighter2.last_name}
                  </Typography>
                  {fighter2.nickname && (
                    <Typography variant="caption1" theme="muted" className="italic">
                      "{fighter2.nickname}"
                    </Typography>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {fighter2.region && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: fighter2.region.color || "#ef4444",
                          color: fighter2.region.color || "inherit",
                        }}
                      >
                        {fighter2.region.name}
                      </Badge>
                    )}
                    {fighter2.ranking !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Rang #{fighter2.ranking}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-red-500 text-white rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              /* Recherche & Choix Lutteur 2 */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, prénom ou surnom..."
                      value={search2}
                      onChange={(e) => setSearch2(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                  <Select
                    value={selectedRegion2}
                    onValueChange={setSelectedRegion2}
                  >
                    <SelectTrigger className="w-full sm:w-[150px] text-xs">
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

                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 border rounded-lg p-1.5 bg-background">
                  {filteredFighters2.length > 0 ? (
                    filteredFighters2.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setFighter2Id(f.id)}
                        className="p-2 rounded-md hover:bg-muted/80 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={f.profile_image} />
                            <AvatarFallback className="text-xs">
                              {f.first_name?.[0]}
                              {f.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {f.first_name} {f.last_name}
                              {f.nickname && (
                                <span className="font-normal italic text-muted-foreground ml-1">
                                  "{f.nickname}"
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {f.region?.name || "Région inconnue"}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Choisir
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Aucun lutteur disponible pour ces critères
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu du Duel & Bouton de Création */}
        {fighter1 && fighter2 && (
          <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-primary">Aperçu :</span>
              <span className="text-sm font-semibold">
                {fighter1.first_name} ({fighter1.region?.name})
              </span>
              <Badge variant="destructive" className="font-bold">
                VS
              </Badge>
              <span className="text-sm font-semibold">
                {fighter2.first_name} ({fighter2.region?.name})
              </span>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2 font-semibold shadow-md w-full sm:w-auto"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  Créer et Enregistrer le Match
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
