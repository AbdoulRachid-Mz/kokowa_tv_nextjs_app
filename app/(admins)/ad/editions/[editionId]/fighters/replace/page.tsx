"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    ArrowRightLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    UserRound,
    MapPin,
    Search,
    Medal,
    AlertTriangle,
    Check
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
import { useQuery } from "@tanstack/react-query";
import { useAvailableFightersInfinite, useEditionFightersInfinite } from "@/hooks/use-editions-participants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function ReplaceFighterPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const editionId = parseInt(params.editionId as string);

    // Paramètres URL
    const fighterToReplaceIdParam = searchParams.get("fighterId") ? parseInt(searchParams.get("fighterId")!) : null;
    const regionIdParam = searchParams.get("regionId") ? parseInt(searchParams.get("regionId")!) : null;
    const replacementIdParam = searchParams.get("replacementId") ? parseInt(searchParams.get("replacementId")!) : null;

    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(regionIdParam);
    const [selectedFighterToReplaceId, setSelectedFighterToReplaceId] = useState<number | null>(fighterToReplaceIdParam);
    const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(replacementIdParam);
    const [replaceOpen, setReplaceOpen] = useState(false);
    const [replacementOpen, setReplacementOpen] = useState(false);

    const [searchToReplace, setSearchToReplace] = useState("");
    const [searchReplacement, setSearchReplacement] = useState("");
    const [debouncedSearchToReplace, setDebouncedSearchToReplace] = useState("");
    const [debouncedSearchReplacement, setDebouncedSearchReplacement] = useState("");

    const [submitting, setSubmitting] = useState(false);

    // Debounce searches
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchToReplace(searchToReplace), 500);
        return () => clearTimeout(timer);
    }, [searchToReplace]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchReplacement(searchReplacement), 500);
        return () => clearTimeout(timer);
    }, [searchReplacement]);

    // Fetch edition & regions
    const { data: editionData, isLoading: loadingEdition, error: editionError } = useQuery({
        queryKey: ['edition-replace-fighter', editionId],
        queryFn: async () => {
            const res = await fetch(`/api/editions/${editionId}?with_relations=true&relations[with_regions]=true`);
            if (!res.ok) throw new Error("Erreur de chargement");
            return res.json();
        }
    });

    const editionRegions = editionData?.regions || [];

    // Infinite queries
    const editionFightersQuery = useEditionFightersInfinite(editionId, {
        region_id: selectedRegionId || undefined,
        search: debouncedSearchToReplace,
        limit: 20
    });

    const availableFightersQuery = useAvailableFightersInfinite(editionId, {
        region_id: selectedRegionId || undefined,
        search: debouncedSearchReplacement,
        limit: 20
    });

    const inEditionFighters = editionFightersQuery.data?.pages.flatMap((p: any) => p.data) || [];
    const availableFighters = availableFightersQuery.data?.pages.flatMap((p: any) => p.data) || [];

    // Selected fighter details
    const selectedFighterToReplace = inEditionFighters.find((f: any) => (f.fighter?.id || f.fighter_id || f.id) === selectedFighterToReplaceId);
    const selectedReplacement = availableFighters.find((f: any) => (f.fighter?.id || f.fighter_id || f.id) === selectedReplacementId);

    // Observers
    const observerReplaceTarget = useRef<HTMLDivElement>(null);
    const observerAvailableTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && editionFightersQuery.hasNextPage && !editionFightersQuery.isFetchingNextPage) {
                editionFightersQuery.fetchNextPage();
            }
        }, { threshold: 0.1 });
        if (observerReplaceTarget.current) observer.observe(observerReplaceTarget.current);
        return () => observer.disconnect();
    }, [editionFightersQuery, replaceOpen]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && availableFightersQuery.hasNextPage && !availableFightersQuery.isFetchingNextPage) {
                availableFightersQuery.fetchNextPage();
            }
        }, { threshold: 0.1 });
        if (observerAvailableTarget.current) observer.observe(observerAvailableTarget.current);
        return () => observer.disconnect();
    }, [availableFightersQuery, replacementOpen]);

    const getFighterStatusLabel = (status: string | undefined) => {
        switch (status) {
            case "registered": return "Inscrit";
            case "qualified": return "Qualifié";
            case "disqualified": return "Disqualifié";
            case "withdrawn": return "Retiré";
            case "eliminated": return "Éliminé";
            case "champion": return "Champion";
            default: return "Inconnu";
        }
    };

    const handleRegionChange = (regionIdStr: string) => {
        setSelectedRegionId(parseInt(regionIdStr));
        setSelectedFighterToReplaceId(null);
        setSelectedReplacementId(null);
    };

    const isValid = selectedRegionId && selectedFighterToReplaceId && selectedReplacementId && (selectedFighterToReplaceId !== selectedReplacementId);

    const handleReplace = async () => {
        if (!isValid) return;
        setSubmitting(true);
        try {
            const fighterToReplace = selectedFighterToReplace || {};
            
            // Add new fighter
            const addResponse = await fetch(`/api/editions/${editionId}/fighters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fighter_id: selectedReplacementId,
                    region_id: selectedRegionId,
                    status: fighterToReplace.status || "registered",
                    is_eliminated: fighterToReplace.is_eliminated || false,
                }),
            });
            if (!addResponse.ok) throw new Error("Erreur ajout");

            // Remove old fighter
            const realIdToRemove = fighterToReplace.fighter?.id || fighterToReplace.fighter_id || selectedFighterToReplaceId;
            const removeResponse = await fetch(`/api/editions/${editionId}/fighters?fighter_id=${realIdToRemove}`, {
                method: "DELETE",
            });
            if (!removeResponse.ok) throw new Error("Erreur suppression");

            toast.success("Remplacement effectué avec succès");
            router.back();
        } catch (error) {
            toast.error("Erreur lors du remplacement du lutteur");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingEdition) {
        return (
            <div className="container mx-auto py-6 flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <Typography variant="body-lg">Chargement des données...</Typography>
            </div>
        );
    }

    if (editionError) {
        return (
            <div className="container mx-auto py-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>Impossible de charger l'édition</AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
            </div>
        );
    }

    // Custom Popover Fighter Select Component
    const renderFighterCombobox = (
        items: any[], 
        queryState: any, 
        selectedId: number | null, 
        onSelect: (id: number) => void, 
        search: string, 
        setSearch: (v: string) => void, 
        placeholder: string,
        observerRef: any,
        open: boolean,
        onOpenChange: (open: boolean) => void
    ) => {
        const selectedItem = items.find((f: any) => (f.fighter?.id || f.fighter_id || f.id) === selectedId);
        const fighterData = selectedItem?.fighter || selectedItem;

        return (
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" disabled={!selectedRegionId}>
                        {selectedItem ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={fighterData.profile_image} />
                                    <AvatarFallback>{fighterData.first_name?.[0]}{fighterData.last_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{fighterData.first_name} {fighterData.last_name} {fighterData.nickname && `(${fighterData.nickname})`}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{selectedRegionId ? placeholder : "Sélectionnez d'abord une région"}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] md:w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <CommandList className="max-h-[300px] overflow-y-auto">
                            {queryState.isLoading && <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>}
                            {!queryState.isLoading && items.length === 0 && <CommandEmpty>Aucun lutteur trouvé.</CommandEmpty>}
                            <CommandGroup>
                                {items.map((item: any) => {
                                    const fighter = item.fighter || item;
                                    const id = item.fighter?.id || item.fighter_id || item.id;
                                    return (
                                        <CommandItem
                                            key={id}
                                            value={id.toString()}
                                            onSelect={() => {
                                                onSelect(id);
                                                onOpenChange(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Avatar className="h-8 w-8 mr-2">
                                                <AvatarImage src={fighter.profile_image} />
                                                <AvatarFallback>{fighter.first_name?.[0]}{fighter.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{fighter.first_name} {fighter.last_name} {fighter.nickname && `(${fighter.nickname})`}</span>
                                            {selectedId === id && <Check className="ml-auto h-4 w-4" />}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            {/* Observer target inside the list */}
                            <div ref={observerRef} className="h-4 w-full flex items-center justify-center">
                                {queryState.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <div className="mx-auto py-4 max-w-5xl space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <Typography variant="h4">Remplacer un lutteur</Typography>
                    <Typography variant="body-base" theme="muted">
                        Édition {editionData?.edition_number} • {editionData?.competition?.name} • {editionData?.year}
                    </Typography>
                </div>
            </div>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <Typography variant="h6">1. Sélectionner la région</Typography>
                    </div>
                    <Select value={selectedRegionId?.toString() || ""} onValueChange={handleRegionChange}>
                        <SelectTrigger className="w-full md:w-96">
                            <SelectValue placeholder="Choisir une région" />
                        </SelectTrigger>
                        <SelectContent>
                            {editionRegions.map((er: any) => (
                                <SelectItem key={er.region_id} value={er.region_id.toString()}>
                                    <div className="flex items-center gap-2">
                                        {er.region?.flag_image && <Avatar className="h-5 w-5"><AvatarImage src={er.region.flag_image} /></Avatar>}
                                        <span>{er.region?.name}</span>
                                        <Badge variant="outline" className="ml-2">{er.fighters_count || 0} lutteurs</Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedRegionId && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-2 border-amber-200">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <Typography variant="h6">2. Lutteur à remplacer</Typography>
                                </div>
                                {renderFighterCombobox(
                                    inEditionFighters, editionFightersQuery, selectedFighterToReplaceId,
                                    setSelectedFighterToReplaceId, searchToReplace, setSearchToReplace,
                                    "Choisir un lutteur de l'édition", observerReplaceTarget,
                                    replaceOpen, setReplaceOpen
                                )}
                                {selectedFighterToReplace && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={selectedFighterToReplace.fighter?.profile_image || selectedFighterToReplace.profile_image} />
                                                <AvatarFallback className="bg-amber-100">{(selectedFighterToReplace.fighter?.first_name || selectedFighterToReplace.first_name)?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <Typography variant="body-base" weight="bold">
                                                    {selectedFighterToReplace.fighter?.first_name || selectedFighterToReplace.first_name} {selectedFighterToReplace.fighter?.last_name || selectedFighterToReplace.last_name}
                                                </Typography>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant={selectedFighterToReplace.is_eliminated ? "destructive" : "secondary"}>
                                                        {selectedFighterToReplace.is_eliminated ? "Éliminé" : "En course"}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-white">
                                                        Statut: {getFighterStatusLabel(selectedFighterToReplace.status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-green-200">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <UserRound className="h-5 w-5" />
                                    <Typography variant="h6">3. Lutteur remplaçant</Typography>
                                </div>
                                {renderFighterCombobox(
                                    availableFighters, availableFightersQuery, selectedReplacementId,
                                    setSelectedReplacementId, searchReplacement, setSearchReplacement,
                                    "Choisir un lutteur disponible", observerAvailableTarget,
                                    replacementOpen, setReplacementOpen
                                )}
                                {selectedReplacement && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={selectedReplacement.fighter?.profile_image || selectedReplacement.profile_image} />
                                                <AvatarFallback className="bg-green-100">{(selectedReplacement.fighter?.first_name || selectedReplacement.first_name)?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <Typography variant="body-base" weight="bold">
                                                    {selectedReplacement.fighter?.first_name || selectedReplacement.first_name} {selectedReplacement.fighter?.last_name || selectedReplacement.last_name}
                                                </Typography>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant={(selectedReplacement.fighter || selectedReplacement).is_active ? "default" : "secondary"}>
                                                        {(selectedReplacement.fighter || selectedReplacement).is_active ? "Actif" : "Inactif"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {selectedFighterToReplace && selectedReplacement && (
                        <Card className="border-2 border-primary/20 bg-primary/5">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                                    <Typography variant="h6">4. Confirmation du remplacement</Typography>
                                </div>
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Le lutteur remplaçant héritera des propriétés de l'ancien</AlertTitle>
                                </Alert>
                                <Separator className="my-4" />
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
                                    <Button onClick={handleReplace} disabled={submitting} className="min-w-[200px]">
                                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Remplacement...</> : <><ArrowRightLeft className="h-4 w-4 mr-2" /> Confirmer</>}
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