import { NextRequest, NextResponse } from 'next/server';
import { requireAuth as requireAuthFn, AuthUser } from '@/lib/server/auth-middleware';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  methods?: string[];
}

export interface ApiContext {
  params?: Promise<{ [key: string]: string }>;
  user?: any;
  firebaseUser?: AuthUser;
}

export async function apiHandler(
  request: NextRequest,
  context: ApiContext,
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: ApiHandlerOptions = {}
): Promise<Response> {
  const { requireAuth = false, requiredPermissions = [], methods = [] } = options;

  // Headers CORS pour toutes les réponses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // Gérer les requêtes OPTIONS pour CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Vérifier les méthodes autorisées
  if (methods.length > 0 && !methods.includes(request.method)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 405,
          message: `Méthode ${request.method} non autorisée`,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Vérifier l'authentification si requis
    if (requireAuth) {
      const authResult = await requireAuthFn(request, requiredPermissions);
      
      if (!authResult.authorized) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: authResult.status || 401,
              message: authResult.error || 'Non autorisé',
              timestamp: new Date().toISOString(),
            },
          },
          {
            status: authResult.status || 401,
            headers: corsHeaders,
          }
        );
      }

      // Ajouter l'utilisateur au contexte
      context.user = authResult.user;
      context.firebaseUser = authResult.firebaseUser;
    }

    // Exécuter le handler principal
    const response = await handler(request, context);
    
    // Ajouter les headers CORS à la réponse
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    return response;

  } catch (error) {
    console.error('API Handler error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Erreur serveur interne',
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Helper pour les handlers avec auth
export function withAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context: ApiContext): Promise<Response> => {
    return apiHandler(request, context, handler, {
      requireAuth: true,
      requiredPermissions,
    });
  };
}

// Helper pour les handlers admin
export function withAdminAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>
) {
  return withAuth(handler, ['admin']);
}

// Helper pour les handlers sans auth
export function publicHandler(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  methods: string[] = []
) {
  return async (request: NextRequest, context: ApiContext): Promise<Response> => {
    return apiHandler(request, context, handler, {
      requireAuth: false,
      methods,
    });
  };
}