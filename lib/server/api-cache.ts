// lib/server/api-cache.ts
import { NextRequest } from "next/server";

export type CacheCategory = "public" | "dynamic" | "private";

export interface CacheOptions {
  category: CacheCategory;
  /** Durée de vie en secondes */
  ttlSeconds: number;
  /** Clé de cache personnalisée. Si absente, générée à partir de l'URL + searchParams */
  key?: string;
  /** Tags d'invalidation (ex: ['editions', 'fighters']) */
  tags?: string[];
}

interface CacheEntry {
  body: string;
  contentType: string;
  status: number;
  expiresAt: number;
  tags: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __kokowa_api_cache: Map<string, CacheEntry> | undefined;
}

const CACHE: Map<string, CacheEntry> =
  globalThis.__kokowa_api_cache ?? (globalThis.__kokowa_api_cache = new Map());

const MAX_CACHE_ENTRIES = 1000;

/**
 * Durées de cache recommandées (en secondes)
 */
export const CACHE_TTL = {
  /** Données quasi-statiques (régions, éditions clôturées) : 10 minutes */
  STATIC_REFERENCE: 600,
  /** Données publiques fréquemment consultées (lutteurs, compétitions) : 60 secondes */
  PUBLIC_DATA: 60,
  /** Données dynamiques en cours de match : 3 à 5 secondes */
  DYNAMIC_MATCH: 5,
  /** Données privées : jamais en cache partagé */
  NO_CACHE: 0,
};

/**
 * Génère une clé de cache déterministe basée sur l'URL et les searchParams
 */
export function buildCacheKey(request: NextRequest, prefix?: string): string {
  const url = new URL(request.url);
  // Trier les paramètres de recherche pour garantir l'idempotence des clés
  const sortedParams = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const path = url.pathname;
  return `${prefix ? prefix + ":" : ""}${path}${sortedParams ? "?" + sortedParams : ""}`;
}

/**
 * Tente de récupérer une réponse depuis le cache
 */
export function getCachedApiResponse(key: string): Response | null {
  const entry = CACHE.get(key);
  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    CACHE.delete(key);
    return null;
  }

  return new Response(entry.body, {
    status: entry.status,
    headers: {
      "Content-Type": entry.contentType,
      "X-Kokowa-Cache": "HIT",
      "Cache-Control": `public, max-age=${Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000))}`,
    },
  });
}

/**
 * Stocke une réponse dans le cache mémoire
 */
export async function setCachedApiResponse(
  key: string,
  response: Response,
  options: CacheOptions
): Promise<Response> {
  // RÈGLE ABSOLUE : Les données privées ou dépendantes d'un utilisateur ne doivent JAMAIS être mises en cache public
  if (options.category === "private" || options.ttlSeconds <= 0) {
    return response;
  }

  // Ne pas cacher les erreurs
  if (response.status < 200 || response.status >= 300) {
    return response;
  }

  // Nettoyage préventif si saturation
  if (CACHE.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of CACHE.entries()) {
      if (now >= v.expiresAt) {
        CACHE.delete(k);
      }
    }
    // Si toujours saturé, éliminer les 100 entrées les plus anciennes
    if (CACHE.size >= MAX_CACHE_ENTRIES) {
      const keysToDelete = Array.from(CACHE.keys()).slice(0, 100);
      keysToDelete.forEach((k) => CACHE.delete(k));
    }
  }

  const contentType = response.headers.get("content-type") || "application/json";
  const bodyText = await response.text();

  CACHE.set(key, {
    body: bodyText,
    contentType,
    status: response.status,
    expiresAt: Date.now() + options.ttlSeconds * 1000,
    tags: options.tags || [],
  });

  // Reconstituer la réponse car le body a été consommé
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Kokowa-Cache", "MISS");
  newHeaders.set("Cache-Control", `public, max-age=${options.ttlSeconds}`);

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Invalide toutes les entrées de cache associées à un tag (ex: après un POST / PUT / DELETE)
 */
export function invalidateCacheByTag(tag: string): number {
  let invalidated = 0;
  for (const [key, entry] of CACHE.entries()) {
    if (entry.tags.includes(tag)) {
      CACHE.delete(key);
      invalidated++;
    }
  }
  return invalidated;
}

/**
 * Invalide une clé de cache exacte
 */
export function invalidateCacheByKey(key: string): boolean {
  return CACHE.delete(key);
}

/**
 * Vide complètement le cache API (utilitaire d'administration / test)
 */
export function clearApiCache(): void {
  CACHE.clear();
}
