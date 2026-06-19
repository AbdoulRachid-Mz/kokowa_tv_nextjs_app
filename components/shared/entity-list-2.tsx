"use client";
// components/shared/entity-list.tsx
import { useDebounce } from "@/hooks/use-debounce";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Filter,
    Grid,
    List,
    Plus,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
} from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
// import { EntityType } from "@/actions/entities";
import { UseEntitiesReturn } from "@/hooks/use-entities";
import { EntityFilters } from "./entity-filters";
import { StatsCarousel } from "./stats-carousel";
import { MobileScreen } from "./mobile-screen";
import { useScreenSize } from "@/hooks/use-screen";
import { EntityType } from "@/lib/entity-utils";

// Interface des props du composant
export interface EntityListProps<T> {
    // Hook useEntities
    entities: UseEntitiesReturn<T>;

    // Configuration
    title: string;
    description?: string;
    entityType: EntityType;

    // Renderers
    renderCard: (item: T, viewMode: "grid" | "list") => React.ReactNode;
    renderFilters?: () => React.ReactNode;
    renderStats?: () => React.ReactNode;
    renderActions?: () => React.ReactNode;

    // Options d'affichage
    viewMode?: "grid" | "list";
    onViewModeChange?: (mode: "grid" | "list") => void;

    // Filtres disponibles
    availableFilters?: Array<{
        key: string;
        label: string;
        options: Array<{ value: string; label: string }>;
    }>;

    // Options
    showSearch?: boolean;
    showFilters?: boolean;
    showPagination?: boolean;
    showSelection?: boolean;
    showViewModeToggle?: boolean;
    showExport?: boolean;
    showRefresh?: boolean;
    showAddButton?: boolean;

    // Classes personnalisées
    className?: string;
    cardClassName?: string;
}

export function EntityList<T extends { id?: number }>({
    entities,
    title,
    description,
    entityType,
    renderCard,
    renderFilters,
    renderStats,
    renderActions,
    viewMode: externalViewMode = "grid",
    onViewModeChange,
    availableFilters = [],
    showSearch = true,
    showFilters = true,
    showPagination = true,
    showSelection = false,
    showViewModeToggle = true,
    showExport = true,
    showRefresh = true,
    showAddButton = true,
    className,
    cardClassName,
}: EntityListProps<T>) {
    const {
        // Données
        data,
        total,
        totalPages,
        isLoading,
        isFetching,

        // Pagination
        page,
        limit,
        setPage,
        setLimit,
        nextPage,
        prevPage,
        goToPage,

        // Recherche
        searchTerm,
        setSearchTerm,

        // Filtres
        filters,
        updateFilter,
        setFilters,
        resetFilters,

        // Actions
        onAdd,
        onExport,
        refetch,

        // Sélection
        selectedItems,
        toggleSelectItem,
        selectAll,
        deselectAll,
        isSelected,

        // Utilitaires
        from,
        to,
        isEmpty,
        hasNextPage,
        hasPrevPage,
    } = entities;

    const { isMobile } = useScreenSize();

    // État local pour le mode d'affichage
    const [viewMode, setViewMode] = React.useState<"grid" | "list">(externalViewMode);

    // Gérer le changement de mode d'affichage
    const handleViewModeChange = (mode: "grid" | "list") => {
        setViewMode(mode);
        onViewModeChange?.(mode);
    };

    // Options de limite
    const limitOptions = [10, 20, 50, 100];

    // Calculer les numéros de page à afficher
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        // components/shared/entity-list.tsx
        const rangeWithDots: (number | string)[] = [];
        let l: number | null = null;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push("...");
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Typography variant="h3" weight="bold" gradient animated>
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="lead" theme="muted">
                            {description}
                        </Typography>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {renderActions?.()}

                    {showViewModeToggle && (
                        <div className="flex border rounded-lg p-1">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleViewModeChange("grid")}
                                className="h-8 w-8 p-0"
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleViewModeChange("list")}
                                className="h-8 w-8 p-0"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {showExport && onExport && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                        </Button>
                    )}

                    {showRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                        </Button>
                    )}

                    {showAddButton && onAdd && (
                        <Button size="sm" onClick={onAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            {renderStats && (
                <div className="mb-6">
                    <StatsCarousel>
                        {renderStats()}
                    </StatsCarousel>
                </div>
            )}

            {/* Barre de recherche et filtres */}
            {(showSearch || showFilters) && (
                <EntityFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filters={filters || {}}
                    onFilterChange={setFilters}
                    availableFilters={availableFilters}
                    renderCustomFilters={renderFilters}
                    onReset={resetFilters}
                    showSearch={showSearch}
                    showFilters={showFilters}
                />
            )}

            {/* Barre de sélection */}
            {showSelection && data.length > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                    <div className="flex items-center gap-4">
                        <Checkbox
                            checked={selectedItems.length === data.length}
                            onCheckedChange={(checked) =>
                                checked ? selectAll() : deselectAll()
                            }
                        />
                        <span className="text-sm">
                            {selectedItems.length} élément(s) sélectionné(s)
                        </span>
                    </div>
                    {selectedItems.length > 0 && (
                        <Button variant="destructive" size="sm">
                            Supprimer la sélection
                        </Button>
                    )}
                </div>
            )}

            {/* Contenu */}
            <Card className={cardClassName}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                            {total} {total > 1 ? "éléments" : "élément"} trouvé(s)
                            {isFetching && (
                                <Badge variant="outline" className="ml-2">
                                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                    Chargement...
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Select
                                value={String(limit)}
                                onValueChange={(value) => setLimit(Number(value))}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {limitOptions.map((option) => (
                                        <SelectItem key={option} value={String(option)}>
                                            {option} / page
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>
                                {from}-{to} sur {total}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div
                            className={cn(
                                "grid gap-4",
                                viewMode === "grid"
                                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                                    : "grid-cols-1"
                            )}
                        >
                            {Array.from({ length: limit }).map((_, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-3 w-3/4" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : isEmpty ? (
                        <div className="text-center py-12">
                            <Typography variant="h4" theme="muted" className="mb-2">
                                Aucun résultat trouvé
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                                Aucun {title.toLowerCase()} ne correspond à vos critères de recherche.
                            </Typography>
                            <Button variant="outline" className="mt-4" onClick={resetFilters}>
                                Réinitialiser les filtres
                            </Button>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "grid gap-4",
                                viewMode === "grid"
                                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                                    : "grid-cols-1"
                            )}
                        >
                            {data.map((item) => (
                                <React.Fragment key={item.id}>
                                    {showSelection && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <Checkbox
                                                checked={isSelected(item.id!)}
                                                onCheckedChange={() => toggleSelectItem(item.id!)}
                                            />
                                        </div>
                                    )}
                                    {renderCard(item, viewMode)}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        Affichage de {from} à {to} sur {total} éléments
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goToPage(1)}
                                    disabled={!hasPrevPage}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                            </PaginationItem>

                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevPage}
                                    disabled={!hasPrevPage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </PaginationItem>

                            {getPageNumbers().map((pageNum, index) => (
                                <PaginationItem key={index}>
                                    {pageNum === "..." ? (
                                        <span className="px-4 py-2">...</span>
                                    ) : (
                                        <Button
                                            variant={page === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => goToPage(Number(pageNum))}
                                        >
                                            {pageNum}
                                        </Button>
                                    )}
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={nextPage}
                                    disabled={!hasNextPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </PaginationItem>

                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goToPage(totalPages)}
                                    disabled={!hasNextPage}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}