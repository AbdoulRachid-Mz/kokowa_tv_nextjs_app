// lib/config/header-config.ts
import {
  BarChart3, Globe, Users, Award, Repeat, Shield, Trophy, Calendar,
  Activity, Swords, Newspaper, FileImage, Video, MessageSquare, Bell,
  Database, Settings, UserCog, Home, Trophy as TrophyIcon, Swords as SwordsIcon,
  MapPin, CalendarDays, Film, FileText, HelpCircle, Info, Mail
} from "lucide-react";

// Configuration des menus de navigation groupés
export interface HeaderMenuItem {
  title: string;
  url: string;
  icon?: React.ComponentType<any>;
  description?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresEditor?: boolean;
  requiresFighterManager?: boolean;
}

export interface HeaderMenuGroup {
  title: string;
  items: HeaderMenuItem[];
  icon?: React.ComponentType<any>;
}

// Menu principal pour les visiteurs non connectés
export const publicMenuGroups: HeaderMenuGroup[] = [
  {
    title: "Accueil",
    items: [
      { title: "Accueil", url: "/", icon: Home, description: "Page d'accueil" },
      { title: "À propos", url: "/about", icon: Info, description: "À propos de nous" },
      { title: "Contact", url: "/contact", icon: Mail, description: "Contactez-nous" },
      { title: "Aide", url: "/help", icon: HelpCircle, description: "Centre d'aide" },
    ]
  },
  {
    title: "Compétitions",
    items: [
      { title: "Compétitions", url: "/competitions", icon: TrophyIcon, description: "Toutes les compétitions" },
      { title: "Editions", url: "/editions", icon: TrophyIcon, description: "Toutes les éditions" },
      { title: "Matchs en direct", url: "/matches/live", icon: CalendarDays, description: "Matchs en direct" },
      { title: "Calendrier", url: "/matches", icon: Calendar, description: "Calendrier des matchs" },
    ]
  },
  {
    title: "Lutteurs & Régions",
    items: [
      { title: "Lutteurs", url: "/fighters", icon: SwordsIcon, description: "Liste des lutteurs" },
      { title: "Régions", url: "/regions", icon: MapPin, description: "Régions participantes" },
    ]
  },
  {
    title: "Médias",
    items: [
      { title: "Articles", url: "/articles", icon: FileText, description: "Actualités et articles" },
      { title: "Vidéos", url: "/videos", icon: Film, description: "Vidéos et interviews" },
      { title: "Médias", url: "/media", icon: FileImage, description: "Photos et galeries" },
    ]
  }
];

// Menu pour utilisateurs connectés (ajout du profil)
export const userMenuGroups: HeaderMenuGroup[] = [
  ...publicMenuGroups,
  {
    title: "Mon Compte",
    items: [
      { title: "Mon Profil", url: "/profile", icon: Users, description: "Gérer mon profil", requiresAuth: true },
      { title: "Favoris", url: "/profile/favorites", icon: Award, description: "Mes favoris", requiresAuth: true },
      { title: "Messages", url: "/profile/messages", icon: MessageSquare, description: "Mes messages", requiresAuth: true },
      { title: "Notifications", url: "/profile/notifications", icon: Bell, description: "Mes notifications", requiresAuth: true },
    ]
  }
];

