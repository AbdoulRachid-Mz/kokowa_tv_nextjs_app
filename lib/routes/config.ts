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
  // Nouveaux champs pour le système d'héritage
  isWildcard?: boolean; // Route avec ** ou *
  parentPath?: string; // Route parente pour héritage
  excludeFromParent?: boolean; // Exclure de l'héritage du parent
  styleGroup?: string; // Groupe de style (ex: 'admin', 'auth', 'editor')
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

// Configuration principale avec héritage
export const ROUTE_CONFIG: RouteConfig[] = [
  // =============================================
  // CONFIGURATIONS DE BASE PAR DÉFAUT
  // =============================================
  {
    path: "/**",
    name: "Default",
    breadcrumbs: true,
    footer: true,
    navigation: true,
    excludeLayout: false,
    menu: false,
    isWildcard: true,
    description: "Configuration par défaut"
  },

  // =============================================
  // GROUPE AUTHENTIFICATION (sans layout)
  // =============================================
  {
    path: "/auth/**",
    name: "Authentification",
    excludeLayout: true,
    requireAuth: false,
    styleGroup: "auth",
    isWildcard: true,
    description: "Routes d'authentification"
  },
  
  // Routes auth spécifiques (elles héritent de /auth/**)
  {
    path: "/auth/login",
    name: "Connexion",
    parentPath: "/auth/**",
    description: "Connectez-vous à votre compte",
    metadata: {
      title: "Connexion - Lutte Traditionnelle",
      description: "Connectez-vous à votre compte"
    }
  },
  {
    path: "/auth/register",
    name: "Inscription",
    parentPath: "/auth/**",
    description: "Créez votre compte",
    metadata: {
      title: "Inscription - Lutte Traditionnelle",
      description: "Créez votre compte sur la plateforme"
    }
  },
  {
    path: "/auth/forgot-password",
    name: "Mot de passe oublié",
    parentPath: "/auth/**",
    description: "Réinitialisez votre mot de passe"
  },
  {
    path: "/auth/reset-password",
    name: "Réinitialisation mot de passe",
    parentPath: "/auth/**",
    description: "Réinitialisez votre mot de passe"
  },

  // =============================================
  // GROUPE ADMINISTRATION (sans layout)
  // =============================================
  {
    path: "/ad/**",
    name: "Administration",
    breadcrumbs: false,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireAdmin: true,
    excludeLayout: true,
    styleGroup: "admin",
    isWildcard: true,
    description: "Routes d'administration"
  },
  
  // Routes admin spécifiques (elles héritent de /ad/**)
  {
    path: "/ad",
    name: "Tableau de bord",
    parentPath: "/ad/**",
    menu: false
  },
  {
    path: "/ad/regions",
    name: "Régions",
    parentPath: "/ad/**"
  },
  {
    path: "/ad/coaches",
    name: "Coaches",
    parentPath: "/ad/**"
  },
  {
    path: "/ad/fighters",
    name: "Lutteurs",
    parentPath: "/ad/**"
  },
  // Routes dynamiques admin
  {
    path: "/ad/fighters/[fighterId]",
    name: "Détail Lutteur",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/fighters/[id]/edit",
    name: "Modifier Lutteur",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/competitions",
    name: "competions",
    parentPath: "/ad/**",
    excludeLayout: true,
    isWildcard: true,
  },
  {
    path: "/ad/competitions/create",
    name: "Créer compétition",
    parentPath: "/ad/**",
    excludeLayout: true,
    isWildcard: true,
  },
  {
    path: "/ad/competitions/[competitionId]",
    name: "competions",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/competitions/[competitionId]/editions",
    name: "Editions d'une competition",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/competitions/[competitionId]/editions/new",
    name: "Créer édition",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/competitions/[competitionId]/edit",
    name: "Modifier compétition",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/editions",
    name: "Editions",
    parentPath: "/ad/**",
    excludeLayout: true,
    isWildcard: true,
  },
  {
    path: "/ad/editions/create",
    name: "Créer édition",
    parentPath: "/ad/**",
    excludeLayout: true,
    isWildcard: true,
  },
  {
    path: "/ad/editions/[editionId]",
    name: "Edition",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/editions/[editionId]/edit",
    name: "Modifier édition",
    parentPath: "/ad/**",
    excludeLayout: true,
  },
  {
    path: "/ad/phases/**",
    name: "Gestion des phases",
    description: "Routes de gestion des phases",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/phases/[phaseId]",
    name: "Gestion des phases",
    description: "Routes de gestion des phases",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/phase-groups/[groupId]",
    name: "Gestion des groupes",
    description: "Routes de gestion des groupes",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/sub-groups/**",
    name: "Gestion des rencontres",
    description: "Routes de gestion des rencontres",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/sub-groups/[subGroupId]",
    name: "Gestion des rencontres",
    description: "Routes de gestion des rencontres",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  {
    path: "/ad/sub-groups/[subGroupId]/**",
    name: "Gestion des rencontres",
    description: "Routes de gestion des rencontres",
    parentPath: "/ad/**",
    excludeLayout: true
  },
  // Plus besoin de définir chaque sous-route individuellement

  // =============================================
  // GROUPE ÉDITEUR
  // =============================================
  {
    path: "/editor/**",
    name: "Édition",
    breadcrumbs: true,
    footer: false,
    navigation: false,
    requireAuth: true,
    requireEditor: true,
    styleGroup: "editor",
    isWildcard: true,
    description: "Zone d'édition de contenu"
  },
  
  // Routes éditeur spécifiques
  {
    path: "/editor/articles/new",
    name: "Nouvel Article",
    parentPath: "/editor/**",
    description: "Créez un nouvel article"
  },
  {
    path: "/editor/articles/[id]/edit",
    name: "Modifier Article",
    parentPath: "/editor/**",
    description: "Modifiez un article"
  },

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
  
  // Routes dynamiques avec wildcard *
  {
    path: "/competitions/*",
    name: "Détails Compétition",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    isWildcard: true,
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
    path: "/fighters/*",
    name: "Profil Lutteur",
    breadcrumbs: true,
    footer: true,
    navigation: false,
    isWildcard: true,
    description: "Profil détaillé d'un lutteur"
  },

  // =============================================
  // ROUTES EXCLUES DU LAYOUT (spécifiques)
  // =============================================
  {
    path: "/maintenance",
    name: "Maintenance",
    excludeLayout: true
  },
  {
    path: "/404",
    name: "Page non trouvée",
    excludeLayout: true
  },
  {
    path: "/500",
    name: "Erreur serveur",
    excludeLayout: true
  },
];

// =============================================
// FONCTIONS UTILITAIRES AVANCÉES
// =============================================

// Fonction pour parser un pattern de route avec wildcards
const parseRoutePattern = (pattern: string): RegExp => {
  // Remplacer ** par (.*) pour n'importe quel chemin
  let regexPattern = pattern.replace(/\*\*/g, '(.*)');
  
  // Remplacer * par ([^/]+) pour un segment
  regexPattern = regexPattern.replace(/\*/g, '([^/]+)');
  
  // Remplacer [param] par ([^/]+) pour les paramètres dynamiques
  regexPattern = regexPattern.replace(/\[[^\]]+\]/g, '([^/]+)');
  
  // Échapper les slashs pour regex
  regexPattern = regexPattern.replace(/\//g, '\\/');
  
  // Ajouter le début et la fin
  regexPattern = '^' + regexPattern + '$';
  
  return new RegExp(regexPattern);
};

