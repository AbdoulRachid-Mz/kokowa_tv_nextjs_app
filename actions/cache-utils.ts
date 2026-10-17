// // "use server"
// import { revalidateTag, cacheLife } from 'next/cache';

// /**
//  * Invalidate cache by tag for a specific entity type and ID.
//  * @param type The type of the entity (e.g., 'edition', 'match', 'subGroup')
//  * @param id The ID of the entity
//  */
// export const invalidateEntityCache = (type: string, id: number | string) => {
//   revalidateTag(`${type}:${id}`);
// };

// /**
//  * Invalidate cache by generic tag for a group of entities.
//  * @param type The type of the entity (e.g., 'editions', 'matches')
//  */
// export const invalidateCollectionCache = (type: string) => {
//   revalidateTag(type);
// };


// /**
//  * Cache life of entities.
//  * @param type The type of the entity (e.g., 'editions', 'matches')
//  */

// export const cacheEntityLife = () => {
//   cacheLife({
//     stale: 3600, // 1 hour until considered stale
//     revalidate: 7200, // 2 hours until revalidated
//     expire: 86400, // 1 day until expired
//   });
// }
