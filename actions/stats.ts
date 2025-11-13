// lib/actions/stats.ts - Fichier complet avec toutes les statistiques
'use server';

// Importations nécessaires
import { query, queryOne } from '@/lib/db/neon-client'; 

// Définitions de types simplifiées (Assurez-vous qu'elles existent dans votre '@/types')
export interface StatsFilters {
  entity?: string;
  statId?: string;
  date_from?: string;
  date_to?: string;
  region_id?: number;
  edition_id?: number;
  competition_id?: number;
  year?: number;
  group_by?: 'day' | 'week' | 'month' | 'year';
  limit?: number;
}

export interface StatsResponse {
  entity: string;
  statId?: string;
  data: any;
  metadata?: {
    total: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    totalPages?: number;
  };
}

export interface GlobalStats {
  total_fighters: number;
  total_regions: number;
  total_competitions: number;
  total_coaches: number;
  total_referees: number;
  total_matches: number;
  total_transfers: number;
  total_users: number;
}

// =============================================
// I. LOGIQUE DE STATISTIQUES SPÉCIFIQUES
// (Exemples basés sur les entités de votre DB)
// =============================================

// --- STATISTIQUES DES TRANSFERTS ---

export async function getTransferTimelineStats(filters: StatsFilters): Promise<StatsResponse> {
  const { date_from, date_to, group_by = 'month' } = filters;
  
  let dateTrunc = 'month';
  switch (group_by) {
    case 'day': dateTrunc = 'day'; break;
    case 'week': dateTrunc = 'week'; break;
    case 'year': dateTrunc = 'year'; break;
  }

  const timeline = await query<{ period: string; count: string; total_fees: string }>(`
    SELECT 
      DATE_TRUNC('${dateTrunc}', transfer_date) as period,
      COUNT(*) as count,
      SUM(COALESCE(transfer_fee, 0)) as total_fees
    FROM fighter_transfers
    WHERE 1=1
    ${date_from ? `AND transfer_date >= '${date_from}'` : ''}
    ${date_to ? `AND transfer_date <= '${date_to}'` : ''}
    GROUP BY DATE_TRUNC('${dateTrunc}', transfer_date)
    ORDER BY period
  `);

  return {
    entity: 'transfers',
    statId: 'timeline',
    data: timeline.map(t => ({
      period: t.period,
      count: parseInt(t.count),
      total_fees: parseFloat(t.total_fees),
    })),
  };
}

export async function getTransferRegionStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour le flux de transferts entre régions
    return { entity: 'transfers', statId: 'regions', data: { message: 'Transfer regions stats placeholder' } };
}

export async function getTransferFeeStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la répartition des frais de transfert
    return { entity: 'transfers', statId: 'fees', data: { message: 'Transfer fee stats placeholder' } };
}


// --- STATISTIQUES DES COMPÉTITIONS ---

export async function getCompetitionTimelineStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour le nombre de compétitions au fil du temps
    return { entity: 'competitions', statId: 'timeline', data: { message: 'Competition timeline stats placeholder' } };
}

export async function getCompetitionTypeStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la répartition par type de compétition (ex: ligue, coupe)
    return { entity: 'competitions', statId: 'types', data: { message: 'Competition type stats placeholder' } };
}


// --- STATISTIQUES DES MATCHS ---

export async function getMatchResultStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la répartition des résultats (KO, soumission, décision)
    return { entity: 'matches', statId: 'results', data: { message: 'Match result stats placeholder' } };
}

export async function getMatchDurationStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la durée moyenne ou la répartition des durées de match
    return { entity: 'matches', statId: 'duration', data: { message: 'Match duration stats placeholder' } };
}

export async function getMatchRegionStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour le nombre de matchs par région
    return { entity: 'matches', statId: 'regions', data: { message: 'Match region stats placeholder' } };
}

