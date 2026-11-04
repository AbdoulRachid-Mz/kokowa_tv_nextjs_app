// app/api/test/mobile/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, withAuth } from '@/lib/server/api-handler';

// Configuration spéciale pour mobile
const MOBILE_CONFIG = {
  skipAppIdValidation: false, // Vérifier l'App ID
};

// ========== 1. API PUBLIQUE MOBILE ==========
export async function GET(request: NextRequest, context: ApiContext) {
  return apiHandler(
    request,
    context,
    async (req, ctx) => {
      return Response.json({
        success: true,
        message: 'API mobile publique',
        data: {
          appId: ctx.appId,
          platform: 'mobile',
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      requireAuth: false,
      skipAppIdValidation: false,
      rateLimit: { windowMs: 60000, max: 60 }, // Plus permissif pour mobile
    }
  );
}

// ========== 2. API AUTHENTIFIÉE MOBILE ==========
export async function POST(request: NextRequest, context: ApiContext) {
  return apiHandler(
    request,
    context,
    async (req, ctx) => {
      const body = await req.json().catch(() => ({}));

      return Response.json({
        success: true,
        message: 'Authentifié (mobile)',
        data: {
          user: ctx.user,
          body,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      requireAuth: true,
      rateLimit: { windowMs: 60000, max: 120 },
    }
  );
}

// ========== 3. Endpoint pour refresh token ==========
export async function PUT(request: NextRequest, context: ApiContext) {
  return withAuth(
    async (req, user) => {
      return Response.json({
        success: true,
        message: 'Token valide',
        data: {
          user: { uid: user.firebaseUser?.uid, email: user.firebaseUser?.email },
          expiresIn: 3600,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {}
  )(request, context);
}
