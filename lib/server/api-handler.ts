// @/lib/server/api-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, AuthUser } from "./auth-middleware";
import { RateLimiter } from "./rate-limit";
import { RedisStore } from "./rate-limit-redis";
import {
  buildPerfLog,
  createPerfContext,
  createRequestId,
  logPerf,
  recordSerialization,
  recordStage,
  runWithPerfContext,
  shouldSample,
} from "./perf-context";

// ─── Singletons Rate Limiter (serverless-safe via globalThis) ────────────────
declare global {
  // eslint-disable-next-line no-var
  var __kokowa_default_redis_store: RedisStore | undefined;
  // eslint-disable-next-line no-var
  var __kokowa_default_rate_limiter: RateLimiter | undefined;
  // eslint-disable-next-line no-var
  var __kokowa_rate_limiters: Map<string, RateLimiter> | undefined;
}

function getRedisStore(): RedisStore | undefined {
  if (process.env.NODE_ENV !== "production" || !process.env.REDIS_URL) {
    return undefined;
  }
  return (globalThis.__kokowa_default_redis_store ??= new RedisStore(
    process.env.REDIS_URL,
  ));
}

function getDefaultRateLimiter(): RateLimiter {
  if (!globalThis.__kokowa_default_rate_limiter) {
    globalThis.__kokowa_default_rate_limiter = new RateLimiter({
      windowMs: 60 * 1000,
      max: 60,
      store: getRedisStore(),
    });
  }
  return globalThis.__kokowa_default_rate_limiter;
}

/**
 * Réutilise un limiteur par configuration (windowMs/max) au lieu de recréer
 * un RateLimiter + RedisStore à chaque requête.
 */
function getRateLimiter(config?: {
  windowMs: number;
  max: number;
}): RateLimiter {
  if (!config) return getDefaultRateLimiter();

  const key = `${config.windowMs}:${config.max}`;
  const cache = (globalThis.__kokowa_rate_limiters ??= new Map());
  const existing = cache.get(key);
  if (existing) return existing;

  const limiter = new RateLimiter({
    windowMs: config.windowMs,
    max: config.max,
    store: getRedisStore(),
  });
  cache.set(key, limiter);
  return limiter;
}

// Configuration CORS avec validation dynamique
const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-App-Id, X-Requested-With, X-Request-Id",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
  // Headers de sécurité supplémentaires
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
};

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");

  // En développement, on peut accepter localhost
  if (process.env.NODE_ENV === "development") {
    if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
      return origin;
    }
    return "*";
  }

  // En production, vérifier la liste blanche
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

  if (!origin) {
    return ""; // Pas d'en-tête Origin pour les requêtes même-origine
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Log sécurité pour les origines non autorisées
  console.warn(`Origine non autorisée tentant d'accéder à l'API: ${origin}`);
  return "";
}

// Apps autorisés
const ALLOWED_APP_IDS = (
  process.env.ALLOWED_APP_IDS || "web-client,mobile-client"
).split(",");

export interface ApiContext {
  params?: Promise<{ [key: string]: string }>;
  user?: any;
  firebaseUser?: AuthUser;
  appId?: string;
}

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  allowedMethods?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  skipAppIdValidation?: boolean;
  /**
   * Cache-Control appliqué aux réponses réussies (GET uniquement).
   * Exemple : "public, s-maxage=30, stale-while-revalidate=60".
   * Ne jamais l'utiliser pour une réponse contenant des données utilisateur.
   */
  cacheControl?: string;
}

