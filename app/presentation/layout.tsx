import type { Metadata } from "next";
import { PresentationSidebar } from "@/components/presentation/sidebar";

export const metadata: Metadata = {
  title: "Dossier de Présentation",
  description:
    "Kokowa TV — Présentation institutionnelle, technique, économique et stratégique complète de la plateforme officielle de lutte traditionnelle nigérienne.",
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar de navigation (fixe sur desktop) */}
      <div className="hidden lg:flex lg:w-72 lg:fixed lg:inset-y-0 lg:flex-col z-30">
        <PresentationSidebar className="h-full" />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 lg:pl-72">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