export async function getMatchTimelineStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour le nombre de matchs au fil du temps
    return { entity: 'matches', statId: 'timeline', data: { message: 'Match timeline stats placeholder' } };
}


// --- STATISTIQUES DES LUTTEURS (FIGHTERS) ---

export async function getFighterRankingStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la répartition des classements
    return { entity: 'fighters', statId: 'ranking', data: { message: 'Fighter ranking stats placeholder' } };
}

export async function getFighterChampionStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la liste ou le nombre de champions
    return { entity: 'fighters', statId: 'champions', data: { message: 'Fighter champion stats placeholder' } };
}

export async function getFighterGrowthStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour l'évolution du nombre de lutteurs inscrits
    return { entity: 'fighters', statId: 'growth', data: { message: 'Fighter growth stats placeholder' } };
}

export async function getFighterRegionStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la répartition géographique des lutteurs
    return { entity: 'fighters', statId: 'regions', data: { message: 'Fighter region stats placeholder' } };
}


// --- STATISTIQUES DES RÉGIONS ---

export async function getRegionPerformanceStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la performance globale des régions
    return { entity: 'regions', statId: 'performance', data: { message: 'Region performance stats placeholder' } };
}

export async function getRegionInfrastructureStats(filters: StatsFilters): Promise<StatsResponse> {
    // Implémenter la logique pour la capacité des stades, etc.
    return { entity: 'regions', statId: 'infrastructure', data: { message: 'Region infrastructure stats placeholder' } };
}


// =============================================
// II. STATISTIQUES DE RÉSUMÉ (DEFAULT)
// =============================================

async function getFighterSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{
    total: string;
    active: string;
    champions: string;
    avg_age: string;
    avg_weight: string;
    avg_height: string;
    avg_ranking: string;
  }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = true) as active,
      COUNT(*) FILTER (WHERE is_champion = true) as champions,
      AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) as avg_age,
      AVG(weight) as avg_weight,
      AVG(height) as avg_height,
      AVG(ranking) FILTER (WHERE ranking > 0) as avg_ranking
    FROM fighters 
    WHERE 1=1
    ${filters.region_id ? `AND region_id = ${filters.region_id}` : ''}
  `);

  return { 
    entity: 'fighters', 
    statId: 'summary',
    data: {
      total: parseInt(stats?.total ?? '0'),
      active: parseInt(stats?.active ?? '0'),
      champions: parseInt(stats?.champions ?? '0'),
      average_age: parseFloat(stats?.avg_age ?? '0').toFixed(1),
      average_weight: parseFloat(stats?.avg_weight ?? '0').toFixed(1),
      average_height: parseFloat(stats?.avg_height ?? '0').toFixed(1),
      average_ranking: parseFloat(stats?.avg_ranking ?? '0').toFixed(1),
    },
    metadata: { total: parseInt(stats?.total ?? '0') }
  };
}

async function getRegionSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{
    total: string;
    total_fighters: string;
    total_champions: string;
    avg_fighters: string;
  }>(`
    SELECT
        COUNT(*) as total,
        SUM(total_fighters) as total_fighters,
        SUM(total_champions) as total_champions,
        AVG(total_fighters) as avg_fighters
    FROM regions
  `);

  return {
    entity: 'regions',
    statId: 'summary',
    data: {
      total: parseInt(stats?.total ?? '0'),
      total_fighters: parseInt(stats?.total_fighters ?? '0'),
      total_champions: parseInt(stats?.total_champions ?? '0'),
      average_fighters_per_region: parseFloat(stats?.avg_fighters ?? '0').toFixed(1),
    },
    metadata: { total: parseInt(stats?.total ?? '0') }
  };
}

async function getMatchSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; total_competitions: string; total_editions: string }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT competition_id) as total_competitions,
      COUNT(DISTINCT edition_id) as total_editions
    FROM matches
    WHERE 1=1
    ${filters.region_id ? `AND region_id = ${filters.region_id}` : ''}
    ${filters.competition_id ? `AND competition_id = ${filters.competition_id}` : ''}
    ${filters.edition_id ? `AND edition_id = ${filters.edition_id}` : ''}
  `);
  return { entity: 'matches', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), total_competitions: parseInt(stats?.total_competitions ?? '0'), total_editions: parseInt(stats?.total_editions ?? '0') }, metadata: { total: parseInt(stats?.total ?? '0') } };
}

