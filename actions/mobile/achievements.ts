// actions/mobile/achievements.ts
"use server";

import { query } from "@/lib/db/neon-client";

const POSITION_ORDER: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  finalist: 4,
  semifinalist: 5,
  quarterfinalist: 6,
};

export interface MobileAchievementFilters {
  entityType?: "fighter" | "region" | "others" | "all";
  editionId?: number;
  year?: number;
  position?: string;
  limit?: number;
}

interface Achievement {
  id: number;
  type: string;
  position: string | null;
  title: string | null;
  description: string | null;
  medalImage: string | null;
  matchId: number | null;
}

interface FighterAchievement extends Achievement {
  fighter: number;
}

interface RegionAchievement extends Achievement {
  year: number | null;
}

interface OtherAchievement extends Achievement {
  year: number | null;
  actor: {
    name: string | null;
    role: string | null;
  };
}

interface MobileFighterWithAchievements {
  id: number;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profileImage: string | null;
  achievements: FighterAchievement[];
}

interface MobileRegionWithAchievements {
  id: number;
  name: string | null;
  flagImage: string | null;
  achievements: RegionAchievement[];
}

export async function getMobileAchievements(
  filters?: MobileAchievementFilters,
) {
  try {
    const entityType = filters?.entityType || "all";

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (entityType !== "all") {
      conditions.push(`fa.entity_type = $${idx++}`);
      params.push(entityType);
    }

    if (filters?.editionId) {
      conditions.push(`fa.edition_id = $${idx++}`);
      params.push(filters.editionId);
    }

    if (filters?.year) {
      conditions.push(`ce.year = $${idx++}`);
      params.push(filters.year);
    }

    if (filters?.position) {
      conditions.push(`fa.position = $${idx++}`);
      params.push(filters.position);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        fa.id,
        fa.entity_type AS "entityType",
        fa.type,
        fa.position,
        fa.title,
        fa.description,
        fa.medal_image AS "medalImage",
        fa.year,
        fa.match_id AS "matchId",

        fa.fighter_id AS "fighterId",
        f.first_name AS "fighterFirstName",
        f.last_name AS "fighterLastName",
        f.nickname AS "fighterNickname",
        f.profile_image AS "fighterProfileImage",

        fa.region_id AS "regionId",
        r.name AS "regionName",
        r.flag_image AS "regionFlagImage",

        fa.other_actor_name AS "otherActorName",
        fa.other_actor_role AS "otherActorRole",

        ce.year AS "editionYear",
        ce.edition_number AS "editionNumber"
      FROM fighter_achievements fa
      JOIN competition_editions ce ON fa.edition_id = ce.id
      LEFT JOIN fighters f ON fa.fighter_id = f.id
      LEFT JOIN regions r ON fa.region_id = r.id
      ${where}
      ORDER BY
        ce.year DESC,
        ce.edition_number DESC,
        CASE fa.position
          WHEN '1st' THEN 1
          WHEN '2nd' THEN 2
          WHEN '3rd' THEN 3
          WHEN 'finalist' THEN 4
          WHEN 'semifinalist' THEN 5
          WHEN 'quarterfinalist' THEN 6
          ELSE 99
        END ASC,
        fa.id ASC
    `;

    const rows = await query(sql, params);

    const fightersMap = new Map<number, MobileFighterWithAchievements>();
    const regionsMap = new Map<number, MobileRegionWithAchievements>();
    const others: OtherAchievement[] = [];

    for (const row of rows) {
      const achievement: Achievement = {
        id: row.id,
        type: row.type,
        position: row.position,
        title: row.title,
        description: row.description,
        medalImage: row.medalImage,
        matchId: row.matchId,
      };

      if (row.entityType === "fighter") {
        if (!row.fighterId) continue;

        if (!fightersMap.has(row.fighterId)) {
          fightersMap.set(row.fighterId, {
            id: row.fighterId,
            firstName: row.fighterFirstName,
            lastName: row.fighterLastName,
            nickname: row.fighterNickname,
            profileImage: row.fighterProfileImage,
            achievements: [],
          });
        }

        fightersMap.get(row.fighterId)!.achievements.push({
          ...achievement,
          fighter: row.fighterId,
        });

      } else if (row.entityType === "region") {
        if (!row.regionId) continue;

        if (!regionsMap.has(row.regionId)) {
          regionsMap.set(row.regionId, {
            id: row.regionId,
            name: row.regionName,
            flagImage: row.regionFlagImage,
            achievements: [],
          });
        }

        regionsMap.get(row.regionId)!.achievements.push({
          ...achievement,
          year: row.year,
        });

      } else if (row.entityType === "others") {
        others.push({
          ...achievement,
          year: row.year,
          actor: {
            name: row.otherActorName,
            role: row.otherActorRole,
          },
        });
      }
    }

    const sortAchievements = <T extends Achievement>(items: T[]) => {
      return items.sort(
        (a, b) =>
          (POSITION_ORDER[a.position || ""] ?? 99) -
          (POSITION_ORDER[b.position || ""] ?? 99),
      );
    };

    const fighters = Array.from(fightersMap.values()).map((fighter) => ({
      ...fighter,
      achievements: sortAchievements(fighter.achievements),
    }));

    const regions = Array.from(regionsMap.values()).map((region) => ({
      ...region,
      achievements: sortAchievements(region.achievements),
    }));

    // Appliquer la limite après regroupement et tri.
    const limit =
      typeof filters?.limit === "number" && filters.limit > 0
        ? Math.floor(filters.limit)
        : undefined;

    const applyLimit = <T>(items: T[]): T[] =>
      limit ? items.slice(0, limit) : items;

    return {
      success: true,
      message: "Palmarès récupérés avec succès",
      data: {
        fighters: applyLimit(fighters),
        regions: applyLimit(regions),
        others: applyLimit(sortAchievements(others)),
      },
    };
  } catch (error) {
    console.error("Error in getMobileAchievements:", error);

    return {
      success: false,
      message: "Erreur lors de la récupération des palmarès",
      error: {
        code: 500,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
