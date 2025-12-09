// lib/actions/stats.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';

// Types étendus
export interface StatsFilters {
  entity?: string;
  statId?: string;
  date_from?: string;
  date_to?: string;
  region_id?: number;
  edition_id?: number;
  competition_id?: number;
  year?: number;
  month?: number;
  group_by?: 'day' | 'week' | 'month' | 'year' | 'quarter';
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface StatsResponse {
  entity: string;
  statId?: string;
  data: any;
  metadata?: {
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface GlobalStats {
  total_fighters: number;
  active_fighters: number;
  champions: number;
  total_regions: number;
  total_competitions: number;
  active_competitions: number;
  total_editions: number;
  ongoing_editions: number;
  total_matches: number;
  upcoming_matches: number;
  completed_matches: number;
  total_coaches: number;
  total_referees: number;
  total_transfers: number;
  total_users: number;
  active_users: number;
  total_articles: number;
  published_articles: number;
  total_videos: number;
  total_notifications: number;
  unread_notifications: number;
  total_messages: number;
}

// =============================================
// FONCTIONS D'AIDE
// =============================================

function buildWhereClause(filters: StatsFilters): string {
  const conditions: string[] = [];

  if (filters.date_from) {
    conditions.push(`created_at >= '${filters.date_from}'`);
  }
  if (filters.date_to) {
    conditions.push(`created_at <= '${filters.date_to}'`);
  }
  if (filters.region_id) {
    conditions.push(`region_id = ${filters.region_id}`);
  }
  if (filters.competition_id) {
    conditions.push(`competition_id = ${filters.competition_id}`);
  }
  if (filters.edition_id) {
    conditions.push(`edition_id = ${filters.edition_id}`);
  }
  if (filters.year) {
    conditions.push(`EXTRACT(YEAR FROM created_at) = ${filters.year}`);
  }
  if (filters.month) {
    conditions.push(`EXTRACT(MONTH FROM created_at) = ${filters.month}`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

// =============================================
// I. STATISTIQUES GLOBALES COMPLÈTES
// =============================================

export async function getGlobalStats(filters: StatsFilters = {}): Promise<GlobalStats> {
  try {
    // Requêtes parallèles corrigées selon vos tables
    const [
      fightersStats,
      regionsStats,
      competitionsStats,
      matchesStats,
      transfersStats,
      usersStats,
      articlesStats,
      videosStats,
      notificationsStats,
      messagesStats,
      coachesStats,
      refereesStats,
      editionsStats
    ] = await Promise.all([
      // Fighters - TABLE CORRECTE
      queryOne<{
        total: string;
        active: string;
        champions: string;
        avg_age: string;
        avg_weight: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_champion = true) as champions,
          AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) as avg_age,
          AVG(weight) as avg_weight
        FROM fighters
      `),

      // Regions - TABLE CORRECTE
      queryOne<{
        total: string;
        total_fighters: string;
        total_champions: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(total_fighters), 0) as total_fighters,
          COALESCE(SUM(total_champions), 0) as total_champions
        FROM regions
      `),

      // Competitions - CORRIGÉ: utiliser status au lieu de is_active
      queryOne<{
        total: string;
        active: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status != 'completed' AND status != 'cancelled') as active
        FROM competitions
      `),

      // Matches - CORRIGÉ: pas de colonne 'active' dans votre table
      queryOne<{
        total: string;
        upcoming: string;
        completed: string;
        live: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'live') as live
        FROM matches
      `),

      // Transfers - TABLE CORRECTE
      queryOne<{
        total: string;
        approved: string;
        pending: string;
        total_fees: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COALESCE(SUM(transfer_fee), 0) as total_fees
        FROM fighter_transfers
      `),

      // Users - CORRIGÉ: utiliser is_active au lieu de status
      queryOne<{
        total: string;
        active: string;
        verified: string;
        admins: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_verified = true) as verified,
          COUNT(*) FILTER (WHERE role = 'admin') as admins
        FROM users
      `),

      // Articles - TABLE CORRECTE
      queryOne<{
        total: string;
        published: string;
        views: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'published') as published,
          COALESCE(SUM(view_count), 0) as views
        FROM articles
      `),

      // Videos - TABLE CORRECTE (pas de status, utiliser is_featured ou published_at)
      queryOne<{
        total: string;
        views: string;
        likes: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(view_count), 0) as views,
          COALESCE(SUM(like_count), 0) as likes
        FROM videos
      `),

      // Notifications - TABLE CORRECTE
      queryOne<{
        total: string;
        unread: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_read = false) as unread
        FROM notifications
      `),

      // Messages - TABLE CORRECTE
      queryOne<{
        total: string;
      }>(`
        SELECT COUNT(*) as total FROM messages
      `),

      // Coaches - CORRIGÉ: utiliser is_active au lieu de status
      queryOne<{
        total: string;
        active: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM coaches
      `),

      // Referees - CORRIGÉ: utiliser is_active au lieu de status
      queryOne<{
        total: string;
        active: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM referees
      `),

      // Editions - CORRIGÉ: pas de colonne 'status' dans competition_editions
      queryOne<{
        total: string;
        ongoing: string;
        upcoming: string;
        completed: string;
        total_participants: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as ongoing,
          COUNT(*) FILTER (WHERE start_date > CURRENT_DATE) as upcoming,
          COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as completed,
          COALESCE(SUM(total_participants), 0) as total_participants
        FROM competition_editions
      `)
    ]);

    return {
      total_fighters: parseInt(fightersStats?.total || '0'),
      active_fighters: parseInt(fightersStats?.active || '0'),
      champions: parseInt(fightersStats?.champions || '0'),
      total_regions: parseInt(regionsStats?.total || '0'),
      total_competitions: parseInt(competitionsStats?.total || '0'),
      active_competitions: parseInt(competitionsStats?.active || '0'),
      total_editions: parseInt(editionsStats?.total || '0'),
      ongoing_editions: parseInt(editionsStats?.ongoing || '0'),
      total_matches: parseInt(matchesStats?.total || '0'),
      upcoming_matches: parseInt(matchesStats?.upcoming || '0'),
      completed_matches: parseInt(matchesStats?.completed || '0'),
      total_coaches: parseInt(coachesStats?.total || '0'),
      total_referees: parseInt(refereesStats?.total || '0'),
      total_transfers: parseInt(transfersStats?.total || '0'),
      total_users: parseInt(usersStats?.total || '0'),
      active_users: parseInt(usersStats?.active || '0'),
      total_articles: parseInt(articlesStats?.total || '0'),
      published_articles: parseInt(articlesStats?.published || '0'),
      total_videos: parseInt(videosStats?.total || '0'),
      total_notifications: parseInt(notificationsStats?.total || '0'),
      unread_notifications: parseInt(notificationsStats?.unread || '0'),
      total_messages: parseInt(messagesStats?.total || '0')
    };
  } catch (error) {
    console.error('Error in getGlobalStats:', error);
    throw error;
  }
}




// =============================================
// II. STATISTIQUES PAR ENTITÉ
// =============================================

export async function getUserStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);

  const statId = filters.statId;

  switch (statId) {
    case 'roles':
      const roles = await query<{
        role: string;
        count: string;
        percentage: string;
      }>(`
        SELECT 
          role,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM users
        ${whereClause}
        GROUP BY role
        ORDER BY count DESC
      `);
      return {
        entity: 'users',
        statId: 'roles',
        data: roles.map(r => ({
          role: r.role,
          count: parseInt(r.count),
          percentage: parseFloat(r.percentage)
        }))
      };

    case 'status':
      const status = await query<{
        status: string;
        count: string;
      }>(`
        SELECT 
          CASE 
            WHEN is_active = true AND is_verified = true THEN 'Active & Verified'
            WHEN is_active = true AND is_verified = false THEN 'Active & Unverified'
            WHEN is_active = false THEN 'Inactive'
            ELSE 'Unknown'
          END as status,
          COUNT(*) as count
        FROM users
        ${whereClause}
        GROUP BY status
        ORDER BY count DESC
      `);
      return {
        entity: 'users',
        statId: 'status',
        data: status.map(s => ({
          status: s.status,
          count: parseInt(s.count)
        }))
      };

    case 'growth':
      const growth = await query<{
        period: string;
        count: string;
      }>(`
        SELECT 
          DATE_TRUNC('${filters.group_by || 'month'}', created_at) as period,
          COUNT(*) as count
        FROM users
        ${whereClause}
        GROUP BY DATE_TRUNC('${filters.group_by || 'month'}', created_at)
        ORDER BY period
      `);
      return {
        entity: 'users',
        statId: 'growth',
        data: growth.map(g => ({
          period: g.period,
          count: parseInt(g.count)
        }))
      };

    case 'countries':
      const countries = await query<{
        country: string;
        count: string;
      }>(`
        SELECT 
          COALESCE(country, 'Unknown') as country,
          COUNT(*) as count
        FROM users
        ${whereClause}
        GROUP BY country
        ORDER BY count DESC
        ${filters.limit ? `LIMIT ${filters.limit}` : ''}
      `);
      return {
        entity: 'users',
        statId: 'countries',
        data: countries.map(c => ({
          country: c.country,
          count: parseInt(c.count)
        }))
      };

    default:
      const summary = await queryOne<{
        total: string;
        active: string;
        verified: string;
        admins: string;
        moderators: string;
        editors: string;
        last_month: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_verified = true) as verified,
          COUNT(*) FILTER (WHERE role = 'admin') as admins,
          COUNT(*) FILTER (WHERE role = 'moderator') as moderators,
          COUNT(*) FILTER (WHERE role = 'editor') as editors,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 month') as last_month
        FROM users
        ${whereClause}
      `);
      
      return {
        entity: 'users',
        statId: 'summary',
        data: summary ? {
          total: parseInt(summary.total),
          active: parseInt(summary.active),
          verified: parseInt(summary.verified),
          admins: parseInt(summary.admins),
          moderators: parseInt(summary.moderators),
          editors: parseInt(summary.editors),
          last_month: parseInt(summary.last_month)
        } : null,
        metadata: { total: parseInt(summary?.total || '0') }
      };
  }
}

// 1. Statistiques des Compétitions
export async function getCompetitionStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);
  
  // Statistiques de base corrigées selon votre table
  const baseStats = await queryOne<{
    total: string;
    upcoming: string;
    ongoing: string;
    completed: string;
    cancelled: string;
    postponed: string;
  }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
      COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COUNT(*) FILTER (WHERE status = 'postponed') as postponed
    FROM competitions
    ${whereClause}
  `);

  const statId = filters.statId;
  
  switch (statId) {
    case 'editions':
      const editions = await query<{
        competition_name: string;
        edition_count: string;
        total_participants: string;
        total_prize: string;
      }>(`
        SELECT 
          c.name as competition_name,
          COUNT(ce.id) as edition_count,
          COALESCE(SUM(ce.total_participants), 0) as total_participants,
          COALESCE(SUM(ce.prize_pool), 0) as total_prize
        FROM competitions c
        LEFT JOIN competition_editions ce ON c.id = ce.competition_id
        GROUP BY c.id, c.name
        ORDER BY edition_count DESC
        ${filters.limit ? `LIMIT ${filters.limit}` : ''}
      `);
      return {
        entity: 'competitions',
        statId: 'editions',
        data: editions.map(e => ({
          name: e.competition_name,
          editions: parseInt(e.edition_count),
          participants: parseInt(e.total_participants),
          prize_pool: parseFloat(e.total_prize)
        })),
        metadata: { total: parseInt(baseStats?.total || '0') }
      };

    case 'timeline':
      const timeline = await query<{
        period: string;
        count: string;
      }>(`
        SELECT 
          DATE_TRUNC('${filters.group_by || 'month'}', created_at) as period,
          COUNT(*) as count
        FROM competitions
        ${whereClause}
        GROUP BY DATE_TRUNC('${filters.group_by || 'month'}', created_at)
        ORDER BY period
      `);
      return {
        entity: 'competitions',
        statId: 'timeline',
        data: timeline.map(t => ({
          period: t.period,
          count: parseInt(t.count)
        })),
        metadata: { total: parseInt(baseStats?.total || '0') }
      };

    case 'status':
      return {
        entity: 'competitions',
        statId: 'status',
        data: {
          total: parseInt(baseStats?.total || '0'),
          upcoming: parseInt(baseStats?.upcoming || '0'),
          ongoing: parseInt(baseStats?.ongoing || '0'),
          completed: parseInt(baseStats?.completed || '0'),
          cancelled: parseInt(baseStats?.cancelled || '0'),
          postponed: parseInt(baseStats?.postponed || '0')
        },
        metadata: { total: parseInt(baseStats?.total || '0') }
      };

    default:
      return {
        entity: 'competitions',
        statId: 'summary',
        data: baseStats ? {
          total: parseInt(baseStats.total),
          upcoming: parseInt(baseStats.upcoming),
          ongoing: parseInt(baseStats.ongoing),
          completed: parseInt(baseStats.completed),
          cancelled: parseInt(baseStats.cancelled),
          postponed: parseInt(baseStats.postponed)
        } : null,
        metadata: { total: parseInt(baseStats?.total || '0') }
      };
  }
}

