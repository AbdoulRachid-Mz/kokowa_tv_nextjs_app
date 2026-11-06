// lib/api-handler.ts
// Pont de compatibilité unifié vers @/lib/server/api-handler
import { NextRequest } from 'next/server';
import {
  apiHandler as serverApiHandler,
  ApiContext,
  ApiHandlerOptions as ServerApiHandlerOptions,
} from '@/lib/server/api-handler';

export type { ApiContext };

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  methods?: string[];
  allowedMethods?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  skipAppIdValidation?: boolean;
  cacheControl?: string;
}

export async function apiHandler(
  request: NextRequest,
  context: ApiContext,
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: ApiHandlerOptions = {}
): Promise<Response> {
  const allowed = options.allowedMethods || options.methods || [];
  const roles = options.requiredRoles || options.requiredPermissions || [];

  return serverApiHandler(request, context, handler, {
    requireAuth: options.requireAuth ?? false,
    requiredRoles: roles,
    allowedMethods: allowed,
    rateLimit: options.rateLimit,
    skipAppIdValidation: options.skipAppIdValidation ?? true,
    cacheControl: options.cacheControl,
  });}

// Helper pour les handlers sans authentification (utilisé par l'API mobile et endpoints publics)
export function publicHandler(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  methodsOrOptions?: string[] | ApiHandlerOptions
) {
  let allowedMethods: string[] = [];
  let rateLimit: { windowMs: number; max: number } | undefined = undefined;
  let skipAppIdValidation: boolean = false;
  let cacheControl: string | undefined = undefined;

  if (Array.isArray(methodsOrOptions)) {
    allowedMethods = methodsOrOptions;
  } else if (methodsOrOptions && typeof methodsOrOptions === 'object') {
    allowedMethods = methodsOrOptions.allowedMethods || methodsOrOptions.methods || [];
    rateLimit = methodsOrOptions.rateLimit;
    skipAppIdValidation = methodsOrOptions.skipAppIdValidation ?? false;
    cacheControl = methodsOrOptions.cacheControl;
  }

  return async (request: NextRequest, context: ApiContext): Promise<Response> => {
    return serverApiHandler(request, context, handler, {
      requireAuth: false,
      allowedMethods,
      rateLimit,
      skipAppIdValidation,
      cacheControl,
    });
  };
}

// Helper pour les handlers avec authentification
export function withAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context: ApiContext): Promise<Response> => {
    return serverApiHandler(request, context, handler, {
      requireAuth: true,
      requiredRoles: requiredPermissions,
      skipAppIdValidation: false,
    });
  };
}

// Helper pour les handlers administrateur
export function withAdminAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>
) {
  return withAuth(handler, ['admin']);
}
