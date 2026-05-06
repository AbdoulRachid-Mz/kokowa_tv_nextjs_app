// components/layout/header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Search,
  Bell,
  User,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRoles } from "@/lib/routes/config";
import { getHeaderMenuGroups, getRouteIcon } from "@/lib/routes/header-config";
import { useScreenSize } from "@/hooks/use-screen";

interface HeaderProps {
  showNavigation?: boolean;
  user: UserRoles | null;
}

export function Header({ showNavigation = true, user }: HeaderProps) {
  const pathname = usePathname();
  const { isLargeScreen, isLargerThan } = useScreenSize();
  const isMobile = !isLargerThan(1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuthContext();

  // Obtenir les groupes de menu selon le rôle de l'utilisateur
  const menuGroups = getHeaderMenuGroups(user);

  // Rendu d'un item de menu
  const MenuItem = ({ item }: { item: any }) => {
    const IconComponent = getRouteIcon(item.url) || item.icon;

    return (
      <NavigationMenuLink asChild>
        <Link
          href={item.url}
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors",
            pathname === item.url && "bg-accent"
          )}
        >
          {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{item.title}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            )}
          </div>
        </Link>
      </NavigationMenuLink>
    );
  };

  // Navigation desktop avec menu groupé
  const DesktopNavigation = () => (
    <NavigationMenu viewport={!isLargeScreen}>
      <NavigationMenuList className="flex-wrap">
        {menuGroups.map((group) => (
          <NavigationMenuItem key={group.title}>
            <NavigationMenuTrigger className="gap-1">
              {group.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid grid-cols-2 gap-1 p-2 w-[360px]">
                {group.items.map((item) => (
                  <div key={item.url} className="min-w-0">
                    <MenuItem item={item} />
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );

  // Navigation mobile simplifiée
  const MobileNavigation = () => (
    <div className="md:hidden border-t py-2">
      <div className="space-y-2">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <Typography variant="body-sm" weight="medium" className="px-3">
              {group.title}
            </Typography>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Button
                    key={item.url}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                      {isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et bouton menu mobile */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Typography
                  variant="h4"
                  weight="bold"
                  className="text-primary-foreground text-sm"
                >
                  K-Tv
                </Typography>
              </div>
              <Typography
                variant="h4"
                weight="bold"
                className="hidden sm:block"
              >
                KOKOWA TV
              </Typography>
            </Link>
          </div>

          {/* Navigation desktop */}
          {showNavigation && !isMobile && <DesktopNavigation />}

          {/* Actions utilisateur */}
          <div className="flex items-center gap-2">
            {/* Barre de recherche */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Menu utilisateur */}
            {user?.isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <Typography variant="body-sm" weight="medium">
                        {user.displayName || user.email}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        {user.role || "Utilisateur"}
                      </Typography>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>

                  {user.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/ad">
                          <Shield className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/sign-in">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/sign-up">Inscription</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation mobile */}
        {isMobileMenuOpen && showNavigation && <MobileNavigation />}
      </div>
    </header>
  );
}