// 2. Statistiques des Lutteurs
export async function getFighterStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);
  
  const statId = filters.statId;
  
  switch (statId) {
    case 'regions':
      const byRegion = await query<{
        region_name: string;
        fighter_count: string;
        champions: string;
        avg_ranking: string;
      }>(`
        SELECT 
          r.name as region_name,
          COUNT(f.id) as fighter_count,
          COUNT(f.id) FILTER (WHERE f.is_champion = true) as champions,
          AVG(f.ranking) FILTER (WHERE f.ranking > 0) as avg_ranking
        FROM fighters f
        LEFT JOIN regions r ON f.region_id = r.id
        GROUP BY r.id, r.name
        ORDER BY fighter_count DESC
      `);
      return {
        entity: 'fighters',
        statId: 'regions',
        data: byRegion.map(r => ({
          region: r.region_name,
          fighters: parseInt(r.fighter_count),
          champions: parseInt(r.champions),
          avg_ranking: parseFloat(r.avg_ranking || '0').toFixed(1)
        }))
      };

    case 'ranking':
      const ranking = await query<{
        ranking_range: string;
        count: string;
      }>(`
        SELECT 
          CASE 
            WHEN ranking = 0 THEN 'Non classé'
            WHEN ranking <= 10 THEN 'Top 10'
            WHEN ranking <= 50 THEN 'Top 50'
            WHEN ranking <= 100 THEN 'Top 100'
            ELSE 'Au-delà 100'
          END as ranking_range,
          COUNT(*) as count
        FROM fighters
        WHERE is_active = true
        GROUP BY ranking_range
        ORDER BY 
          CASE ranking_range
            WHEN 'Top 10' THEN 1
            WHEN 'Top 50' THEN 2
            WHEN 'Top 100' THEN 3
            WHEN 'Au-delà 100' THEN 4
            ELSE 5
          END
      `);
      return {
        entity: 'fighters',
        statId: 'ranking',
        data: ranking.map(r => ({
          range: r.ranking_range,
          count: parseInt(r.count)
        }))
      };

    case 'growth':
      const growth = await query<{
        year: string;
        count: string;
      }>(`
        SELECT 
          EXTRACT(YEAR FROM created_at) as year,
          COUNT(*) as count
        FROM fighters
        GROUP BY EXTRACT(YEAR FROM created_at)
        ORDER BY year
      `);
      return {
        entity: 'fighters',
        statId: 'growth',
        data: growth.map(g => ({
          year: g.year,
          count: parseInt(g.count)
        }))
      };

    case 'weight_classes':
      const weightClasses = await query<{
        weight_class: string;
        count: string;
      }>(`
        SELECT 
          CASE 
            WHEN weight < 60 THEN '< 60 kg'
            WHEN weight BETWEEN 60 AND 70 THEN '60-70 kg'
            WHEN weight BETWEEN 71 AND 80 THEN '71-80 kg'
            WHEN weight BETWEEN 81 AND 90 THEN '81-90 kg'
            WHEN weight BETWEEN 91 AND 100 THEN '91-100 kg'
            WHEN weight > 100 THEN '> 100 kg'
            ELSE 'Non renseigné'
          END as weight_class,
          COUNT(*) as count
        FROM fighters
        WHERE is_active = true
        GROUP BY weight_class
        ORDER BY 
          CASE weight_class
            WHEN '< 60 kg' THEN 1
            WHEN '60-70 kg' THEN 2
            WHEN '71-80 kg' THEN 3
            WHEN '81-90 kg' THEN 4
            WHEN '91-100 kg' THEN 5
            WHEN '> 100 kg' THEN 6
            ELSE 7
          END
      `);
      return {
        entity: 'fighters',
        statId: 'weight_classes',
        data: weightClasses.map(w => ({
          class: w.weight_class,
          count: parseInt(w.count)
        }))
      };

    default:
      const summary = await queryOne<{
        total: string;
        active: string;
        champions: string;
        avg_age: string;
        avg_weight: string;
        avg_height: string;
        avg_experience: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_champion = true) as champions,
          AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) as avg_age,
          AVG(weight) as avg_weight,
          AVG(height) as avg_height,
          AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, MAKE_DATE(debut_year, 1, 1)))) as avg_experience
        FROM fighters
        ${whereClause}
      `);
      
      return {
        entity: 'fighters',
        statId: 'summary',
        data: summary ? {
          total: parseInt(summary.total),
          active: parseInt(summary.active),
          champions: parseInt(summary.champions),
          avg_age: parseFloat(summary.avg_age || '0').toFixed(1),
          avg_weight: parseFloat(summary.avg_weight || '0').toFixed(1),
          avg_height: parseFloat(summary.avg_height || '0').toFixed(1),
          avg_experience: parseFloat(summary.avg_experience || '0').toFixed(1)
        } : null,
        metadata: { total: parseInt(summary?.total || '0') }
      };
  }
}

// 3. Statistiques des Régions
export async function getRegionStats(filters: StatsFilters = {}) {
  const statId = filters.statId;
  
  switch (statId) {
    case 'performance':
      const performance = await query<{
        region_name: string;
        fighters: string;
        champions: string;
        matches_won: string;
        win_rate: string;
        total_points: string;
      }>(`
        SELECT 
          r.name as region_name,
          r.total_fighters as fighters,
          r.total_champions as champions,
          COUNT(m.id) FILTER (WHERE m.winner_fighter_id IS NOT NULL AND f.region_id = r.id) as matches_won,
          ROUND(
            COUNT(m.id) FILTER (WHERE m.winner_fighter_id IS NOT NULL AND f.region_id = r.id) * 100.0 / 
            NULLIF(COUNT(DISTINCT m.id) FILTER (WHERE f1.region_id = r.id OR f2.region_id = r.id), 0),
            2
          ) as win_rate,
          COALESCE(SUM(ft.transfer_fee), 0) as total_points
        FROM regions r
        LEFT JOIN fighters f ON f.region_id = r.id
        LEFT JOIN matches m ON m.winner_fighter_id = f.id
        LEFT JOIN matches m2 ON (m2.fighter1_id = f.id OR m2.fighter2_id = f.id)
        LEFT JOIN fighters f1 ON m2.fighter1_id = f1.id
        LEFT JOIN fighters f2 ON m2.fighter2_id = f2.id
        LEFT JOIN fighter_transfers ft ON ft.to_region_id = r.id AND ft.status = 'approved'
        GROUP BY r.id, r.name, r.total_fighters, r.total_champions
        ORDER BY fighters DESC
      `);
      return {
        entity: 'regions',
        statId: 'performance',
        data: performance.map(p => ({
          region: p.region_name,
          fighters: parseInt(p.fighters),
          champions: parseInt(p.champions),
          matches_won: parseInt(p.matches_won),
          win_rate: parseFloat(p.win_rate || '0'),
          total_points: parseFloat(p.total_points)
        }))
      };

    case 'infrastructure':
      const infrastructure = await query<{
        region_name: string;
        stadium_name: string;
        total_fighters: string;
        stadium_capacity: string;
      }>(`
        SELECT 
          r.name as region_name,
          r.stadium_name,
          r.total_fighters,
          '10000' as stadium_capacity -- À remplacer par un champ réel si disponible
        FROM regions r
        ORDER BY r.total_fighters DESC
      `);
      return {
        entity: 'regions',
        statId: 'infrastructure',
        data: infrastructure.map(i => ({
          region: i.region_name,
          stadium: i.stadium_name,
          fighters: parseInt(i.total_fighters),
          capacity: parseInt(i.stadium_capacity)
        }))
      };

    case 'transfer_flow':
      const transferFlow = await query<{
        from_region: string;
        to_region: string;
        transfer_count: string;
        total_fees: string;
      }>(`
        SELECT 
          fr.name as from_region,
          tr.name as to_region,
          COUNT(ft.id) as transfer_count,
          COALESCE(SUM(ft.transfer_fee), 0) as total_fees
        FROM fighter_transfers ft
        JOIN regions fr ON ft.from_region_id = fr.id
        JOIN regions tr ON ft.to_region_id = tr.id
        WHERE ft.status = 'approved'
        GROUP BY fr.name, tr.name
        ORDER BY transfer_count DESC
        LIMIT 20
      `);
      return {
        entity: 'regions',
        statId: 'transfer_flow',
        data: transferFlow.map(t => ({
          from: t.from_region,
          to: t.to_region,
          transfers: parseInt(t.transfer_count),
          total_fees: parseFloat(t.total_fees)
        }))
      };

    default:
      const summary = await queryOne<{
        total: string;
        avg_fighters: string;
        max_fighters: string;
        min_fighters: string;
        total_champions: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          AVG(total_fighters) as avg_fighters,
          MAX(total_fighters) as max_fighters,
          MIN(total_fighters) as min_fighters,
          SUM(total_champions) as total_champions
        FROM regions
      `);
      
      const regions = await query<{
        name: string;
        fighters: string;
        champions: string;
        code: string;
      }>(`
        SELECT name, total_fighters as fighters, total_champions as champions, code
        FROM regions
        ORDER BY total_fighters DESC
        LIMIT 10
      `);
      
      return {
        entity: 'regions',
        statId: 'summary',
        data: {
          summary: summary ? {
            total: parseInt(summary.total),
            avg_fighters: parseFloat(summary.avg_fighters || '0').toFixed(1),
            max_fighters: parseInt(summary.max_fighters || '0'),
            min_fighters: parseInt(summary.min_fighters || '0'),
            total_champions: parseInt(summary.total_champions || '0')
          } : null,
          top_regions: regions.map(r => ({
            name: r.name,
            fighters: parseInt(r.fighters),
            champions: parseInt(r.champions),
            code: r.code
          }))
        },
        metadata: { total: parseInt(summary?.total || '0') }
      };
  }
}

