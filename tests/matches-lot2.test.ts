import { describe, it, expect } from "bun:test";
// Simule un membre de l'équipe connecté (les actions vérifient l'appelant)
import { setTestActor } from "./helpers/mock-staff-session";
import { createEliminationMatch } from "@/actions/matches";
import { assignSubGroupReferee } from "@/actions/sub-group-referee";

describe("LOT 2 - Combats & Phases Éliminatoires Tests", () => {
  it("createEliminationMatch rejette la création si aucun lutteur n'est spécifié", async () => {
    try {
      await createEliminationMatch(1, {
        fighter1_id: null,
        fighter2_id: null,
      });
      expect(true).toBe(false); // Doit échouer
    } catch (e: any) {
      expect(e.message).toContain("Au moins un lutteur");
    }
  });

  it("createEliminationMatch rejette un combat où le même lutteur est sélectionné 2 fois", async () => {
    try {
      await createEliminationMatch(1, {
        fighter1_id: 10,
        fighter2_id: 10,
      });
      expect(true).toBe(false); // Doit échouer
    } catch (e: any) {
      expect(e.message).toContain("combattre contre lui-même");
    }
  });

  it("assignSubGroupReferee valide les paramètres d'entrée", async () => {
    try {
      await assignSubGroupReferee(0 as any, 1);
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("invalide");
    }
  });

  it("refuse un appel anonyme (sécurité des Server Actions)", async () => {
    setTestActor(null);
    try {
      const res = await createEliminationMatch(1, {} as any).catch((e: Error) => ({ error: e.message }));
      expect(JSON.stringify(res)).toContain("Accès refusé");
    } finally {
      setTestActor("admin");
    }
  });
});
