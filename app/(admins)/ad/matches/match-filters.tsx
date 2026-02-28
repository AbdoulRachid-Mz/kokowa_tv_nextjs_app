// components/matches/match-filters.tsx
'use client';

import { useState, useEffect } from 'react';
import { MatchFilters as MatchFiltersType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MatchFiltersProps {
  filters: MatchFiltersType;
  onFilterChange: <K extends keyof MatchFiltersType>(
    key: K,
    value: MatchFiltersType[K]
  ) => void;
  onSortChange: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
}

export function MatchFilters({
  filters,
  onFilterChange,
  onSortChange,
}: MatchFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );

  // Synchroniser les dates avec les filtres
  useEffect(() => {
    if (dateFrom) {
      onFilterChange('date_from', format(dateFrom, 'yyyy-MM-dd'));
    } else {
      onFilterChange('date_from', undefined);
    }
  }, [dateFrom, onFilterChange]);

  useEffect(() => {
    if (dateTo) {
      onFilterChange('date_to', format(dateTo, 'yyyy-MM-dd'));
    } else {
      onFilterChange('date_to', undefined);
    }
  }, [dateTo, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Filtres rapides par période */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.period === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const today = new Date();
            setDateFrom(today);
            setDateTo(today);
          }}
        >
          Aujourd'hui
        </Button>
        <Button
          variant={filters.period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const today = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            setDateFrom(weekAgo);
            setDateTo(today);
          }}
        >
              Cette semaine
        </Button>
        <Button
          variant={filters.period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const today = new Date();
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            setDateFrom(monthAgo);
            setDateTo(today);
          }}
        >
          Ce mois
        </Button>
      </div>

      {/* Filtres de date */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Date de début</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Date de fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-6"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Réinitialiser les dates
          </Button>
        )}
      </div>

      {/* Filtre par sous-groupe */}
      <div>
        <label className="text-sm font-medium mb-1 block">Sous-groupe</label>
        <Select
          value={filters.sub_group_id?.toString() || 'all'}
          onValueChange={(value) => 
            onFilterChange('sub_group_id', value === 'all' ? undefined : parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tous les sous-groupes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sous-groupes</SelectItem>
            {/* Les options seront chargées dynamiquement */}
          </SelectContent>
        </Select>
      </div>

      {/* Tri */}
      <div>
        <label className="text-sm font-medium mb-1 block">Trier par</label>
        <Select
          value={`${filters.sortBy || 'match_date'}_${filters.sortOrder || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('_');
            onSortChange(sortBy, sortOrder as 'asc' | 'desc');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match_date_desc">Date (récent → ancien)</SelectItem>
            <SelectItem value="match_date_asc">Date (ancien → récent)</SelectItem>
            <SelectItem value="created_at_desc">Création (récent → ancien)</SelectItem>
            <SelectItem value="created_at_asc">Création (ancien → récent)</SelectItem>
            <SelectItem value="status_asc">Statut (A-Z)</SelectItem>
            <SelectItem value="audience_count_desc">Audience (décroissant)</SelectItem>
            <SelectItem value="audience_count_asc">Audience (croissant)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}