// 4. Statistiques des Matchs
export async function getMatchStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);
  
  const statId = filters.statId;
  
  switch (statId) {
    case 'timeline':
      const timeline = await query<{
        period: string;
        count: string;
        avg_duration: string;
      }>(`
        SELECT 
          DATE_TRUNC('${filters.group_by || 'month'}', match_date) as period,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM total_duration)/60) as avg_duration
        FROM matches
        ${whereClause}
        GROUP BY DATE_TRUNC('${filters.group_by || 'month'}', match_date)
        ORDER BY period
      `);
      return {
        entity: 'matches',
        statId: 'timeline',
        data: timeline.map(t => ({
          period: t.period,
          count: parseInt(t.count),
          avg_duration: parseFloat(t.avg_duration || '0').toFixed(1)
        }))
      };

    case 'results':
      const results = await query<{
        result_type: string;
        count: string;
        percentage: string;
      }>(`
        SELECT 
          match_result as result_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM matches
        WHERE match_result IS NOT NULL
        ${whereClause}
        GROUP BY match_result
        ORDER BY count DESC
      `);
      return {
        entity: 'matches',
        statId: 'results',
        data: results.map(r => ({
          result: r.result_type,
          count: parseInt(r.count),
          percentage: parseFloat(r.percentage)
        }))
      };

    case 'duration':
      const duration = await query<{
        duration_range: string;
        count: string;
      }>(`
        SELECT 
          CASE 
            WHEN EXTRACT(EPOCH FROM total_duration)/60 < 5 THEN '< 5 min'
            WHEN EXTRACT(EPOCH FROM total_duration)/60 BETWEEN 5 AND 10 THEN '5-10 min'
            WHEN EXTRACT(EPOCH FROM total_duration)/60 BETWEEN 11 AND 20 THEN '11-20 min'
            WHEN EXTRACT(EPOCH FROM total_duration)/60 BETWEEN 21 AND 30 THEN '21-30 min'
            WHEN EXTRACT(EPOCH FROM total_duration)/60 > 30 THEN '> 30 min'
            ELSE 'Inconnu'
          END as duration_range,
          COUNT(*) as count
        FROM matches
        WHERE total_duration IS NOT NULL
        GROUP BY duration_range
        ORDER BY 
          CASE duration_range
            WHEN '< 5 min' THEN 1
            WHEN '5-10 min' THEN 2
            WHEN '11-20 min' THEN 3
            WHEN '21-30 min' THEN 4
            WHEN '> 30 min' THEN 5
            ELSE 6
          END
      `);
      return {
        entity: 'matches',
        statId: 'duration',
        data: duration.map(d => ({
          range: d.duration_range,
          count: parseInt(d.count)
        }))
      };

    case 'regions':
      const byRegion = await query<{
        region_name: string;
        match_count: string;
        win_count: string;
        win_rate: string;
      }>(`
        SELECT 
          r.name as region_name,
          COUNT(m.id) as match_count,
          COUNT(m.id) FILTER (WHERE m.winner_fighter_id = f.id) as win_count,
          ROUND(
            COUNT(m.id) FILTER (WHERE m.winner_fighter_id = f.id) * 100.0 / 
            NULLIF(COUNT(m.id), 0),
            2
          ) as win_rate
        FROM matches m
        JOIN fighters f ON (m.fighter1_id = f.id OR m.fighter2_id = f.id)
        JOIN regions r ON f.region_id = r.id
        ${whereClause}
        GROUP BY r.id, r.name
        ORDER BY match_count DESC
      `);
      return {
        entity: 'matches',
        statId: 'regions',
        data: byRegion.map(r => ({
          region: r.region_name,
          matches: parseInt(r.match_count),
          wins: parseInt(r.win_count),
          win_rate: parseFloat(r.win_rate || '0')
        }))
      };

    default:
      const summary = await queryOne<{
        total: string;
        scheduled: string;
        live: string;
        completed: string;
        cancelled: string;
        postponed: string;
        avg_audience: string;
        total_audience: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
          COUNT(*) FILTER (WHERE status = 'live') as live,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE status = 'postponed') as postponed,
          AVG(audience_count) as avg_audience,
          SUM(audience_count) as total_audience
        FROM matches
        ${whereClause}
      `);
      
      return {
        entity: 'matches',
        statId: 'summary',
        data: summary ? {
          total: parseInt(summary.total),
          scheduled: parseInt(summary.scheduled),
          live: parseInt(summary.live),
          completed: parseInt(summary.completed),
          cancelled: parseInt(summary.cancelled),
          postponed: parseInt(summary.postponed),
          avg_audience: parseFloat(summary.avg_audience || '0').toFixed(0),
          total_audience: parseInt(summary.total_audience || '0')
        } : null,
        metadata: { total: parseInt(summary?.total || '0') }
      };
  }
}

// 5. Statistiques des Transfers
export async function getTransferStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);
  
  const statId = filters.statId;
  
  switch (statId) {
    case 'timeline':
      const timeline = await query<{
        period: string;
        count: string;
        total_fees: string;
        avg_fee: string;
      }>(`
        SELECT 
          DATE_TRUNC('${filters.group_by || 'month'}', transfer_date) as period,
          COUNT(*) as count,
          COALESCE(SUM(transfer_fee), 0) as total_fees,
          AVG(transfer_fee) as avg_fee
        FROM fighter_transfers
        WHERE status = 'approved'
        ${whereClause}
        GROUP BY DATE_TRUNC('${filters.group_by || 'month'}', transfer_date)
        ORDER BY period
      `);
      return {
        entity: 'transfers',
        statId: 'timeline',
        data: timeline.map(t => ({
          period: t.period,
          count: parseInt(t.count),
          total_fees: parseFloat(t.total_fees),
          avg_fee: parseFloat(t.avg_fee || '0')
        }))
      };

    case 'status':
      const status = await query<{
        status: string;
        count: string;
        total_fees: string;
        avg_fee: string;
      }>(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(transfer_fee), 0) as total_fees,
          AVG(transfer_fee) as avg_fee
        FROM fighter_transfers
        ${whereClause}
        GROUP BY status
        ORDER BY count DESC
      `);
      return {
        entity: 'transfers',
        statId: 'status',
        data: status.map(s => ({
          status: s.status,
          count: parseInt(s.count),
          total_fees: parseFloat(s.total_fees),
          avg_fee: parseFloat(s.avg_fee || '0')
        }))
      };

    case 'seasonal':
      const seasonal = await query<{
        month: string;
        count: string;
        total_fees: string;
      }>(`
        SELECT 
          EXTRACT(MONTH FROM transfer_date) as month,
          COUNT(*) as count,
          COALESCE(SUM(transfer_fee), 0) as total_fees
        FROM fighter_transfers
        WHERE status = 'approved'
        ${whereClause}
        GROUP BY EXTRACT(MONTH FROM transfer_date)
        ORDER BY month
      `);
      return {
        entity: 'transfers',
        statId: 'seasonal',
        data: seasonal.map(s => ({
          month: s.month,
          count: parseInt(s.count),
          total_fees: parseFloat(s.total_fees)
        }))
      };

    default:
      const summary = await queryOne<{
        total: string;
        pending: string;
        approved: string;
        rejected: string;
        completed: string;
        total_fees: string;
        avg_fee: string;
        max_fee: string;
        min_fee: string;
        avg_duration: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COALESCE(SUM(transfer_fee), 0) as total_fees,
          AVG(transfer_fee) as avg_fee,
          MAX(transfer_fee) as max_fee,
          MIN(transfer_fee) as min_fee,
          AVG(contract_duration) as avg_duration
        FROM fighter_transfers
        ${whereClause}
      `);
      
      const recentTransfers = await query<{
        fighter_name: string;
        from_region: string;
        to_region: string;
        fee: string;
        date: string;
      }>(`
        SELECT 
          CONCAT(f.first_name, ' ', f.last_name) as fighter_name,
          fr.name as from_region,
          tr.name as to_region,
          ft.transfer_fee as fee,
          ft.transfer_date as date
        FROM fighter_transfers ft
        JOIN fighters f ON ft.fighter_id = f.id
        JOIN regions fr ON ft.from_region_id = fr.id
        JOIN regions tr ON ft.to_region_id = tr.id
        WHERE ft.status = 'approved'
        ORDER BY ft.transfer_date DESC
        LIMIT 10
      `);
      
      return {
        entity: 'transfers',
        statId: 'summary',
        data: {
          summary: summary ? {
            total: parseInt(summary.total),
            pending: parseInt(summary.pending),
            approved: parseInt(summary.approved),
            rejected: parseInt(summary.rejected),
            completed: parseInt(summary.completed),
            total_fees: parseFloat(summary.total_fees),
            avg_fee: parseFloat(summary.avg_fee || '0'),
            max_fee: parseFloat(summary.max_fee || '0'),
            min_fee: parseFloat(summary.min_fee || '0'),
            avg_duration: parseFloat(summary.avg_duration || '0').toFixed(1)
          } : null,
          recent: recentTransfers.map(t => ({
            fighter: t.fighter_name,
            from: t.from_region,
            to: t.to_region,
            fee: parseFloat(t.fee || '0'),
            date: t.date
          }))
        },
        metadata: { total: parseInt(summary?.total || '0') }
      };
  }
}

// 6. Statistiques des Médias
export async function getMediaStats(filters: StatsFilters = {}) {
  const whereClause = buildWhereClause(filters);
  
  const statId = filters.statId;
  
  switch (statId) {
    case 'articles':
      const articles = await query<{
        status: string;
        count: string;
        total_views: string;
        avg_views: string;
      }>(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(view_count), 0) as total_views,
          COALESCE(AVG(view_count), 0) as avg_views
        FROM articles
        ${whereClause}
        GROUP BY status
        ORDER BY count DESC
      `);
      
      const topArticles = await query<{
        title: string;
        views: string;
        likes: string;
        author: string;
        published_at: string;
      }>(`
        SELECT 
          a.title,
          a.view_count as views,
          a.like_count as likes,
          u.username as author,
          a.published_at
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.status = 'published'
        ORDER BY a.view_count DESC
        LIMIT 10
      `);
      
      return {
        entity: 'media',
        statId: 'articles',
        data: {
          by_status: articles.map(a => ({
            status: a.status,
            count: parseInt(a.count),
            total_views: parseInt(a.total_views || '0'),
            avg_views: parseFloat(a.avg_views || '0').toFixed(1)
          })),
          top_articles: topArticles.map(a => ({
            title: a.title,
            views: parseInt(a.views),
            likes: parseInt(a.likes),
            author: a.author,
            published_at: a.published_at
          }))
        }
      };

    case 'videos':
      // Correction: pas de status dans videos, utiliser published_at
      const videos = await query<{
        category: string;
        count: string;
        total_views: string;
        avg_views: string;
        total_likes: string;
      }>(`
        SELECT 
          category,
          COUNT(*) as count,
          COALESCE(SUM(view_count), 0) as total_views,
          COALESCE(AVG(view_count), 0) as avg_views,
          COALESCE(SUM(like_count), 0) as total_likes
        FROM videos
        ${whereClause}
        GROUP BY category
        ORDER BY count DESC
      `);
      
      const topVideos = await query<{
        title: string;
        views: string;
        likes: string;
        category: string;
        duration: string;
      }>(`
        SELECT 
          title,
          COALESCE(view_count, 0) as views,
          COALESCE(like_count, 0) as likes,
          category,
          duration
        FROM videos
        ORDER BY view_count DESC
        LIMIT 10
      `);
      
      return {
        entity: 'media',
        statId: 'videos',
        data: {
          by_category: videos.map(v => ({
            category: v.category,
            count: parseInt(v.count),
            total_views: parseInt(v.total_views || '0'),
            avg_views: parseFloat(v.avg_views || '0').toFixed(1),
            total_likes: parseInt(v.total_likes || '0')
          })),
          top_videos: topVideos.map(v => ({
            title: v.title,
            views: parseInt(v.views),
            likes: parseInt(v.likes),
            category: v.category,
            duration: parseInt(v.duration || '0')
          }))
        }
      };

    default:
      const summary = await queryOne<{
        total_articles: string;
        published_articles: string;
        total_videos: string;
        total_views: string;
        total_likes: string;
        total_media: string;
      }>(`
        SELECT 
          (SELECT COUNT(*) FROM articles) as total_articles,
          (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_articles,
          (SELECT COUNT(*) FROM videos) as total_videos,
          (SELECT COALESCE(SUM(view_count), 0) FROM articles) + 
          (SELECT COALESCE(SUM(view_count), 0) FROM videos) as total_views,
          (SELECT COALESCE(SUM(like_count), 0) FROM articles) + 
          (SELECT COALESCE(SUM(like_count), 0) FROM videos) as total_likes,
          (SELECT COUNT(*) FROM media) as total_media
      `);
      
      return {
        entity: 'media',
        statId: 'summary',
        data: summary ? {
          total_articles: parseInt(summary.total_articles),
          published_articles: parseInt(summary.published_articles),
          total_videos: parseInt(summary.total_videos),
          total_views: parseInt(summary.total_views || '0'),
          total_likes: parseInt(summary.total_likes || '0'),
          total_media: parseInt(summary.total_media)
        } : null,
        metadata: { total: parseInt(summary?.total_articles || '0') + parseInt(summary?.total_videos || '0') }
      };
  }
}

