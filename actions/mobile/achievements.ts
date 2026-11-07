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

export async function getMobileAchievements(filters?: MobileAchievementFilters) {
  try {
    const entityType = filters?.entityType || "all";
    const limit = filters?.limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (entityType && entityType !== "all") {
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

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        fa.id,
        fa.entity_type as "entityType",
        fa.type,
        fa.position,
        fa.title,
        fa.description,
        fa.medal_image as "medalImage",
        fa.year,
        fa.match_id as "matchId",

        fa.fighter_id as "fighterId",
        f.first_name as "fighterFirstName",
        f.last_name as "fighterLastName",
        f.nickname as "fighterNickname",
        f.profile_image as "fighterProfileImage",

        fa.region_id as "regionId",
        r.name as "regionName",
        r.flag_image as "regionFlagImage",

        fa.other_actor_name as "otherActorName",
        fa.other_actor_role as "otherActorRole",

        fa.edition_id as "editionId",
        ce.edition_number as "editionNumber",
        ce.year as "editionYear",
        ce.theme as "editionTheme",
        c.name as "competitionName"
      FROM fighter_achievements fa
      JOIN competition_editions ce ON fa.edition_id = ce.id
      LEFT JOIN competitions c ON ce.competition_id = c.id
      LEFT JOIN fighters f ON fa.fighter_id = f.id
      LEFT JOIN regions r ON fa.region_id = r.id
      ${where}
      ORDER BY ce.year DESC, ce.edition_number DESC, fa.position
      ${limit ? `LIMIT ${Number(limit)}` : ""}
    `;

    const rows = await query(sql, params);

    // --- Grouper les distinctions de lutteurs par édition, puis par position
    const fighterByEdition = new Map<number, { edition: any; achievements: any[] }>();
    const regionAchievements: any[] = [];
    const otherAchievements: any[] = [];

    for (const row of rows) {
      const edition = {
        id: row.editionId,
        editionNumber: row.editionNumber,
        year: row.editionYear,
        theme: row.editionTheme,
        competitionName: row.competitionName,
      };

      if (row.entityType === "fighter") {
        if (!fighterByEdition.has(row.editionId)) {
          fighterByEdition.set(row.editionId, { edition, achievements: [] });
        }
        fighterByEdition.get(row.editionId)!.achievements.push({
          id: row.id,
          type: row.type,
          position: row.position,
          title: row.title,
          description: row.description,
          medalImage: row.medalImage,
          matchId: row.matchId,
          fighter: row.fighterId
            ? {
                id: row.fighterId,
                firstName: row.fighterFirstName,
                lastName: row.fighterLastName,
                nickname: row.fighterNickname,
                profileImage: row.fighterProfileImage,
              }
            : null,
        });
      } else if (row.entityType === "region") {
        regionAchievements.push({
          id: row.id,
          type: row.type,
          position: row.position,
          title: row.title,
          description: row.description,
          medalImage: row.medalImage,
          matchId: row.matchId,
          year: row.year,
          region: row.regionId
            ? { id: row.regionId, name: row.regionName, flagImage: row.regionFlagImage }
            : null,
          edition,
        });
      } else {
        otherAchievements.push({
          id: row.id,
          type: row.type,
          position: row.position,
          title: row.title,
          description: row.description,
          medalImage: row.medalImage,
          matchId: row.matchId,
          year: row.year,
          actor: {
            name: row.otherActorName,
            role: row.otherActorRole,
          },
          edition,
        });
      }
    }

    // Trier les achievements de chaque édition par position (1st, 2nd, 3rd, ...)
    const fighters = Array.from(fighterByEdition.values()).map((group) => {
      group.achievements.sort(
        (a, b) =>
          (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99),
      );
      return group;
    });

    // Trier régions et autres par année desc puis position
    regionAchievements.sort((a, b) => {
      if (b.edition.year !== a.edition.year) return b.edition.year - a.edition.year;
      return (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99);
    });
    otherAchievements.sort((a, b) => {
      if (b.edition.year !== a.edition.year) return b.edition.year - a.edition.year;
      return (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99);
    });

    return {
      success: true,
      data: {
        fighters,
        regions: regionAchievements,
        others: otherAchievements,
      },
      message: "Palmarès récupérés avec succès",
    };
  } catch (error: any) {
    console.error("Error in getMobileAchievements:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des palmarès",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
