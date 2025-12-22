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
import { Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmptyMatchCardProps {
  fighter1?: Fighter;
  fighter2?: Fighter;
  region2Fighters: Fighter[];
  onSelectFighter2: (fighter2Id?: number) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function EmptyMatchCard({
  fighter1,
  fighter2,
  region2Fighters,
  onSelectFighter2,
  onCreate,
  onCancel,
}: EmptyMatchCardProps) {
  const [selectedFighter2, setSelectedFighter2] = useState<string>(
    fighter2?.id.toString() || ""
  );

  const canCreateMatch = fighter1 && selectedFighter2;

  const handleCreate = () => {
    if (canCreateMatch) {
      onCreate();
      setSelectedFighter2("");
    }
  };

  const handleCancel = () => {
    onCancel();
    setSelectedFighter2("");
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-muted/20 p-2">
      <CardContent className="p-2">
        <div className="flex justify-between items-center mb-2">
          <Typography
            variant="body-lg"
            weight="medium"
            className="text-primary"
          >
            Nouveau Match
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Lutteur 1 (présélectionné) */}
          <div className="space-y-2">
            <Typography variant="body-sm" weight="medium">
              Lutteur Région 1
            </Typography>
            {fighter1 ? (
              <div className="flex items-center gap-3 p-2 border rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={fighter1.profile_image || "/placeholder-avatar.png"}
                    alt={`${fighter1.first_name} ${fighter1.last_name}`}
                  />
                  <AvatarFallback>
                    {fighter1.first_name[0]}
                    {fighter1.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {fighter1.first_name} {fighter1.last_name}
                  </span>
                  {fighter1.nickname && (
                    <span className="text-xs text-muted-foreground">
                      "{fighter1.nickname}"
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Typography variant="body-sm" theme="muted" className="italic">
                Sélectionnez un lutteur
              </Typography>
            )}
          </div>

          {/* Sélection Lutteur 2 */}
          <div className="space-y-2">
            <Typography variant="body-sm" weight="medium">
              Lutteur Région 2
            </Typography>
            <Select
              value={selectedFighter2}
              onValueChange={(value) => {
                setSelectedFighter2(value);
                onSelectFighter2(value ? parseInt(value) : undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                {region2Fighters.map((fighter) => (
                  <SelectItem
                    key={fighter.id}
                    value={fighter.id.toString()}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={fighter.profile_image || "/placeholder-avatar.png"}
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