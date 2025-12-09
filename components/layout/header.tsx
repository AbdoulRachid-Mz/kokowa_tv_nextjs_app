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
  Trophy, 
  Search, 
  Bell, 
  User, 
  Home,
  Swords,
  MapPin,
  Calendar,
  Newspaper,
  Video,
  Shield,
  Edit,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { getNavigationMenu, RouteConfig } from "@/lib/routes/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {UserRoles} from "@/lib/routes/config"

interface HeaderProps {
  showNavigation?: boolean;
  currentRoute?: RouteConfig;
 user: UserRoles | null;
}

export function Header({ showNavigation = true, currentRoute, user }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Obtenir le menu de navigation
  const navigationItems = getNavigationMenu(user);

  // Icônes pour les éléments du menu
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'shield': return <Shield className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      default: return null;
    }
  };

  // Icônes pour les routes spécifiques
  const getRouteIcon = (path: string) => {
    switch (path) {
      case '/': return <Home className="h-4 w-4" />;
      case '/competitions': return <Trophy className="h-4 w-4" />;
      case '/fighters': return <Swords className="h-4 w-4" />;
      case '/regions': return <MapPin className="h-4 w-4" />;
      case '/matches': return <Calendar className="h-4 w-4" />;
      case '/articles': return <Newspaper className="h-4 w-4" />;
      case '/videos': return <Video className="h-4 w-4" />;
      case '/admin': return <Shield className="h-4 w-4" />;
      case '/editor': return <Edit className="h-4 w-4" />;
      case '/manager': return <Users className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et nom */}
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
                <Swords className="h-5 w-5 text-primary-foreground" />
              </div>
              <Typography variant="h4" weight="bold" className="hidden sm:block">
                Lutte Traditionnelle
              </Typography>
            </Link>
          </div>

          {/* Navigation desktop */}
          {showNavigation && (
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.path || 
                  (item.path !== '/' && pathname.startsWith(item.path));
                
                return (
                  <Button
                    key={item.path}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-secondary"
                    )}
                  >
                    <Link href={item.path}>
                      {getRouteIcon(item.path)}
                      {item.name}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          )}

          {/* Actions à droite */}
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
                        {user.role || 'Utilisateur'}
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
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {['admin', 'editor'].includes(user.role || '') && (
                    <DropdownMenuItem asChild>
                      <Link href="/editor">
                        <Edit className="mr-2 h-4 w-4" />
                        Édition
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {['admin', 'fighter_manager'].includes(user.role || '') && (
                    <DropdownMenuItem asChild>
                      <Link href="/manager">
                        <Users className="mr-2 h-4 w-4" />
                        Gestion Lutteurs
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">
                    Connexion
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">
                    Inscription
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation mobile */}
        {isMobileMenuOpen && showNavigation && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.path || 
                  (item.path !== '/' && pathname.startsWith(item.path));
                
                return (
                  <Button
                    key={item.path}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href={item.path}>
                      {getRouteIcon(item.path)}
                      {item.name}
                      {isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}