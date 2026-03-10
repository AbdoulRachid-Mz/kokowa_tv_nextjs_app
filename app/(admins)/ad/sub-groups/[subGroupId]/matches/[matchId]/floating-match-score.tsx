// app/ad/sub-groups/[subGroupId]/matches/[matchId]/floating-match-score.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Swords, Minus, Maximize2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Match, SubGroup, Region } from "@/types";
import Image from "next/image";

interface FloatingMatchScoreProps {
    subGroup: SubGroup;
    match: Match;
    region1: Region | undefined;
    region2: Region | undefined;
    className?: string;
}

export function FloatingMatchScore({
    subGroup,
    match,
    region1,
    region2,
    className = "",
}: FloatingMatchScoreProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Récupérer les scores du sous-groupe
    const scoreRegion1 = subGroup.score_region1 || 0;
    const scoreRegion2 = subGroup.score_region2 || 0;
    const nulls = subGroup.nulls || 0;

    // Version Desktop (toujours visible)
    const DesktopScore = () => (
        <Card className={`shadow-lg border-2 border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                    {/* Région 1 */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                        {region1?.flag_image ? (
                            <Image
                                src={region1.flag_image}
                                alt={region1.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                            />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-full border-2"
                                style={{ backgroundColor: region1?.color || '#ccc' }}
                            />
                        )}
                        <div className="flex-1">
                            <Typography variant="body-sm" weight="bold" className="truncate max-w-[100px]">
                                {region1?.name || "Région 1"}
                            </Typography>
                            <Typography variant="h4" weight="bold" className="text-primary">
                                {scoreRegion1}
                            </Typography>
                        </div>
                    </div>

                    {/* VS et info match */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                                {match.match_number || "?"}
                            </Badge>
                            <Swords className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Typography variant="body-sm" weight="bold" className="text-muted-foreground">
                            {match.fighter1?.first_name || "?"} vs {match.fighter2?.first_name || "?"}
                        </Typography>
                    </div>

                    {/* Région 2 */}
                    <div className="flex items-center gap-3 min-w-[140px] justify-end">
                        <div className="flex-1 text-right">
                            <Typography variant="body-sm" weight="bold" className="truncate max-w-[100px]">
                                {region2?.name || "Région 2"}
                            </Typography>
                            <Typography variant="h4" weight="bold" className="text-primary">
                                {scoreRegion2}
                            </Typography>
                        </div>
                        {region2?.flag_image ? (
                            <Image
                                src={region2.flag_image}
                                alt={region2.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                            />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-full border-2"
                                style={{ backgroundColor: region2?.color || '#ccc' }}
                            />
                        )}
                    </div>

                    {/* Nulls */}
                    {nulls > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full">
                            <Minus className="h-3 w-3" />
                            <Typography variant="body-sm" weight="medium">
                                {nulls}
                            </Typography>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Version Mobile (bouton qui ouvre un dialog)
    const MobileTrigger = () => (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="fixed bottom-4 right-4 shadow-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90 z-50 md:hidden"
                >
                    <Trophy className="h-4 w-4" />
                    Scores
                    <Badge variant="secondary" className="ml-1 bg-primary-foreground/20 text-primary-foreground">
                        {scoreRegion1} - {scoreRegion2}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Scores de la rencontre
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Info rencontre */}
                    <div className="text-center space-y-1">
                        <Typography variant="h5" weight="bold">
                            {subGroup.name}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                            {subGroup.group?.phase?.edition?.competition?.name} - Édition {subGroup.group?.phase?.edition?.edition_number} ({subGroup.group?.phase?.edition?.year})
                        </Typography>
                    </div>

                    {/* Match en cours */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <Avatar className="h-12 w-12 mx-auto mb-2">
                                        <AvatarImage src={match.fighter1?.profile_image} />
                                        <AvatarFallback>
                                            {match.fighter1?.first_name?.[0]}
                                            {match.fighter1?.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Typography variant="body-sm" weight="medium">
                                        {match.fighter1?.first_name} {match.fighter1?.last_name}
                                    </Typography>
                                    {match.fighter1?.nickname && (
                                        <Typography variant="caption1" theme="muted">
                                            "{match.fighter1.nickname}"
                                        </Typography>
                                    )}
                                </div>

                                <div className="flex flex-col items-center px-4">
                                    <Swords className="h-6 w-6 text-muted-foreground mb-1" />
                                    <Typography variant="body-sm" weight="bold">
                                        VS
                                    </Typography>
                                </div>

                                <div className="text-center">
                                    <Avatar className="h-12 w-12 mx-auto mb-2">
                                        <AvatarImage src={match.fighter2?.profile_image} />
                                        <AvatarFallback>
                                            {match.fighter2?.first_name?.[0]}
                                            {match.fighter2?.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Typography variant="body-sm" weight="medium">
                                        {match.fighter2?.first_name} {match.fighter2?.last_name}
                                    </Typography>
                                    {match.fighter2?.nickname && (
                                        <Typography variant="caption1" theme="muted">
                                            "{match.fighter2.nickname}"
                                        </Typography>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scores détaillés */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Région 1 */}
                        <Card className="text-center">
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center gap-2">
                                    {region1?.flag_image ? (
                                        <img
                                            src={region1.flag_image}
                                            alt={region1.name}
                                            className="w-12 h-12 rounded-full object-cover border-2"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-full border-2"
                                            style={{ backgroundColor: region1?.color || '#ccc' }}
                                        />
                                    )}
                                    <Typography variant="body-base" weight="bold">
                                        {region1?.name || "Région 1"}
                                    </Typography>
                                    <Typography variant="h2" weight="bold" className="text-primary">
                                        {scoreRegion1}
                                    </Typography>
                                    <Typography variant="caption1" theme="muted">
                                        points
                                    </Typography>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Région 2 */}
                        <Card className="text-center">
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center gap-2">
                                    {region2?.flag_image ? (
                                        <img
                                            src={region2.flag_image}
                                            alt={region2.name}
                                            className="w-12 h-12 rounded-full object-cover border-2"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-full border-2"
                                            style={{ backgroundColor: region2?.color || '#ccc' }}
                                        />
                                    )}
                                    <Typography variant="body-base" weight="bold">
                                        {region2?.name || "Région 2"}
                                    </Typography>
                                    <Typography variant="h2" weight="bold" className="text-primary">
                                        {scoreRegion2}
                                    </Typography>
                                    <Typography variant="caption1" theme="muted">
                                        points
                                    </Typography>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Matchs nuls */}
                    {nulls > 0 && (
                        <Card className="bg-muted/20">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                    <Minus className="h-4 w-4" />
                                    <Typography variant="body-base" weight="medium">
                                        Matchs nuls : {nulls}
                                    </Typography>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Statut du sous-groupe */}
                    <div className="flex justify-center">
                        <Badge variant={subGroup.is_completed ? "default" : "secondary"} className="gap-1">
                            {subGroup.is_completed ? "✓ Terminé" : "🔄 En cours"}
                        </Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    return (
        <>
            {/* Desktop version (visible sur md et plus) */}
            <div className="hidden md:block">
                <DesktopScore />
            </div>

            {/* Mobile version (visible sur moins de md) */}
            <div className="md:hidden">
                <MobileTrigger />
            </div>
        </>
    );
}