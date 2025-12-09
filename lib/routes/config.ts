// lib/routes/config.ts

export interface RouteConfig {
  path: string;
  name: string;
  breadcrumbs?: boolean;
  footer?: boolean;
  navigation?: boolean;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEditor?: boolean;
  requireFighterManager?: boolean;
  excludeLayout?: boolean;
  description?: string;
  icon?: string;
  menu?: boolean;
  menuOrder?: number;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface UserRoles {
  isAuthenticated: boolean;
  role?: 'admin' | 'editor' | 'user' | 'moderator' | 'fighter_manager';
  isAdmin?: boolean;
  isEditor?: boolean;
  isFighterManager?: boolean;
  displayName?: string;
  email?: string | null;
}

// Configuration principale des routes
export const ROUTE_CONFIG: RouteConfig[] = [
  // =============================================
  // ROUTES PUBLIQUES
  // =============================================
  {
    path: "/",
    name: "Accueil",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 1,
    description: "Page d'accueil de la plateforme de lutte traditionnelle",
    metadata: {
      title: "Lutte Traditionnelle - Accueil",
      description: "Plateforme de gestion des compétitions de lutte traditionnelle",
      keywords: ["lutte", "traditionnelle", "compétition", "sport"]
    }
  },
  {
    path: "/competitions",
    name: "Compétitions",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 2,
    description: "Liste des compétitions de lutte traditionnelle",
    metadata: {
      title: "Compétitions de Lutte Traditionnelle",
      description: "Découvrez toutes les compétitions de lutte traditionnelle"
    }
  },
  {
    path: "/competitions/[slug]",
    name: "Détail Compétition",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Détails d'une compétition de lutte traditionnelle"
  },
  {
    path: "/fighters",
    name: "Lutteurs",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 3,
    description: "Liste des lutteurs professionnels",
    metadata: {
      title: "Lutteurs - Lutte Traditionnelle",
      description: "Découvrez tous les lutteurs professionnels"
    }
  },
  {
    path: "/fighters/[slug]",
    name: "Profil Lutteur",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Profil détaillé d'un lutteur"
  },
  {
    path: "/regions",
    name: "Régions",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 4,
    description: "Régions participantes aux compétitions",
    metadata: {
      title: "Régions - Lutte Traditionnelle",
      description: "Découvrez les régions participantes"
    }
  },
  {
    path: "/regions/[slug]",
    name: "Détail Région",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Détails d'une région participante"
  },
  {
    path: "/matches",
    name: "Matchs",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 5,
    description: "Calendrier et résultats des matchs",
    metadata: {
      title: "Matchs - Lutte Traditionnelle",
      description: "Calendrier et résultats des matchs de lutte"
    }
  },
  {
    path: "/matches/live",
    name: "Matchs en Direct",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 6,
    description: "Suivez les matchs en direct",
    metadata: {
      title: "Matchs en Direct - Lutte Traditionnelle",
      description: "Suivez en direct les matchs de lutte traditionnelle"
    }
  },
  {
    path: "/matches/[id]",
    name: "Détail Match",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Détails d'un match de lutte"
  },
  {
    path: "/media",
    name: "Médias",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 7,
    description: "Photos, vidéos et articles sur la lutte",
    metadata: {
      title: "Médias - Lutte Traditionnelle",
      description: "Photos, vidéos et articles sur la lutte traditionnelle"
    }
  },
  {
    path: "/articles",
    name: "Articles",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 8,
    description: "Articles et actualités sur la lutte",
    metadata: {
      title: "Articles - Lutte Traditionnelle",
      description: "Articles et actualités sur la lutte traditionnelle"
    }
  },
  {
    path: "/articles/[slug]",
    name: "Détail Article",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Lire un article complet"
  },
  {
    path: "/videos",
    name: "Vidéos",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 9,
    description: "Vidéos des matchs et interviews",
    metadata: {
      title: "Vidéos - Lutte Traditionnelle",
      description: "Vidéos des matchs et interviews des lutteurs"
    }
  },
  {
    path: "/videos/[slug]",
    name: "Détail Vidéo",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Regarder une vidéo"
  },

  // =============================================
  // ROUTES D'AUTHENTIFICATION
  // =============================================
  {
    path: "/auth/login",
    name: "Connexion",
    excludeLayout: true,
    requireAuth: false,
    description: "Connectez-vous à votre compte",
    metadata: {
      title: "Connexion - Lutte Traditionnelle",
      description: "Connectez-vous à votre compte"
    }
  },
  {
    path: "/auth/register",
    name: "Inscription",
    excludeLayout: true,
    requireAuth: false,
    description: "Créez votre compte",
    metadata: {
      title: "Inscription - Lutte Traditionnelle",
      description: "Créez votre compte sur la plateforme"
    }
  },
  {
    path: "/auth/forgot-password",
    name: "Mot de passe oublié",
    excludeLayout: true,
    requireAuth: false,
    description: "Réinitialisez votre mot de passe"
  },
  {
    path: "/auth/reset-password",
    name: "Réinitialisation mot de passe",
    excludeLayout: true,
    requireAuth: false,
    description: "Réinitialisez votre mot de passe"
  },

  // =============================================
  // ROUTES UTILISATEUR (PROTÉGÉES)
  // =============================================
  {
    path: "/profile",
    name: "Mon Profil",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    requireAuth: true,
    menu: true,
    menuOrder: 10,
    description: "Gérez votre profil utilisateur",
    metadata: {
      title: "Mon Profil - Lutte Traditionnelle",
      description: "Gérez votre profil utilisateur"
    }
  },
  {
    path: "/profile/settings",
    name: "Paramètres",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    description: "Modifiez vos paramètres"
  },
  {
    path: "/profile/favorites",
    name: "Favoris",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    requireAuth: true,
    description: "Vos lutteurs et compétitions favoris"
  },
  {
    path: "/profile/notifications",
    name: "Notifications",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    description: "Gérez vos notifications"
  },
  {
    path: "/profile/messages",
    name: "Messages",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    description: "Vos messages privés"
  },

  // =============================================
  // ROUTES ADMINISTRATION
  // =============================================
  {
    path: "/admin",
    name: "Administration",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    menu: true,
    menuOrder: 11,
    icon: "shield",
    description: "Tableau de bord d'administration",
    metadata: {
      title: "Administration - Lutte Traditionnelle",
      description: "Tableau de bord d'administration"
    }
  },
  {
    path: "/admin/competitions",
    name: "Gestion Compétitions",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les compétitions"
  },
  {
    path: "/admin/fighters",
    name: "Gestion Lutteurs",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les lutteurs"
  },
  {
    path: "/admin/regions",
    name: "Gestion Régions",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les régions"
  },
  {
    path: "/admin/matches",
    name: "Gestion Matchs",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les matchs"
  },
  {
    path: "/admin/transfers",
    name: "Gestion Transferts",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les transferts de lutteurs"
  },
  {
    path: "/admin/media",
    name: "Gestion Médias",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les médias"
  },
  {
    path: "/admin/users",
    name: "Gestion Utilisateurs",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Gérez les utilisateurs"
  },
  {
    path: "/admin/stats",
    name: "Statistiques",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Statistiques détaillées"
  },
  {
    path: "/admin/settings",
    name: "Paramètres Admin",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    description: "Paramètres d'administration"
  },

  // =============================================
  // ROUTES ÉDITEURS
  // =============================================
  {
    path: "/editor",
    name: "Édition",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    menu: true,
    menuOrder: 12,
    icon: "edit",
    description: "Zone d'édition de contenu",
    metadata: {
      title: "Édition - Lutte Traditionnelle",
      description: "Zone d'édition de contenu"
    }
  },
  {
    path: "/editor/articles",
    name: "Éditer Articles",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    description: "Éditez les articles"
  },
  {
    path: "/editor/articles/new",
    name: "Nouvel Article",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    description: "Créez un nouvel article"
  },
  {
    path: "/editor/articles/[id]/edit",
    name: "Modifier Article",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    description: "Modifiez un article"
  },
  {
    path: "/editor/videos",
    name: "Éditer Vidéos",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    description: "Éditez les vidéos"
  },

  // =============================================
  // ROUTES GESTIONNAIRES DE LUTTEURS
  // =============================================
  {
    path: "/manager",
    name: "Gestion Lutteurs",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireFighterManager: true,
    menu: true,
    menuOrder: 13,
    icon: "users",
    description: "Gestion des lutteurs",
    metadata: {
      title: "Gestion Lutteurs - Lutte Traditionnelle",
      description: "Gestion des lutteurs"
    }
  },
  {
    path: "/manager/fighters",
    name: "Mes Lutteurs",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireFighterManager: true,
    description: "Gérez vos lutteurs"
  },
  {
    path: "/manager/transfers",
    name: "Transferts",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireFighterManager: true,
    description: "Gérez les transferts"
  },
  {
    path: "/manager/contracts",
    name: "Contrats",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireFighterManager: true,
    description: "Gérez les contrats"
  },

  // =============================================
  // ROUTES SPÉCIALES
  // =============================================
  {
    path: "/about",
    name: "À propos",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 14,
    description: "À propos de la plateforme",
    metadata: {
      title: "À propos - Lutte Traditionnelle",
      description: "Découvrez notre plateforme"
    }
  },
  {
    path: "/contact",
    name: "Contact",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 15,
    description: "Contactez-nous",
    metadata: {
      title: "Contact - Lutte Traditionnelle",
      description: "Contactez notre équipe"
    }
  },
  {
    path: "/help",
    name: "Aide",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    menu: true,
    menuOrder: 16,
    description: "Centre d'aide et FAQ",
    metadata: {
      title: "Aide - Lutte Traditionnelle",
      description: "Centre d'aide et questions fréquentes"
    }
  },
  {
    path: "/privacy",
    name: "Confidentialité",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Politique de confidentialité"
  },
  {
    path: "/terms",
    name: "Conditions",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    description: "Conditions d'utilisation"
  },

  // =============================================
  // ROUTES EXCLUES DU LAYOUT
  // =============================================
  {
    path: "/maintenance",
    name: "Maintenance",
    excludeLayout: true,
    description: "Page de maintenance"
  },
  {
    path: "/404",
    name: "Page non trouvée",
    excludeLayout: true,
    description: "Page d'erreur 404"
  },
  {
    path: "/500",
    name: "Erreur serveur",
    excludeLayout: true,
    description: "Page d'erreur 500"
  },
  {
    path: "/api/",
    name: "API",
    excludeLayout: true
  },
  {
    path: "/_next/",
    name: "Next.js",
    excludeLayout: true
  },
  {
    path: "/favicon.ico",
    name: "Favicon",
    excludeLayout: true
  },
  {
    path: "/sitemap.xml",
    name: "Sitemap",
    excludeLayout: true
  },
  {
    path: "/robots.txt",
    name: "Robots",
    excludeLayout: true
  }
];

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

// Fonction pour matcher les routes dynamiques
export const matchRoute = (pathname: string, pattern: string): boolean => {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      // C'est un paramètre dynamique, on continue
      continue;
    }

    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
};

