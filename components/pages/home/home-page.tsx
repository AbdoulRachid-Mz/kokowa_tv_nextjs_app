// components/home/home-page.tsx
"use client";

import { CtaSection } from "./sections/cta-section";
import { FeaturedContentSection } from "./sections/featured-content-section";
import { FeaturesSection } from "./sections/features-section";
import { HeroSection } from "./sections/hero-section";
import { motion } from "framer-motion";
import { ImpactSection } from "./sections/impact-section";
import { LiveMatchesSection } from "./sections/live-matches-section";
import { StatsSection } from "./sections/stats-section";
import { TeamSection } from "./sections/team-section";

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Fond animé */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      </div>

      <div className="relative space-y-20 pb-20">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ImpactSection />
        <LiveMatchesSection />
        <TeamSection />
        <FeaturedContentSection />
        <CtaSection />
      </div>
    </motion.div>
  );
}