async function getCompetitionSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; active: string; total_regions: string }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = true) as active,
      COUNT(DISTINCT region_id) as total_regions
    FROM competitions
  `);
  return { entity: 'competitions', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), active: parseInt(stats?.active ?? '0'), total_regions: parseInt(stats?.total_regions ?? '0') }, metadata: { total: parseInt(stats?.total ?? '0') } };
}

async function getTransferSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; approved: string; total_fees: string; avg_fee: string }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      SUM(COALESCE(transfer_fee, 0)) as total_fees,
      AVG(COALESCE(transfer_fee, 0)) as avg_fee
    FROM fighter_transfers
  `);
  return { entity: 'transfers', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), approved: parseInt(stats?.approved ?? '0'), total_fees: parseFloat(stats?.total_fees ?? '0').toFixed(2), average_fee: parseFloat(stats?.avg_fee ?? '0').toFixed(2) }, metadata: { total: parseInt(stats?.total ?? '0') } };
}

// Placeholders pour les petites entités
async function getEditionSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; total_participants: string }>(`SELECT COUNT(*) as total, SUM(total_participants) as total_participants FROM competition_editions`);
  return { entity: 'editions', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), total_participants: parseInt(stats?.total_participants ?? '0') }, metadata: { total: parseInt(stats?.total ?? '0') } };
}

async function getCoachSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; active: string }>(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM coaches`);
  return { entity: 'coaches', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), active: parseInt(stats?.active ?? '0') }, metadata: { total: parseInt(stats?.total ?? '0') } };
}

async function getRefereeSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ total: string; active: string }>(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM referees`);
  return { entity: 'referees', statId: 'summary', data: { total: parseInt(stats?.total ?? '0'), active: parseInt(stats?.active ?? '0') }, metadata: { total: parseInt(stats?.total ?? '0') } };
}


// =============================================
// III. FONCTIONS DE DISPATCHER PAR ENTITÉ
// =============================================

async function getFighterStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  if (statId) {
    switch (statId) {
      case 'ranking': return await getFighterRankingStats(filters);
      case 'champions': return await getFighterChampionStats(filters);
      case 'growth': return await getFighterGrowthStats(filters);
      case 'regions': return await getFighterRegionStats(filters);
      default: throw new Error(`Statistique de Lutteur non trouvée: ${statId}`);
    }
  }
  return await getFighterSummaryStats(filters);
}

async function getRegionStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  if (statId) {
    switch (statId) {
      case 'performance': return await getRegionPerformanceStats(filters);
      case 'infrastructure': return await getRegionInfrastructureStats(filters);
      default: throw new Error(`Statistique de Région non trouvée: ${statId}`);
    }
  }
  return await getRegionSummaryStats(filters);
}

async function getMatchStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  if (statId) {
    switch (statId) {
      case 'timeline': return await getMatchTimelineStats(filters);
      case 'results': return await getMatchResultStats(filters);
      case 'duration': return await getMatchDurationStats(filters);
      case 'regions': return await getMatchRegionStats(filters);
      default: throw new Error(`Statistique de Match non trouvée: ${statId}`);
    }
  }
  return await getMatchSummaryStats(filters);
}

async function getCompetitionStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  if (statId) {
    switch (statId) {
      case 'timeline': return await getCompetitionTimelineStats(filters);
      case 'types': return await getCompetitionTypeStats(filters);
      default: throw new Error(`Statistique de Compétition non trouvée: ${statId}`);
    }
  }
  return await getCompetitionSummaryStats(filters);
}