// Fonction pour trouver la configuration d'une route
export const findRouteConfig = (pathname: string): RouteConfig | undefined => {
  // Chercher d'abord les correspondances exactes
  const exactMatch = ROUTE_CONFIG.find(config => config.path === pathname);
  if (exactMatch) return exactMatch;

  // Chercher les routes dynamiques
  const dynamicMatch = ROUTE_CONFIG.find(config => 
    config.path.includes('[') && 
    config.path.includes(']') && 
    matchRoute(pathname, config.path)
  );

  if (dynamicMatch) return dynamicMatch;

  // Chercher les préfixes de route pour les sous-routes
  const prefixMatch = ROUTE_CONFIG.find(config => 
    pathname.startsWith(config.path + '/') && 
    !config.path.includes('[') &&
    !config.excludeLayout
  );

  return prefixMatch;
};

// Fonction pour vérifier l'accès à une route
// Mettre à jour la fonction canAccessRoute
export const canAccessRoute = (
  pathname: string, 
  user: UserRoles | null
): { 
  hasAccess: boolean; 
  requiresAuth: boolean; 
  requiresAdmin: boolean;
  requiresEditor: boolean;
  requiresFighterManager: boolean;
  redirectTo?: string;
} => {
  const config = findRouteConfig(pathname);
  
  if (!config) {
    return { 
      hasAccess: true, 
      requiresAuth: false, 
      requiresAdmin: false,
      requiresEditor: false,
      requiresFighterManager: false
    };
  }

  const requiresAuth = config.requireAuth || false;
  const requiresAdmin = config.requireAdmin || false;
  const requiresEditor = config.requireEditor || false;
  const requiresFighterManager = config.requireFighterManager || false;

  // Vérification des permissions
  if (requiresAdmin && (!user?.isAuthenticated || !user.isAdmin)) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/auth/login'
    };
  }

  if (requiresEditor && (!user?.isAuthenticated || !['admin', 'editor'].includes(user.role || ''))) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/auth/login'
    };
  }

  if (requiresFighterManager && (!user?.isAuthenticated || !['admin', 'fighter_manager'].includes(user.role || ''))) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/auth/login'
    };
  }

  if (requiresAuth && !user?.isAuthenticated) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/auth/login'
    };
  }

  return { 
    hasAccess: true, 
    requiresAuth, 
    requiresAdmin,
    requiresEditor,
    requiresFighterManager
  };
};

