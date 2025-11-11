"use client";

import type React from "react";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
} from "@/components/dashboard/enhanced-dashboard";
// import { useUser } from "@/contexts/user-context"
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
} from "@/constants/admin-items";
// === LAYOUT ===

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <PageSkeleton type="dashboard" />;
  }

  const AdminSidebar = (
    <div className="flex flex-col h-full bg-secondary text-white">
      <SidebarHeader
        title="Administration"
        user={{
          username: user?.displayName || "user",
          level: user?.userDocument?.role || "user",
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble">
          {overviewItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Zones & Régions">
          {regionItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Lutteurs">
          {fighterItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Arbitres">
          {refereeItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Compétitions">
          {competitionItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Contenu & Médias">
          {contentItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Communication">
          {communicationItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Système">
          {systemItems.map((item) => (
            <SidebarItem key={item.title} {...item} />
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
      title="Administration"
      description="Tableau de bord du système de lutte"
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
