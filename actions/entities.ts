// @/actions/entities.ts
'use server';

import { query } from '@/lib/db/neon-client';
import { 
  // Types d'entités
  Fighter, Region, Competition, CompetitionEdition, Match, 
  Referee, Phase, PhaseGroup, SubGroup, Article, Media, 
  Video, Message, Notification, User, Coach, FighterTransfer,
  Advertisement, Interaction, Belt, FighterAchievement,
  EditionFighter, EditionRegion, FighterCard,
  // Types de filtres
  FighterFilters, RegionFilters, CompetitionFilters, EditionFilters,
  MatchFilters, RefereeFilters, PhaseFilters, PhaseGroupFilters,
  SubGroupFilters, ArticleFilters, MediaFilters, VideoFilters,
  MessageFilters, NotificationFilters, UserFilters, CoachFilters,
  FighterTransferFilters, AdvertisementFilters, InteractionFilters,
  BeltFilters, FighterAchievementFilters, EditionFighterFilters,
  EditionRegionFilters, FighterCardFilters,
  // Type de réponse paginée
  PaginatedResponse,
  BaseFilters
} from '@/types';

// Type pour les entités supportées
export type EntityType = 
  | 'fighters' | 'regions' | 'competitions' | 'editions' | 'matches'
  | 'referees' | 'phases' | 'phase-groups' | 'sub-groups'
  | 'articles' | 'media' | 'videos' | 'messages' | 'notifications'
  | 'users' | 'coaches' | 'transfers' | 'advertisements' | 'interactions'
  | 'archives' | 'belts' | 'fighter-achievements' | 'edition-fighters'
  | 'edition-regions' | 'fighter-cards';

// Mapping des types d'entités vers leurs noms de table
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  fighters: 'fighters',
  regions: 'regions',
  competitions: 'competitions',
  editions: 'competition_editions',
  matches: 'matches',
  referees: 'referees',
  phases: 'phases',
  'phase-groups': 'phase_groups',
  'sub-groups': 'sub_groups',
  articles: 'articles',
  media: 'media',
  videos: 'videos',
  messages: 'messages',
  notifications: 'notifications',
  users: 'users',
  coaches: 'coaches',
  transfers: 'fighter_transfers',
  advertisements: 'advertisements',
  interactions: 'interactions',
  archives: 'fighter_achievements_archive',
  belts: 'belt',
  'fighter-achievements': 'fighter_achievements',
  'edition-fighters': 'edition_fighters',
  'edition-regions': 'edition_regions',
  'fighter-cards': 'fighter_cards',
};

// Mapping des types d'entités vers leurs jointures par défaut
const DEFAULT_RELATIONS_MAP: Partial<Record<EntityType, string[]>> = {
  fighters: ['region'],
  regions: ['fighters', 'coaches'],
  competitions: ['editions'],
  editions: ['competition', 'winner_fighter', 'winner_region', 'region'],
  matches: ['fighter1', 'fighter2', 'winner_fighter', 'loser_fighter', 'sub_group'],
  referees: ['region'],
  phases: ['edition'],
  'phase-groups': ['phase'],
  'sub-groups': ['group', 'region1', 'region2', 'belt1', 'belt2', 'main_referee'],
  articles: ['author'],
  media: ['uploader'],
  videos: [],
  messages: ['author', 'recipient', 'parent_message'],
  notifications: ['user'],
  users: [],
  coaches: ['region'],
  transfers: ['fighter', 'from_region', 'to_region', 'approved_by_user'],
  advertisements: [],
  interactions: ['user'],
  archives: ['fighter', 'region', 'edition'],
  belts: [],
  'fighter-achievements': ['fighter', 'region', 'edition'],
  'edition-fighters': ['edition', 'fighter', 'region'],
  'edition-regions': ['edition', 'region'],
  'fighter-cards': ['fighter', 'match'],
};

// Interface pour les options de requête
export interface EntityQueryOptions<TFilters = BaseFilters> {
  filters?: TFilters;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  withRelations?: boolean | string[];
  customWhere?: string;
  customParams?: any[];
}

// Interface pour le résultat de construction de requête
interface QueryBuildResult {
  sql: string;
  countSql: string;
  params: any[];
  whereClause: string;
  joins: string[];
  selectFields: string[];
}