// =============================================
// III. DERNIÈRES ACTIVITÉS
// =============================================

export interface RecentActivity {
  id: number;
  type: 'match' | 'fighter' | 'transfer' | 'article' | 'video' | 'user' | 'competition' | 'edition';
  action: string;
  description: string;
  entity_id: number;
  user_id?: number;
  user_name?: string;
  timestamp: string;
  icon: string;
  color: string;
}

export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Requête corrigée avec types cohérents
    const activities = await query<any>(`
      (
        -- Matchs récents
        SELECT 
          id::text,
          'match' as type,
          CASE 
            WHEN status = 'completed' THEN 'match_completed'
            WHEN status = 'live' THEN 'match_started'
            WHEN status = 'scheduled' THEN 'match_scheduled'
            ELSE 'match_updated'
          END as action,
          'Match ' || COALESCE(match_number::text, 'N°' || id::text) || ' - ' || 
          COALESCE((SELECT CONCAT(first_name, ' ', last_name) FROM fighters WHERE id = fighter1_id), 'Fighter 1') || ' vs ' ||
          COALESCE((SELECT CONCAT(first_name, ' ', last_name) FROM fighters WHERE id = fighter2_id), 'Fighter 2') as description,
          id::text as entity_id,
          NULL::text as user_id,
          'system' as user_name,
          COALESCE(updated_at, created_at) as timestamp,
          CASE 
            WHEN status = 'completed' THEN '🏆'
            WHEN status = 'live' THEN '🔴'
            ELSE '📅'
          END as icon,
          CASE 
            WHEN status = 'completed' THEN 'text-green-600'
            WHEN status = 'live' THEN 'text-red-600'
            ELSE 'text-blue-600'
          END as color
        FROM matches
        WHERE COALESCE(updated_at, created_at) >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY COALESCE(updated_at, created_at) DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Nouveaux lutteurs
        SELECT 
          id::text,
          'fighter' as type,
          'fighter_registered' as action,
          'Nouveau lutteur: ' || first_name || ' ' || last_name as description,
          id::text as entity_id,
          NULL::text as user_id,
          'system' as user_name,
          created_at as timestamp,
          '🥊' as icon,
          'text-purple-600' as color
        FROM fighters
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Transferts
        SELECT 
          ft.id::text,
          'transfer' as type,
          'transfer_' || status as action,
          'Transfert: ' || f.first_name || ' ' || f.last_name || 
          ' de ' || fr.name || ' à ' || tr.name as description,
          ft.id::text as entity_id,
          ft.approved_by_user_id::text as user_id,
          COALESCE(u.username, 'system') as user_name,
          ft.created_at as timestamp,
          '🔄' as icon,
          CASE 
            WHEN status = 'approved' THEN 'text-green-600'
            WHEN status = 'pending' THEN 'text-yellow-600'
            ELSE 'text-red-600'
          END as color
        FROM fighter_transfers ft
        JOIN fighters f ON ft.fighter_id = f.id
        JOIN regions fr ON ft.from_region_id = fr.id
        JOIN regions tr ON ft.to_region_id = tr.id
        LEFT JOIN users u ON ft.approved_by_user_id = u.id
        WHERE ft.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY ft.created_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Nouveaux articles
        SELECT 
          a.id::text,
          'article' as type,
          'article_' || status as action,
          'Article: ' || title as description,
          a.id::text as entity_id,
          a.author_id::text as user_id,
          u.username as user_name,
          COALESCE(a.published_at, a.created_at) as timestamp,
          '📝' as icon,
          CASE 
            WHEN status = 'published' THEN 'text-blue-600'
            WHEN status = 'draft' THEN 'text-gray-600'
            ELSE 'text-orange-600'
          END as color
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY COALESCE(a.published_at, a.created_at) DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Nouveaux utilisateurs
        SELECT 
          id::text,
          'user' as type,
          'user_registered' as action,
          'Nouvel utilisateur: ' || username as description,
          id::text as entity_id,
          NULL::text as user_id,
          'system' as user_name,
          created_at as timestamp,
          '👤' as icon,
          'text-indigo-600' as color
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Nouveaux matchs programmés
        SELECT 
          id::text,
          'match' as type,
          'match_scheduled' as action,
          'Match programmé: ' || 
          COALESCE((SELECT CONCAT(first_name, ' ', last_name) FROM fighters WHERE id = fighter1_id), 'Fighter 1') || ' vs ' ||
          COALESCE((SELECT CONCAT(first_name, ' ', last_name) FROM fighters WHERE id = fighter2_id), 'Fighter 2') as description,
          id::text as entity_id,
          NULL::text as user_id,
          'system' as user_name,
          created_at as timestamp,
          '📅' as icon,
          'text-blue-600' as color
        FROM matches
        WHERE status = 'scheduled' 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT ${limit}
      )
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `);

    return activities.map((act: any) => ({
      id: parseInt(act.id),
      type: act.type,
      action: act.action,
      description: act.description,
      entity_id: parseInt(act.entity_id),
      user_id: act.user_id ? parseInt(act.user_id) : undefined,
      user_name: act.user_name,
      timestamp: act.timestamp,
      icon: act.icon,
      color: act.color
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

async function getEditionSummaryStats(filters: StatsFilters): Promise<StatsResponse> {
  const stats = await queryOne<{ 
    total: string; 
    active: string;
    upcoming: string;
    completed: string;
    total_participants: string 
  }>(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = true) as active,
      COUNT(*) FILTER (WHERE start_date > CURRENT_DATE) as upcoming,
      COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as completed,
      COALESCE(SUM(total_participants), 0) as total_participants
    FROM competition_editions
  `);
  
  return { 
    entity: 'editions', 
    statId: 'summary', 
    data: {
      total: parseInt(stats?.total ?? '0'),
      active: parseInt(stats?.active ?? '0'),
      upcoming: parseInt(stats?.upcoming ?? '0'),
      completed: parseInt(stats?.completed ?? '0'),
      total_participants: parseInt(stats?.total_participants ?? '0')
    }, 
    metadata: { total: parseInt(stats?.total ?? '0') } 
  };
}

// =============================================
// IV. FONCTION PRINCIPALE
// =============================================

export async function getStats(filters: StatsFilters = {}): Promise<StatsResponse> {
  try {
    const { entity, statId } = filters;

    // Si pas d'entité, retourner les stats globales
    if (!entity) {
      const globalStats = await getGlobalStats(filters);
      return {
        entity: 'global',
        statId: 'summary',
        data: globalStats,
        metadata: {
          total: Object.values(globalStats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
        }
      };
    }

    // Dispatcher par entité avec les fonctions corrigées
    switch (entity) {
      case 'fighters':
        return await getFighterStats(filters);
      case 'regions':
        return await getRegionStats(filters);
      case 'matches':
        return await getMatchStats(filters);
      case 'competitions':
        return await getCompetitionStats(filters);
      case 'transfers':
        return await getTransferStats(filters);
      case 'media':
        return await getMediaStats(filters);
      case 'editions':
        return await getEditionSummaryStats(filters);
      case 'global':
        const globalStats = await getGlobalStats(filters);
        return {
          entity: 'global',
          statId: 'summary',
          data: globalStats,
          metadata: {
            total: Object.values(globalStats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
          }
        };
      case 'recent':
        const activities = await getRecentActivities(filters.limit || 10);
        return {
          entity: 'recent',
          statId: 'activities',
          data: activities,
          metadata: { total: activities.length }
        };
      default:
        throw new Error(`Entité de statistique non supportée: ${entity}`);
    }
  } catch (error) {
    console.error('Erreur dans getStats:', error);
    throw error;
  }
}