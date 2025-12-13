'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, UserPlus, Share2 } from 'lucide-react'
import { useInteractions } from '@/hooks/use-interactions'
import { cn } from '@/lib/utils'

type InteractionType = 'like' | 'bookmark' | 'follow' | 'share'

export interface InteractionButtonProps {
  type: InteractionType
  entityType: string
  entityId: number
  iconOnly?: boolean
  count?: number
  children?: ReactNode
  singleAction?: boolean // if true, cannot toggle off
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const iconMap: Record<InteractionType, React.ElementType> = {
  like: Heart,
  bookmark: Bookmark,
  follow: UserPlus,
  share: Share2,
}

const defaultLabels: Record<InteractionType, string> = {
  like: 'J\'aime',
  bookmark: 'Sauvegarder',
  follow: 'Suivre',
  share: 'Partager',
}

export function InteractionButton({
  type,
  entityType,
  entityId,
  iconOnly = false,
  count = 0,
  children,
  singleAction = false,
  className,
  variant = 'default',
  size = 'md',
}: InteractionButtonProps) {
  const {
    liked,
    bookmarked,
    followed,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    isAuthenticated,
  } = useInteractions(entityType, entityId)

  const [localCount, setLocalCount] = useState(count)
  const [isActivated, setIsActivated] = useState(() => {
    if (type === 'like') return liked
    if (type === 'bookmark') return bookmarked
    if (type === 'follow') return followed
    return false
  })

  const Icon = iconMap[type]
  const label = children || defaultLabels[type]

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      // trigger auth modal or toast
      return
  }

    if (singleAction && isActivated) return // block toggle off

    // optimistic local update
    const next = !isActivated
    setIsActivated(next)
    setLocalCount(prev => next ? prev + 1 : Math.max(0, prev - 1))

    // fire real action
    if (type === 'like') handleLike()
    else if (type === 'bookmark') handleBookmark()
    else if (type === 'follow') handleFollow()
    else if (type === 'share') handleShare('copy')
  }

  const sizeClasses = {
    sm: 'h-8 px-2 text-sm gap-1',
    md: 'h-10 px-3 text-base gap-2',
    lg: 'h-12 px-4 text-lg gap-2',
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
        sizeClasses[size],
        variantClasses[variant],
        isActivated && variant === 'default' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        className
      )}
      aria-pressed={isActivated}
      aria-label={String(label)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isActivated ? 'active' : 'idle'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          <Icon
            className={cn(
              'shrink-0',
              size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6',
              isActivated && type === 'like' && 'fill-current'
            )}
          />
          {!iconOnly && (
            <>
              <span>{label}</span>
              {localCount > 0 && (
                <span className="tabular-nums text-xs ml-1">{localCount}</span>
              )}
            </>
          )}
          {iconOnly && localCount > 0 && (
            <span className="tabular-nums text-xs">{localCount}</span>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  )
}
