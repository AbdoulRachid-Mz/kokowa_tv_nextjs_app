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
import { Fighter, Region, Referee } from "@/types";
import {
  Swords,
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  Clock,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface EliminationFighter extends Fighter {
  region?: Region;
  is_eliminated?: boolean;
}

interface EliminationMatchCreatorProps {
  availableFighters: EliminationFighter[];
  allEditionFighters?: EliminationFighter[];
  regions: Region[];
  referees?: Referee[];
  onCreateMatch: (
    fighter1Id: number | null,
    fighter2Id: number | null,
    period: "matin" | "soir",
    isExceptional?: boolean,
    refereeId?: number | null
  ) => Promise<void>;
  isCreating: boolean;
  onCancel?: () => void;
}

export function EliminationMatchCreator({
  availableFighters,
  allEditionFighters = [],
  regions,
  referees = [],
  onCreateMatch,
  isCreating,
  onCancel,
}: EliminationMatchCreatorProps) {
  const [fighter1Id, setFighter1Id] = useState<number | null>(null);
  const [fighter2Id, setFighter2Id] = useState<number | null>(null);
  const [period, setPeriod] = useState<"matin" | "soir">("matin");
  const [isExceptional, setIsExceptional] = useState(false);
  const [selectedRefereeId, setSelectedRefereeId] = useState<string>("none");

  // Filtres de recherche pour le Lutteur 1
  const [search1, setSearch1] = useState("");
  const [selectedRegion1, setSelectedRegion1] = useState<string>("all");

  // Filtres de recherche pour le Lutteur 2
  const [search2, setSearch2] = useState("");
  const [selectedRegion2, setSelectedRegion2] = useState<string>("all");

  // Source des lutteurs selon le mode (normal = non éliminés & non engagés, exceptionnel = tous)
  const fightersPool = useMemo(() => {
    if (isExceptional && allEditionFighters.length > 0) {
      return allEditionFighters;
    }
    return availableFighters;
  }, [isExceptional, allEditionFighters, availableFighters]);

  // Lutteurs filtrés pour la sélection 1
  const filteredFighters1 = useMemo(() => {
    return fightersPool.filter((f) => {
      if (fighter2Id && f.id === fighter2Id) return false;

      if (selectedRegion1 !== "all") {
        const fighterRegionId = f.region_id ?? f.region?.id;
        if (
          fighterRegionId === undefined ||
          fighterRegionId === null ||
          String(fighterRegionId) !== String(selectedRegion1)
        ) {
          return false;
        }
      }

      if (search1.trim()) {
        const query = search1.toLowerCase().trim();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nickname = (f.nickname || "").toLowerCase();
        return fullName.includes(query) || nickname.includes(query);
      }

      return true;
    });
  }, [fightersPool, fighter2Id, selectedRegion1, search1]);

  // Lutteurs filtrés pour la sélection 2
  const filteredFighters2 = useMemo(() => {
    return fightersPool.filter((f) => {
      if (fighter1Id && f.id === fighter1Id) return false;

      if (selectedRegion2 !== "all") {
        const fighterRegionId = f.region_id ?? f.region?.id;
        if (
          fighterRegionId === undefined ||
          fighterRegionId === null ||
          String(fighterRegionId) !== String(selectedRegion2)
        ) {
          return false;
        }
      }

      if (search2.trim()) {
        const query = search2.toLowerCase().trim();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const nickname = (f.nickname || "").toLowerCase();
        return fullName.includes(query) || nickname.includes(query);
      }

      return true;
    });
  }, [fightersPool, fighter1Id, selectedRegion2, search2]);

  const fighter1 = useMemo(
    () => fightersPool.find((f) => f.id === fighter1Id),
    [fightersPool, fighter1Id]
  );

  const fighter2 = useMemo(
    () => fightersPool.find((f) => f.id === fighter2Id),
    [fightersPool, fighter2Id]
  );

  const handleCreate = async () => {
    // Règle Lot 2 : Au moins un lutteur requis (1 ou 2, mais pas 0)
    if (!fighter1Id && !fighter2Id) return;
    const refereeIdNum = selectedRefereeId !== "none" ? parseInt(selectedRefereeId) : null;

    await onCreateMatch(
      fighter1Id,
      fighter2Id,
      period,
      isExceptional,
      refereeIdNum
    );

    setFighter1Id(null);
    setFighter2Id(null);
  };

  const hasAtLeastOneFighter = !!(fighter1Id || fighter2Id);

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isExceptional ? "Ajouter un Match Exceptionnel (3e place / repêchage)" : "Créer un Combat d'Élimination"}
              </CardTitle>
              <Typography variant="body-sm" theme="muted">
                {isExceptional
                  ? "Autorise la sélection de lutteurs déjà engagés ou éliminés pour les matchs de classement."
                  : "Sélectionnez un ou deux lutteurs pour programmer le combat."}
              </Typography>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={isExceptional ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setIsExceptional(!isExceptional);
                setFighter1Id(null);
                setFighter2Id(null);
              }}
              className="text-xs gap-1.5 h-8"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {isExceptional ? "Mode Normal" : "Match Exceptionnel"}
            </Button>

            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              {fightersPool.length} lutteur(s)
            </Badge>

            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Paramètres : Période & Arbitre de la rencontre */}
        <div className="p-3 bg-muted/30 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Période du match :</span>
            <div className="flex items-center gap-1 bg-background p-1 rounded-md border">
              <Button
                variant={period === "matin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("matin")}
                className="h-7 text-xs px-2.5"
              >
                🌅 Matin
              </Button>
              <Button
                variant={period === "soir" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("soir")}
                className="h-7 text-xs px-2.5"
              >
                🌙 Soir
              </Button>
            </div>
          </div>

          {/* Sélecteur d'arbitre de la rencontre */}
          {referees.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold">Arbitre de la rencontre :</span>
              <Select
                value={selectedRefereeId}
                onValueChange={setSelectedRefereeId}
              >
                <SelectTrigger className="h-8 text-xs w-[200px]">
                  <SelectValue placeholder="Choisir un arbitre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun arbitre (facultatif)</SelectItem>
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
        </div>

        {/* Sélection des 2 Lutteurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lutteur 1 */}
          <div className="space-y-3 p-3 rounded-xl border-2 border-blue-500/20 bg-blue-50/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Premier Lutteur {fighter1Id ? "" : "(Optionnel si lutteur 2 choisi)"}
                </span>
              </div>
              {fighter1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFighter1Id(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {fighter1 ? (
              <div className="p-3 bg-background rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={fighter1.profile_image} />
                    <AvatarFallback>
                      {fighter1.first_name?.[0]}
                      {fighter1.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Typography variant="body-sm" weight="bold">
                      {fighter1.first_name} {fighter1.last_name}
                    </Typography>
                    {fighter1.region && (
                      <Badge
                        variant="outline"
                        className="text-[10px] mt-0.5"
                      >
                        {fighter1.region.name}
                      </Badge>
                    )}
                    {fighter1.is_eliminated && (
                      <Badge variant="destructive" className="text-[10px] ml-1">
                        Éliminé (Repêché)
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-blue-500 text-white rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nom ou surnom..."
                      value={search1}
                      onChange={(e) => setSearch1(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  <Select
                    value={selectedRegion1}
                    onValueChange={setSelectedRegion1}
                  >
                    <SelectTrigger className="w-[120px] text-xs h-8">
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

                <div className="max-h-[180px] overflow-y-auto space-y-1 border rounded-lg p-1 bg-background">
                  {filteredFighters1.length > 0 ? (
                    filteredFighters1.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setFighter1Id(f.id)}
                        className="p-1.5 rounded-md hover:bg-muted/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={f.profile_image} />
                            <AvatarFallback className="text-[10px]">
                              {f.first_name?.[0]}
                              {f.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <span className="font-semibold">{f.first_name} {f.last_name}</span>
                            <span className="text-muted-foreground text-[10px] ml-1">
                              ({f.region?.name || "Sans région"})
                            </span>
                            {f.is_eliminated && (
                              <Badge variant="outline" className="text-[9px] text-red-500 ml-1 h-3.5 px-1">
                                Éliminé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                          Choisir
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      Aucun lutteur disponible
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lutteur 2 */}
          <div className="space-y-3 p-3 rounded-xl border-2 border-red-500/20 bg-red-50/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Deuxième Lutteur {fighter2Id ? "" : "(Optionnel si lutteur 1 choisi)"}
                </span>
              </div>
              {fighter2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFighter2Id(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {fighter2 ? (
              <div className="p-3 bg-background rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={fighter2.profile_image} />
                    <AvatarFallback>
                      {fighter2.first_name?.[0]}
                      {fighter2.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Typography variant="body-sm" weight="bold">
                      {fighter2.first_name} {fighter2.last_name}
                    </Typography>
                    {fighter2.region && (
                      <Badge
                        variant="outline"
                        className="text-[10px] mt-0.5"
                      >
                        {fighter2.region.name}
                      </Badge>
                    )}
                    {fighter2.is_eliminated && (
                      <Badge variant="destructive" className="text-[10px] ml-1">
                        Éliminé (Repêché)
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-red-500 text-white rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nom ou surnom..."
                      value={search2}
                      onChange={(e) => setSearch2(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  <Select
                    value={selectedRegion2}
                    onValueChange={setSelectedRegion2}
                  >
                    <SelectTrigger className="w-[120px] text-xs h-8">
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

                <div className="max-h-[180px] overflow-y-auto space-y-1 border rounded-lg p-1 bg-background">
                  {filteredFighters2.length > 0 ? (
                    filteredFighters2.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setFighter2Id(f.id)}
                        className="p-1.5 rounded-md hover:bg-muted/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={f.profile_image} />
                            <AvatarFallback className="text-[10px]">
                              {f.first_name?.[0]}
                              {f.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <span className="font-semibold">{f.first_name} {f.last_name}</span>
                            <span className="text-muted-foreground text-[10px] ml-1">
                              ({f.region?.name || "Sans région"})
                            </span>
                            {f.is_eliminated && (
                              <Badge variant="outline" className="text-[9px] text-red-500 ml-1 h-3.5 px-1">
                                Éliminé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                          Choisir
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      Aucun lutteur disponible
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de validation si au moins un lutteur est sélectionné */}
        {hasAtLeastOneFighter && (
          <div className="p-3 rounded-xl border bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold">
              {fighter1 && fighter2 ? (
                <span>
                  Combat : <b>{fighter1.first_name}</b> vs <b>{fighter2.first_name}</b>
                </span>
              ) : fighter1 ? (
                <span>
                  Match individuel : <b>{fighter1.first_name} {fighter1.last_name}</b> (adversaire à définir)
                </span>
              ) : (
                <span>
                  Match individuel : <b>{fighter2?.first_name} {fighter2?.last_name}</b> (adversaire à définir)
                </span>
              )}
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2 font-semibold shadow-md w-full sm:w-auto"
              size="sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
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
