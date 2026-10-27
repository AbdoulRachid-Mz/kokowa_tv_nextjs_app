// lib/presentation/data.ts
// Source centralisée des données du module de présentation Kokowa TV
// Toutes les valeurs sont basées sur le code réel du dépôt.
// Les indicateurs marqués [À DÉFINIR] nécessitent une validation métier.

export interface BudgetLine {
  poste: string;
  description: string;
  quantite?: string;
  coutUnitaire?: string;
  total?: string;
  type: "ponctuel" | "mensuel" | "annuel" | "investissement";
  couvert?: boolean;
  hypothese?: string;
}

export interface BudgetScenario {
  nom: string;
  duree: string;
  totalEstime: string;
  description: string;
  lignes: BudgetLine[];
}

export const PRESENTATION_DATA = {
  meta: {
    titre: "Kokowa TV",
    sousTitre: "Plateforme Officielle de la Lutte Traditionnelle Nigérienne",
    slogan: "Valoriser la culture, connecter les passionnés, digitaliser le Kokowa",
    version: "2.0 (Refonte 2026)",
    statut: "En production active — Améliorations continues",
    dateAudit: "Octobre 2026",
  },

  chapitres: [
    { id: "presentation", titre: "Présentation Générale", numero: 1, emoji: "🏆" },
    { id: "contexte", titre: "Contexte & Problématique", numero: 2, emoji: "🌍" },
    { id: "vision", titre: "Vision, Mission & Objectifs", numero: 3, emoji: "🎯" },
    { id: "public", titre: "Public Cible & Utilisateurs", numero: 4, emoji: "👥" },
    { id: "fonctionnalites", titre: "Fonctionnalités Détaillées", numero: 5, emoji: "⚡" },
    { id: "parcours", titre: "Parcours Utilisateurs", numero: 6, emoji: "🗺️" },
    { id: "architecture", titre: "Architecture Technique", numero: 7, emoji: "🏗️" },
    { id: "api", titre: "Architecture API & Intégration Mobile", numero: 8, emoji: "📱" },
    { id: "securite", titre: "Sécurité & Protection des Données", numero: 9, emoji: "🔒" },
    { id: "infrastructure", titre: "Infrastructure & Fonctionnement", numero: 10, emoji: "☁️" },
    { id: "modele", titre: "Modèle Économique", numero: 11, emoji: "💼" },
    { id: "financement", titre: "Besoins en Financement", numero: 12, emoji: "💰" },
    { id: "equipe", titre: "Équipe & Gouvernance", numero: 13, emoji: "🤝" },
    { id: "roadmap", titre: "Feuille de Route", numero: 14, emoji: "🗓️" },
    { id: "risques", titre: "Risques & Mesures d'Atténuation", numero: 15, emoji: "⚠️" },
    { id: "indicateurs", titre: "Indicateurs de Performance", numero: 16, emoji: "📊" },
    { id: "conclusion", titre: "Conclusion & Perspectives", numero: 17, emoji: "🚀" },
  ],

  stackTechnique: [
    { nom: "Next.js 16", role: "Framework Web (App Router, RSC)", categorie: "Frontend" },
    { nom: "TypeScript 5.7 Strict", role: "Langage de développement", categorie: "Dev" },
    { nom: "Bun 1.4+", role: "Runtime & Gestionnaire de paquets", categorie: "Dev" },
    { nom: "Neon PostgreSQL Serverless", role: "Base de données principale", categorie: "Backend" },
    { nom: "Firebase Authentication", role: "Authentification & Sessions", categorie: "Sécurité" },
    { nom: "Firebase App Check", role: "Intégrité applicative", categorie: "Sécurité" },
    { nom: "Firebase Realtime Database", role: "Scores & Directs Temps Réel (< 100ms)", categorie: "Temps Réel" },
    { nom: "Firebase Cloud Storage", role: "Stockage médias & photos", categorie: "Stockage" },
    { nom: "Upstash Redis", role: "Rate Limiting & Cache distribué", categorie: "Performance" },
    { nom: "Tailwind CSS v4", role: "Design System & Interface", categorie: "Frontend" },
    { nom: "Radix UI", role: "Composants d'interface accessibles", categorie: "Frontend" },
    { nom: "TanStack Query v5", role: "Gestion de cache côté client", categorie: "Frontend" },
    { nom: "Flutter (Mobile)", role: "Application iOS & Android", categorie: "Mobile" },
  ],

  fonctionnalites: [
    {
      domaine: "Gestion du Tournoi",
      statut: "✅ Opérationnel",
      items: [
        "Création et gestion des compétitions (Sabre National, Tournoi des Maîtres...)",
        "Gestion multi-éditions annuelles avec historique complet",
        "Organisation en phases (poules, 1/4, 1/2, finale)",
        "Groupes de phase et sous-groupes (confrontations régionales)",
        "Appariement des combats d'élimination directe avec règles anti-doublons",
        "Calcul automatique des scores de région et classements",
      ],
    },
    {
      domaine: "Gestion des Combats & Live",
      statut: "✅ Opérationnel",
      items: [
        "Saisie des résultats de combat en temps réel",
        "Chronomètre de combat synchronisé (Firebase RTDB < 100ms)",
        "Types de victoire : chute (fall), points, disqualification, forfait",
        "Avertissements et cartons jaunes/rouges",
        "Tableau de bord de supervision des combats en direct",
        "Navigation entre combats par carrousel",
      ],
    },
    {
      domaine: "Gestion des Lutteurs",
      statut: "✅ Opérationnel",
      items: [
        "Fiches biographiques complètes (photo, poids, région, palmarès)",
        "Inscription aux éditions et gestion du statut d'élimination",
        "Historique des combats par lutteur",
        "Mutation de délégation régionale entre éditions",
        "Gestion des entraîneurs et du corps arbitral",
        "Suivi des titres et ceintures remportées",
      ],
    },
    {
      domaine: "Contenu & Médias",
      statut: "✅ Opérationnel",
      items: [
        "Publication d'articles d'actualité (éditeur riche)",
        "Galeries photos et replays vidéo des combats",
        "Campagnes publicitaires et bannières partenaires",
        "Archives des éditions depuis 1975",
        "Gestion des médias (upload Firebase Storage)",
      ],
    },
    {
      domaine: "Communauté & Interaction",
      statut: "✅ Opérationnel",
      items: [
        "Commentaires et tchat en direct sur les matchs",
        "Likes et favoris sur articles, vidéos, lutteurs",
        "Notifications push et in-app",
        "Profil utilisateur et gestion du compte",
      ],
    },
    {
      domaine: "Application Mobile Flutter",
      statut: "✅ API Opérationnelle",
      items: [
        "API REST dédiée documentée (/api/mobile/*)",
        "Abonnement temps réel Firebase RTDB pour les scores live",
        "Catalogue des lutteurs, régions, éditions et matchs",
        "Flux d'actualités et commentaires",
        "Interactions utilisateur (likes, favoris) sécurisées",
      ],
    },
  ],

  securiteAudit: [
    { ref: "SEC-01", vulnerabilite: "Server Actions destructives non protégées", severite: "CRITIQUE", statut: "RÉSOLU" },
    { ref: "SEC-02", vulnerabilite: "Injection SQL dans importTableData", severite: "CRITIQUE", statut: "RÉSOLU" },
    { ref: "SEC-03", vulnerabilite: "Fuite de hash de mots de passe", severite: "ÉLEVÉE", statut: "RÉSOLU" },
    { ref: "SEC-04", vulnerabilite: "IDOR / BOLA sur l'API mobile", severite: "ÉLEVÉE", statut: "RÉSOLU" },
    { ref: "SEC-05", vulnerabilite: "Énumération non-authentifiée du schéma DB", severite: "MOYENNE", statut: "RÉSOLU" },
    { ref: "SEC-06", vulnerabilite: "Auto-élévation de privilèges dans createUser", severite: "ÉLEVÉE", statut: "RÉSOLU" },
    { ref: "SEC-07", vulnerabilite: "Inversion logique Firebase App Check", severite: "MOYENNE", statut: "RÉSOLU" },
    { ref: "SEC-08", vulnerabilite: "Absence de vérification de rôle côté layout admin", severite: "MOYENNE", statut: "RÉSOLU" },
    { ref: "SEC-09", vulnerabilite: "ID Token traité comme Session Cookie (Erreur d'émetteur)", severite: "ÉLEVÉE", statut: "RÉSOLU" },
  ],

  budgetScenarios: [
    {
      nom: "Scénario Minimal — Stabilisation & Sécurisation",
      duree: "6 mois",
      totalEstime: "2 500 000 — 4 000 000 FCFA",
      description: "Maintien en condition opérationnelle, corrections critiques, couverture des coûts d'hébergement et de services cloud pour un an.",
      lignes: [
        {
          poste: "Hébergement Cloud (Neon PostgreSQL)", description: "Tier Pro Neon avec connexions concurrentes pour la saison du Sabre", quantite: "12 mois", coutUnitaire: "~30 000 FCFA/mois", total: "~360 000 FCFA", type: "annuel", hypothese: "Basé sur les tarifs publics Neon Pro de $19/mois"
        },
        {
          poste: "Hébergement Application Web (Vercel/Railway)", description: "Déploiement Next.js avec fonctions serverless et bande passante", quantite: "12 mois", coutUnitaire: "~15 000 FCFA/mois", total: "~180 000 FCFA", type: "annuel", hypothese: "Basé sur Vercel Pro $20/mois"
        },
        {
          poste: "Firebase (Auth, RTDB, Storage)", description: "Authentification, scores temps réel et stockage médias", quantite: "12 mois", coutUnitaire: "~12 000 FCFA/mois", total: "~144 000 FCFA", type: "annuel", hypothese: "Firebase Blaze selon usage moyen estimé"
        },
        {
          poste: "Upstash Redis (Rate Limiting)", description: "Protection anti-abus et cache distribué", quantite: "12 mois", coutUnitaire: "~5 000 FCFA/mois", total: "~60 000 FCFA", type: "annuel", hypothese: "Upstash Pay-per-request"
        },
        {
          poste: "Nom de domaine & certificat SSL", description: "kokowatv.com ou équivalent .com / .ne", quantite: "1 an", coutUnitaire: "~15 000 FCFA", total: "~15 000 FCFA", type: "annuel"
        },
        {
          poste: "Maintenance technique (développeur)", description: "Corrections de bugs, mises à jour de sécurité, support technique", quantite: "6 mois", coutUnitaire: "À définir selon profil", total: "[À DÉFINIR]", type: "mensuel", hypothese: "Coût variable selon disponibilité freelance ou équipe interne"
        },
      ],
    },
    {
      nom: "Scénario Intermédiaire — Consolidation & Développement",
      duree: "12 mois",
      totalEstime: "8 000 000 — 15 000 000 FCFA",
      description: "Amélioration de la plateforme, développement de nouvelles fonctionnalités prioritaires (tableau de bord génération automatique de bracket, module statistiques avancées), renforcement de la sécurité et du monitoring.",
      lignes: [
        {
          poste: "Infrastructure Cloud (total)", description: "Neon Pro, Vercel Pro, Firebase Blaze, Upstash, domaine", quantite: "12 mois", total: "~760 000 FCFA", type: "annuel"
        },
        {
          poste: "Développement — Génération automatique des tableaux de tournoi", description: "Module de bracket automatique avec arbre élimination directe", quantite: "1 module", total: "[À DÉFINIR — Devis développeur]", type: "ponctuel"
        },
        {
          poste: "Développement — Module Statistiques & Analytics", description: "Tableau de bord statistiques avancées (top lutteurs, régions, tendances)", quantite: "1 module", total: "[À DÉFINIR — Devis développeur]", type: "ponctuel"
        },
        {
          poste: "Tests de charge & Audit de sécurité", description: "Test de performance en conditions de pic (finale du Sabre), pentest partiel", quantite: "1 audit", total: "[À DÉFINIR — Prestataire spécialisé]", type: "ponctuel"
        },
        {
          poste: "Application Mobile Flutter (amélioration UI/UX)", description: "Refonte de l'expérience utilisateur mobile basée sur les retours terrain", quantite: "1 phase", total: "[À DÉFINIR — Devis développeur Flutter]", type: "ponctuel"
        },
        {
          poste: "Communication & Acquisition (réseaux sociaux, presse)", description: "Promotion de la plateforme auprès du public nigérien", quantite: "12 mois", total: "[À DÉFINIR — Plan de communication]", type: "mensuel"
        },
      ],
    },
    {
      nom: "Scénario Ambitieux — Accélération & Déploiement Élargi",
      duree: "18 à 24 mois",
      totalEstime: "25 000 000 — 50 000 000+ FCFA",
      description: "Montée en charge complète : diffusion vidéo intégrée (streaming live), couverture de toutes les compétitions régionales, équipe permanente, partenariats médias et institutionnels, déploiement mobile en boutiques.",
      lignes: [
        {
          poste: "Infrastructure haute disponibilité", description: "Neon Scale, CDN dédié, Firebase quotas élevés, monitoring 24/7", total: "~3 000 000 FCFA/an", type: "annuel"
        },
        {
          poste: "Streaming vidéo live (Mux.com ou équivalent)", description: "Diffusion en direct des combats avec faible latence", total: "[À DÉFINIR selon volume — ~$50-200/mois]", type: "mensuel"
        },
        {
          poste: "Équipe technique permanente", description: "1 développeur full-stack + 1 DevOps/Ops (temps partiel ou plein)", total: "[À DÉFINIR selon profil et contractualisation]", type: "mensuel"
        },
        {
          poste: "Publication Application Mobile (App Store & Play Store)", description: "Frais d'enregistrement développeur et maintenance des stores", quantite: "1 an", total: "~50 000 FCFA", type: "annuel"
        },
        {
          poste: "Équipement terrain (tablettes arbitrage, caméras IP)", description: "Équipement pour la saisie en direct des résultats sur le terrain", total: "[À DÉFINIR selon nombre de sites]", type: "investissement"
        },
        {
          poste: "Partenariats institutionnels & Communication", description: "Plan de communication nationale, dossiers de sponsoring", total: "[À DÉFINIR — Plan marketing]", type: "ponctuel"
        },
      ],
    },
  ] as BudgetScenario[],

  risques: [
    { categorie: "Technique", risque: "Indisponibilité de Neon PostgreSQL (cold-start)", impact: "Moyen", probabilite: "Faible", mesure: "Retry automatique avec backoff exponentiel implémenté. Cache serveur sur les données fréquentes." },
    { categorie: "Technique", risque: "Dépassement du quota Firebase Realtime Database lors de la finale", impact: "Élevé", probabilite: "Moyen", mesure: "Surveiller les connexions simultanées. Passer au tier Blaze Firebase avant la finale." },
    { categorie: "Sécurité", risque: "Compromission de la clé FIREBASE_PRIVATE_KEY en production", impact: "Critique", probabilite: "Faible", mesure: "Stocker dans un gestionnaire de secrets (Vercel Secrets / Railway Variables). Jamais dans le code." },
    { categorie: "Financier", risque: "Dépassement des limites des tiers gratuits des services cloud", impact: "Moyen", probabilite: "Moyen", mesure: "Alertes de facturation configurées. Migration vers tiers payants planifiée avant le Sabre National." },
    { categorie: "Adoption", risque: "Faible taux d'adoption de l'application mobile Flutter", impact: "Moyen", probabilite: "Moyen", mesure: "Communication ciblée sur les réseaux sociaux. Partenariat avec la FENILUTTE pour promotion officielle." },
    { categorie: "Organisationnel", risque: "Maintenance non assurée entre deux éditions du Sabre", impact: "Élevé", probabilite: "Moyen", mesure: "Documenter clairement les procédures. Impliquer a minima 2 personnes techniques." },
  ],

  indicateurs: [
    { categorie: "Disponibilité", indicateur: "Uptime de la plateforme", cible: "> 99% pendant le Sabre National", statut: "À mesurer" },
    { categorie: "Performance", indicateur: "Latence de synchronisation des scores live", cible: "< 500ms de bout en bout", statut: "Firebase RTDB < 100ms mesuré" },
    { categorie: "Performance", indicateur: "Temps de réponse API mobile (P95)", cible: "< 800ms", statut: "À instrumenter" },
    { categorie: "Sécurité", indicateur: "Vulnérabilités critiques non corrigées", cible: "0 après audit", statut: "0 (SEC-01 à SEC-09 résolus)" },
    { categorie: "Qualité", indicateur: "Erreurs TypeScript de compilation", cible: "0 erreurs", statut: "✅ 0 erreurs (bun run typecheck)" },
    { categorie: "Utilisation", indicateur: "Combats saisis en temps réel par édition", cible: "[À définir selon calendrier]", statut: "À mesurer" },
    { categorie: "Utilisation", indicateur: "Téléchargements application mobile", cible: "[À définir par la FENILUTTE]", statut: "À mesurer" },
    { categorie: "Contenu", indicateur: "Articles publiés par édition", cible: "[À définir équipe éditoriale]", statut: "À mesurer" },
  ],
};
