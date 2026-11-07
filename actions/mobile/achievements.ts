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
  type?: string;
  editionId?: number;
  year?: number;
  position?: string;
  limit?: number;
}

interface CompetitionAchievement {
  achieveId: number;
  type: string;
  position: string | null;
  title: string | null;
  description: string | null;
  medalImage: string | null;
  matchId: number | null;

  // Informations du bénéficiaire lutteur
  fighter?: number;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  profileImage?: string | null;

  // Informations du bénéficiaire région
  region?: number;
  name?: string | null;
  flagImage?: string | null;

  year?: number | null;
}

interface OtherAchievement {
  achieveId: number;
  type: string;
  position: string | null;
  title: string | null;
  description: string | null;
  medalImage: string | null;
  matchId: number | null;
  year?: number | null;
  fighter?: number;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  profileImage?: string | null;
  region?: number;
  name?: string | null;
  flagImage?: string | null;
  actor?: {
    name: string | null;
    role: string | null;
  };
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

    if (filters?.type) {
      conditions.push(`fa.type = $${idx++}`);
      params.push(filters.type);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        fa.id AS "achieveId",
        fa.entity_type AS "entityType",
        fa.type,
        fa.position,
        fa.title,
        fa.description,
        fa.medal_image AS "medalImage",
        fa.year,
        fa.match_id AS "matchId",

        fa.fighter_id AS "fighterId",
        f.first_name AS "firstName",
        f.last_name AS "lastName",
        f.nickname AS "nickname",
        f.profile_image AS "profileImage",

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

    const competition: CompetitionAchievement[] = [];
    const others: OtherAchievement[] = [];

    for (const row of rows) {
      const achievement = {
        achieveId: row.achieveId,
        type: row.type,
        position: row.position,
        title: row.title,
        description: row.description,
        medalImage: row.medalImage,
        matchId: row.matchId,
      };

      // Bénéficiaire selon entity_type.
      const fighterInfo =
        row.entityType === "fighter" && row.fighterId
          ? {
              fighter: row.fighterId,
              firstName: row.firstName,
              lastName: row.lastName,
              nickname: row.nickname,
              profileImage: row.profileImage,
            }
          : {};
      const regionInfo =
        row.entityType === "region" && row.regionId
          ? {
              region: row.regionId,
              name: row.regionName,
              flagImage: row.regionFlagImage,
              year: row.year,
            }
          : {};
      const otherInfo =
        row.entityType === "others"
          ? {
              year: row.year,
              actor: {
                name: row.otherActorName,
                role: row.otherActorRole,
              },
            }
          : {};

      const enriched = { ...achievement, ...fighterInfo, ...regionInfo, ...otherInfo };

      // Répartition par type : competition vs autres (dance, walki, etc.).
      if (row.type === "competition") {
        competition.push(enriched as CompetitionAchievement);
      } else {
        others.push(enriched as OtherAchievement);
      }
    }

    // Tri par position à l'intérieur de l'ordre chronologique des éditions.
    // Le tri SQL garantit déjà l'ordre des éditions.
    const sortByPosition = <T extends { position: string | null }>(
      items: T[],
    ) =>
      items.sort(
        (a, b) =>
          (POSITION_ORDER[a.position || ""] ?? 99) -
          (POSITION_ORDER[b.position || ""] ?? 99),
      );

    const sortedCompetition = sortByPosition(competition);
    const sortedOthers = sortByPosition(others);

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
        competition: applyLimit(sortedCompetition),
        others: applyLimit(sortedOthers),
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