// Configuration pour le menu admin (utilisée dans le dashboard admin, pas dans le header public)
export const adminMenuGroups: HeaderMenuGroup[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { title: "Tableau de bord", url: "/ad", icon: BarChart3, description: "Vue d'ensemble générale", requiresAdmin: true },
    ]
  },
  {
    title: "Régions & Personnes",
    items: [
      { title: "Régions", url: "/ad/regions", icon: Globe, description: "Gestion des régions", requiresAdmin: true },
      { title: "Coaches", url: "/ad/coaches", icon: UserCog, description: "Gestion des coaches", requiresAdmin: true },
      { title: "Arbitres", url: "/ad/referees", icon: Shield, description: "Gestion des arbitres", requiresAdmin: true },
    ]
  },
  {
    title: "Lutteurs",
    items: [
      { title: "Lutteurs", url: "/ad/fighters", icon: Users, description: "Gestion des lutteurs", requiresAdmin: true },
      { title: "Palmarès", url: "/ad/fighters/achievements", icon: Award, description: "Titres et distinctions", requiresAdmin: true },
      { title: "Transferts", url: "/ad/fighters/transfers", icon: Repeat, description: "Transferts entre régions", requiresAdmin: true },
    ]
  },
  {
    title: "Compétitions",
    items: [
      { title: "Compétitions", url: "/ad/competitions", icon: Trophy, description: "Gérer les compétitions", requiresAdmin: true },
      { title: "Éditions", url: "/ad/editions", icon: Calendar, description: "Éditions et saisons", requiresAdmin: true },
      { title: "Phases", url: "/ad/phases", icon: Activity, description: "Phases et groupes", requiresAdmin: true },
      { title: "Matchs", url: "/ad/matches", icon: Swords, description: "Matchs et résultats", requiresAdmin: true },
    ]
  },
  {
    title: "Contenu",
    items: [
      { title: "Articles", url: "/ad/articles", icon: Newspaper, description: "Actualités et articles", requiresAdmin: true },
      { title: "Médias", url: "/ad/media", icon: FileImage, description: "Photos et fichiers", requiresAdmin: true },
      { title: "Vidéos", url: "/ad/videos", icon: Video, description: "Vidéos et diffusions", requiresAdmin: true },
    ]
  },
  {
    title: "Communication",
    items: [
      { title: "Messages", url: "/ad/messages", icon: MessageSquare, description: "Messagerie et commentaires", requiresAdmin: true },
      { title: "Notifications", url: "/ad/notifications", icon: Bell, description: "Alertes et notifications", requiresAdmin: true },
    ]
  },
  {
    title: "Système",
    items: [
      { title: "Utilisateurs", url: "/ad/users", icon: Users, description: "Gestion des utilisateurs", requiresAdmin: true },
      { title: "Base de données", url: "/ad/database", icon: Database, description: "Surveillance de la DB", requiresAdmin: true },
      { title: "Paramètres", url: "/ad/settings", icon: Settings, description: "Configuration système", requiresAdmin: true },
    ]
  }
];

// Fonction pour obtenir les menus selon le rôle de l'utilisateur
export const getHeaderMenuGroups = (user: any): HeaderMenuGroup[] => {
  if (!user?.isAuthenticated) {
    return publicMenuGroups;
  }
  
  return userMenuGroups;
};

// Fonction pour obtenir les menus admin (pour le dashboard admin)
export const getAdminMenuGroups = (): HeaderMenuGroup[] => {
  return adminMenuGroups;
};

// Configuration des icônes pour les routes
export const getRouteIcon = (path: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    '/': Home,
    '/competitions': TrophyIcon,
    '/fighters': SwordsIcon,
    '/regions': MapPin,
    '/matches': Calendar,
    '/matches/live': CalendarDays,
    '/media': FileImage,
    '/articles': FileText,
    '/videos': Film,
    '/about': Info,
    '/contact': Mail,
    '/help': HelpCircle,
    '/profile': Users,
    '/profile/favorites': Award,
    '/profile/messages': MessageSquare,
    '/profile/notifications': Bell,
    '/ad': BarChart3,
    '/ad/regions': Globe,
    '/ad/coaches': UserCog,
    '/ad/fighters': Users,
    '/ad/fighters/achievements': Award,
    '/ad/fighters/transfers': Repeat,
    '/ad/referees': Shield,
    '/ad/competitions': Trophy,
    '/ad/editions': Calendar,
    '/ad/phases': Activity,
    '/ad/matches': Swords,
    '/ad/articles': Newspaper,
    '/ad/media': FileImage,
    '/ad/videos': Video,
    '/ad/messages': MessageSquare,
    '/ad/notifications': Bell,
    '/ad/database': Database,
    '/ad/settings': Settings,
    '/ad/users': Users,
  };
  
  return iconMap[path];
};