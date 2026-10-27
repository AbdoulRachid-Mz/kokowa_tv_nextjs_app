import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRESENTATION_DATA } from "@/lib/presentation/data";
import { ChapterNavigation } from "@/components/presentation/chapter-navigation";

// Import de tous les contenus de chapitres
import { ChapterPresentation } from "@/components/presentation/chapters/ch01-presentation";
import { ChapterContexte } from "@/components/presentation/chapters/ch02-contexte";
import { ChapterVision } from "@/components/presentation/chapters/ch03-vision";
import { ChapterPublic } from "@/components/presentation/chapters/ch04-public";
import { ChapterFonctionnalites } from "@/components/presentation/chapters/ch05-fonctionnalites";
import { ChapterParcours } from "@/components/presentation/chapters/ch06-parcours";
import { ChapterArchitecture } from "@/components/presentation/chapters/ch07-architecture";
import { ChapterApi } from "@/components/presentation/chapters/ch08-api";
import { ChapterSecurite } from "@/components/presentation/chapters/ch09-securite";
import { ChapterInfrastructure } from "@/components/presentation/chapters/ch10-infrastructure";
import { ChapterModele } from "@/components/presentation/chapters/ch11-modele";
import { ChapterFinancement } from "@/components/presentation/chapters/ch12-financement";
import { ChapterEquipe } from "@/components/presentation/chapters/ch13-equipe";
import { ChapterRoadmap } from "@/components/presentation/chapters/ch14-roadmap";
import { ChapterRisques } from "@/components/presentation/chapters/ch15-risques";
import { ChapterIndicateurs } from "@/components/presentation/chapters/ch16-indicateurs";
import { ChapterConclusion } from "@/components/presentation/chapters/ch17-conclusion";

const CHAPTER_COMPONENTS: Record<string, React.ComponentType> = {
  presentation: ChapterPresentation,
  contexte: ChapterContexte,
  vision: ChapterVision,
  public: ChapterPublic,
  fonctionnalites: ChapterFonctionnalites,
  parcours: ChapterParcours,
  architecture: ChapterArchitecture,
  api: ChapterApi,
  securite: ChapterSecurite,
  infrastructure: ChapterInfrastructure,
  modele: ChapterModele,
  financement: ChapterFinancement,
  equipe: ChapterEquipe,
  roadmap: ChapterRoadmap,
  risques: ChapterRisques,
  indicateurs: ChapterIndicateurs,
  conclusion: ChapterConclusion,
};

export async function generateStaticParams() {
  return PRESENTATION_DATA.chapitres.map((c) => ({ chapter: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter } = await params;
  const chapitre = PRESENTATION_DATA.chapitres.find((c) => c.id === chapter);
  if (!chapitre) return {};
  return {
    title: `${chapitre.emoji} ${chapitre.titre} — Kokowa TV`,
    description: `Chapitre ${chapitre.numero} du dossier de présentation de Kokowa TV : ${chapitre.titre}`,
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const chapitre = PRESENTATION_DATA.chapitres.find((c) => c.id === chapter);

  if (!chapitre) notFound();

  const ChapterContent = CHAPTER_COMPONENTS[chapter];
  if (!ChapterContent) notFound();

  return (
    <article className="space-y-8">
      {/* En-tête du chapitre */}
      <div className="border-b border-border/50 pb-6">
        <p className="text-sm text-muted-foreground font-mono mb-2">
          Chapitre {String(chapitre.numero).padStart(2, "0")} / {PRESENTATION_DATA.chapitres.length}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <span>{chapitre.emoji}</span>
          <span>{chapitre.titre}</span>
        </h1>
      </div>

      {/* Contenu du chapitre */}
      <ChapterContent />

      {/* Navigation entre chapitres */}
      <ChapterNavigation currentChapterId={chapter} />
    </article>
  );
}
