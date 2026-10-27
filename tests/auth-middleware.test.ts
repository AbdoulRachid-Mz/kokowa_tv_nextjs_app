// tests/auth-middleware.test.ts
// NOTE: Ces tests valident la logique de routage et de détection du type de jeton.
// La vérification cryptographique réelle (Firebase Admin SDK) nécessite un environnement
// configuré avec des variables FIREBASE_* valides et n'est pas testée en CI local.

import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";

/**
 * Simule la logique de détection du type de jeton (Bearer vs Cookie)
 * sans importer Firebase Admin (qui nécessite des credentials réels)
 */
function detectTokenSource(request: NextRequest): {
  token: string | null;
  isBearerHeader: boolean;
} {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.substring(7).trim(), isBearerHeader: true };
  }
  const cookieToken =
    request.cookies.get("firebase_session")?.value ||
    request.cookies.get("token")?.value ||
    null;
  return { token: cookieToken, isBearerHeader: false };
}

describe("Auth Token Detection Logic - Kokowa TV", () => {
  it("Retourne token null si aucun justificatif n'est fourni", () => {
    const req = new NextRequest("http://localhost:3000/api/test");
    const { token, isBearerHeader } = detectTokenSource(req);
    expect(token).toBeNull();
    expect(isBearerHeader).toBe(false);
  });

  it("Détecte un Bearer token dans le header Authorization", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { authorization: "Bearer eyJhbGciOiJSUzI1NiJ9.test.sig" },
    });
    const { token, isBearerHeader } = detectTokenSource(req);
    expect(token).toBe("eyJhbGciOiJSUzI1NiJ9.test.sig");
    expect(isBearerHeader).toBe(true);
  });

  it("Détecte un cookie firebase_session et ne le traite pas comme Bearer", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { cookie: "firebase_session=eyJhbGciOiJSUzI1NiJ9.session.sig" },
    });
    const { token, isBearerHeader } = detectTokenSource(req);
    expect(token).toBe("eyJhbGciOiJSUzI1NiJ9.session.sig");
    expect(isBearerHeader).toBe(false);
  });

  it("Priorité : Bearer header est préféré au cookie", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        authorization: "Bearer bearer_token_here",
        cookie: "firebase_session=cookie_token_here",
      },
    });
    const { token, isBearerHeader } = detectTokenSource(req);
    expect(token).toBe("bearer_token_here");
    expect(isBearerHeader).toBe(true);
  });

  it("Retourne null si le header Authorization ne commence pas par 'Bearer '", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    });
    const { token, isBearerHeader } = detectTokenSource(req);
    expect(token).toBeNull();
    expect(isBearerHeader).toBe(false);
  });
});
