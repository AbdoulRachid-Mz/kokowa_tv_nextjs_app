// components/layout/main-layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Header } from "./header";
import { Footer } from "./footer";
import { MaintenanceMode } from "./maintenance-mode";
import { LoadingScreen } from "./loading-screen";
import {
  findRouteConfig,
  canAccessRoute,
  shouldExcludeLayout,
  getLayoutOptions,
  getRouteStyleGroup,
  routeContainsTerm,
  UserRoles,
} from "@/lib/routes/config";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, userDocument } = useAuthContext();
  const {
    settings,
    loading: settingsLoading,
    isMaintenanceMode,
  } = useAppSettings();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Préparer l'objet user pour les vérifications de permission
  const userRoles: UserRoles | null = user
    ? {
        isAuthenticated: true,
        role: userDocument?.role,
        isAdmin: userDocument?.role === "admin",
        isEditor: userDocument?.role === "editor",
        isFighterManager: userDocument?.role === "fighter_manager",
        displayName: user.displayName ?? undefined,
        email: user.email ?? undefined,
      }
    : {
        isAuthenticated: false,
        role: undefined,
        isAdmin: false,
        isEditor: false,
        isFighterManager: false,
      };

  // Obtenir le groupe de style de la route
  const styleGroup = getRouteStyleGroup(pathname);

  // Vérifier si c'est une route de création/modification
  const isCrudRoute = routeContainsTerm(pathname, [
    "create",
    "new",
    "edit",
    "update",
    "add",
  ]);

  // Vérifier si le layout doit être exclu
  const excludeLayout = shouldExcludeLayout(pathname) || isCrudRoute;

  // Obtenir les options de layout
  const layoutOptions = getLayoutOptions(pathname);

  // Vérifier l'accès à la route
  useEffect(() => {
    if (!authLoading && !settingsLoading && pathname) {
      setIsCheckingAccess(true);

      // Ne pas vérifier l'accès pour les routes d'authentification
      if (pathname.startsWith("/auth/")) {
        setIsCheckingAccess(false);
        return;
      }

      const accessCheck = canAccessRoute(pathname, userRoles);

      if (!accessCheck.hasAccess && accessCheck.redirectTo) {
        setShouldRedirect(true);
        setRedirectPath(accessCheck.redirectTo);
      } else {
        setShouldRedirect(false);
        setRedirectPath(null);
      }

      setIsCheckingAccess(false);
    }
  }, [authLoading, settingsLoading, pathname, userRoles]);

  // Effectuer la redirection si nécessaire
  useEffect(() => {
    if (shouldRedirect && redirectPath && !authLoading) {
      router.push(redirectPath);
    }
  }, [shouldRedirect, redirectPath, authLoading, router]);

  // Mode maintenance
  if (isMaintenanceMode && pathname !== "/maintenance") {
    return <MaintenanceMode />;
  }

  // Loading state
  if (authLoading || settingsLoading || isCheckingAccess) {
    return <LoadingScreen />;
  }

  // Si on doit rediriger
  if (shouldRedirect) {
    return <LoadingScreen />;
  }

  // Si le layout doit être exclu
  if (excludeLayout) {
    return (
      <TooltipProvider>
        {/* Appliquer un style spécifique au groupe si nécessaire */}
        <div className={styleGroup ? `${styleGroup}-layout` : ""}>
          {children}
          <Toaster />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* En-tête */}
        <Header
          showNavigation={layoutOptions.navigation || false}
          user={userRoles}
        />

        {/* Contenu principal */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={`flex-1 container mx-auto px-4 py-6 ${
              styleGroup ? `${styleGroup}-content` : ""
            }`}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Pied de page */}
        {layoutOptions.footer && <Footer />}

        {/* Toaster pour les notifications */}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
