// app/admin/sub-groups/[subGroupId]/organisation/empty-match-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Fighter } from "@/types";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmptyMatchCardProps {
  region1Fighters: Fighter[];
  region2Fighters: Fighter[];
  onCreateMatch: (fighter1Id: number, fighter2Id: number) => void;
}

export function EmptyMatchCard({
  region1Fighters,
  region2Fighters,
  onCreateMatch,
}: EmptyMatchCardProps) {
  const [selectedFighter1, setSelectedFighter1] = useState<string>("");
  const [selectedFighter2, setSelectedFighter2] = useState<string>("");

  const canCreateMatch = selectedFighter1 && selectedFighter2;

  const handleCreate = () => {
    if (canCreateMatch) {
      onCreateMatch(parseInt(selectedFighter1), parseInt(selectedFighter2));
      setSelectedFighter1("");
      setSelectedFighter2("");
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-muted/20">
      <CardContent className="p-2">
        <Typography
          variant="body-lg"
          weight="medium"
          className="text-center mb-2 text-primary"
        >
          Nouveau Match
        </Typography>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Sélection Lutteur 1 */}
          <div className="space-y-2">
            <Typography variant="body-sm" weight="medium">
              Lutteur Région 1
            </Typography>
            <Select
              value={selectedFighter1}
              onValueChange={setSelectedFighter1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                {region1Fighters.map((fighter) => (
                  <SelectItem
                    className="text-wrap"
                    key={fighter.id}
                    value={fighter.id.toString()}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            fighter.profile_image || "/placeholder-avatar.png"
                          }
                          alt={`${fighter.first_name} ${fighter.last_name}`}
                        />
                        <AvatarFallback>
                          {fighter.first_name[0]}
                          {fighter.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fighter.first_name} {fighter.last_name}
                        </span>
                        {fighter.nickname && (
                          <span className="text-xs text-muted-foreground">
                            "{fighter.nickname}"
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection Lutteur 2 */}
          <div className="space-y-2">
            <Typography variant="body-sm" weight="medium">
              Lutteur Région 2
            </Typography>
            <Select
              value={selectedFighter2}
              onValueChange={setSelectedFighter2}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                {region2Fighters.map((fighter) => (
                  <SelectItem key={fighter.id} value={fighter.id.toString()}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            fighter.profile_image || "/placeholder-avatar.png"
                          }
                          alt={`${fighter.first_name} ${fighter.last_name}`}
                        />
                        <AvatarFallback>
                          {fighter.first_name[0]}
                          {fighter.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fighter.first_name} {fighter.last_name}
                        </span>
                        {fighter.nickname && (
                          <span className="text-xs text-muted-foreground">
                            "{fighter.nickname}"
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={!canCreateMatch}
          className="w-full bg-primary/20 hover:text-white text-primary border border-primary"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer le Match
        </Button>
      </CardContent>
    </Card>
  );
}
