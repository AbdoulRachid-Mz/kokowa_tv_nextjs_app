import { describe, it, expect, beforeEach } from "bun:test";
import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/server/api-handler";
import {
  getCachedApiResponse,
  setCachedApiResponse,
  buildCacheKey,
  invalidateCacheByTag,
  clearApiCache,
  CACHE_TTL,
} from "@/lib/server/api-cache";

describe("API Cache System - Kokowa TV", () => {
  beforeEach(() => {
    clearApiCache();
  });

  it("génère des clés de cache déterministes", () => {
    const req1 = new NextRequest("http://localhost:3000/api/editions?limit=20&page=1");
    const req2 = new NextRequest("http://localhost:3000/api/editions?page=1&limit=20");

    const key1 = buildCacheKey(req1);
    const key2 = buildCacheKey(req2);

    expect(key1).toBe(key2);
    expect(key1).toBe("/api/editions?limit=20&page=1");
  });

  it("met en cache et retourne une réponse publique (HIT)", async () => {
    const key = "test:editions:page1";
    const initialResponse = Response.json({ success: true, data: [1, 2, 3] });

    const cachedResponse = await setCachedApiResponse(key, initialResponse, {
      category: "public",
      ttlSeconds: 60,
      tags: ["editions"],
    });

    expect(cachedResponse.headers.get("X-Kokowa-Cache")).toBe("MISS");

    const hitResponse = getCachedApiResponse(key);
    expect(hitResponse).not.toBeNull();
    expect(hitResponse?.headers.get("X-Kokowa-Cache")).toBe("HIT");

    const data = await hitResponse?.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual([1, 2, 3]);
  });

  it("ne met JAMAIS en cache les données privées", async () => {
    const key = "test:user:profile";
    const privateResponse = Response.json({ user: "secret" });

    await setCachedApiResponse(key, privateResponse, {
      category: "private",
      ttlSeconds: 60,
    });

    const hit = getCachedApiResponse(key);
    expect(hit).toBeNull();
  });

  it("invalide le cache par tag", async () => {
    const key1 = "editions:list";
    const key2 = "editions:detail:29";
    const key3 = "fighters:list";

    await setCachedApiResponse(key1, Response.json({ e: 1 }), {
      category: "public",
      ttlSeconds: 60,
      tags: ["editions"],
    });
    await setCachedApiResponse(key2, Response.json({ e: 2 }), {
      category: "public",
      ttlSeconds: 60,
      tags: ["editions"],
    });
    await setCachedApiResponse(key3, Response.json({ f: 1 }), {
      category: "public",
      ttlSeconds: 60,
      tags: ["fighters"],
    });

    const invalidated = invalidateCacheByTag("editions");
    expect(invalidated).toBe(2);

    expect(getCachedApiResponse(key1)).toBeNull();
    expect(getCachedApiResponse(key2)).toBeNull();
    expect(getCachedApiResponse(key3)).not.toBeNull();
  });
});

describe("API Handler X-App-Id & Performance - Kokowa TV", () => {
  it("rejette les requêtes avec App ID invalide quand skipAppIdValidation est false", async () => {
    const req = new NextRequest("http://localhost:3000/api/test/mobile", {
      headers: {
        "x-app-id": "hacker-app",
      },
    });

    const res = await apiHandler(
      req,
      {},
      async () => Response.json({ ok: true }),
      { skipAppIdValidation: false }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("Application non autorisée");
  });

  it("accepte les requêtes avec App ID 'mobile-client'", async () => {
    const req = new NextRequest("http://localhost:3000/api/test/mobile", {
      headers: {
        "x-app-id": "mobile-client",
      },
    });

    const res = await apiHandler(
      req,
      {},
      async (r, ctx) => Response.json({ ok: true, appId: ctx.appId }),
      { skipAppIdValidation: false }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.appId).toBe("mobile-client");
  });

  it("exécute le handler léger en moins de 50ms en mémoire", async () => {
    const req = new NextRequest("http://localhost:3000/api/test/public", {
      headers: { "x-app-id": "web-client" },
    });

    const start = performance.now();
    const res = await apiHandler(
      req,
      {},
      async () => Response.json({ success: true, timestamp: Date.now() }),
      { skipAppIdValidation: false }
    );
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    // En local, un handler sans I/O doit répondre en < 50ms
    expect(duration).toBeLessThan(50);
  });
});
