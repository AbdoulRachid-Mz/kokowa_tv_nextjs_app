// app/ad/editions/[editionId]/fighters/replace/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ArrowLeft,
    ArrowRightLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    UserRound,
    MapPin,
    Trophy,
    Medal,
    AlertTriangle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Types
interface FighterWithDetails {
    id: number;
    first_name: string;
    last_name: string;
    nickname?: string;
    profile_image?: string;
    region_id: number;
    region?: {
        id: number;
        name: string;
        code: string;
        color?: string;
    };
    ranking: number;
    is_active: boolean;
    is_champion: boolean;
    isInEdition?: boolean;
    editionStatus?: string;
    editionIsEliminated?: boolean;
    editionIsChampion?: boolean;
    editionRegionId?: number;
}

interface EditionRegion {
    id: number;
    region_id: number;
    region: {
        id: number;
        name: string;
        code: string;
        color?: string;
        flag_image?: string;
    };
    fighters_count?: number;
    status: string;
}

export default function ReplaceFighterPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const editionId = parseInt(params.editionId as string);

    // Paramètres URL
    const fighterToReplaceId = searchParams.get("fighterId") ? parseInt(searchParams.get("fighterId")!) : null;
    const regionId = searchParams.get("regionId") ? parseInt(searchParams.get("regionId")!) : null;
    const replacementId = searchParams.get("replacementId") ? parseInt(searchParams.get("replacementId")!) : null;

    // États
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [edition, setEdition] = useState<any>(null);
    const [editionRegions, setEditionRegions] = useState<EditionRegion[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(regionId);
    const [fightersInEdition, setFightersInEdition] = useState<FighterWithDetails[]>([]);
    const [availableFighters, setAvailableFighters] = useState<FighterWithDetails[]>([]);
    const [selectedFighterToReplace, setSelectedFighterToReplace] = useState<FighterWithDetails | null>(null);
    const [selectedReplacement, setSelectedReplacement] = useState<FighterWithDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Chargement initial
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Charger l'édition avec ses régions
                const editionResponse = await fetch(`/api/editions/${editionId}?with_relations=true&relations[with_regions]=true&relations[with_fighters]=true`);
                if (!editionResponse.ok) throw new Error("Erreur lors du chargement de l'édition");
                const editionData = await editionResponse.json();
                setEdition(editionData);

                // Extraire les régions participantes
                const regions = editionData.regions || [];
                setEditionRegions(regions);

                // Si regionId est fourni, charger les lutteurs de cette région
                if (regionId) {
                    await loadFightersByRegion(regionId);
                }
            } catch (error) {
                console.error("Erreur:", error);
                setError("Erreur lors du chargement des données");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [editionId, regionId]);

    // getFighterStatusLabel
    const getFighterStatusLabel = (status: string | undefined) => {
        switch (status) {
            case "registered":
                return "Inscrit";
            case "qualified":
                return "Qualifié";
            case "disqualified":
                return "Disqualifié";
            case "withdrawn":
                return "Retiré";
            case "eliminated":
                return "Éliminé";
            case "champion":
                return "Champion";
            default:
                return "Inconnu";
        }
    };

    // Charger les lutteurs d'une région spécifique
    const loadFightersByRegion = async (regionId: number) => {
        try {
            // Récupérer tous les lutteurs de la région
            const fightersResponse = await fetch(`/api/fighters?region_id=${regionId}&limit=1000&with_region=true`);
            if (!fightersResponse.ok) throw new Error("Erreur lors du chargement des lutteurs");
            const fightersData = await fightersResponse.json();
            const allRegionFighters = fightersData.data || [];

            // Récupérer les IDs des lutteurs déjà dans l'édition
            const editionResponse = await fetch(`/api/editions/${editionId}/fighters?region_id=${regionId}&limit=1000`);
            if (!editionResponse.ok) throw new Error("Erreur lors du chargement des participants");
            const editionFightersData = await editionResponse.json();

            const editionFightersMap = new Map(
                editionFightersData.data.map((ef: any) => [
                    ef.fighter_id,
                    {
                        status: ef.status,
                        is_eliminated: ef.is_eliminated,
                        is_champion: ef.is_champion,
                        region_id: ef.region_id
                    }
                ])
            );

            // Séparer les lutteurs
            const inEdition: FighterWithDetails[] = [];
            const available: FighterWithDetails[] = [];

            allRegionFighters.forEach((fighter: any) => {
                const fighterWithDetails: FighterWithDetails = {
                    ...fighter,
                    isInEdition: editionFightersMap.has(fighter.id),
                    // @ts-ignore
                    editionStatus: editionFightersMap.get(fighter.id)?.status,
                    // @ts-ignore
                    editionIsEliminated: editionFightersMap.get(fighter.id)?.is_eliminated,
                    // @ts-ignore
                    editionIsChampion: editionFightersMap.get(fighter.id)?.is_champion,
                    // @ts-ignore
                    editionRegionId: editionFightersMap.get(fighter.id)?.region_id
                };

                if (editionFightersMap.has(fighter.id)) {
                    inEdition.push(fighterWithDetails);
                } else {
                    available.push(fighterWithDetails);
                }
            });

            setFightersInEdition(inEdition);
            setAvailableFighters(available);

            // Si fighterToReplaceId est fourni, le sélectionner automatiquement
            if (fighterToReplaceId) {
                const fighterToReplace = inEdition.find(f => f.id === fighterToReplaceId);
                if (fighterToReplace) {
                    setSelectedFighterToReplace(fighterToReplace);
                } else {
                    toast.error("Le lutteur à remplacer n'est pas dans l'édition pour cette région");
                }
            }

            // Si replacementId est fourni, le sélectionner automatiquement
            if (replacementId) {
                const replacement = available.find(f => f.id === replacementId);
                if (replacement) {
                    setSelectedReplacement(replacement);
                } else {
                    toast.error("Le lutteur de remplacement n'est pas disponible");
                }
            }

        } catch (error) {
            console.error("Erreur lors du chargement des lutteurs:", error);
            toast.error("Erreur lors du chargement des lutteurs");
        }
    };

    // Gestionnaire de changement de région
    const handleRegionChange = async (regionId: string) => {
        const id = parseInt(regionId);
        setSelectedRegionId(id);
        setSelectedFighterToReplace(null);
        setSelectedReplacement(null);
        await loadFightersByRegion(id);
    };

    // Validation
    const isValid = useMemo(() => {
        if (!selectedRegionId) return false;
        if (!selectedFighterToReplace) return false;
        if (!selectedReplacement) return false;
        if (selectedFighterToReplace.id === selectedReplacement.id) return false;
        return true;
    }, [selectedRegionId, selectedFighterToReplace, selectedReplacement]);

    // Soumission du remplacement
    const handleReplace = async () => {
        if (!isValid) return;

        setSubmitting(true);
        try {
            // 1. Récupérer le statut et l'état d'élimination du lutteur à remplacer
            const fighterToReplace = selectedFighterToReplace!;
            const replacement = selectedReplacement!;

            // 2. Ajouter le nouveau lutteur avec le même statut
            const addResponse = await fetch(`/api/editions/${editionId}/fighters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fighter_id: replacement.id,
                    region_id: selectedRegionId,
                    status: fighterToReplace.editionStatus || "registered",
                    is_eliminated: fighterToReplace.editionIsEliminated || false,
                    // is_champion: fighterToReplace.editionIsChampion || false,
                }),
            });

            if (!addResponse.ok) throw new Error("Erreur lors de l'ajout du nouveau lutteur");

            // 3. Retirer l'ancien lutteur
            const removeResponse = await fetch(`/api/editions/${editionId}/fighters?fighter_id=${fighterToReplace.id}`, {
                method: "DELETE",
            });

            if (!removeResponse.ok) throw new Error("Erreur lors du retrait de l'ancien lutteur");

            toast.success("Remplacement effectué avec succès");

            // Redirection vers la page des lutteurs de l'édition
            router.push(`/ad/editions/${editionId}/fighters`);

        } catch (error) {
            console.error("Erreur lors du remplacement:", error);
            toast.error("Erreur lors du remplacement du lutteur");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <Typography variant="body-lg">Chargement des données...</Typography>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto py-4 max-w-5xl space-y-6">
            {/* En-tête */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <Typography variant="h4">
                        Remplacer un lutteur
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                        Édition {edition?.edition_number} • {edition?.competition?.name} • {edition?.year}
                    </Typography>
                </div>
            </div>

            {/* Sélection de la région */}
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <Typography variant="h6">1. Sélectionner la région</Typography>
                        </div>

                        <Select
                            value={selectedRegionId?.toString() || ""}
                            onValueChange={handleRegionChange}
                        >
                            <SelectTrigger className="w-full md:w-96">
                                <SelectValue placeholder="Choisir une région" />
                            </SelectTrigger>
                            <SelectContent>
                                {editionRegions.map((er) => (
                                    <SelectItem key={er.region_id} value={er.region_id.toString()}>
                                        <div className="flex items-center gap-2">
                                            {er.region.flag_image && (
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={er.region.flag_image} alt={er.region.name} />
                                                </Avatar>
                                            )}
                                            <span>{er.region.name}</span>
                                            <Badge variant="outline" className="ml-2">
                                                {er.fighters_count || 0} lutteurs
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sélection des lutteurs (affiché seulement si une région est sélectionnée) */}
            {selectedRegionId && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Colonne : Lutteur à remplacer */}
                        <Card className="border-2 border-amber-200">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <Typography variant="h6">2. Lutteur à remplacer</Typography>
                                </div>

                                <Select
                                    value={selectedFighterToReplace?.id?.toString() || ""}
                                    onValueChange={(value) => {
                                        const fighter = fightersInEdition.find(f => f.id === parseInt(value));
                                        setSelectedFighterToReplace(fighter || null);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un lutteur de l'édition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fightersInEdition.map((fighter) => (
                                            <SelectItem key={fighter.id} value={fighter.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={fighter.profile_image} />
                                                        <AvatarFallback>
                                                            {fighter.first_name[0]}{fighter.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>
                                                        {fighter.first_name} {fighter.last_name}
                                                        {fighter.nickname && ` (${fighter.nickname})`}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Carte du lutteur sélectionné */}
                                {selectedFighterToReplace && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={selectedFighterToReplace.profile_image} />
                                                <AvatarFallback className="bg-amber-100">
                                                    {selectedFighterToReplace.first_name[0]}
                                                    {selectedFighterToReplace.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <Typography variant="body-base" weight="bold">
                                                    {selectedFighterToReplace.first_name} {selectedFighterToReplace.last_name}
                                                </Typography>
                                                {selectedFighterToReplace.nickname && (
                                                    <Typography variant="body-sm" theme="muted">
                                                        "{selectedFighterToReplace.nickname}"
                                                    </Typography>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* <Badge variant="outline" className="bg-white">
                                                        Classement: #{selectedFighterToReplace.ranking}
                                                    </Badge> */}
                                                    <Badge variant={selectedFighterToReplace.editionIsEliminated ? "destructive" : "secondary"}>
                                                        {selectedFighterToReplace.editionIsEliminated ? "Éliminé" : "En course"}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-white">
                                                        Statut: {getFighterStatusLabel(selectedFighterToReplace.editionStatus)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Colonne : Lutteur remplaçant */}
                        <Card className="border-2 border-green-200">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <UserRound className="h-5 w-5" />
                                    <Typography variant="h6">3. Lutteur remplaçant</Typography>
                                </div>

                                <Select
                                    value={selectedReplacement?.id?.toString() || ""}
                                    onValueChange={(value) => {
                                        const fighter = availableFighters.find(f => f.id === parseInt(value));
                                        setSelectedReplacement(fighter || null);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un lutteur disponible" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableFighters.map((fighter) => (
                                            <SelectItem key={fighter.id} value={fighter.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={fighter.profile_image} />
                                                        <AvatarFallback>
                                                            {fighter.first_name[0]}{fighter.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>
                                                        {fighter.first_name} {fighter.last_name}
                                                        {fighter.nickname && ` (${fighter.nickname})`}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Carte du lutteur sélectionné */}
                                {selectedReplacement && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={selectedReplacement.profile_image} />
                                                <AvatarFallback className="bg-green-100">
                                                    {selectedReplacement.first_name[0]}
                                                    {selectedReplacement.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <Typography variant="body-base" weight="bold">
                                                    {selectedReplacement.first_name} {selectedReplacement.last_name}
                                                </Typography>
                                                {selectedReplacement.nickname && (
                                                    <Typography variant="body-sm" theme="muted">
                                                        "{selectedReplacement.nickname}"
                                                    </Typography>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* <Badge variant="outline" className="bg-white">
                                                        Classement: #{selectedReplacement.ranking}
                                                    </Badge> */}
                                                    {selectedReplacement.is_champion && (
                                                        <Badge variant="default" className="bg-yellow-500">
                                                            <Medal className="h-3 w-3 mr-1" />
                                                            Champion
                                                        </Badge>
                                                    )}
                                                    <Badge variant={selectedReplacement.is_active ? "default" : "secondary"}>
                                                        {selectedReplacement.is_active ? "Actif" : "Inactif"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Récapitulatif du transfert */}
                    {selectedFighterToReplace && selectedReplacement && (
                        <Card className="border-2 border-primary/20 bg-primary/5">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                                    <Typography variant="h6">4. Confirmation du remplacement</Typography>
                                </div>

                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Le lutteur remplaçant héritera des propriétés suivantes</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>
                                                <span className="font-medium">Statut :</span>{" "}
                                                <Badge variant="outline">{getFighterStatusLabel(selectedFighterToReplace.editionStatus)}</Badge>
                                            </li>
                                            <li>
                                                <span className="font-medium">État :</span>{" "}
                                                <Badge variant={selectedFighterToReplace.editionIsEliminated ? "destructive" : "secondary"}>
                                                    {selectedFighterToReplace.editionIsEliminated ? "Éliminé" : "En course"}
                                                </Badge>
                                            </li>
                                            {selectedFighterToReplace.editionIsChampion && (
                                                <li>
                                                    <span className="font-medium">Statut de champion :</span>{" "}
                                                    <Badge variant="default" className="bg-yellow-500">
                                                        Champion
                                                    </Badge>
                                                </li>
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <Separator className="my-4" />

                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => router.back()}>
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleReplace}
                                        disabled={submitting}
                                        className="min-w-[200px]"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Remplacement...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                                Confirmer le remplacement
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}