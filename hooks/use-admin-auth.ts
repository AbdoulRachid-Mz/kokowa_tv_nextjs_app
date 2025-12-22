// hooks/use-admin-auth.ts
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminAuth(requiredRole?: string) {
  const { user, loading, hasRole } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Vérifier si l'utilisateur est connecté
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Vérifier les rôles si nécessaire
      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/unauthorized');
        return;
      }

      // Vérifier les permissions spécifiques pour l'admin
      const allowedRoles = ['admin', 'editor', 'moderator', 'fighter_manager'];
      if (!allowedRoles.some(role => hasRole(role))) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, hasRole, requiredRole, router]);

  return {
    user,
    loading,
    hasRole,
    canManageCompetitions: hasRole('admin') || hasRole('editor'),
    canManageFighters: hasRole('admin') || hasRole('fighter_manager'),
    canManageUsers: hasRole('admin'),
  };
}