// app/api/auth/reset-password/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { AuthService } from '@/lib/firebase/auth-service';
import { ConfirmResetPasswordCredentials } from '@/types/user';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req) => {
      const body: ConfirmResetPasswordCredentials = await req.json();
      const { oobCode, newPassword } = body;

      // Valider les données
      if (!oobCode || !newPassword) {
        return Response.json(
          { success: false, error: 'Code de réinitialisation et nouveau mot de passe sont requis' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return Response.json(
          { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        );
      }

      // Vérifier d'abord le code
      const verifyResult = await AuthService.verifyPasswordResetCode(oobCode);

      if (!verifyResult.success) {
        return Response.json(
          { success: false, error: verifyResult.error || 'Code de réinitialisation invalide' },
          { status: 400 }
        );
      }

      // Confirmer la réinitialisation
      const resetResult = await AuthService.confirmPasswordReset(oobCode, newPassword);

      if (!resetResult.success) {
        return Response.json(
          { success: false, error: resetResult.error },
          { status: 400 }
        );
      }

      return Response.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });
    },
    {
      requireAuth: false,      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 3 },
    }
  );