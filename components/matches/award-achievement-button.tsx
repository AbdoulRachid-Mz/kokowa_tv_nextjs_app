// components/matches/award-achievement-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createArchiveFighterAchievement } from "@/actions/archives";
import { toast } from "sonner";
import { Award, Trophy } from "lucide-react";

interface AwardAchievementButtonProps {
  match: any;
  fighterSlot: 1 | 2;
}

export function AwardAchievementButton({ match, fighterSlot }: AwardAchievementButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fighter = fighterSlot === 1 ? match?.fighter1 : match?.fighter2;
  const fighterId = fighterSlot === 1 ? match?.fighter1_id : match?.fighter2_id;
  const isWinner = match?.winner_fighter_id === fighterId;

  const edition = match?.sub_group?.group?.phase?.edition;
  const editionId = edition?.id;
  const year = edition?.year;
  const competitionName = edition?.competition?.name;
  const editionNumber = edition?.edition_number;
  const phaseType = match?.sub_group?.group?.phase?.phase_type;

  const isFinal = phaseType === "final";
  const isThirdPlace = phaseType === "third_place";

  const eligible =
    match?.status === "completed" && (isFinal || isThirdPlace) && !!fighterId && !!editionId;

  if (!eligible) return null;

  const position = isFinal
    ? isWinner
      ? "1st"
      : "2nd"
    : "3rd";
  const type = "competition";

  const handleAward = async () => {
    setLoading(true);
    try {
      const result = await createArchiveFighterAchievement({
        fighter_id: fighterId,
        region_id: fighter?.region_id ?? fighter?.region?.id ?? null,
        title: `${position === "1st" ? "Champion" : position === "2nd" ? "Vice-champion" : "3ème place"} (${competitionName || "Compétition"})`,
        edition_id: editionId,
        year: year,
        position: position,
        type: type,
        description: `Palmarès attribué manuellement pour le match #${match?.match_number}.`,
        medal_image: null,
      });
      if (result?.success) {
        toast.success("Palmarès attribué avec succès");
        setOpen(false);
      } else {
        toast.error(result?.message || "Erreur lors de l'attribution");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'attribution du palmarès");
    } finally {
      setLoading(false);
    }
  };

  const posLabel = position === "1st" ? "1ère place" : position === "2nd" ? "2ème place" : "3ème place";

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Award className="h-4 w-4" />
        Attribuer le palmarès
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un palmarès</DialogTitle>
            <DialogDescription>
              Confirmez l'attribution du palmarès au lutteur suivant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                {fighter?.first_name?.[0]}
                {fighter?.last_name?.[0]}
              </div>
              <div>
                <p className="font-medium">
                  {fighter?.first_name} {fighter?.last_name}
                </p>
                {fighter?.nickname && (
                  <p className="text-sm text-muted-foreground">"{fighter.nickname}"</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Édition :</span>{" "}
                {competitionName} (Éd. {editionNumber})
              </div>
              <div>
                <span className="text-muted-foreground">Année :</span> {year}
              </div>
              <div>
                <span className="text-muted-foreground">Type :</span> competition
              </div>
              <div>
                <span className="text-muted-foreground">Position :</span> {posLabel}
              </div>
              <div>
                <span className="text-muted-foreground">Match :</span> #{match?.match_number}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleAward} disabled={loading}>
              {loading ? "Attribution..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