async function getTransferStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  if (statId) {
    switch (statId) {
      case 'timeline': return await getTransferTimelineStats(filters);
      case 'regions': return await getTransferRegionStats(filters);
      case 'fees': return await getTransferFeeStats(filters);
      default: throw new Error(`Statistique de Transfert non trouvée: ${statId}`);
    }
  }
  return await getTransferSummaryStats(filters);
}

async function getEditionStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  // Ajoutez des cas spécifiques si vous avez des statId pour les éditions
  return await getEditionSummaryStats(filters);
}

async function getCoachStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  // Ajoutez des cas spécifiques si vous avez des statId pour les coachs
  return await getCoachSummaryStats(filters);
}

async function getRefereeStats(statId: string | undefined, filters: StatsFilters): Promise<StatsResponse> {
  // Ajoutez des cas spécifiques si vous avez des statId pour les arbitres
  return await getRefereeSummaryStats(filters);
}


// =============================================
// IV. STATISTIQUES GLOBALES (getGlobalStats)
// =============================================

async function getGlobalStats(filters: StatsFilters): Promise<StatsResponse> {
  const summary = await queryOne<any>(`
    SELECT 
      (SELECT COUNT(*) FROM fighters WHERE is_active = true) as total_fighters,
      (SELECT COUNT(*) FROM regions) as total_regions,
      (SELECT COUNT(*) FROM coaches WHERE is_active = true) as total_coaches,
      (SELECT COUNT(*) FROM referees WHERE is_active = true) as total_referees,
      (SELECT COUNT(*) FROM competitions WHERE is_active = true) as total_competitions,
      (SELECT COUNT(*) FROM matches) as total_matches,
      (SELECT COUNT(*) FROM fighter_transfers) as total_transfers,
      (SELECT COUNT(*) FROM users) as total_users
  `);
  
  const data: GlobalStats = {
    total_fighters: parseInt(summary?.total_fighters ?? '0'),
    total_regions: parseInt(summary?.total_regions ?? '0'),
    total_coaches: parseInt(summary?.total_coaches ?? '0'),
    total_referees: parseInt(summary?.total_referees ?? '0'),
    total_competitions: parseInt(summary?.total_competitions ?? '0'),
    total_matches: parseInt(summary?.total_matches ?? '0'),
    total_transfers: parseInt(summary?.total_transfers ?? '0'),
    total_users: parseInt(summary?.total_users ?? '0'),
  };

  return { 
    entity: 'global', 
    statId: 'summary', 
    data, 
    metadata: { 
        total: (data.total_fighters + data.total_regions + data.total_competitions) 
    } 
  };
}

// =============================================
// V. FONCTION PRINCIPALE EXPORTÉE
// =============================================

export async function getStats(filters: StatsFilters = {}): Promise<StatsResponse> {
  try {
    const { entity, statId } = filters;

    // Si pas d'entité, retourner les stats globales
    if (!entity) {
      return await getGlobalStats(filters);
    }

    // Dispatcher par entité
    switch (entity) {
      case 'fighters': return await getFighterStats(statId, filters);
      case 'regions': return await getRegionStats(statId, filters);
      case 'matches': return await getMatchStats(statId, filters);
      case 'competitions': return await getCompetitionStats(statId, filters);
      case 'editions': return await getEditionStats(statId, filters);
      case 'transfers': return await getTransferStats(statId, filters);
      case 'coaches': return await getCoachStats(statId, filters);
      case 'referees': return await getRefereeStats(statId, filters);
      case 'global': return await getGlobalStats(filters); // Pour un appel explicite
      default:
        throw new Error(`Entité de statistique non supportée: ${entity}`);
    }
  } catch (error) {
    console.error('Erreur dans getStats:', error);
    // Relancer l'erreur pour qu'elle soit gérée par la route Next.js
    throw error;
  }
}