// Fonction pour vérifier si un chemin correspond à un pattern
const matchesPattern = (pathname: string, pattern: string): boolean => {
  if (pattern === pathname) return true;
  
  const regex = parseRoutePattern(pattern);
  return regex.test(pathname);
};

// Fonction pour trouver toutes les configurations applicables (avec héritage)
export const findApplicableConfigs = (pathname: string): RouteConfig[] => {
  const applicableConfigs: RouteConfig[] = [];
  
  // Trouver toutes les configurations qui matchent
  for (const config of ROUTE_CONFIG) {
    if (matchesPattern(pathname, config.path)) {
      applicableConfigs.push(config);
    }
  }
  
  // Si aucune config spécifique, utiliser la config par défaut
  if (applicableConfigs.length === 0) {
    const defaultConfig = ROUTE_CONFIG.find(c => c.path === "/**");
    if (defaultConfig) applicableConfigs.push(defaultConfig);
  }
  
  // Trier par spécificité (le plus spécifique en premier)
  applicableConfigs.sort((a, b) => {
    // Compter les wildcards et paramètres
    const aScore = (a.path.match(/\[|\*+/g) || []).length;
    const bScore = (b.path.match(/\[|\*+/g) || []).length;
    
    // Moins de wildcards = plus spécifique
    if (aScore !== bScore) return aScore - bScore;
    
    // Sinon, plus long = plus spécifique
    return b.path.length - a.path.length;
  });
  
  return applicableConfigs;
};

// Fonction pour fusionner les configurations avec héritage
export const mergeRouteConfigs = (configs: RouteConfig[]): RouteConfig => {
  if (configs.length === 0) {
    // Retourner une config par défaut
    return {
      path: "",
      name: "Unknown",
      breadcrumbs: true,
      footer: true,
      navigation: true,
      excludeLayout: false,
      menu: false
    };
  }
  
  // Commencer avec la config la plus spécifique
  const merged: RouteConfig = { ...configs[0] };
  
  // Appliquer l'héritage des configs parentes
  for (let i = 1; i < configs.length; i++) {
    const parent = configs[i];
    
    // Fusionner les propriétés (sauf celles déjà définies)
    Object.keys(parent).forEach(key => {
      if (key !== 'path' && key !== 'parentPath' && 
          key !== 'isWildcard' && key !== 'styleGroup' &&
          (merged[key as keyof RouteConfig] === undefined || 
           merged[key as keyof RouteConfig] === null ||
           merged[key as keyof RouteConfig] === false)) {
        (merged as any)[key] = parent[key as keyof RouteConfig];
      }
    });
  }
  
  // Vérifier s'il y a un parentPath explicite
  if (merged.parentPath) {
    const parentConfig = ROUTE_CONFIG.find(c => c.path === merged.parentPath);
    if (parentConfig && !merged.excludeFromParent) {
      // Fusionner avec le parent explicite
      Object.keys(parentConfig).forEach(key => {
// lib/routes/config.ts
        if (key !== 'path' && key !== 'parentPath' && 
            key !== 'isWildcard' && key !== 'styleGroup' &&
            (merged[key as keyof RouteConfig] === undefined || 
             merged[key as keyof RouteConfig] === null ||
             merged[key as keyof RouteConfig] === false)) {
          (merged as any)[key] = parentConfig[key as keyof RouteConfig];
        }
      });
    }
  }
  
  return merged;
};

// Fonction pour trouver la configuration finale d'une route
export const findRouteConfig = (pathname: string): RouteConfig => {
  const applicableConfigs = findApplicableConfigs(pathname);
  return mergeRouteConfigs(applicableConfigs);
};

// Fonction pour vérifier les permissions
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
      redirectTo: '/unauthorized'
    };
  }

  if (requiresEditor && (!user?.isAuthenticated || user.role !== 'editor')) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/unauthorized'
    };
  }

  if (requiresFighterManager && (!user?.isAuthenticated || user.role !== 'fighter_manager')) {
    return { 
      hasAccess: false, 
      requiresAuth, 
      requiresAdmin,
      requiresEditor,
      requiresFighterManager,
      redirectTo: '/unauthorized'
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
export const getLayoutOptions = (pathname: string): Omit<RouteConfig, 'path' | 'name' | 'requireAuth' | 'requireAdmin' | 'requireEditor' | 'requireFighterManager' | 'description' | 'metadata' | 'parentPath' | 'isWildcard' | 'styleGroup' | 'excludeFromParent'> => {
  const config = findRouteConfig(pathname);
  
  const {
    path,
    name,
    requireAuth,
    requireAdmin,
    requireEditor,
    requireFighterManager,
    description,
    metadata,
    parentPath,
    isWildcard,
    styleGroup,
    excludeFromParent,
    ...layoutOptions
  } = config;

  return layoutOptions;
};

// Fonction pour vérifier si une route doit être exclue du layout
export const shouldExcludeLayout = (pathname: string): boolean => {
  const config = findRouteConfig(pathname);
  return config.excludeLayout || false;
};

// Fonction pour obtenir le groupe de style d'une route
export const getRouteStyleGroup = (pathname: string): string | undefined => {
  const config = findRouteConfig(pathname);
  return config.styleGroup;
};

// Fonction pour vérifier si une route contient un terme particulier
export const routeContainsTerm = (pathname: string, terms: string[]): boolean => {
  return terms.some(term => pathname.includes(`/${term}`) || pathname.endsWith(`/${term}`));
};

// Fonction pour obtenir les métadonnées d'une route
export const getRouteMetadata = (pathname: string) => {
  const config = findRouteConfig(pathname);
  
  return config.metadata || {
    title: config.name,
    description: config.description
  };
};

// Fonction utilitaire pour obtenir toutes les routes d'un groupe
export const getRoutesByGroup = (group: string): RouteConfig[] => {
  return ROUTE_CONFIG.filter(config => 
    config.styleGroup === group || 
    (config.parentPath && ROUTE_CONFIG.find(p => p.path === config.parentPath)?.styleGroup === group)
  );
};

// Fonction pour obtenir le breadcrumb d'une route
export const getBreadcrumbForRoute = (pathname: string): Array<{name: string, path: string}> => {
  const parts = pathname.split('/').filter(p => p);
  const breadcrumb = [{ name: 'Accueil', path: '/' }];
  
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    const config = findRouteConfig(currentPath);
    if (config.name && config.name !== 'Unknown') {
      breadcrumb.push({ name: config.name, path: currentPath });
    }
  }
  
  return breadcrumb;
};