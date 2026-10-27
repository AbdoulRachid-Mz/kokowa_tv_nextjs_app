// tests/middleware.test.ts
import { describe, expect, it } from "bun:test";
import { proxy as middleware } from "../proxy";
import { NextRequest } from "next/server";

// Utilitaire pour créer un faux JWT Firebase
function createMockJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "fake_signature_hash";
  return `${header}.${body}.${signature}`;
}

describe("Middleware / Proxy Tests - Kokowa TV", () => {
  const validExp = Math.floor(Date.now() / 1000) + 3600; // Valide pour 1h
  const expiredExp = Math.floor(Date.now() / 1000) - 3600; // Expiré depuis 1h

  const adminToken = createMockJwt({
    uid: "admin_uid_123",
    email: "admin@kokowatv.com",
    role: "admin",
    exp: validExp,
  });

  const userToken = createMockJwt({
    uid: "user_uid_456",
    email: "user@kokowatv.com",
    role: "user",
    exp: validExp,
  });

  const expiredToken = createMockJwt({
    uid: "admin_uid_123",
    email: "admin@kokowatv.com",
    role: "admin",
    exp: expiredExp,
  });

  it("1. Utilisateur anonyme sur page publique : doit laisser passer (200 OK)", async () => {
    const req = new NextRequest("http://localhost:3000/articles");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("2. Utilisateur anonyme sur la page de présentation : doit laisser passer (200 OK)", async () => {
    const req = new NextRequest("http://localhost:3000/presentation");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("3. Utilisateur anonyme sur page administrative /ad : passe le proxy (la protection est déléguée au layout client AdminLayout)", async () => {
    const req = new NextRequest("http://localhost:3000/ad/matches?page=2");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("4. Utilisateur connecté (token valide) sur page administrative : accès autorisé (200 OK) avec injection de headers", async () => {
    const req = new NextRequest("http://localhost:3000/ad/matches", {
      headers: {
        cookie: `firebase_session=${adminToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("5. Utilisateur avec session expirée sur page administrative : passe le proxy sans bloquer au niveau réseau", async () => {
    const req = new NextRequest("http://localhost:3000/ad/fighters", {
      headers: {
        cookie: `firebase_session=${expiredToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("6. Utilisateur avec cookie malformé sur page administrative : passe le proxy sans bloquer au niveau réseau", async () => {
    const req = new NextRequest("http://localhost:3000/ad", {
      headers: {
        cookie: "firebase_session=not_a_valid_jwt_token",
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("7. Utilisateur connecté accédant à /auth/sign-in : doit être redirigé vers sa destination légitime", async () => {
    const req = new NextRequest("http://localhost:3000/auth/sign-in?redirect=%2Fad%2Fmatches", {
      headers: {
        cookie: `firebase_session=${adminToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/ad/matches");
  });

  it("8. Tentative d'Open Redirect sur /auth/sign-in : doit être assainie vers /ad", async () => {
    const req = new NextRequest("http://localhost:3000/auth/sign-in?redirect=https%3A%2F%2Fevil.com", {
      headers: {
        cookie: `firebase_session=${adminToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/ad");
  });

  it("9. Tentative d'Open Redirect avec //evil.com : doit être assainie vers /ad", async () => {
    const req = new NextRequest("http://localhost:3000/auth/sign-in?redirect=%2F%2Fevil.com", {
      headers: {
        cookie: `firebase_session=${adminToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/ad");
  });

  it("10. Route API appelée directement : ne doit JAMAIS être redirigée vers /auth/sign-in en HTML", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/matches");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("11. Route API protégée appelée directement sans token : pass-through pour que apiHandler gère le JSON 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("12. Support du Header Authorization Bearer sur page /ad", async () => {
    const req = new NextRequest("http://localhost:3000/ad/competitions", {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
