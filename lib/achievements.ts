// lib/achievements.ts
import { Fighter, Region, CompetitionEdition } from "@/types";

export interface AchievementData {
  fighter?: Fighter;
  region?: Region;
  edition?: CompetitionEdition & {
    competition?: { name: string };
    stadium_name?: string;
  };
  year?: number;
  position?: string;
  type?: string;
  title?: string;
}

export function getTypeLabel(type: string) {
  const types: Record<string, string> = {
    competition: "est champion de",
    kirari: "kirari de",
    "fair-play": "fair-play de",
    point: "meilleur pointeur de",
    walki: "meilleur walki de",
    dance: "meilleur danseur de",
    tchali_tchali: "tchali tchali de",
    once_beat: "terrassé une fois",
    best_beaten: "meilleur combat",
    other: "distingué à",
  };
  return types[type] || "distingué à";
}

export function getPositionLabel(position: string) {
  const positions: Record<string, { label: string; icon: string }> = {
    "1st": { label: "1ère place", icon: "🥇" },
    "2nd": { label: "2ème place", icon: "🥈" },
    "3rd": { label: "3ème place", icon: "🥉" },
    finalist: { label: "Finaliste", icon: "🏆" },
    semifinalist: { label: "Demi-finaliste", icon: "🎯" },
    quarterfinalist: { label: "Quart-de-finaliste", icon: "⭐" },
  };
  return positions[position] || { label: position, icon: "🏅" };
}

export function generateAchievementDescription(data: AchievementData): string {
  const { fighter, region, edition, year, position } = data;

  const parts: string[] = [];

  if (fighter) {
    let fighterName = `${fighter.first_name} ${fighter.last_name}`;
    if (fighter.nickname) {
      fighterName += ` dit (${fighter.nickname})`;
    }
    parts.push(fighterName);
  }

  if (region) {
    parts.push(`de la région ${region.name}`);
  }

  parts.push("a obtenu");

  if (position) {
    const posData = getPositionLabel(position);
    parts.push(`${posData.icon} ${posData.label}`);
  }

  parts.push("en");

  if (edition?.competition?.name) {
    parts.push(edition.competition.name);
    if (edition.edition_number) {
      parts.push(`- Édition ${edition.edition_number}`);
    }
  }

  if (year) {
    parts.push(`en ${year}`);
  }

  return parts.join(" ") + ".";
}