// Fonction pour obtenir les options de layout
export const getLayoutOptions = (pathname: string): Omit<RouteConfig, 'path' | 'name' | 'requireAuth' | 'requireAdmin' | 'requireEditor' | 'requireFighterManager' | 'description' | 'metadata'> => {
  const config = findRouteConfig(pathname);
  
  if (!config) {
    return {
      breadcrumbs: true,
      footer: true,
      navigation: true,
      excludeLayout: false,
      menu: false,
      menuOrder: 99,
      icon: undefined
    };
  }

  const {
    path,
    name,
    requireAuth,
    requireAdmin,
    requireEditor,
    requireFighterManager,
    description,
    metadata,
    ...layoutOptions
  } = config;

  return layoutOptions;
};

// Fonction pour vérifier si une route doit être exclue du layout
export const shouldExcludeLayout = (pathname: string): boolean => {
  const config = findRouteConfig(pathname);
  return config?.excludeLayout || false;
};

// Fonction pour obtenir les métadonnées d'une route
export const getRouteMetadata = (pathname: string) => {
  const config = findRouteConfig(pathname);
  
  if (!config) {
    return {
      title: 'Lutte Traditionnelle',
      description: 'Plateforme de gestion des compétitions de lutte traditionnelle'
    };
  }

  return config.metadata || {
    title: config.name,
    description: config.description
  };
};

// Fonction pour obtenir le menu de navigation
export const getNavigationMenu = (user: UserRoles | null) => {
  return ROUTE_CONFIG
    .filter(route => route.menu && (!route.requireAuth || user?.isAuthenticated))
    .sort((a, b) => (a.menuOrder || 99) - (b.menuOrder || 99))
    .map(route => ({
      path: route.path,
      name: route.name,
      icon: route.icon,
      requiresAuth: route.requireAuth,
      requiresAdmin: route.requireAdmin,
      requiresEditor: route.requireEditor,
      requiresFighterManager: route.requireFighterManager
    }));
};