// Classe de construction de requêtes par entité
class EntityQueryBuilder {
  private entityType: EntityType;
  private tableName: string;
  private options: EntityQueryOptions;
  private params: any[] = [];
  private whereClauses: string[] = [];
  private joins: string[] = [];
  private selectFields: string[] = [];

  constructor(entityType: EntityType, options: EntityQueryOptions = {}) {
    this.entityType = entityType;
    this.tableName = ENTITY_TABLE_MAP[entityType];
    this.options = options;
    this.selectFields = [`${this.tableName}.*`];
  }

  // Ajouter une condition WHERE
  addWhere(condition: string, value?: any): this {
    this.whereClauses.push(condition);
    if (value !== undefined) {
      this.params.push(value);
    }
    return this;
  }

  // Ajouter une jointure
  addJoin(join: string): this {
    if (!this.joins.includes(join)) {
      this.joins.push(join);
    }
    return this;
  }

  // Ajouter un champ de sélection
  addSelectField(field: string): this {
    this.selectFields.push(field);
    return this;
  }

  // Construire les relations
  buildRelations(): this {
    const { withRelations = false } = this.options;
    
    if (!withRelations) return this;

    const relations = Array.isArray(withRelations) 
      ? withRelations 
      : DEFAULT_RELATIONS_MAP[this.entityType] || [];

    switch (this.entityType) {
      case 'fighters':
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON fighters.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code,
              'color', r.color,
              'flag_image', r.flag_image,
              'stadium_name', r.stadium_name,
              'stadium_image', r.stadium_image
            ) as region
          `);
        }
        if (relations.includes('achievements')) {
          this.addSelectField(`
            (SELECT COALESCE(JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', fa.id,
                'title', fa.title,
                'year', fa.year,
                'position', fa.position,
                'medal_image', fa.medal_image
              ) ORDER BY fa.year DESC
            ), '[]'::json) FROM fighter_achievements fa WHERE fa.fighter_id = fighters.id) as achievements
          `);
        }
        break;

      case 'regions':
        if (relations.includes('fighters')) {
          this.addSelectField(`
            (SELECT COUNT(*) FROM fighters f WHERE f.region_id = regions.id AND f.is_active = true) as total_fighters
          `);
        }
        if (relations.includes('coaches')) {
          this.addSelectField(`
            (SELECT COUNT(*) FROM coaches c WHERE c.region_id = regions.id AND c.is_active = true) as total_coaches
          `);
        }
        break;

      case 'editions':
        if (relations.includes('competition')) {
          this.addJoin(`LEFT JOIN competitions c ON competition_editions.competition_id = c.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'slug', c.slug,
              'status', c.status
            ) as competition
          `);
        }
        if (relations.includes('winner_fighter')) {
          this.addJoin(`LEFT JOIN fighters wf ON competition_editions.winner_fighter_id = wf.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', wf.id,
              'first_name', wf.first_name,
              'last_name', wf.last_name,
              'nickname', wf.nickname
            ) as winner_fighter
          `);
        }
        if (relations.includes('winner_region')) {
          this.addJoin(`LEFT JOIN regions wr ON competition_editions.winner_region_id = wr.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', wr.id,
              'name', wr.name,
              'code', wr.code
            ) as winner_region
          `);
        }
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON competition_editions.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code
            ) as region
          `);
        }
        break;

      case 'matches':
        if (relations.includes('fighter1')) {
          this.addJoin(`LEFT JOIN fighters f1 ON matches.fighter1_id = f1.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f1.id,
              'first_name', f1.first_name,
              'last_name', f1.last_name,
              'nickname', f1.nickname,
              'profile_image', f1.profile_image,
              'region_id', f1.region_id
            ) as fighter1
          `);
        }
        if (relations.includes('fighter2')) {
          this.addJoin(`LEFT JOIN fighters f2 ON matches.fighter2_id = f2.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f2.id,
              'first_name', f2.first_name,
              'last_name', f2.last_name,
              'nickname', f2.nickname,
              'profile_image', f2.profile_image,
              'region_id', f2.region_id
            ) as fighter2
          `);
        }
        if (relations.includes('winner_fighter')) {
          this.addJoin(`LEFT JOIN fighters wf ON matches.winner_fighter_id = wf.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', wf.id,
              'first_name', wf.first_name,
              'last_name', wf.last_name
            ) as winner_fighter
          `);
        }
        if (relations.includes('loser_fighter')) {
          this.addJoin(`LEFT JOIN fighters lf ON matches.loser_fighter_id = lf.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', lf.id,
              'first_name', lf.first_name,
              'last_name', lf.last_name
            ) as loser_fighter
          `);
        }
        if (relations.includes('sub_group')) {
          this.addJoin(`LEFT JOIN sub_groups sg ON matches.sub_group_id = sg.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', sg.id,
              'name', sg.name,
              'group_id', sg.group_id,
              'region1_id', sg.region1_id,
              'region2_id', sg.region2_id
            ) as sub_group
          `);
        }
        break;

      case 'sub-groups':
        if (relations.includes('group')) {
          this.addJoin(`LEFT JOIN phase_groups pg ON sub_groups.group_id = pg.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'phase_id', pg.phase_id
            ) as group
          `);
        }
        if (relations.includes('region1')) {
          this.addJoin(`LEFT JOIN regions r1 ON sub_groups.region1_id = r1.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r1.id,
              'name', r1.name,
              'code', r1.code,
              'color', r1.color,
              'flag_image', r1.flag_image
            ) as region1
          `);
        }
        if (relations.includes('region2')) {
          this.addJoin(`LEFT JOIN regions r2 ON sub_groups.region2_id = r2.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r2.id,
              'name', r2.name,
              'code', r2.code,
              'color', r2.color,
              'flag_image', r2.flag_image
            ) as region2
          `);
        }
        if (relations.includes('belt1')) {
          this.addJoin(`LEFT JOIN belt b1 ON sub_groups.belt_region1 = b1.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', b1.id,
              'color', b1.color
            ) as belt1
          `);
        }
        if (relations.includes('belt2')) {
          this.addJoin(`LEFT JOIN belt b2 ON sub_groups.belt_region2 = b2.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', b2.id,
              'color', b2.color
            ) as belt2
          `);
        }
        if (relations.includes('main_referee')) {
          this.addJoin(`LEFT JOIN referees ref ON sub_groups.main_referee_id = ref.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ref.id,
              'first_name', ref.first_name,
              'last_name', ref.last_name,
              'nickname', ref.nickname,
              'profile_image', ref.profile_image
            ) as main_referee
          `);
        }
        break;

      case 'articles':
        if (relations.includes('author')) {
          this.addJoin(`LEFT JOIN users u ON articles.author_id = u.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', u.id,
              'username', u.username,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'profile_picture', u.profile_picture,
              'email', u.email
            ) as author
          `);
        }
        if (relations.includes('media')) {
          this.addSelectField(`
            (SELECT COALESCE(JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', m.id,
                'title', m.title,
                'file_path', m.file_path,
                'file_type', m.file_type,
                'mime_type', m.mime_type,
                'alt_text', m.alt_text,
                'is_featured', m.is_featured
              ) ORDER BY m.is_featured DESC
            ), '[]'::json) FROM media m WHERE m.entity_type = 'article' AND m.entity_id = articles.id) as media
          `);
        }
        break;

      case 'media':
        if (relations.includes('uploader')) {
          this.addJoin(`LEFT JOIN users u ON media.uploader_id = u.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', u.id,
              'username', u.username,
              'first_name', u.first_name,
              'last_name', u.last_name
            ) as uploader
          `);
        }
        break;

      case 'messages':
        if (relations.includes('author')) {
          this.addJoin(`LEFT JOIN users au ON messages.author_id = au.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', au.id,
              'username', au.username,
              'first_name', au.first_name,
              'last_name', au.last_name,
              'profile_picture', au.profile_picture
            ) as author
          `);
        }
        if (relations.includes('recipient')) {
          this.addJoin(`LEFT JOIN users ru ON messages.recipient_id = ru.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ru.id,
              'username', ru.username,
              'first_name', ru.first_name,
              'last_name', ru.last_name,
              'profile_picture', ru.profile_picture
            ) as recipient
          `);
        }
        if (relations.includes('parent_message')) {
          this.addJoin(`LEFT JOIN messages pm ON messages.parent_message_id = pm.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', pm.id,
              'content', pm.content,
              'author_id', pm.author_id,
              'created_at', pm.created_at
            ) as parent_message
          `);
        }
        break;

      case 'notifications':
        if (relations.includes('user')) {
          this.addJoin(`LEFT JOIN users u ON notifications.user_id = u.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', u.id,
              'username', u.username,
              'email', u.email
            ) as user
          `);
        }
        break;

      case 'coaches':
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON coaches.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code,
              'color', r.color,
              'flag_image', r.flag_image
            ) as region
          `);
        }
        break;

      case 'transfers':
        if (relations.includes('fighter')) {
          this.addJoin(`LEFT JOIN fighters f ON fighter_transfers.fighter_id = f.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname
            ) as fighter
          `);
        }
        if (relations.includes('from_region')) {
          this.addJoin(`LEFT JOIN regions fr ON fighter_transfers.from_region_id = fr.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', fr.id,
              'name', fr.name,
              'code', fr.code
            ) as from_region
          `);
        }
        if (relations.includes('to_region')) {
          this.addJoin(`LEFT JOIN regions tr ON fighter_transfers.to_region_id = tr.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', tr.id,
              'name', tr.name,
              'code', tr.code
            ) as to_region
          `);
        }
        if (relations.includes('approved_by_user')) {
          this.addJoin(`LEFT JOIN users u ON fighter_transfers.approved_by_user_id = u.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', u.id,
              'username', u.username,
              'email', u.email
            ) as approved_by_user
          `);
        }
        break;

      case 'interactions':
        if (relations.includes('user')) {
          this.addJoin(`LEFT JOIN users u ON interactions.user_id = u.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', u.id,
              'username', u.username,
              'first_name', u.first_name,
              'last_name', u.last_name
            ) as user
          `);
        }
        break;

      case 'archives':
        if (relations.includes('fighter')) {
          this.addJoin(`LEFT JOIN fighters f ON fighter_achievements_archive.fighter_id = f.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname
            ) as fighter
          `);
        }
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON fighter_achievements_archive.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code
            ) as region
          `);
        }
        if (relations.includes('edition')) {
          this.addJoin(`LEFT JOIN competition_editions ce ON fighter_achievements_archive.edition_id = ce.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'competition_id', ce.competition_id
            ) as edition
          `);
        }
        break;

      case 'fighter-achievements':
        if (relations.includes('fighter')) {
          this.addJoin(`LEFT JOIN fighters f ON fighter_achievements.fighter_id = f.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname
            ) as fighter
          `);
        }
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON fighter_achievements.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code
            ) as region
          `);
        }
        if (relations.includes('edition')) {
          this.addJoin(`LEFT JOIN competition_editions ce ON fighter_achievements.edition_id = ce.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year
            ) as edition
          `);
        }
        break;

      case 'edition-fighters':
        if (relations.includes('edition')) {
          this.addJoin(`LEFT JOIN competition_editions ce ON edition_fighters.edition_id = ce.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year
            ) as edition
          `);
        }
        if (relations.includes('fighter')) {
          this.addJoin(`LEFT JOIN fighters f ON edition_fighters.fighter_id = f.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname,
              'profile_image', f.profile_image,
              'region_id', f.region_id
            ) as fighter
          `);
        }
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON edition_fighters.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code,
              'color', r.color
            ) as region
          `);
        }
        break;

      case 'edition-regions':
        if (relations.includes('edition')) {
          this.addJoin(`LEFT JOIN competition_editions ce ON edition_regions.edition_id = ce.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year
            ) as edition
          `);
        }
        if (relations.includes('region')) {
          this.addJoin(`LEFT JOIN regions r ON edition_regions.region_id = r.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'code', r.code,
              'color', r.color,
              'flag_image', r.flag_image
            ) as region
          `);
        }
        break;

      case 'fighter-cards':
        if (relations.includes('fighter')) {
          this.addJoin(`LEFT JOIN fighters f ON fighter_cards.fighter_id = f.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname
            ) as fighter
          `);
        }
        if (relations.includes('match')) {
          this.addJoin(`LEFT JOIN matches m ON fighter_cards.match_id = m.id`);
          this.addSelectField(`
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'status', m.status
            ) as match
          `);
        }
        break;
    }

    return this;
  }

  // Appliquer les filtres de recherche
  applySearch(searchFields: string[]): this {
    const { search } = this.options;
    if (!search) return this;

    const searchConditions = searchFields.map(field => 
      `${this.tableName}.${field} ILIKE $${this.params.length + 1}`
    ).join(' OR ');
    
    this.whereClauses.push(`(${searchConditions})`);
    this.params.push(`%${search}%`);
    return this;
  }

  // Construire la requête finale
  build(): QueryBuildResult {
    const { sortBy = 'created_at', sortOrder = 'DESC', customWhere, customParams } = this.options;

    // Ajouter les paramètres personnalisés
    if (customParams) {
      this.params.push(...customParams);
    }

    // Construire la clause WHERE
    let whereClause = '';
    if (this.whereClauses.length > 0 || customWhere) {
      const conditions = [];
      if (this.whereClauses.length > 0) {
        conditions.push(this.whereClauses.join(' AND '));
      }
      if (customWhere) {
        conditions.push(customWhere);
      }
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Requête COUNT
    const countSql = `
      SELECT COUNT(DISTINCT ${this.tableName}.id) as total
      FROM ${this.tableName}
      ${this.joins.join(' ')}
      ${whereClause}
    `;

    // Requête principale
    const sql = `
      SELECT ${this.selectFields.join(', ')}
      FROM ${this.tableName}
      ${this.joins.join(' ')}
      ${whereClause}
      GROUP BY ${this.tableName}.id
      ORDER BY ${this.tableName}.${sortBy} ${sortOrder}
      LIMIT $${this.params.length + 1} OFFSET $${this.params.length + 2}
    `;

    return {
      sql,
      countSql,
      params: this.params,
      whereClause,
      joins: this.joins,
      selectFields: this.selectFields,
    };
  }
}

