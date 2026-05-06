"use client";

import React from "react";
import { Search, X, Filter as FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { FilterSheet } from "./filter-sheet";
import { useScreenSize } from "@/hooks/use-screen";

export interface FilterOption {
  value: string;
  label: string;
}

export interface AvailableFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface EntityFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  availableFilters: AvailableFilter[];
  renderCustomFilters?: () => React.ReactNode;
  onReset: () => void;
  showSearch?: boolean;
  showFilters?: boolean;
}

export const EntityFilters: React.FC<EntityFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  availableFilters,
  renderCustomFilters,
  onReset,
  showSearch = true,
  showFilters = true,
}) => {
  const { isMobile } = useScreenSize();

  const updateFilter = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.values(filters || {}).filter(
    (v) => v !== undefined && v !== "all" && v !== ""
  ).length;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      {/* Recherche */}
      {showSearch && (
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-11 bg-card border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Filtres */}
      {showFilters && (
        <div className="flex gap-2 w-full md:w-auto">
          {!isMobile ? (
            <div className="hidden md:flex flex-wrap gap-2">
              {availableFilters.map((filter) => (
                <Select
                  key={filter.key}
                  value={String(filters[filter.key] || "all")}
                  onValueChange={(value) =>
                    updateFilter(filter.key, value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-[180px] h-11 bg-card rounded-xl">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              {renderCustomFilters?.()}
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-11 rounded-xl px-4"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          ) : (
            <FilterSheet
              activeFiltersCount={activeFiltersCount}
              onReset={onReset}
              className="w-full h-11 rounded-xl"
            >
              <div className="space-y-6">
                {availableFilters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Typography variant="body-sm" weight="medium">
                      {filter.label}
                    </Typography>
                    <Select
                      value={String(filters[filter.key] || "all")}
                      onValueChange={(value) =>
                        updateFilter(
                          filter.key,
                          value === "all" ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {renderCustomFilters?.()}
              </div>
            </FilterSheet>
          )}
        </div>
      )}
    </div>
  );
};