export async function apiHandler(
  request: NextRequest,
  context: ApiContext,
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: ApiHandlerOptions = {},
): Promise<Response> {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const perf = createPerfContext(request, requestId, shouldSample());

  return runWithPerfContext(perf, async () => {
    const t0 = performance.now();

    const {
      requireAuth = false,
      requiredRoles = [],
      allowedMethods = [],
      rateLimit,
      skipAppIdValidation = false,
      cacheControl,
    } = options;

    // Construire les headers CORS dynamiquement
    const corsOrigin = getCorsOrigin(request);
    const corsHeaders = {
      ...BASE_CORS_HEADERS,
      "X-Request-Id": requestId,
      ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin } : {}),
    };

    // Gérer OPTIONS pour CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Vérifier les méthodes autorisées
    if (allowedMethods.length > 0 && !allowedMethods.includes(request.method)) {
      const response = sendError(
        405,
        `Méthode ${request.method} non autorisée`,
        corsHeaders,
      );
      logPerf(perf, response.status);
      return response;
    }

    recordStage("cors", performance.now() - t0);

    try {
      // 1. Vérification App ID
      const tAppIdStart = performance.now();
      const appId = request.headers.get("x-app-id");

      if (!skipAppIdValidation && !appId) {
        const response = sendError(400, "En-tête X-App-Id requis", corsHeaders);
        logPerf(perf, response.status);
        return response;
      }

      if (!skipAppIdValidation && appId && !ALLOWED_APP_IDS.includes(appId)) {
        console.warn(`Tentative d'accès avec App ID non autorisé: ${appId}`, {
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "IP non disponible",
          path: request.nextUrl.pathname,
        });
        const response = sendError(
          403,
          "Application non autorisée",
          corsHeaders,
        );
        logPerf(perf, response.status);
        return response;
      }

      context.appId = appId || undefined;
      perf.appId = appId || undefined;
      recordStage("appId", performance.now() - tAppIdStart);

      // 2. Rate limiting avec Redis en production (instance mutualisée)
      const tRateLimitStart = performance.now();
      const rateLimiter = getRateLimiter(rateLimit);

      let rateLimitResult;

      try {
        // Garde-fou : ne jamais laisser le rate limiter bloquer la requête
        // pendant plusieurs secondes si Redis (Upstash) est lent/indisponible.
        // Au-delà du seuil, on laisse passer (fail open) et on journalise.
        const RATE_LIMIT_TIMEOUT_MS = Number(
          process.env.RATE_LIMIT_TIMEOUT_MS || 300,
        );
        rateLimitResult = await Promise.race([
          rateLimiter.check(request),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("rate-limit-timeout")),
              RATE_LIMIT_TIMEOUT_MS,
            ),
          ),
        ]);
      } catch (error) {
        console.error("Rate limit error/timeout:", error);

        // fallback safe
        rateLimitResult = {
          success: true,
          headers: {},
        };
      }

      recordStage("rateLimit", performance.now() - tRateLimitStart);

      if (!rateLimitResult.success) {
        const response = NextResponse.json(
          {
            success: false,
            error: {
              code: rateLimitResult.statusCode,
              message: rateLimitResult.message,
              timestamp: new Date().toISOString(),
            },
          },
          {
            status: rateLimitResult.statusCode,
            headers: {
              ...corsHeaders,
              ...rateLimitResult.headers,
            },
          },
        );
        logPerf(perf, response.status);
        return response;
      }

      // 3. Vérification Firebase Auth (avec cache mémoire court cryptographique)
      const tAuthStart = performance.now();
      if (requireAuth) {
        const authResult = await verifyFirebaseToken(request);

        if (!authResult.user) {
          recordStage("auth", performance.now() - tAuthStart);
          const response = sendError(
            401,
            authResult.error || "Non authentifié",
            corsHeaders,
          );
          logPerf(perf, response.status);
          return response;
        }

        // Vérifier les permissions
        if (requiredRoles.length > 0) {
          const tPermissionsStart = performance.now();
          const { checkUserPermissions } = await import("./auth-utils");
          const permissionResult = await checkUserPermissions(
            authResult.user.uid,
            requiredRoles,
          );
          recordStage("permissions", performance.now() - tPermissionsStart);

          if (!permissionResult.hasPermission) {
            recordStage("auth", performance.now() - tAuthStart);
            const response = sendError(
              403,
              "Permissions insuffisantes",
              corsHeaders,
            );
            logPerf(perf, response.status);
            return response;
          }

          context.user = permissionResult.user;
        } else {
          context.user = authResult.user;
        }

        context.firebaseUser = authResult.user;
      }
      recordStage("auth", performance.now() - tAuthStart);

      // 4. Vérification CSRF pour les méthodes non-idempotentes (web seulement)
      if (
        appId === "web-client" &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
      ) {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");

        if (process.env.NODE_ENV === "production" && origin) {
          try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host && corsOrigin !== origin) {
              const response = sendError(
                403,
                "Origine non autorisée",
                corsHeaders,
              );
              logPerf(perf, response.status);
              return response;
            }
          } catch (error) {
            const response = sendError(400, "Origin invalide", corsHeaders);
            logPerf(perf, response.status);
            return response;
          }
        }
      }

      // 5. Exécuter le handler métier
      const tBeforeHandler = performance.now();
      const response = await handler(request, context);
      recordStage("handler", performance.now() - tBeforeHandler);

      // Mesure de la taille de la réponse sans coût en production non échantillonnée.
      let responseBytes = perf.responseBytes;
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        responseBytes = Number(contentLength) || responseBytes;
      } else if (perf.sampled && response.body && !response.bodyUsed) {
        try {
          const buffer = await response.clone().arrayBuffer();
          responseBytes = buffer.byteLength;
        } catch {
          // ignore : la mesure ne doit jamais casser la réponse
        }
      }
      if (responseBytes > perf.responseBytes) {
        recordSerialization(0, responseBytes - perf.responseBytes);
      }

      // 6. Ajouter les headers de sécurité et rate limiting
      const responseHeaders = new Headers(response.headers);
      Object.entries({
        ...corsHeaders,
        ...rateLimitResult.headers,
      }).forEach(([key, value]) => {
        if (value) responseHeaders.set(key, value);
      });

      if (!responseHeaders.has("cache-control")) {
        if (cacheControl && request.method === "GET" && response.ok) {
          responseHeaders.set("cache-control", cacheControl);
        } else if (requireAuth) {
          responseHeaders.set("cache-control", "private, no-store");
        }
      }

      if (process.env.API_SERVER_TIMING !== "false") {
        const timing = buildPerfLog(perf, response.status);
        responseHeaders.set(
          "server-timing",
          [
            `appid;dur=${timing.appIdMs ?? 0}`,
            `ratelimit;dur=${timing.rateLimitMs ?? 0}`,
            `auth;dur=${timing.authMs ?? 0}`,
            `permissions;dur=${timing.permissionsMs ?? 0}`,
            `handler;dur=${timing.handlerMs ?? 0}`,
            `sql;dur=${timing.sqlMs}`,
            `total;dur=${timing.totalMs}`,
          ].join(", "),
        );
      }

      logPerf(perf, response.status);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("API Handler error:", {
        requestId,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        stack: error instanceof Error ? error.stack : undefined,
        path: request.nextUrl.pathname,
      });

      const response = sendError(
        500,
        process.env.NODE_ENV === "production"
          ? "Erreur serveur interne"
          : error instanceof Error
            ? error.message
            : "Erreur inconnue",
        corsHeaders,
      );
      logPerf(perf, response.status);
      return response;
    }
  });
}