// Fonction principale pour récupérer les entités
export async function getEntities<T = any>(
  entityType: EntityType,
  options: EntityQueryOptions = {}
): Promise<PaginatedResponse<T>> {
  try {
    const {
      page = 1,
      limit = 20,
      filters = {},
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      withRelations = false,
    } = options;

    const builder = new EntityQueryBuilder(entityType, { ...options, search });

    // Appliquer les filtres spécifiques à chaque entité
    applyEntityFilters(builder, entityType, filters);

    // Ajouter les relations
    builder.buildRelations();

    // Construire les requêtes
    const { sql, countSql, params } = builder.build();

    // Exécuter la requête COUNT
    const countResult = await query<{ total: string }>(countSql, params.slice(0, -2));
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;

    // Exécuter la requête principale avec les paramètres de pagination
    const data = await query<T>(sql, [...params.slice(0, -2), validatedLimit, offset]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error(`Error in getEntities for ${entityType}:`, error);
    // Si c'est une erreur SQL liée à GROUP BY, on retourne une réponse vide au lieu de planter
    if (error.message?.includes('must appear in the GROUP BY clause')) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: options.limit ?? 20,
          total: 0,
          totalPages: 0,
        },
      };
    }
    throw new Error(`Erreur lors de la récupération des ${entityType}`);
  }
}

