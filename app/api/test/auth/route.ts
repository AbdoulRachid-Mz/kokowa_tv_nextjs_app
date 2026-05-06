// app/api/test/auth/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, withAuth } from '@/lib/server/api-handler';
import { getRegions } from '@/actions/regions';
import { getUserByAuthId } from '@/actions/users';

export async function GET(request: NextRequest, context: ApiContext) {
  return withAuth(
    async (req, ctx) => {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      
      // Récupérer l'utilisateur complet depuis la base
      const dbUser = await getUserByAuthId(ctx?.user?.uid || '');
      
      const result = await getRegions({
        limit,
        page: 1,
        with_fighters: true,
        with_coach: true,
      });

      return Response.json({
        success: true,
        message: 'API authentifiée - Données utilisateur + régions',
        data: {
          firebaseUser: {
            uid: ctx.user?.uid,
            email: ctx.firebaseUser?.email,
            email_verified: ctx.firebaseUser?.email_verified,
          },
          dbUser: dbUser ? {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.role,
          } : null,
          regions: result.data,
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {} // Pas de permissions spécifiques
  )(request, context);
}