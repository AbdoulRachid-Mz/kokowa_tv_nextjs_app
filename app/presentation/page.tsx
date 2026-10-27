import Link from "next/link";
import type { Metadata } from "next";
import { PRESENTATION_DATA } from "@/lib/presentation/data";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Kokowa TV — Dossier de Présentation",
  description:
    "Dossier de présentation institutionnel, technique et stratégique de Kokowa TV, la plateforme officielle de la lutte traditionnelle nigérienne.",
};

export default function PresentationHomePage() {
  const { meta, chapitres } = PRESENTATION_DATA;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full font-medium">
          <BookOpen className="w-4 h-4" />
          {meta.version}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          🏆 {meta.titre}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {meta.sousTitre}
        </p>
        <p className="text-muted-foreground/80 italic text-sm">
          &laquo; {meta.slogan} &raquo;
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full border border-green-500/20">
            {meta.statut}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
            Audit : {meta.dateAudit}
          </span>
        </div>
      </div>

      {/* Description rapide */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Kokowa TV</strong> est la plateforme numérique officielle
          dédiée à la gestion, à la couverture en direct et à la médiatisation de la{" "}
          <strong className="text-foreground">lutte traditionnelle nigérienne (Kokowa)</strong>.
          Elle regroupe un <strong className="text-foreground">portail web grand public</strong>, un{" "}
          <strong className="text-foreground">back-office d&apos;administration du tournoi</strong>{" "}
          (arbitrage, saisie des résultats, organisation des phases) et une{" "}
          <strong className="text-foreground">API REST sécurisée</strong> alimentant une application
          mobile Flutter pour les supporters et les médias.
        </p>
      </div>

      {/* Table des matières */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
          <span>📋</span> Table des Matières
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chapitres.map((chapitre) => (
            <Link
              key={chapitre.id}
              href={`/presentation/${chapitre.id}`}
              className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-4 hover:border-primary/40 hover:shadow-md hover:bg-accent/30 transition-all group"
            >
              <span className="text-2xl shrink-0">{chapitre.emoji}</span>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-muted-foreground font-mono">
                  Chapitre {String(chapitre.numero).padStart(2, "0")}
                </span>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors text-sm leading-snug">
                  {chapitre.titre}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          href="/presentation/presentation"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          Commencer la lecture
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
