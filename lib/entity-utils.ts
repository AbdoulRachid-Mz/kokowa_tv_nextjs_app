
// Singular to plural mapping
export const SINGULAR_TO_PLURAL: Record<string, string> = {
  'user': 'users',
  'fighter': 'fighters',
  'archive': 'archives',
  'transfer': 'transfers',
  'region': 'regions',
  'coach': 'coaches',
  'competition': 'competitions',
  'edition': 'editions',
  'referee': 'referees',
  'match': 'matches',
  'phase': 'phases',
  'phase-group': 'phase-groups',
  'sub-group': 'sub-groups',
  'article': 'articles',
  'video': 'videos',
  'media': 'media',
  'message': 'messages',
  'notification': 'notifications',
  'belt': 'belts',
  'fighter-achievement': 'fighter-achievements',
  'edition-fighter': 'edition-fighters',
  'edition-region': 'edition-regions',
  'fighter-card': 'fighter-cards',
  'advertisement': 'advertisements',
  'interaction': 'interactions',
  'team': 'teams',
};

// Type for entities supported (singular and plural)
export type EntityType = 
  | 'fighters' | 'regions' | 'competitions' | 'editions' | 'matches'
  | 'referees' | 'phases' | 'phase-groups' | 'sub-groups'
  | 'articles' | 'media' | 'videos' | 'messages' | 'notifications'
  | 'users' | 'coaches' | 'transfers' | 'advertisements' | 'interactions'
  | 'archives' | 'belts' | 'fighter-achievements' | 'edition-fighters'
  | 'edition-regions' | 'fighter-cards' | 'teams'
  | 'user' | 'fighter' | 'archive' | 'transfer' | 'region'
  | 'coach' | 'competition' | 'edition' | 'referee' | 'match' | 'phase'
  | 'phase-group' | 'sub-group' | 'article' | 'video' | 'message'
  | 'notification' | 'belt' | 'fighter-achievement' | 'edition-fighter'
  | 'edition-region' | 'fighter-card' | 'advertisement' | 'interaction' | 'team';

// Helper function to convert to plural entity type
export function toPluralEntityType(type: EntityType): Exclude<EntityType, 
  | 'user' | 'fighter' | 'archive' | 'transfer' | 'region' | 'coach'
  | 'competition' | 'edition' | 'referee' | 'match' | 'phase'
  | 'phase-group' | 'sub-group' | 'article' | 'video' | 'message'
  | 'notification' | 'belt' | 'fighter-achievement' | 'edition-fighter'
  | 'edition-region' | 'fighter-card' | 'advertisement' | 'interaction' | 'team'
> {
  return (SINGULAR_TO_PLURAL[type] || type) as any;
}

