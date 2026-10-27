"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
} from "@/components/dashboard/enhanced-dashboard";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import {
  overviewItems,
  regionItems,
  fighterItems,
  refereeItems,
  competitionItems,
  contentItems,
  communicationItems,
  systemItems,
  test,
} from "@/constants/admin-items";
import { useActiveRoute } from "@/hooks/use-active-route";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userDocument, loading, isAdmin, isEditor, isModerator, isFighterManager } = useAuthContext();
  const { isActive } = useActiveRoute();
  const router = useRouter();

  const allowedRoles = ["admin", "editor", "moderator", "fighter_manager"];
  const userRole = userDocument?.role || user?.userDocument?.role;
  const isAuthorized = Boolean(
    (userRole && allowedRoles.includes(userRole)) ||
    isAdmin || isEditor || isModerator || isFighterManager
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login?redirect=/ad");
      } else if (!isAuthorized) {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, isAuthorized, router]);

  if (loading || !isAuthorized) {
    return <PageSkeleton type="dashboard" />;
  }

  // Récupérer tous les items pour le header
  const allItems = [
    ...overviewItems,
    ...regionItems,
    ...fighterItems,
    ...refereeItems,
    ...competitionItems,
    ...contentItems,
    ...communicationItems,
    ...test,
    ...systemItems,
  ];

  // Trouver l'item actif pour le titre du header
  const activeItem = allItems.find(item => item.url && isActive(item.url, false));
  const pageTitle = activeItem?.title || "Administration";

  const AdminSidebar = (
    <div className="flex flex-col h-full bg-secondary text-white">
      <SidebarHeader
        title="Administration"
        user={{
          username: user?.displayName || userDocument?.username || "user",
          level: userRole || "user",
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble">
          {overviewItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Zones & Régions">
          {regionItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Lutteurs">
          {fighterItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Arbitres">
          {refereeItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Compétitions">
          {competitionItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Contenu & Médias">
          {contentItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Communication">
          {communicationItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Système">
          {systemItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
            />
          ))}
        </SidebarGroup>
      </div>

      <SidebarFooter
        user={{
          username: user?.displayName || "user",
          profileImage: user?.photoURL || undefined,
          status: "online",
        }}
      />
    </div>
  );

  const AdminHeader = (
    <DashboardHeader
      title={pageTitle}
      description={`Administration - ${activeItem?.description || "Tableau de bord du système de lutte"}`}
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard
      sidebar={AdminSidebar}
      header={AdminHeader}
      sidebarBgType="gradient"
    >
      {children}
    </EnhancedDashboard>
  );
}
