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
    <Card className={`hover:shadow-md relative transition-shadow border-tv p-2 border-t-primary border-b-green-500 border-2 ${className}`}>
      <span className='absolute animate-pulse w-16 h-16 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-primary/30 px-2 rounded-full' />
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
