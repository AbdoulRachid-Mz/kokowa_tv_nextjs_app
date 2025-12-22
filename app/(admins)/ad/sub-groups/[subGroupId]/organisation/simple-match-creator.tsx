// app/ad/sub-groups/[subGroupId]/organisation/simple-match-creator.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Swords, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SimpleMatchCreatorProps {
  region1Fighters: Fighter[];
  region2Fighters: Fighter[];
  fighterSelectionCounts: Record<number, number>;
  onCreateMatch: (fighter1Id: number, fighter2Id?: number) => void;
  isCreating: boolean;
  onCancel: () => void;
}

export function SimpleMatchCreator({
  region1Fighters,
  region2Fighters,
  fighterSelectionCounts,
  onCreateMatch,
  isCreating,
  onCancel,
}: SimpleMatchCreatorProps) {
  const [fighter1Id, setFighter1Id] = useState<string>("");
  const [fighter2Id, setFighter2Id] = useState<string>("");

  const fighter1 = useMemo(() => 
    fighter1Id ? region1Fighters.find(f => f.id === parseInt(fighter1Id)) : undefined,
    [fighter1Id, region1Fighters]
  );

  const fighter2 = useMemo(() => 
    fighter2Id ? region2Fighters.find(f => f.id === parseInt(fighter2Id)) : undefined,
    [fighter2Id, region2Fighters]
  );

  const canCreateMatch = !!fighter1Id;

  const handleCreate = () => {
    if (fighter1Id) {
      const fighter2IdValue = fighter2Id ? parseInt(fighter2Id) : undefined;
      onCreateMatch(parseInt(fighter1Id), fighter2IdValue);
      // Réinitialiser après création
      setFighter1Id("");
      setFighter2Id("");
    }
  };

  const handleCancel = () => {
    setFighter1Id("");
    setFighter2Id("");
    onCancel();
  };

  // Formater le nom du lutteur pour l'affichage
  const formatFighterName = (fighter: Fighter) => {
    return `${fighter.first_name} ${fighter.last_name}${fighter.nickname ? ` "${fighter.nickname}"` : ''}`;
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h5" weight="bold" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un nouveau match
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Annuler
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-4 items-center mb-6">
          {/* Lutteur Région 1 */}
          <div className="col-span-5 space-y-2">
            <Typography variant="body-sm" weight="medium" className="text-muted-foreground">
              Lutteur Région 1 *
            </Typography>
            <Select 
              value={fighter1Id} 
              onValueChange={setFighter1Id}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un lutteur..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Aucun</SelectItem>
                {region1Fighters.map((fighter) => (
                  <SelectItem key={fighter.id} value={fighter.id.toString()}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={fighter.profile_image} alt={fighter.first_name} />
                          <AvatarFallback>
                            {fighter.first_name[0]}{fighter.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
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
                        <Badge variant="outline" className="text-xs">
                          {fighterSelectionCounts[fighter.id]}x
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fighter1 && (
              <div className="text-sm text-muted-foreground mt-1">
                Classement: {fighter1.ranking || "N/A"}
              </div>
            )}
          </div>

          {/* VS au centre */}
          <div className="col-span-2 flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Swords className="h-4 w-4 text-muted-foreground" />
              </div>
              <Typography variant="body-sm" weight="bold" className="text-muted-foreground">
                VS
              </Typography>
            </div>
          </div>

          {/* Lutteur Région 2 */}
          <div className="col-span-5 space-y-2">
            <Typography variant="body-sm" weight="medium" className="text-muted-foreground">
              Lutteur Région 2 (optionnel)
            </Typography>
            <Select 
              value={fighter2Id} 
              onValueChange={setFighter2Id}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un lutteur..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Aucun</SelectItem>
                {region2Fighters.map((fighter) => (
                  <SelectItem key={fighter.id} value={fighter.id.toString()}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={fighter.profile_image} alt={fighter.first_name} />
                          <AvatarFallback>
                            {fighter.first_name[0]}{fighter.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
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
                        <Badge variant="outline" className="text-xs">
                          {fighterSelectionCounts[fighter.id]}x
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fighter2 && (
              <div className="text-sm text-muted-foreground mt-1">
                Classement: {fighter2.ranking || "N/A"}
              </div>
            )}
          </div>
        </div>

        {/* Informations du match */}
        {(fighter1 || fighter2) && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <Typography variant="body-sm" weight="medium" className="mb-2">
              Match à créer :
            </Typography>
            <div className="flex items-center justify-center gap-4">
              {fighter1 && (
                <div className="text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={fighter1.profile_image} alt={fighter1.first_name} />
                    <AvatarFallback>
                      {fighter1.first_name[0]}{fighter1.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Typography variant="body-sm" weight="medium">
                    {fighter1.first_name} {fighter1.last_name}
                  </Typography>
                  {fighter1.nickname && (
                    <Typography variant="caption1" theme="muted">
                      "{fighter1.nickname}"
                    </Typography>
                  )}
                </div>
              )}

              {fighter1 && fighter2 && (
                <div className="flex flex-col items-center">
                  <Swords className="h-6 w-6 text-muted-foreground mb-1" />
                  <Typography variant="body-sm" weight="bold">
                    VS
                  </Typography>
                </div>
              )}

              {fighter2 && (
                <div className="text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={fighter2.profile_image} alt={fighter2.first_name} />
                    <AvatarFallback>
                      {fighter2.first_name[0]}{fighter2.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Typography variant="body-sm" weight="medium">
                    {fighter2.first_name} {fighter2.last_name}
                  </Typography>
                  {fighter2.nickname && (
                    <Typography variant="caption1" theme="muted">
                      "{fighter2.nickname}"
                    </Typography>
                  )}
                </div>
              )}

              {fighter1 && !fighter2 && (
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                    <Typography variant="body-sm" theme="muted">
                      ?
                    </Typography>
                  </div>
                  <Typography variant="body-sm" weight="medium" theme="muted">
                    À déterminer
                  </Typography>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleCreate}
            disabled={!canCreateMatch || isCreating}
            className="gap-2 flex-1"
            variant="default"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Créer le match
              </>
            )}
          </Button>

          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isCreating}
          >
            Annuler
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
            <Typography variant="body-sm">
              Un lutteur peut participer à plusieurs matchs. Le badge "Xx" indique le nombre de fois qu'un lutteur est déjà sélectionné.
            </Typography>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
            <Typography variant="body-sm">
              Le lutteur de la région 2 est optionnel. Vous pourrez le définir plus tard.
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}