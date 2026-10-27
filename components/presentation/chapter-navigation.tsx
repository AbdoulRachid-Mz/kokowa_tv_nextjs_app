"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRESENTATION_DATA } from "@/lib/presentation/data";

interface ChapterNavigationProps {
  currentChapterId: string;
}

export function ChapterNavigation({ currentChapterId }: ChapterNavigationProps) {
  const chapitres = PRESENTATION_DATA.chapitres;
  const currentIndex = chapitres.findIndex((c) => c.id === currentChapterId);
  const prev = currentIndex > 0 ? chapitres[currentIndex - 1] : null;
  const next = currentIndex < chapitres.length - 1 ? chapitres[currentIndex + 1] : null;

  return (
    <div className="flex justify-between items-center mt-12 pt-8 border-t border-border/50">
      <div className="flex-1">
        {prev && (
          <Link
            href={`/presentation/${prev.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group max-w-xs"
          >
            <ChevronLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            <div className="text-left min-w-0">
              <p className="text-xs text-muted-foreground/70 mb-0.5">Chapitre précédent</p>
              <p className="font-medium truncate">
                {prev.emoji} {prev.titre}
              </p>
            </div>
          </Link>
        )}
      </div>
      <Link
        href="/presentation"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-4"
      >
        Sommaire
      </Link>
      <div className="flex-1 flex justify-end">
        {next && (
          <Link
            href={`/presentation/${next.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group max-w-xs"
          >
            <div className="text-right min-w-0">
              <p className="text-xs text-muted-foreground/70 mb-0.5">Chapitre suivant</p>
              <p className="font-medium truncate">
                {next.emoji} {next.titre}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}
