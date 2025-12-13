// components/ui/list-item.tsx
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ListItemProps extends React.ComponentPropsWithoutRef<"div"> {
  title: string;
  href: string;
  children?: React.ReactNode;
  icon?: React.ComponentType<any>;
}

function ListItem({ 
  className, 
  title, 
  children, 
  href, 
  icon: Icon,
  ...props 
}: ListItemProps) {
  return (
    <div {...props} className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground", className)}>
      <Link href={href} className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <div className="flex-1">
          <div className="text-sm font-medium leading-none">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

export { ListItem }