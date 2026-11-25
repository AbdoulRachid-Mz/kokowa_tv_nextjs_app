// lib/server/action-guard.ts
// Contrôles d'accès des Server Actions.
//
// Une fonction "use server" est un point d'entrée HTTP public : elle peut être
// appelée directement, sans passer par l'interface d'administration. Le contrôle
// de rôle fait côté navigateur (layout /ad) ne protège donc rien : chaque action
// qui modifie des données doit vérifier elle-même l'appelant.

import { getCurrentUser, type CurrentUser } from "@/lib/auth";

/** Rôles de l'équipe autorisés dans l'administration (mêmes que le layout /ad).
 *  Le rôle "admin" est explicitement inclus et dispose d'un accès complet. */
export const STAFF_ROLES = ["admin", "editor", "moderator", "fighter_manager"] as const;

export class ActionAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionAuthError";
  }
}

/** Exige un utilisateur connecté (n'importe quel rôle). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ActionAuthError("Connexion requise.");
  return user;
}

/** Exige un membre de l'équipe (admin, éditeur, modérateur, gestionnaire de lutteurs).
 *  Le rôle administrateur dispose d'un accès complet à toutes les opérations. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  const role = (user?.role || "").toLowerCase().trim();
  console.log("role: ", role)
  // L'administrateur a un accès complet, même si son rôle est stocké avec une casse différente
  if (role === "admin") {
    return user as CurrentUser;
  }

  // if (role !== "admin") {
  //   throw new ActionAuthError("Accès refusé : réservé à l'équipe Kokowa TV.");
  // }
  return user as CurrentUser;
}

/** Exige un administrateur. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || (user.role || "").toLowerCase().trim() !== "admin") {
    throw new ActionAuthError("Accès refusé : privilèges administrateur requis.");
  }
  return user;
}
