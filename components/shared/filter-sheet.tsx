"use client"

import * as React from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FilterSheetProps {
  children: React.ReactNode
  activeFiltersCount?: number
  onReset?: () => void
  onApply?: () => void
  title?: string
  triggerLabel?: string
  className?: string
}

export function FilterSheet({
  children,
  activeFiltersCount = 0,
  onReset,
  onApply,
  title = "Filtres",
  triggerLabel = "Filtrer",
  className,
}: FilterSheetProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("relative gap-2 h-10", className)}
        >
          <Filter className="h-4 w-4" />
          {triggerLabel}
          {activeFiltersCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        <SheetFooter className="p-6 border-t bg-muted/50 flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onReset?.()
              // Optional: close on reset if desired
            }}
          >
            Réinitialiser
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply?.()
              setOpen(false)
            }}
          >
            Appliquer les filtres
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
