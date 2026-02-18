// /ad/advertisements
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Advertisement } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import {
    DollarSign,
    Eye,
    MousePointer,
    TrendingUp,
    Calendar,
    Clock,
    AlertCircle
} from "lucide-react";
import { getAdvertisementStats } from "@/actions/advertisements";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientAdvertisementsPage() {
    const [stats, setStats] = useState({
        totalAds: 0,
        activeAds: 0,
        totalClicks: 0,
        totalImpressions: 0,
        avgCTR: 0
    });
    const router = useRouter()

    const {
        data,
        total,
        loading,
        page,
        limit,
        searchTerm,
        filters,
        viewMode,
        setPage,
        setLimit,
        setSearchTerm,
        setFilters,
        setViewMode,
        onAdd,
        onEdit,
        onView,
        onRefresh,
    } = useEntityList<Advertisement>({
        entityType: 'advertisements',
        defaultFilters: {
            with_clicks: true,
            limit: '20',
        },
    });

    // Charger les statistiques
    useEffect(() => {
        const loadStats = async () => {
            const statsData = await getAdvertisementStats();
            setStats(statsData);
        };
        loadStats();
    }, []);

    // Statistiques pour les publicités
    const renderStats = () => {
        const ctrValue = stats.totalImpressions > 0
            ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)
            : '0.00';

        const statsCards = [
            {
                label: "Total Publicités",
                value: stats.totalAds,
                icon: DollarSign,
                color: "text-blue-600",
            },
            {
                label: "Publicités Actives",
                value: stats.activeAds,
                icon: TrendingUp,
                color: "text-green-600",
            },
            {
                label: "Impressions Total",
                value: stats.totalImpressions.toLocaleString(),
                icon: Eye,
                color: "text-purple-600",
            },
            {
                label: "Clics Total",
                value: stats.totalClicks.toLocaleString(),
                icon: MousePointer,
                color: "text-orange-600",
            },
            {
                label: "CTR Moyen",
                value: `${ctrValue}%`,
                icon: TrendingUp,
                color: "text-indigo-600",
            },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {statsCards.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="p-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Typography variant="body-sm" theme="muted" className="mb-1">
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h4" weight="bold">
                                        {stat.value}
                                    </Typography>
                                </div>
                                <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color} bg-current`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // Filtres disponibles
    const availableFilters = [
        {
            key: 'position',
            label: 'Position',
            options: [
                { value: 'all', label: 'Toutes positions' },
                { value: 'header', label: 'En-tête' },
                { value: 'sidebar', label: 'Barre latérale' },
                { value: 'footer', label: 'Pied de page' },
                { value: 'in_content', label: 'Dans le contenu' },
                { value: 'popup', label: 'Pop-up' },
                { value: 'banner_top', label: 'Bannière haut' },
                { value: 'banner_bottom', label: 'Bannière bas' },
                { value: 'mobile_sticky', label: 'Mobile collant' },
            ],
        },
        {
            key: 'media_type',
            label: 'Type média',
            options: [
                { value: 'all', label: 'Tous types' },
                { value: 'image', label: 'Image' },
                { value: 'video', label: 'Vidéo' },
                { value: 'html', label: 'HTML' },
            ],
        },
        {
            key: 'is_active',
            label: 'Statut',
            options: [
                { value: 'all', label: 'Tous' },
                { value: 'true', label: 'Actives' },
                { value: 'false', label: 'Inactives' },
            ],
        },
    ];

    return (
        <EntityList
            title="Gestion des Publicités"
            description="Gérez l'ensemble des campagnes publicitaires et leurs performances"
            entityType="advertisements"
            data={data}
            total={total}
            onAdd={() => router.push('/ad/advertisements/create')}
            loading={loading}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setFilters}
            onRefresh={onRefresh}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            renderStats={renderStats}
            availableFilters={availableFilters}
            renderCard={(advertisement, viewMode) => (
                <EntityCards.Advertisement
                    advertisement={advertisement}
                    viewMode={viewMode}
                    onEdit={onEdit}
                    onView={onView}
                />
            )}
        />
    );
}