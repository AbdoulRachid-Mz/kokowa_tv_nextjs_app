import { describe, it, expect } from "bun:test";
import {
  buildAchievementTitle,
  buildAchievementDescription,
  syncMatchOfficialAchievements,
} from "@/actions/achievements";

describe("LOT 3 - Automatisation des Palmarès Tests", () => {
  it("génère les titres officiels corrects pour lutteurs et régions", () => {
    const fighterGold = buildAchievementTitle("fighter", "1st", 45, "Sabre National");
    const fighterSilver = buildAchievementTitle("fighter", "2nd", 45, "Sabre National");
    const fighterBronze = buildAchievementTitle("fighter", "3rd", 45, "Sabre National");

    expect(fighterGold).toBe("Champion National (Sabre National - 45e Édition)");
    expect(fighterSilver).toBe("Vice-Champion National (Sabre National - 45e Édition)");
    expect(fighterBronze).toBe("3ème Place Nationale (Sabre National - 45e Édition)");

    const regionGold = buildAchievementTitle("region", "1st", 45, "Sabre National");
    const regionSilver = buildAchievementTitle("region", "2nd", 45, "Sabre National");
    const regionBronze = buildAchievementTitle("region", "3rd", 45, "Sabre National");

    expect(regionGold).toBe("Région Championne (Sabre National - 45e Édition)");
    expect(regionSilver).toBe("Région Vice-Championne (Sabre National - 45e Édition)");
    expect(regionBronze).toBe("Région 3ème Place (Sabre National - 45e Édition)");
  });

  it("génère des descriptions textuelles claires avec médailles", () => {
    const descFighter = buildAchievementDescription(
      "fighter",
      "Issaka Issaka",
      "Dosso",
      "1st",
      2024,
      "Sabre National"
    );
    expect(descFighter).toContain("🥇");
    expect(descFighter).toContain("Issaka Issaka");
    expect(descFighter).toContain("Dosso");

    const descRegion = buildAchievementDescription(
      "region",
      "",
      "Tahoua",
      "2nd",
      2024,
      "Sabre National"
    );
    expect(descRegion).toContain("🥈");
    expect(descRegion).toContain("Tahoua");
  });

  it("syncMatchOfficialAchievements gère gracieusement un match inexistant sans crasher", async () => {
    const res = await syncMatchOfficialAchievements(99999999);
    expect(res.success).toBe(false);
    expect(res.reason).toContain("non trouvé");
  });
});