// Fonction pour appliquer les filtres spécifiques
function applyEntityFilters(
  builder: EntityQueryBuilder,
  entityType: EntityType,
  filters: any
) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  
  // Fonction utilitaire pour ajouter un filtre avec un paramètre
  const addFilter = (condition: string, value: any) => {
    if (value !== undefined && value !== null && value !== 'all' && value !== '') {
      builder.addWhere(condition, value);
    }
  };

  switch (entityType) {
    case 'fighters':
      builder.applySearch(['first_name', 'last_name', 'nickname']);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.is_champion = $${builder['params'].length + 1}`, filters.is_champion);
      addFilter(`${tableName}.ranking >= $${builder['params'].length + 1}`, filters.min_ranking);
      addFilter(`${tableName}.ranking <= $${builder['params'].length + 1}`, filters.max_ranking);
      break;

    case 'regions':
      builder.applySearch(['name', 'code', 'description']);
      addFilter(`${tableName}.code = $${builder['params'].length + 1}`, filters.code);
      break;

    case 'competitions':
      builder.applySearch(['name', 'description']);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      if (filters.edition_year) {
        builder.addWhere(`EXISTS (SELECT 1 FROM competition_editions ce WHERE ce.competition_id = ${tableName}.id AND ce.year = $${builder['params'].length + 1})`, filters.edition_year);
      }
      break;

    case 'editions':
      addFilter(`${tableName}.competition_id = $${builder['params'].length + 1}`, filters.competition_id);
      addFilter(`${tableName}.year = $${builder['params'].length + 1}`, filters.year);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      break;

    case 'matches':
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.sub_group_id = $${builder['params'].length + 1}`, filters.sub_group_id);
      addFilter(`${tableName}.match_date >= $${builder['params'].length + 1}`, filters.date_from);
      addFilter(`${tableName}.match_date <= $${builder['params'].length + 1}`, filters.date_to);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      break;

    case 'referees':
      builder.applySearch(['first_name', 'last_name', 'nickname', 'license_number']);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.certification_level = $${builder['params'].length + 1}`, filters.certification_level);
      addFilter(`${tableName}.experience_years >= $${builder['params'].length + 1}`, filters.experience_min);
      break;

    case 'phases':
      addFilter(`${tableName}.edition_id = $${builder['params'].length + 1}`, filters.edition_id);
      addFilter(`${tableName}.phase_type = $${builder['params'].length + 1}`, filters.phase_type);
      addFilter(`${tableName}.is_completed = $${builder['params'].length + 1}`, filters.is_completed);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      break;

    case 'phase-groups':
      addFilter(`${tableName}.phase_id = $${builder['params'].length + 1}`, filters.phase_id);
      addFilter(`${tableName}.is_completed = $${builder['params'].length + 1}`, filters.is_completed);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.date >= $${builder['params'].length + 1}`, filters.date_from);
      addFilter(`${tableName}.date <= $${builder['params'].length + 1}`, filters.date_to);
      break;

    case 'sub-groups':
      addFilter(`${tableName}.group_id = $${builder['params'].length + 1}`, filters.group_id);
      addFilter(`${tableName}.region1_id = $${builder['params'].length + 1}`, filters.region1_id);
      addFilter(`${tableName}.region2_id = $${builder['params'].length + 1}`, filters.region2_id);
      addFilter(`${tableName}.belt_region1 = $${builder['params'].length + 1}`, filters.belt_region1);
      addFilter(`${tableName}.belt_region2 = $${builder['params'].length + 1}`, filters.belt_region2);
      addFilter(`${tableName}.main_referee_id = $${builder['params'].length + 1}`, filters.main_referee_id);
      addFilter(`${tableName}.is_completed = $${builder['params'].length + 1}`, filters.is_completed);
      addFilter(`${tableName}.period = $${builder['params'].length + 1}`, filters.period);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      break;

    case 'articles':
      builder.applySearch(['title', 'content', 'excerpt']);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.language = $${builder['params'].length + 1}`, filters.language);
      addFilter(`${tableName}.author_id = $${builder['params'].length + 1}`, filters.author_id);
      addFilter(`${tableName}.type = $${builder['params'].length + 1}`, filters.type);
      break;

    case 'media':
      builder.applySearch(['title', 'description', 'alt_text']);
      addFilter(`${tableName}.file_type = $${builder['params'].length + 1}`, filters.file_type);
      addFilter(`${tableName}.entity_type = $${builder['params'].length + 1}`, filters.entity_type);
      addFilter(`${tableName}.entity_id = $${builder['params'].length + 1}`, filters.entity_id);
      addFilter(`${tableName}.uploader_id = $${builder['params'].length + 1}`, filters.uploader_id);
      addFilter(`${tableName}.is_featured = $${builder['params'].length + 1}`, filters.is_featured);
      break;

    case 'videos':
      builder.applySearch(['title', 'description']);
      addFilter(`${tableName}.type = $${builder['params'].length + 1}`, filters.type);
      addFilter(`${tableName}.category = $${builder['params'].length + 1}`, filters.category);
      addFilter(`${tableName}.is_live = $${builder['params'].length + 1}`, filters.is_live);
      addFilter(`${tableName}.is_featured = $${builder['params'].length + 1}`, filters.is_featured);
      break;

    case 'messages':
      builder.applySearch(['content']);
      addFilter(`${tableName}.message_type = $${builder['params'].length + 1}`, filters.message_type);
      addFilter(`${tableName}.entity_type = $${builder['params'].length + 1}`, filters.entity_type);
      addFilter(`${tableName}.entity_id = $${builder['params'].length + 1}`, filters.entity_id);
      addFilter(`${tableName}.author_id = $${builder['params'].length + 1}`, filters.author_id);
      addFilter(`${tableName}.recipient_id = $${builder['params'].length + 1}`, filters.recipient_id);
      addFilter(`${tableName}.parent_message_id = $${builder['params'].length + 1}`, filters.parent_message_id);
      addFilter(`${tableName}.is_read = $${builder['params'].length + 1}`, filters.is_read);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.is_deleted = $${builder['params'].length + 1}`, filters.is_deleted);
      break;

    case 'notifications':
      builder.applySearch(['title', 'message']);
      addFilter(`${tableName}.user_id = $${builder['params'].length + 1}`, filters.user_id);
      addFilter(`${tableName}.notification_type = $${builder['params'].length + 1}`, filters.notification_type);
      addFilter(`${tableName}.is_read = $${builder['params'].length + 1}`, filters.is_read);
      addFilter(`${tableName}.priority = $${builder['params'].length + 1}`, filters.priority);
      break;

    case 'users':
      builder.applySearch(['username', 'email', 'first_name', 'last_name']);
      addFilter(`${tableName}.role = $${builder['params'].length + 1}`, filters.role);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.is_verified = $${builder['params'].length + 1}`, filters.is_verified);
      addFilter(`${tableName}.country = $${builder['params'].length + 1}`, filters.country);
      break;

    case 'coaches':
      builder.applySearch(['first_name', 'last_name', 'nickname', 'license_number']);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.certification_level = $${builder['params'].length + 1}`, filters.certification_level);
      addFilter(`${tableName}.experience_years >= $${builder['params'].length + 1}`, filters.experience_min);
      break;

    case 'transfers':
      addFilter(`${tableName}.fighter_id = $${builder['params'].length + 1}`, filters.fighter_id);
      addFilter(`${tableName}.from_region_id = $${builder['params'].length + 1}`, filters.from_region_id);
      addFilter(`${tableName}.to_region_id = $${builder['params'].length + 1}`, filters.to_region_id);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.transfer_date >= $${builder['params'].length + 1}`, filters.date_from);
      addFilter(`${tableName}.transfer_date <= $${builder['params'].length + 1}`, filters.date_to);
      break;

    case 'advertisements':
      builder.applySearch(['title', 'description', 'advertiser_name']);
      addFilter(`${tableName}.position = $${builder['params'].length + 1}`, filters.position);
      addFilter(`${tableName}.media_type = $${builder['params'].length + 1}`, filters.media_type);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      addFilter(`${tableName}.start_date >= $${builder['params'].length + 1}`, filters.start_date_from);
      addFilter(`${tableName}.start_date <= $${builder['params'].length + 1}`, filters.start_date_to);
      addFilter(`${tableName}.end_date >= $${builder['params'].length + 1}`, filters.end_date_from);
      addFilter(`${tableName}.end_date <= $${builder['params'].length + 1}`, filters.end_date_to);
      break;

    case 'interactions':
      addFilter(`${tableName}.user_id = $${builder['params'].length + 1}`, filters.user_id);
      addFilter(`${tableName}.entity_type = $${builder['params'].length + 1}`, filters.entity_type);
      addFilter(`${tableName}.entity_id = $${builder['params'].length + 1}`, filters.entity_id);
      addFilter(`${tableName}.interaction_type = $${builder['params'].length + 1}`, filters.interaction_type);
      break;

    case 'archives':
      builder.applySearch(['title', 'description', 'archive_reason']);
      addFilter(`${tableName}.fighter_id = $${builder['params'].length + 1}`, filters.fighter_id);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.edition_id = $${builder['params'].length + 1}`, filters.edition_id);
      addFilter(`${tableName}.year = $${builder['params'].length + 1}`, filters.year);
      addFilter(`${tableName}.position = $${builder['params'].length + 1}`, filters.position);
      addFilter(`${tableName}.archive_reason = $${builder['params'].length + 1}`, filters.archive_reason);
      addFilter(`${tableName}.archived_at >= $${builder['params'].length + 1}`, filters.date_from);
      addFilter(`${tableName}.archived_at <= $${builder['params'].length + 1}`, filters.date_to);
      break;

    case 'belts':
      builder.applySearch(['color']);
      addFilter(`${tableName}.is_active = $${builder['params'].length + 1}`, filters.is_active);
      break;

    case 'fighter-achievements':
      builder.applySearch(['title', 'description']);
      addFilter(`${tableName}.fighter_id = $${builder['params'].length + 1}`, filters.fighter_id);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.edition_id = $${builder['params'].length + 1}`, filters.edition_id);
      addFilter(`${tableName}.year = $${builder['params'].length + 1}`, filters.year);
      addFilter(`${tableName}.position = $${builder['params'].length + 1}`, filters.position);
      break;

    case 'edition-fighters':
      addFilter(`${tableName}.edition_id = $${builder['params'].length + 1}`, filters.edition_id);
      addFilter(`${tableName}.fighter_id = $${builder['params'].length + 1}`, filters.fighter_id);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.is_champion = $${builder['params'].length + 1}`, filters.is_champion);
      addFilter(`${tableName}.is_eliminated = $${builder['params'].length + 1}`, filters.is_eliminated);
      break;

    case 'edition-regions':
      addFilter(`${tableName}.edition_id = $${builder['params'].length + 1}`, filters.edition_id);
      addFilter(`${tableName}.region_id = $${builder['params'].length + 1}`, filters.region_id);
      addFilter(`${tableName}.status = $${builder['params'].length + 1}`, filters.status);
      addFilter(`${tableName}.is_eliminated = $${builder['params'].length + 1}`, filters.is_eliminated);
      addFilter(`${tableName}.points >= $${builder['params'].length + 1}`, filters.points_min);
      addFilter(`${tableName}.points <= $${builder['params'].length + 1}`, filters.points_max);
      break;

    case 'fighter-cards':
      addFilter(`${tableName}.fighter_id = $${builder['params'].length + 1}`, filters.fighter_id);
      addFilter(`${tableName}.match_id = $${builder['params'].length + 1}`, filters.match_id);
      addFilter(`${tableName}.card_type = $${builder['params'].length + 1}`, filters.card_type);
      addFilter(`${tableName}.is_cancelled = $${builder['params'].length + 1}`, filters.is_cancelled);
      break;
  }
}

