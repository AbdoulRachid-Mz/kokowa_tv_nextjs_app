// app/ad/sub-groups/[subGroupId]/organisation/bulk-match-creator.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Fighter } from "@/types";
import {
  Plus,
  Trash2,
  SaveAll,
  X,
  Users,
  Swords,
  Check,
  AlertCircle,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

type SortOrder = 'asc' | 'desc';

interface BulkMatchCreatorProps {
  region1Fighters: Fighter[];
  region2Fighters: Fighter[];
  existingMatchFighterIds: Set<number>; // IDs des lutteurs déjà dans des matchs existants
  onCreateMatches: (
    matches: { fighter1Id: number; fighter2Id?: number }[]
  ) => void;
  onCancel: () => void;
}

interface MatchRow {
  fighter1Id?: number;
  fighter2Id?: number;
}

export function BulkMatchCreator({
  region1Fighters,
  region2Fighters,
  existingMatchFighterIds,
  onCreateMatches,
  onCancel,
}: BulkMatchCreatorProps) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortControls, setShowSortControls] = useState(false);

  // Initialiser avec une seule carte pré-remplie avec le premier lutteur disponible
  useEffect(() => {
    const availableFighters = region1Fighters.filter(f => !existingMatchFighterIds.has(f.id));

    if (availableFighters.length > 0) {
      // Créer une seule carte au début avec le premier lutteur disponible de la région 1
      setMatches([{
        fighter1Id: availableFighters[0]?.id,
      }]);
    } else {
      // Si pas de lutteurs région 1 disponibles, créer une carte vide
      setMatches([{ fighter1Id: undefined }]);
    }
  }, [region1Fighters, existingMatchFighterIds]);

  // Calculer les lutteurs région 1 disponibles (non utilisés dans les matchs existants ET non sélectionnés dans le bulk)
  const availableRegion1Fighters = useMemo(() => {
    const selectedInBulk = new Set<number>();
    matches.forEach(match => {
      if (match.fighter1Id) selectedInBulk.add(match.fighter1Id);
    });

    return region1Fighters
      .filter(fighter => !existingMatchFighterIds.has(fighter.id)) // Exclure ceux déjà dans des matchs existants
      .filter(fighter => !selectedInBulk.has(fighter.id)) // Exclure ceux déjà sélectionnés dans le bulk
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
  }, [region1Fighters, existingMatchFighterIds, matches, sortOrder]);

  // Calculer les lutteurs région 2 disponibles
  const availableRegion2Fighters = useMemo(() => {
    const selectedInBulk = new Set<number>();
    matches.forEach(match => {
      if (match.fighter2Id) selectedInBulk.add(match.fighter2Id);
    });

    return region2Fighters
      .filter(fighter => !existingMatchFighterIds.has(fighter.id)) // Exclure ceux déjà dans des matchs existants
      .filter(fighter => !selectedInBulk.has(fighter.id)) // Exclure ceux déjà sélectionnés dans le bulk
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
  }, [region2Fighters, existingMatchFighterIds, matches, sortOrder]);

  // Obtenir tous les IDs sélectionnés dans le bulk (pour les vérifications)
  const selectedInBulkIds = useMemo(() => {
    const ids = new Set<number>();
    matches.forEach(match => {
      if (match.fighter1Id) ids.add(match.fighter1Id);
      if (match.fighter2Id) ids.add(match.fighter2Id);
    });
    return ids;
  }, [matches]);

  // Ajouter une carte vide avec le prochain lutteur disponible de la région 1
  const addMatch = () => {
    if (availableRegion1Fighters.length > 0) {
      setMatches([...matches, { fighter1Id: availableRegion1Fighters[0].id }]);
    } else if (region1Fighters.some(f => !existingMatchFighterIds.has(f.id))) {
      // Si tous les lutteurs disponibles sont déjà sélectionnés dans le bulk
      const firstAvailable = region1Fighters.find(f => !existingMatchFighterIds.has(f.id));
      if (firstAvailable) {
        setMatches([...matches, { fighter1Id: firstAvailable.id }]);
      }
    } else {
      toast.error("Aucun lutteur disponible pour la région 1");
    }
  };

  // Supprimer une carte
  const removeMatch = (index: number) => {
    if (matches.length > 1) {
      setMatches(matches.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour le lutteur 1
  const updateMatchFighter1 = (index: number, fighter1Id?: number) => {
    const newMatches = [...matches];

    // Vérifier si le lutteur est déjà sélectionné ailleurs
    if (fighter1Id && selectedInBulkIds.has(fighter1Id) &&
      fighter1Id !== matches[index].fighter1Id) {
      toast.error("Ce lutteur est déjà sélectionné dans une autre carte");
      return;
    }

    newMatches[index] = { ...newMatches[index], fighter1Id };
    setMatches(newMatches);
  };

  // Mettre à jour le lutteur 2
  const updateMatchFighter2 = (index: number, fighter2Id?: number) => {
    const newMatches = [...matches];

    // Vérifier si le lutteur est déjà sélectionné ailleurs
    if (fighter2Id && selectedInBulkIds.has(fighter2Id) &&
      fighter2Id !== matches[index].fighter2Id) {
      toast.error("Ce lutteur est déjà sélectionné dans une autre carte");
      return;
    }

    newMatches[index] = { ...newMatches[index], fighter2Id };
    setMatches(newMatches);
  };

  // Créer tous les matchs validés
  const handleCreateAll = async () => {
    const validMatches = matches
      .filter((m) => m.fighter1Id) // Uniquement ceux avec un lutteur 1
      .map((m) => ({ fighter1Id: m.fighter1Id!, fighter2Id: m.fighter2Id }));

    if (validMatches.length > 0) {
      setIsSaving(true);
      try {
        await onCreateMatches(validMatches);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Créer un seul match
  const handleCreateSingle = async (index: number) => {
    const match = matches[index];
    if (match.fighter1Id) {
      setIsSaving(true);
      try {
        await onCreateMatches([
          { fighter1Id: match.fighter1Id, fighter2Id: match.fighter2Id },
        ]);
        // Retirer la carte après création
        removeMatch(index);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Compter les matchs prêts
  const readyMatchesCount = matches.filter((m) => m.fighter1Id).length;
  const totalMatchesCount = matches.length;

  // Obtenir un lutteur par ID
  const getFighter1 = (fighter1Id?: number) => {
    return fighter1Id
      ? region1Fighters.find((f) => f.id === fighter1Id)
      : undefined;
  };

  const getFighter2 = (fighter2Id?: number) => {
    return fighter2Id
      ? region2Fighters.find((f) => f.id === fighter2Id)
      : undefined;
  };

  // Formatter le nom du lutteur pour l'affichage
  const getFighterDisplayName = (fighter: Fighter) => {
    return `${fighter.first_name} ${fighter.last_name}${fighter.nickname ? ` (${fighter.nickname})` : ''}`;
  };

  return (
    <Card className="border-2 p-4 border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Création multiple de matchs
            <Badge variant="outline" className="ml-2">
              {readyMatchesCount}/{totalMatchesCount} avec lutteur 1
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSortControls(!showSortControls)}
              className="h-8 gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {showSortControls ? "Masquer tri" : "Trier"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showSortControls && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted/20 rounded-lg">
            <Typography variant="body-sm" weight="medium">
              Ordre d'affichage des lutteurs :
            </Typography>
            <Toggle
              pressed={sortOrder === 'asc'}
              onPressedChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label="Changer l'ordre de tri"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              <span className="ml-2">
                {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
              </span>
            </Toggle>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match, index) => {
            const fighter1 = getFighter1(match.fighter1Id);
            const fighter2 = getFighter2(match.fighter2Id);
            const canCreateSingle = !!match.fighter1Id;
            const isFighter1Disabled = !match.fighter1Id && availableRegion1Fighters.length === 0;

            return (
              <div
                key={index}
                className="p-4 border rounded-lg bg-card/50 relative"
              >
                {/* En-tête de la carte */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-sm" weight="medium">
                      Match #{index + 1}
                    </Typography>
                    {!match.fighter1Id && (
                      <Badge variant="destructive" className="text-xs">
                        Lutteur 1 requis
                      </Badge>
                    )}
                    {isFighter1Disabled && (
                      <Badge variant="destructive" className="text-xs">
                        Plus de lutteurs disponibles
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleCreateSingle(index)}
                      disabled={!canCreateSingle || isSaving}
                      size="sm"
                      className="gap-1"
                      variant="outline"
                    >
                      <Check className="h-3 w-3" />
                      Créer
                    </Button>
                    {matches.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMatch(index)}
                        className="text-destructive h-8 w-8 p-0"
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Lutteur 1 */}
                  <div className="col-span-5">
                    <div className="space-y-2">
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        className="flex items-center gap-1"
                      >
                        Lutteur Région 1
                        <span className="text-xs text-muted-foreground">
                          ({availableRegion1Fighters.length} disponibles)
                        </span>
                      </Typography>
                      <Select
                        value={match.fighter1Id?.toString() || ""}
                        onValueChange={(value) =>
                          updateMatchFighter1(
                            index,
                            value ? parseInt(value) : undefined
                          )
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          {fighter1 ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={fighter1.profile_image}
                                  alt={fighter1.first_name}
                                />
                                <AvatarFallback>
                                  {fighter1.first_name?.[0]}
                                  {fighter1.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {getFighterDisplayName(fighter1)}
                              </span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner un lutteur..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {availableRegion1Fighters.length === 0 ? (
                            <SelectItem value="no-fighters" disabled>
                              Aucun lutteur disponible
                            </SelectItem>
                          ) : (
                            availableRegion1Fighters.map((fighter) => (
                              <SelectItem
                                key={fighter.id}
                                value={fighter.id.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={fighter.profile_image}
                                      alt={fighter.first_name}
                                    />
                                    <AvatarFallback>
                                      {fighter.first_name?.[0]}
                                      {fighter.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {getFighterDisplayName(fighter)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Classement: {fighter.ranking || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* VS au centre */}
                  <div className="col-span-2 flex justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Swords className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Typography
                        variant="body-sm"
                        weight="bold"
                        className="text-muted-foreground mt-1"
                      >
                        VS
                      </Typography>
                    </div>
                  </div>

                  {/* Lutteur 2 */}
                  <div className="col-span-5">
                    <div className="space-y-2">
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        className="flex items-center gap-1"
                      >
                        Lutteur Région 2
                        <span className="text-xs text-muted-foreground">
                          ({availableRegion2Fighters.length} disponibles)
                        </span>
                      </Typography>
                      <Select
                        value={match.fighter2Id?.toString() || ""}
                        onValueChange={(value) =>
                          updateMatchFighter2(
                            index,
                            value ? parseInt(value) : undefined
                          )
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          {fighter2 ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={fighter2.profile_image}
                                  alt={fighter2.first_name}
                                />
                                <AvatarFallback>
                                  {fighter2.first_name?.[0]}
                                  {fighter2.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {getFighterDisplayName(fighter2)}
                              </span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Optionnel - Sélectionner..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Optionnel --</SelectItem>
                          {availableRegion2Fighters.length > 0 ? (
                            availableRegion2Fighters.map((fighter) => (
                              <SelectItem
                                key={fighter.id}
                                value={fighter.id.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={fighter.profile_image}
                                      alt={fighter.first_name}
                                    />
                                    <AvatarFallback>
                                      {fighter.first_name?.[0]}
                                      {fighter.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {getFighterDisplayName(fighter)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Classement: {fighter.ranking || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-fighters" disabled>
                              Aucun lutteur disponible
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Actions principales */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={addMatch}
              variant="outline"
              className="gap-2"
              disabled={isSaving || availableRegion1Fighters.length === 0}
            >
              <Plus className="h-4 w-4" />
              Ajouter un match
            </Button>

            <Button
              onClick={handleCreateAll}
              disabled={readyMatchesCount === 0 || isSaving}
              className="gap-2 flex-1"
              variant="default"
            >
              <SaveAll className="h-4 w-4" />
              {isSaving
                ? "Création en cours..."
                : `Créer ${readyMatchesCount} match(s)`}
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 bg-muted/20 rounded-lg text-center">
              <Typography variant="caption1" theme="muted">
                Lutteurs Région 1 dispo.
              </Typography>
              <Typography variant="body-base" weight="bold">
                {availableRegion1Fighters.length}
              </Typography>
            </div>
            <div className="p-2 bg-muted/20 rounded-lg text-center">
              <Typography variant="caption1" theme="muted">
                Lutteurs Région 2 dispo.
              </Typography>
              <Typography variant="body-base" weight="bold">
                {availableRegion2Fighters.length}
              </Typography>
            </div>
            <div className="p-2 bg-muted/20 rounded-lg text-center">
              <Typography variant="caption1" theme="muted">
                Déjà utilisés (total)
              </Typography>
              <Typography variant="body-base" weight="bold">
                {existingMatchFighterIds.size + selectedInBulkIds.size}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}