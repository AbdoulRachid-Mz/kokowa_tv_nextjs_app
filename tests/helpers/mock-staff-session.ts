// tests/helpers/mock-staff-session.ts
// Les Server Actions vérifient l'appelant (lib/server/action-guard.ts) via le cookie
// de session, absent dans les tests. Ce module simule l'utilisateur connecté.
// À importer EN PREMIER dans un fichier de test, avant les actions.
//
// Par défaut : un administrateur. Pour tester un appel anonyme :
//   setTestActor(null)   (puis setTestActor("admin") pour revenir)
import { mock } from "bun:test";

type Role = "admin" | "editor" | "moderator" | "fighter_manager" | "user";
const STAFF = ["admin", "editor", "moderator", "fighter_manager"];

let actor: Role | null = "admin";
export function setTestActor(role: Role | null) {
  actor = role;
}

class ActionAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionAuthError";
  }
}

const user = () => ({ uid: "test-uid", email: "test@kokowa.tv", role: actor ?? undefined });

mock.module("@/lib/server/action-guard", () => ({
  STAFF_ROLES: STAFF,
  ActionAuthError,
  requireUser: async () => {
    if (!actor) throw new ActionAuthError("Connexion requise.");
    return user();
  },
  requireStaff: async () => {
    if (!actor || !STAFF.includes(actor)) {
      throw new ActionAuthError("Accès refusé : réservé à l'équipe Kokowa TV.");
    }
    return user();
  },
  requireAdmin: async () => {
    if (actor !== "admin") {
      throw new ActionAuthError("Accès refusé : privilèges administrateur requis.");
    }
    return user();
  },
}));