// Fonction pour récupérer une entité par ID
export async function getEntityById<T = any>(
  entityType: EntityType,
  id: number,
  withRelations: boolean = true
): Promise<T | null> {
  try {
    const builder = new EntityQueryBuilder(entityType, { withRelations });
    
    builder.addWhere(`${ENTITY_TABLE_MAP[entityType]}.id = $1`, id);
    builder.buildRelations();

    const { sql, params } = builder.build();
    const results = await query<T>(sql, params.slice(0, -2));
    
    return results[0] || null;
  } catch (error) {
    console.error(`Error in getEntityById for ${entityType}:`, error);
    throw new Error(`Erreur lors de la récupération de l'entité`);
  }
}

// Fonction pour récupérer une entité par slug
export async function getEntityBySlug<T = any>(
  entityType: Extract<EntityType, 'fighters' | 'articles' | 'videos' | 'competitions'>,
  slug: string,
  withRelations: boolean = true
): Promise<T | null> {
  try {
    const tableName = ENTITY_TABLE_MAP[entityType];
    const builder = new EntityQueryBuilder(entityType, { withRelations });
    
    builder.addWhere(`${tableName}.slug = $1`, slug);
    builder.buildRelations();

    const { sql, params } = builder.build();
    const results = await query<T>(sql, params.slice(0, -2));
    
    return results[0] || null;
  } catch (error) {
    console.error(`Error in getEntityBySlug for ${entityType}:`, error);
    throw new Error(`Erreur lors de la récupération de l'entité par slug`);
  }
}