// Helper pour envoyer des erreurs formatées
function sendError(
  status: number,
  message: string,
  headers: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status,
        message,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers,
    },
  );
}

// Helpers pour les handlers (inchangés)
export function withAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: Omit<ApiHandlerOptions, "requireAuth"> = {},
) {
  return async (
    request: NextRequest,
    context: ApiContext,
  ): Promise<Response> => {
    return apiHandler(request, context, handler, {
      requireAuth: true,
      ...options,
    });
  };
}

export function withAdminAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: Omit<ApiHandlerOptions, "requireAuth" | "requiredRoles"> = {},
) {
  return withAuth(handler, {
    requiredRoles: ["admin"],
    ...options,
  });
}

export function publicHandler(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: Omit<ApiHandlerOptions, "requireAuth"> = {},
) {
  return async (
    request: NextRequest,
    context: ApiContext,
  ): Promise<Response> => {
    return apiHandler(request, context, handler, {
      requireAuth: false,
      ...options,
    });
  };
}

/**
 * Instrumentation légère pour les routes qui n'utilisent pas encore
 * `apiHandler`. Elle n'ajoute AUCUNE validation (donc ne casse aucun client)
 * et se contente de mesurer et journaliser la requête.
 */
export function withLightInstrumentation(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const requestId = createRequestId(request.headers.get("x-request-id"));
    const perf = createPerfContext(request, requestId, shouldSample());

    return runWithPerfContext(perf, async () => {
      try {
        const startedAt = performance.now();
        const response = await handler(request, context);
        recordStage("handler", performance.now() - startedAt);

        const headers = new Headers(response.headers);
        headers.set("X-Request-Id", requestId);

        if (perf.sampled && response.body && !response.bodyUsed) {
          try {
            const buffer = await response.clone().arrayBuffer();
            recordSerialization(0, buffer.byteLength);
          } catch {
            // ignore
          }
        }

        logPerf(perf, response.status);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        logPerf(perf, 500);
        throw error;
      }
    });
  };
}
