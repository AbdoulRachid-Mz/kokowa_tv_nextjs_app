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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BulkMatchCreatorProps {
  region1Fighters: Fighter[];
  region2Fighters: Fighter[];
  fighterSelectionCounts: Record<number, number>;
  onCreateMatches: (
    matches: { fighter1Id: number; fighter2Id?: number }[]
  ) => void;
  onCancel: () => void;
}

export function BulkMatchCreator({
  region1Fighters,
  region2Fighters,
  fighterSelectionCounts,
  onCreateMatches,
  onCancel,
}: BulkMatchCreatorProps) {
  const [matches, setMatches] = useState<
    { fighter1Id?: number; fighter2Id?: number }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser avec des cartes vides pré-remplies avec le premier lutteur disponible
  useEffect(() => {
    if (region1Fighters.length > 0) {
      // Créer jusqu'à 10 cartes, chaque carte avec un lutteur différent de la région 1
      const initialMatches = [];
      const maxCards = Math.min(10, region1Fighters.length);

      for (let i = 0; i < maxCards; i++) {
        initialMatches.push({
          fighter1Id: region1Fighters[i]?.id,
        });
      }

      setMatches(initialMatches);
    } else {
      // Si pas de lutteurs région 1, créer une carte vide
      setMatches([{ fighter1Id: undefined }]);
    }
  }, [region1Fighters]);

  // Calculer les lutteurs région 2 déjà sélectionnés
  const selectedRegion2FighterIds = useMemo(() => {
    const ids = new Set<number>();
    matches.forEach((match) => {
      if (match.fighter2Id) ids.add(match.fighter2Id);
    });
    return ids;
  }, [matches]);

  // Ajouter une carte vide avec le prochain lutteur disponible de la région 1
  const addMatch = () => {
    // Trouver tous les lutteurs région 1 déjà utilisés
    const usedFighter1Ids = new Set(
      matches.map((m) => m.fighter1Id).filter(Boolean)
    );

    // Trouver le premier lutteur région 1 non utilisé
    const availableFighter1 = region1Fighters.find(
      (f) => !usedFighter1Ids.has(f.id)
    );

    if (availableFighter1) {
      setMatches([...matches, { fighter1Id: availableFighter1.id }]);
    } else if (region1Fighters.length > 0) {
      // Si tous les lutteurs sont déjà utilisés, réutiliser le premier
      setMatches([...matches, { fighter1Id: region1Fighters[0].id }]);
    } else {
      // Si pas de lutteurs région 1, ajouter une carte vide
      setMatches([...matches, { fighter1Id: undefined }]);
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
    newMatches[index] = { ...newMatches[index], fighter1Id };
    setMatches(newMatches);
  };

  // Mettre à jour le lutteur 2
  const updateMatchFighter2 = (index: number, fighter2Id?: number) => {
    const newMatches = [...matches];
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

  // Filtrer les lutteurs région 2 disponibles
  const getAvailableRegion2Fighters = (currentFighter2Id?: number) => {
    return region2Fighters.filter(
      (fighter) =>
        !selectedRegion2FighterIds.has(fighter.id) ||
        fighter.id === currentFighter2Id
    );
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
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match, index) => {
            const fighter1 = getFighter1(match.fighter1Id);
            const fighter2 = getFighter2(match.fighter2Id);
            const availableRegion2Fighters = getAvailableRegion2Fighters(
              match.fighter2Id
            );
            const canCreateSingle = !!match.fighter1Id;
            const selectionCount1 = fighter1
              ? fighterSelectionCounts[fighter1.id] || 0
              : 0;
            const selectionCount2 = fighter2
              ? fighterSelectionCounts[fighter2.id] || 0
              : 0;

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
                  {/* Lutteur 1 (présélectionné mais modifiable) */}
                  <div className="col-span-5">
                    <div className="space-y-2">
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        className="flex items-center gap-1"
                      >
                        Lutteur Région 1
                        {selectionCount1 > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {selectionCount1}x déjà
                          </Badge>
                        )}
                      </Typography>
                      <Select
                        value={match.fighter1Id?.toString() || "empty"}
                        onValueChange={(value) =>
                          updateMatchFighter1(
                            index,
                            value === "empty" ? undefined : parseInt(value)
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
                                {fighter1.first_name} {fighter1.last_name}
                              </span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empty">-- Aucun --</SelectItem>
                          {region1Fighters.map((fighter) => (
                            <SelectItem
                              key={fighter.id}
                              value={fighter.id.toString()}
                            >
                              <div className="flex items-center justify-between gap-2">
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
                                  <div>
                                    <div className="font-medium line-clamp-1">
                                      {fighter.first_name} {fighter.last_name}
                                    </div>
                                    {fighter.nickname && (
                                      <div className="text-xs text-muted-foreground line-clamp-1">
                                        "{fighter.nickname}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {fighterSelectionCounts[fighter.id] > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {fighterSelectionCounts[fighter.id]}x
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
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

                  {/* Lutteur 2 (optionnel) */}
                  <div className="col-span-5">
                    <div className="space-y-2">
                      <Typography
                        variant="body-sm"
                        weight="medium"
                        className="flex items-center gap-1"
                      >
                        Lutteur Région 2
                        {fighter2 && selectionCount2 > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {selectionCount2}x déjà
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          (optionnel)
                        </span>
                      </Typography>
                      <Select
                        value={match.fighter2Id?.toString() || "empty"}
                        onValueChange={(value) =>
                          updateMatchFighter2(
                            index,
                            value === "empty" ? undefined : parseInt(value)
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
                                {fighter2.first_name} {fighter2.last_name}
                              </span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empty">-- Aucun --</SelectItem>
                          {availableRegion2Fighters.map((fighter) => (
                            <SelectItem
                              key={fighter.id}
                              value={fighter.id.toString()}
                            >
                              <div className="flex items-center justify-between gap-2">
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
                                  <div>
                                    <div className="font-medium line-clamp-1">
                                      {fighter.first_name} {fighter.last_name}
                                    </div>
                                    {fighter.nickname && (
                                      <div className="text-xs text-muted-foreground line-clamp-1">
                                        "{fighter.nickname}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {fighterSelectionCounts[fighter.id] > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {fighterSelectionCounts[fighter.id]}x
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Aperçu du match */}
                {(fighter1 || fighter2) && (
                  <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                    <Typography
                      variant="body-sm"
                      weight="medium"
                      className="mb-2"
                    >
                      Aperçu :
                    </Typography>
                    <div className="flex items-center justify-center gap-6">
                      {fighter1 && (
                        <div className="text-center flex-1">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={fighter1.profile_image}
                                alt={fighter1.first_name}
                              />
                              <AvatarFallback>
                                {fighter1.first_name[0]}
                                {fighter1.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Typography variant="body-sm" weight="medium">
                                {fighter1.first_name} {fighter1.last_name}
                              </Typography>
                              {fighter1.nickname && (
                                <Typography variant="caption1" theme="muted">
                                  "{fighter1.nickname}"
                                </Typography>
                              )}
                            </div>
                          </div>
                          {selectionCount1 > 0 && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Utilisé {selectionCount1} fois
                            </Badge>
                          )}
                        </div>
                      )}

                      {fighter1 && fighter2 && (
                        <div className="flex flex-col items-center">
                          <Swords className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="caption1" weight="bold">
                            VS
                          </Typography>
                        </div>
                      )}

                      {fighter2 ? (
                        <div className="text-center flex-1">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={fighter2.profile_image}
                                alt={fighter2.first_name}
                              />
                              <AvatarFallback>
                                {fighter2.first_name[0]}
                                {fighter2.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Typography variant="body-sm" weight="medium">
                                {fighter2.first_name} {fighter2.last_name}
                              </Typography>
                              {fighter2.nickname && (
                                <Typography variant="caption1" theme="muted">
                                  "{fighter2.nickname}"
                                </Typography>
                              )}
                            </div>
                          </div>
                          {selectionCount2 > 0 && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Utilisé {selectionCount2} fois
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-center flex-1">
                          <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-muted flex items-center justify-center">
                            <Typography variant="body-sm" theme="muted">
                              ?
                            </Typography>
                          </div>
                          <Typography variant="body-sm" theme="muted">
                            À déterminer
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Actions principales */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={addMatch}
              variant="outline"
              className="gap-2"
              disabled={isSaving}
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

          {/* Instructions et informations */}
          <div className="text-sm text-muted-foreground mt-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className="text-blue-600"
                >
                  Fonctionnement :
                </Typography>
                <Typography variant="body-sm">
                  • Chaque carte est pré-remplie avec un lutteur différent de la
                  Région 1 • Vous pouvez modifier le lutteur 1 ou le laisser tel
                  quel • Le lutteur 2 est optionnel - vous pourrez le définir
                  plus tard • Cliquez sur "Créer" sur une carte pour créer ce
                  match seul • Cliquez sur "Créer X match(s)" pour créer tous
                  les matchs validés
                </Typography>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5"></div>
              <Typography variant="body-sm">
                Le badge "Xx" indique combien de fois un lutteur est déjà
                utilisé dans d'autres matchs de cette rencontre.
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
