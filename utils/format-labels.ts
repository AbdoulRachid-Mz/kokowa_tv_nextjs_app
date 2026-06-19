// @/utils/format-labels

// Generic status formatter for competition/phase/sub_group status
export const formatStatus = (status: string): string => {
  switch (status) {
    case 'upcoming':
      return 'À venir';
    case 'ongoing':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    case 'postponed':
      return 'Reporté';
    default:
      return status;
  }
};

// Match specific status formatter
export const formatMatchStatus = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return 'Programmé';
    case 'live':
      return 'En direct';
    case 'round_break':
      return 'Pause entre rounds';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    case 'postponed':
      return 'Reporté';
    case 'reclamation':
      return 'En réclamation';
    default:
      return status;
  }
};

// Phase type formatter
export const formatPhaseType = (type: string): string => {
  switch (type) {
    case 'qualification':
      return 'Qualifications';
    case 'group':
      return 'Phase de groupes';
    case 'knockout':
      return 'Phase éliminatoire';
    case 'quarterfinal':
      return 'Quart de finale';
    case 'semifinal':
      return 'Demi-finale';
    case 'final':
      return 'Finale';
    default:
      return type;
  }
};

// Match result formatter
export const formatMatchResult = (result: string): string => {
  switch (result) {
    case 'fighter1_win':
      return 'Victoire lutteur 1';
    case 'fighter2_win':
      return 'Victoire lutteur 2';
    case 'draw':
      return 'Match nul';
    case 'cancelled':
      return 'Annulé';
    case 'postponed':
      return 'Reporté';
    default:
      return result;
  }
};

// Edition fighter status formatter
export const formatEditionFighterStatus = (status: string): string => {
  switch (status) {
    case 'registered':
      return 'Inscrit';
    case 'qualified':
      return 'Qualifié';
    case 'disqualified':
      return 'Disqualifié';
    case 'withdrawn':
      return 'Retiré';
    default:
      return status;
  }
};

// Edition region status formatter
export const formatEditionRegionStatus = (status: string): string => {
  switch (status) {
    case 'registered':
      return 'Inscrite';
    case 'approved':
      return 'Approuvée';
    case 'rejected':
      return 'Refusée';
    default:
      return status;
  }
};

// Transfer status formatter
export const formatTransferStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'approved':
      return 'Approuvé';
    case 'rejected':
      return 'Refusé';
    case 'completed':
      return 'Terminé';
    default:
      return status;
  }
};

// Article status formatter
export const formatArticleStatus = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Brouillon';
    case 'published':
      return 'Publié';
    case 'archived':
      return 'Archivé';
    default:
      return status;
  }
};

// Article type formatter
export const formatArticleType = (type: string): string => {
  switch (type) {
    case 'news':
      return 'Actualité';
    case 'event':
      return 'Événement';
    case 'announcement':
      return 'Annonce';
    case 'highlight':
      return 'Point fort';
    case 'interview':
      return 'Interview';
    case 'analyse':
      return 'Analyse';
    default:
      return type;
  }
};

// Sub-group period formatter
export const formatPeriod = (period: string): string => {
  switch (period) {
    case 'matin':
      return 'Matin';
    case 'soir':
      return 'Soir';
    default:
      return period;
  }
};

// Card type formatter
export const formatCardType = (type: string): string => {
  switch (type) {
    case 'yellow':
      return 'Carton jaune';
    case 'red':
      return 'Carton rouge';
    default:
      return type;
  }
};

// User role formatter
export const formatUserRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'editor':
      return 'Éditeur';
    case 'user':
      return 'Utilisateur';
    case 'moderator':
      return 'Modérateur';
    case 'fighter_manager':
      return 'Gestionnaire de lutteur';
    default:
      return role;
  }
};

// Message type formatter
export const formatMessageType = (type: string): string => {
  switch (type) {
    case 'comment':
      return 'Commentaire';
    case 'direct_message':
      return 'Message privé';
    case 'group_message':
      return 'Message de groupe';
    case 'match_commentary':
      return 'Commentaire de match';
    case 'system_notification':
      return 'Notification système';
    default:
      return type;
  }
};

// Achievement position formatter
export const formatAchievementPosition = (position: string): string => {
  switch (position) {
    case '1st':
      return '1er';
    case '2nd':
      return '2ème';
    case '3rd':
      return '3ème';
    case 'finalist':
      return 'Finaliste';
    case 'semifinalist':
      return 'Demi-finaliste';
    case 'quarterfinalist':
      return 'Quart-finaliste';
    default:
      return position;
  }
};

// Video category formatter
export const formatVideoCategory = (category: string): string => {
  switch (category) {
    case 'match':
      return 'Match';
    case 'interview':
      return 'Interview';
    case 'highlights':
      return 'Meilleurs moments';
    case 'training':
      return 'Entraînement';
    case 'documentary':
      return 'Documentaire';
    case 'ceremony':
      return 'Cérémonie';
    default:
      return category;
  }
};

// Advertisement position formatter
export const formatAdvertisementPosition = (position: string): string => {
  switch (position) {
    case 'header':
      return 'En-tête';
    case 'sidebar':
      return 'Barre latérale';
    case 'footer':
      return 'Pied de page';
    case 'in_content':
      return 'Dans le contenu';
    case 'popup':
      return 'Fenêtre popup';
    case 'banner_top':
      return 'Bannière supérieure';
    case 'banner_bottom':
      return 'Bannière inférieure';
    case 'mobile_sticky':
      return 'Fixe sur mobile';
    default:
      return position;
  }
};
