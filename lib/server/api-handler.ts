// @/lib/server/api-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, AuthUser } from "./auth-middleware";
import { RateLimiter } from "./rate-limit";
import { RedisStore } from "./rate-limit-redis";

// ─── Singletons Rate Limiter (serverless-safe via globalThis) ────────────────
declare global {
  // eslint-disable-next-line no-var
  var __kokowa_default_redis_store: RedisStore | undefined;
  // eslint-disable-next-line no-var
  var __kokowa_default_rate_limiter: RateLimiter | undefined;
}

function getDefaultRateLimiter(): RateLimiter {
  if (!globalThis.__kokowa_default_rate_limiter) {
    const store =
      process.env.NODE_ENV === "production" && process.env.REDIS_URL
        ? (globalThis.__kokowa_default_redis_store ??= new RedisStore(process.env.REDIS_URL))
        : undefined;

    globalThis.__kokowa_default_rate_limiter = new RateLimiter({
      windowMs: 60 * 1000,
      max: 60,
      store,
    });
  }
  return globalThis.__kokowa_default_rate_limiter;
}

// Configuration CORS avec validation dynamique
const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-App-Id, X-Requested-With",
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
}

export async function apiHandler(
  request: NextRequest,
  context: ApiContext,
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: ApiHandlerOptions = {},
): Promise<Response> {
  const t0 = performance.now();
  const shouldLogPerf =
    process.env.API_PERF_LOG === "true" || process.env.NODE_ENV === "development";

  const {
    requireAuth = false,
    requiredRoles = [],
    allowedMethods = [],
    rateLimit,
    skipAppIdValidation = false,
  } = options;

  // Construire les headers CORS dynamiquement
  const corsOrigin = getCorsOrigin(request);
  const corsHeaders = {
    ...BASE_CORS_HEADERS,
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
    return sendError(
      405,
      `Méthode ${request.method} non autorisée`,
      corsHeaders,
    );
  }

  const tCors = performance.now();

  try {
    // 1. Vérification App ID
    const appId = request.headers.get("x-app-id");

    if (!skipAppIdValidation && !appId) {
      return sendError(400, "En-tête X-App-Id requis", corsHeaders);
    }

    if (!skipAppIdValidation && appId && !ALLOWED_APP_IDS.includes(appId)) {
      console.warn(`Tentative d'accès avec App ID non autorisé: ${appId}`, {
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "IP non disponible",
        path: request.nextUrl.pathname,
      });
      return sendError(403, "Application non autorisée", corsHeaders);
    }

    context.appId = appId || undefined;
    const tAppId = performance.now();

    // 2. Rate limiting avec Redis en production (instance mutualisée)
    const rateLimiter = rateLimit
      ? new RateLimiter({
          windowMs: rateLimit.windowMs,
          max: rateLimit.max,
          store:
            process.env.NODE_ENV === "production" && process.env.REDIS_URL
              ? new RedisStore(process.env.REDIS_URL)
              : undefined,
        })
      : getDefaultRateLimiter();

    let rateLimitResult;

    try {
      rateLimitResult = await rateLimiter.check(request);
    } catch (error) {
      console.error("Rate limit error:", error);

      // fallback safe
      rateLimitResult = {
        success: true,
        headers: {},
      };
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
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
    }
    const tRateLimit = performance.now();

    // 3. Vérification Firebase Auth (avec cache mémoire court cryptographique)
    let tAuth = tRateLimit;
    if (requireAuth) {
      const authResult = await verifyFirebaseToken(request);

      if (!authResult.user) {
        return sendError(
          401,
          authResult.error || "Non authentifié",
          corsHeaders,
        );
      }

      // Vérifier les permissions
      if (requiredRoles.length > 0) {
        const { checkUserPermissions } = await import("./auth-utils");
        const permissionResult = await checkUserPermissions(
          authResult.user.uid,
          requiredRoles,
        );

        if (!permissionResult.hasPermission) {
          return sendError(403, "Permissions insuffisantes", corsHeaders);
        }

        context.user = permissionResult.user;
      } else {
        context.user = authResult.user;
      }

      context.firebaseUser = authResult.user;
      tAuth = performance.now();
    }

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
            return sendError(403, "Origine non autorisée", corsHeaders);
          }
        } catch (error) {
          return sendError(400, "Origin invalide", corsHeaders);
        }
      }
    }

    // 5. Exécuter le handler métier
    const tBeforeHandler = performance.now();
    const response = await handler(request, context);
    const tAfterHandler = performance.now();

    // Mesure et logs de performance
    if (shouldLogPerf) {
      const totalMs = Math.round(tAfterHandler - t0);
      const handlerMs = Math.round(tAfterHandler - tBeforeHandler);
      const authMs = Math.round(tAuth - tRateLimit);
      const rlMs = Math.round(tRateLimit - tAppId);
      console.log(
        `⚡ [API-PERF] ${request.method} ${request.nextUrl.pathname} — Total: ${totalMs}ms (Handler: ${handlerMs}ms, Auth: ${authMs}ms, RateLimit: ${rlMs}ms)`
      );
    }

    // 6. Ajouter les headers de sécurité et rate limiting
    const responseHeaders = new Headers(response.headers);
    Object.entries({
      ...corsHeaders,
      ...rateLimitResult.headers,
    }).forEach(([key, value]) => {
      if (value) responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API Handler error:", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname,
    });

    return sendError(
      500,
      process.env.NODE_ENV === "production"
        ? "Erreur serveur interne"
        : error instanceof Error
          ? error.message
          : "Erreur inconnue",
      corsHeaders,
    );
  }
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
