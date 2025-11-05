// components/admin/admin-sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  // SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarContainer, SidebarFooter, SidebarGroup, SidebarItem } from "@/components/dashboard/enhanced-dashboard";
import { 
  Settings
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { menuItems } from "@/constants/admin-items";

export function AdminSidebar() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  return (
    <Sidebar variant="floating" className="border-0">
      <SidebarContainer sidebarBgType="gradient">
        <SidebarHeader
          title="Lutte Pro"
          // subtitle="Plateforme de gestion"
          // user={{
          //   username: user?.displayName || "Admin",
          //   level: "Expert",
          // }}
          // sidebarBgType="gradient"
        />
        
        <SidebarContent className="flex-1 px-3 py-4">
          <SidebarGroup label="Navigation" sidebarBgType="gradient">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.path}
                title={item.label}
                url={item.path}
                icon={item.icon}
                // badge={item.badge}
                description={item.description}
                isActive={pathname === item.path || pathname.startsWith(item.path + "/")}
                sidebarBgType="gradient"
              />
            ))}
          </SidebarGroup>

          <SidebarGroup label="Configuration" sidebarBgType="gradient">
            <SidebarItem
              title="Paramètres"
              url="/admin/settings"
              icon={Settings}
              description="Configuration système"
              isActive={pathname === "/admin/settings"}
              sidebarBgType="gradient"
            />
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter
          user={{
            username: user?.displayName || "Administrateur",
            profileImage: user?.photoURL || undefined,
            status: "online",
          }}
          sidebarBgType="gradient"
        />
      </SidebarContainer>
    </Sidebar>
  );
}