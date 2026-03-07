// @/lib/server/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, AuthUser } from './auth-middleware';
import { verifyAppCheckToken, isDebugMode } from './app-check';
import { RateLimiter } from './rate-limit';
import { RedisStore } from './rate-limit-redis'; // Nouveau

// Configuration CORS avec validation dynamique
const BASE_CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck, X-App-Id, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
    // Headers de sécurité supplémentaires
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
};

function getCorsOrigin(request: NextRequest): string {
    const origin = request.headers.get('origin');

    // En développement, on peut accepter localhost
    if (process.env.NODE_ENV === 'development') {
        if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
            return origin;
        }
        return '*';
    }

    // En production, vérifier la liste blanche
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

    if (!origin) {
        return ''; // Pas d'en-tête Origin pour les requêtes même-origine
    }

    if (allowedOrigins.includes(origin)) {
        return origin;
    }

    // Log sécurité pour les origines non autorisées
    console.warn(`Origine non autorisée tentant d'accéder à l'API: ${origin}`);
    return '';
}

// Apps autorisés
const ALLOWED_APP_IDS = (process.env.ALLOWED_APP_IDS || 'web-client,mobile-client').split(',');

export interface ApiContext {
    params?: Promise<{ [key: string]: string }>;
    user?: any;
    firebaseUser?: AuthUser;
    appId?: string;
}

export interface ApiHandlerOptions {
    requireAuth?: boolean;
    requireAppCheck?: boolean;
    requiredPermissions?: string[];
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
    options: ApiHandlerOptions = {}
): Promise<Response> {
    const {
        requireAuth = false,
        requireAppCheck = true,
        requiredPermissions = [],
        allowedMethods = [],
        rateLimit,
        skipAppIdValidation = false,
    } = options;

    // Construire les headers CORS dynamiquement
    const corsOrigin = getCorsOrigin(request);
    const corsHeaders = {
        ...BASE_CORS_HEADERS,
        ...(corsOrigin ? { 'Access-Control-Allow-Origin': corsOrigin } : {}),
    };

    // Gérer OPTIONS pour CORS preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // Vérifier les méthodes autorisées
    if (allowedMethods.length > 0 && !allowedMethods.includes(request.method)) {
        return sendError(405, `Méthode ${request.method} non autorisée`, corsHeaders);
    }

    try {
        // 1. Vérification App ID
        const appId = request.headers.get('x-app-id');

        if (!skipAppIdValidation && !appId) {
            return sendError(400, 'En-tête X-App-Id requis', corsHeaders);
        }

        if (!skipAppIdValidation && appId && !ALLOWED_APP_IDS.includes(appId)) {
            console.warn(`Tentative d'accès avec App ID non autorisé: ${appId}`, {
                ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'IP non disponible',
                path: request.nextUrl.pathname,
            });
            return sendError(403, 'Application non autorisée', corsHeaders);
        }

        context.appId = appId || undefined;

        // 2. Rate limiting avec Redis en production
        const rateLimiter = new RateLimiter({
            windowMs: rateLimit?.windowMs || 60 * 1000,
            max: rateLimit?.max || 60,
            store: process.env.REDIS_URL ? new RedisStore(process.env.REDIS_URL) : undefined,
        });

        const rateLimitResult = await rateLimiter.check(request);

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
                }
            );
        }

        // 3. Vérification App Check (sauf en mode debug)
        if (requireAppCheck && !isDebugMode()) {
            const appCheckToken = request.headers.get('x-firebase-appcheck');

            if (!appCheckToken) {
                return sendError(401, 'Token App Check requis', corsHeaders);
            }

            const appCheckResult = await verifyAppCheckToken(appCheckToken);

            if (!appCheckResult.success) {
                console.error('Échec vérification App Check:', {
                    error: appCheckResult.error,
                    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'IP non disponible',
                    path: request.nextUrl.pathname,
                });
                return sendError(401, 'Token App Check invalide', corsHeaders);
            }

            // Vérifier que l'App ID correspond
            if (appCheckResult.appId && appCheckResult.appId !== process.env.FIREBASE_APP_ID) {
                console.error('App ID Firebase ne correspond pas:', {
                    expected: process.env.FIREBASE_APP_ID,
                    received: appCheckResult.appId,
                });
                return sendError(401, 'Token App Check invalide', corsHeaders);
            }
        }

        // 4. Vérification Firebase Auth
        if (requireAuth) {
            const authResult = await verifyFirebaseToken(request);

            if (!authResult.user) {
                return sendError(401, authResult.error || 'Non authentifié', corsHeaders);
            }

            // Vérifier les permissions
            if (requiredPermissions.length > 0) {
                const { checkUserPermissions } = await import('./auth-utils');
                const permissionResult = await checkUserPermissions(
                    authResult.user.uid,
                    requiredPermissions
                );

                if (!permissionResult.hasPermission) {
                    return sendError(403, 'Permissions insuffisantes', corsHeaders);
                }

                context.user = permissionResult.user;
            } else {
                context.user = authResult.user;
            }

            context.firebaseUser = authResult.user;
        }

        // 5. Vérification CSRF pour les méthodes non-idempotentes (web seulement)
        if (appId === 'web-client' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const origin = request.headers.get('origin');
            const host = request.headers.get('host');

            if (process.env.NODE_ENV === 'production' && origin) {
                try {
                    const originUrl = new URL(origin);
                    if (originUrl.host !== host && corsOrigin !== origin) {
                        return sendError(403, 'Origine non autorisée', corsHeaders);
                    }
                } catch (error) {
                    return sendError(400, 'Origin invalide', corsHeaders);
                }
            }
        }

        // 6. Exécuter le handler
        const response = await handler(request, context);

        // 7. Ajouter les headers de sécurité et rate limiting
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
        console.error('API Handler error:', {
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            stack: error instanceof Error ? error.stack : undefined,
            path: request.nextUrl.pathname,
        });

        return sendError(
            500,
            process.env.NODE_ENV === 'production'
                ? 'Erreur serveur interne'
                : error instanceof Error ? error.message : 'Erreur inconnue',
            corsHeaders
        );
    }
}

// Helper pour envoyer des erreurs formatées
function sendError(status: number, message: string, headers: Record<string, string>): NextResponse {
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
        }
    );
}

// Helpers pour les handlers (inchangés)
export function withAuth(
    handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
    options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
    return async (request: NextRequest, context: ApiContext): Promise<Response> => {
        return apiHandler(request, context, handler, {
            requireAuth: true,
            ...options,
        });
    };
}

export function withAdminAuth(
    handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
    options: Omit<ApiHandlerOptions, 'requireAuth' | 'requiredPermissions'> = {}
) {
    return withAuth(handler, {
        requiredPermissions: ['admin'],
        ...options,
    });
}

export function publicHandler(
    handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
    options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
    return async (request: NextRequest, context: ApiContext): Promise<Response> => {
        return apiHandler(request, context, handler, {
            requireAuth: false,
            requireAppCheck: true,
            ...options,
        });
    };
}