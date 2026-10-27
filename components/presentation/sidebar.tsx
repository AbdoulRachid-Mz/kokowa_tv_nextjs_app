"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRESENTATION_DATA } from "@/lib/presentation/data";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function PresentationSidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-72 shrink-0 bg-card border-r border-border/50 flex flex-col h-full",
        className
      )}
    >
      {/* En-tête */}
      <div className="p-6 border-b border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
        <Link href="/presentation" className="block group">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Kokowa TV
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Dossier de Présentation
              </p>
            </div>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {PRESENTATION_DATA.meta.version}
          </span>
        </Link>
      </div>

      {/* Navigation des chapitres */}
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Table des Matières
        </p>
        <ul className="space-y-0.5 px-2">
          {PRESENTATION_DATA.chapitres.map((chapitre) => {
            const href = `/presentation/${chapitre.id}`;
            const isActive = pathname === href;

            return (
              <li key={chapitre.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="text-base shrink-0">{chapitre.emoji}</span>
                  <span className="flex items-center gap-2 truncate min-w-0">
                    <span
                      className={cn(
                        "text-xs shrink-0 font-mono",
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {String(chapitre.numero).padStart(2, "0")}
                    </span>
                    <span className="truncate">{chapitre.titre}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Pied de sidebar */}
      <div className="p-4 border-t border-border/50 text-xs text-muted-foreground text-center space-y-1">
        <p>© 2026 Kokowa TV — FENILUTTE</p>
        <Link
          href="/presentation"
          className="text-primary hover:underline block"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </aside>
  );
}
