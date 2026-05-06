// app/api/test/web/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, publicHandler, withAuth, withAdminAuth } from '@/lib/server/api-handler';

// ========== 1. API PUBLIQUE (sans auth) ==========
export async function GET(request: NextRequest, context: ApiContext) {
  return publicHandler(
    async (req, ctx) => {
      return Response.json({
        success: true,
        message: 'API publique accessible',
        data: {
          appId: ctx.appId,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      requireAppCheck: false, // Désactiver App Check pour le test
      rateLimit: { windowMs: 60000, max: 30 }, // 30 requêtes/minute
    }
  )(request, context);
}

// ========== 2. API AUTHENTIFIÉE ==========
export async function POST(request: NextRequest, context: ApiContext) {
  return withAuth(
    async (req, ctx) => {
      const body = await req.json().catch(() => ({}));

      return Response.json({
        success: true,
        message: 'Authentifié avec succès',
        data: {
          user: {
            uid: ctx.user?.uid,
            email: ctx.firebaseUser?.email,
            role: ctx.user.role,
          },
          body,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {} // Pas de permissions spécifiques
  )(request, context);
}

// ========== 3. API ADMIN ==========
export async function PUT(request: NextRequest, context: ApiContext) {
  return withAdminAuth(
    async (req, ctx) => {
      const body = await req.json().catch(() => ({}));

      return Response.json({
        success: true,
        message: 'Action admin autorisée',
        data: {
          user: {
            uid: ctx.user?.uid,
            email: ctx.firebaseUser?.email,
            role: ctx.user.role,
          },
          action: body.action,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      rateLimit: { windowMs: 60000, max: 100 }, // Moins de limites pour admin
    }
  )(request, context);
}

// ========== 4. DELETE avec permissions spécifiques ==========
export async function DELETE(request: NextRequest, context: ApiContext) {
  return withAuth(
    async (req, ctx) => {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      return Response.json({
        success: true,
        message: 'Ressource supprimée',
        data: {
          user: {
            uid: ctx.user?.uid,
            email: ctx.firebaseUser?.email,
            role: ctx.user.role,
          },
          resourceId: id,
          deletedBy: ctx.user?.uid,
          timestamp: new Date().toISOString(),
        },
      });
    },
    { requiredPermissions: ['admin', 'editor'] } // Nécessite admin OU editor
  )(request, context);
}