// components/layout/main-layout.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from "react";
import { useAuthContext } from "@/contexts/auth-context";
// import { useAppSettings } from "@/contexts/app-settings-context";
import { Header } from "./header";
// import { Footer } from "./footer";
// import { MaintenanceMode } from "./maintenance-mode";
import { LoadingScreen } from "./loading-screen";
import {
  findRouteConfig,
  canAccessRoute,
  shouldExcludeLayout,
  getLayoutOptions,
  getRouteMetadata,
} from "@/lib/routes/config";
// import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useAppSettings } from "@/contexts/app-settings-context";
import MaintenanceMode from "./maintenance-mode";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const {
    settings,
    loading: settingsLoading,
    isMaintenanceMode,
  } = useAppSettings();

  // Configuration actuelle de la route
  const currentRoute = findRouteConfig(pathname);

  // Vérifier si le layout doit être exclu
  const excludeLayout = shouldExcludeLayout(pathname);

  // Obtenir les options de layout
  const layoutOptions = getLayoutOptions(pathname);

  // Mode maintenance
  if (isMaintenanceMode && pathname !== "/maintenance") {
    return <MaintenanceMode />;
  }

  // Loading state
  if (authLoading || settingsLoading) {
    return <LoadingScreen />;
  }

  // Vérifier l'accès à la route
  if (pathname) {
    const accessCheck = canAccessRoute(
      pathname,
      user
        ? {
            isAuthenticated: !!user,
            role: user.userDocument?.role,
            isAdmin: user.userDocument?.role === "admin",
            isEditor: user.userDocument?.role === "editor",
            isFighterManager: user.userDocument?.role === "fighter_manager",
          }
        : null
    );

    if (!accessCheck.hasAccess && accessCheck.redirectTo) {
      router.push(accessCheck.redirectTo);
      return <LoadingScreen />;
    }
  }

  // Si le layout doit être exclu
  if (excludeLayout) {
    return (
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* En-tête */}
        <Header
          showNavigation={layoutOptions.navigation || false}
          currentRoute={currentRoute}
          user={
            user
              ? {
                  isAuthenticated: true,
                  role: user.userDocument?.role,
                  displayName:
                    user.userDocument?.first_name ||
                    user.displayName ||
                    user.email ||
                    undefined,
                  email: user.email,
                }
              : null
          }
        />

        {/* Breadcrumbs avec shadcn */}
        {layoutOptions.breadcrumbs && currentRoute && (
          <div className="border-b bg-muted/40">
            <div className="container mx-auto px-4 py-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentRoute.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        )}

        {/* Contenu principal avec animation Framer Motion */}
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
            className="flex-1 container mx-auto px-4 py-6"
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
