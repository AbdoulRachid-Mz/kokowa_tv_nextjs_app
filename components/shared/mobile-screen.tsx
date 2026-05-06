"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useScreenSize } from "@/hooks/use-screen"

interface MobileScreenProps {
  children: React.ReactNode
  className?: string
  /** If true, the content will only be rendered on mobile/tablet */
  mobileOnly?: boolean
  /** If true, the content will be hidden on mobile */
  desktopOnly?: boolean
}

/**
 * MobileScreen component to handle mobile-specific layout logic and rendering.
 */
export function MobileScreen({
  children,
  className,
  mobileOnly = false,
  desktopOnly = false,
}: MobileScreenProps) {
  const { isMobile, isTablet } = useScreenSize()
  const isSmallScreen = isMobile || isTablet

  if (mobileOnly && !isSmallScreen) return null
  if (desktopOnly && isSmallScreen) return null

  return (
    <div className={cn("w-full h-full", className)}>
      {children}
    </div>
  )
}
