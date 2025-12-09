"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  description?: string;
  trend?: string;
  trendPositive?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  description,
  trend,
  trendPositive = true
}: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <Typography variant="h2" weight="bold" className="mb-1">
              {value.toLocaleString()}
            </Typography>
            {description && (
              <Typography variant="body-sm" theme="muted">
                {description}
              </Typography>
            )}
          </div>
          {trend && (
            <div className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              trendPositive 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            )}>
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}