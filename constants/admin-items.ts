import {
  BarChart3,
  Trophy,
  Calendar,
  Users,
  MapPin,
  Swords,
  Shield,
  MessageSquare,
  Newspaper,
  Video,
  FileImage,
  Repeat,
  Award,
  Globe,
  Settings,
  UserCog,
  Database,
  Layers,
  Activity,
  Bell,
} from "lucide-react";

export const menuItems = [
  {
    id: "dashboard",
    label: "Tableau de Bord",
    path: "/admin",
    icon: BarChart3,
    description: "Vue d'ensemble",
  },
  // Utilisateurs
  {
    id: "users",
    label: "Utilisateurs",
    path: "/admin/users",
    icon: UserCog,
    description: "Gérer les comptes utilisateurs",
  },
  // Régions et Villes
  {
    id: "regions",
    label: "Régions",
    path: "/ad/regions",
    icon: Globe,
    description: "Gérer les régions et leurs statistiques",
  },
  {
    id: "coaches",
    label: "Coaches",
    path: "/ad/coaches",
    icon: MapPin,
    description: "Gérer les coaches par région",
  },
  // Lutteurs
  {
    id: "fighters",
    label: "Lutteurs",
    path: "/ad/fighters",
    icon: Users,
    description: "Gérer les lutteurs",
  },
  {
    id: "fighter-achievements",
    label: "Palmarès",
    path: "/ad/fighters/achievements",
    icon: Award,
    description: "Gérer les distinctions et titres des lutteurs",
  },
  {
    id: "fighter-transfers",
    label: "Transferts",
    path: "/ad/fighters/transfers",
    icon: Repeat,
    description: "Suivre les transferts de lutteurs entre régions",
  },
  // Arbitres
  {
    id: "referees",
    label: "Arbitres",
    path: "/admin/referees",
    icon: Shield,
    description: "Gérer les arbitres et leurs certifications",
  },
  // Compétitions
  {
    id: "competitions",
    label: "Compétitions",
    path: "/admin/competitions",
    icon: Trophy,
    description: "Gérer les compétitions",
  },
  {
    id: "editions",
    label: "Éditions",
    path: "/admin/competitions/editions",
    icon: Calendar,
    description: "Gérer les éditions de compétitions",
  },
  {
    id: "phases",
    label: "Phases",
    path: "/admin/competitions/phases",
    icon: Layers,
    description: "Gérer les phases et groupes des éditions",
  },
  {
    id: "matches",
    label: "Matchs",
    path: "/admin/competitions/matches",
    icon: Swords,
    description: "Gérer les matchs",
  },
  // Médias et contenus
  {
    id: "articles",
    label: "Articles",
    path: "/admin/articles",
    icon: Newspaper,
    description: "Gérer les articles et publications",
  },
  {
    id: "media",
    label: "Médias",
    path: "/admin/media",
    icon: FileImage,
    description: "Gérer les fichiers multimédias",
  },
  {
    id: "videos",
    label: "Vidéos",
    path: "/admin/videos",
    icon: Video,
    description: "Gérer les vidéos et diffusions",
  },
  // Messagerie & Notifications
  {
    id: "messages",
    label: "Messages",
    path: "/admin/messages",
    icon: MessageSquare,
    description: "Gérer les messages et commentaires",
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    description: "Notifications et alertes système",
  },
  // Interactions
  {
    id: "interactions",
    label: "Interactions",
    path: "/admin/interactions",
    icon: Activity,
    description: "Gérer les likes, vues et partages",
  },
  // Système
  {
    id: "database",
    label: "Base de Données",
    path: "/admin/database",
    icon: Database,
    description: "Surveiller et gérer les données système",
  },
  {
    id: "settings",
    label: "Paramètres",
    path: "/admin/settings",
    icon: Settings,
    description: "Configuration système",
  },
];


// === GROUPES DE MENU ===

export const overviewItems = [
  { title: "Tableau de bord", url: "/admin", icon: BarChart3, description: "Vue d'ensemble générale" },
]

export const regionItems = [
  { title: "Régions", url: "/ad/regions", icon: Globe, description: "Gestion des régions" },
  { title: "Villes", url: "/ad/cities", icon: MapPin, description: "Gestion des villes par région" },
]

export const fighterItems = [
  { title: "Lutteurs", url: "/ad/fighters", icon: Users, description: "Gestion des lutteurs" },
  { title: "Palmarès", url: "/ad/fighters/achievements", icon: Award, description: "Titres et distinctions" },
  { title: "Transferts", url: "/ad/fighters/transfers", icon: Repeat, description: "Transferts entre régions" },
]

export const refereeItems = [
  { title: "Arbitres", url: "/ad/referees", icon: Shield, description: "Gestion des arbitres" },
]

export const competitionItems = [
  { title: "Compétitions", url: "/ad/competitions", icon: Trophy, description: "Gérer les compétitions" },
  { title: "Éditions", url: "/ad/competitions/editions", icon: Calendar, description: "Éditions et saisons" },
  { title: "Phases", url: "/ad/competitions/phases", icon: Activity, description: "Phases et groupes" },
  { title: "Matchs", url: "/ad/competitions/matches", icon: Swords, description: "Matchs et résultats" },
]

export const contentItems = [
  { title: "Articles", url: "/ad/articles", icon: Newspaper, description: "Actualités et articles" },
  { title: "Médias", url: "/ad/media", icon: FileImage, description: "Photos et fichiers" },
  { title: "Vidéos", url: "/ad/videos", icon: Video, description: "Vidéos et diffusions" },
]

export const communicationItems = [
  { title: "Messages", url: "/ad/messages", icon: MessageSquare, description: "Messagerie et commentaires" },
  { title: "Notifications", url: "/ad/notifications", icon: Bell, description: "Alertes et notifications" },
]

export const systemItems = [
  { title: "Base de données", url: "/ad/database", icon: Database, description: "Surveillance de la DB" },
  { title: "Paramètres", url: "/ad/settings", icon: Settings, description: "Configuration système" },
]
