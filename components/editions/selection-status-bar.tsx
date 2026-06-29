// components/editions/selection-status-bar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionStatusBarProps {
  loadedCount: number;
  totalCount: number;
  onLoadAll: () => void;
  isLoading?: boolean;
  className?: string;
  label?: string;
  context?: string;
}

export function SelectionStatusBar({
  loadedCount,
  totalCount,
  onLoadAll,
  isLoading = false,
  className,
  label = "éléments",
  context,
}: SelectionStatusBarProps) {
  const isComplete = loadedCount >= totalCount;
  const percentage = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  return (
    <div className={cn(
      "fixed bottom-14 left-1/2 -translate-x-1/2 z-50",
      "bg-background/95 backdrop-blur-md border rounded-full shadow-lg",
      "px-4 py-2 flex items-center gap-3",
      "transition-all duration-300",
      className
    )}>
      {context && (
        <Typography variant="caption2" theme="muted" className="hidden sm:block">
          {context}
        </Typography>
      )}
      
      <Typography variant="caption1" theme="muted" className="whitespace-nowrap">
        {loadedCount} / {totalCount} {label}
        <span className="hidden sm:inline"> chargés ({percentage}%)</span>
      </Typography>
      
      <div className="w-16 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {!isComplete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadAll}
          disabled={isLoading}
          className="gap-1.5 text-xs h-7"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowUp className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">Tout charger</span>
        </Button>
      )}
      
      {isComplete && (
        <Badge variant="default" className="text-xs gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Tous chargés
        </Badge>
      )}
    </div>
  );
}