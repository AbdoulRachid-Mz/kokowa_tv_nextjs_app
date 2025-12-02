"use client"
import React from 'react'
import { Typography } from '../ui/typography';
import { Card, CardContent } from '../ui/card';

interface Props {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
  className?: string;
}

export const CardStats: React.FC<Props> = ({
  label,
  value,
  icon: Icon,
  color,
  description,
  className = '',
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow border-tv p-2 border-t-primary border-b-green-500 border-2 ${className}`}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="body-sm" theme="muted" className="mb-1">
              {label}
            </Typography>
            <Typography variant="h5" weight="bold" className="mb-1">
              {value}
            </Typography>
            {description && (
              <Typography variant="caption2" theme="muted">
                {description}
              </Typography>
            )}
          </div>
          <div className={`p-1 rounded-lg bg-opacity-10 ${color} bg-current`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
