// @/actions/fighters.ts
"use server";

import { query, queryOne } from "@/lib/db/neon-client";
import { fighterSchema } from "@/validation/schemas";
import { revalidatePath, cacheTag, revalidateTag, cacheLife } from "next/cache";
import { emitFighterEvent } from "./realtime";
import {
  ArchiveFighterAchievementFilters,
  Fighter,
  FighterFilters,
  PaginatedResponse,
} from "@/types";

export async function getFighters(
  filters: FighterFilters = {},
): Promise<PaginatedResponse<Fighter>> {
  // "use cache";
  // // cacheTag("fighters");
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  
  try {
    const {
      search = "",
      page = 1,
      limit = 20,
      region_id,
      is_active,
      is_champion,
      min_ranking,
      max_ranking,
      with_region = false,
      with_achievements = false,
      not_in_edition,
    } = filters;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    const selectFields = [
      "f.id",
      "f.first_name",
      "f.last_name",
      "f.nickname",
      "f.slug",
      "f.profile_image",
      "f.ranking",
      "f.is_active",
      "f.is_champion",
      "f.region_id",
    ];

    // Recherche
    if (search) {
      whereClause += ` AND (
        f.first_name ILIKE $${params.length + 1} OR 
        f.last_name ILIKE $${params.length + 1} OR 
        f.nickname ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Filtres
    if (region_id !== undefined) {
      whereClause += ` AND f.region_id = $${params.length + 1}`;
      params.push(region_id);
    }

    if (is_active !== undefined) {
      whereClause += ` AND f.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (is_champion !== undefined) {
      whereClause += ` AND f.is_champion = $${params.length + 1}`;
      params.push(is_champion);
    }

    if (min_ranking !== undefined) {
      whereClause += ` AND f.ranking >= $${params.length + 1}`;
      params.push(min_ranking);
    }

    if (max_ranking !== undefined) {
      whereClause += ` AND f.ranking <= $${params.length + 1}`;
      params.push(max_ranking);
    }

    if (not_in_edition !== undefined) {
      whereClause += ` AND f.id NOT IN (SELECT fighter_id FROM edition_fighters WHERE edition_id = $${params.length + 1})`;
      params.push(not_in_edition);
    }

    // JOIN region
    if (with_region) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color,
          'flag_image', r.flag_image
        ) as region
      `);
    }

    // JOIN achievements
    if (with_achievements) {
      selectFields.push(`
        (SELECT JSON_AGG(sub)
        FROM (
          SELECT
            fa.id,
            fa.title,
            fa.year,
            fa.position
          FROM fighter_achievements fa
          WHERE fa.fighter_id = f.id
          ORDER BY fa.year DESC
          LIMIT 3
        ) sub) as achievements
      `);
    }

    // COUNT
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighters f
      ${with_region ? "LEFT JOIN regions r ON f.region_id = r.id" : ""}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? "0");

    // Pagination
    const validatedPage = Math.max(1, page);

    // 🔥 FIX ICI
    const validatedLimit = limit <= 0 ? total : Math.max(1, limit);

    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages =
      validatedLimit > 0 ? Math.ceil(total / validatedLimit) : 1;

    // QUERY
    const dataSql = `
      SELECT ${selectFields.join(", ")}
      FROM fighters f
      ${with_region ? "LEFT JOIN regions r ON f.region_id = r.id" : ""}
      ${whereClause}
      ORDER BY f.ranking ASC, f.last_name ASC, f.first_name ASC
      ${limit <= 0 ? "" : `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`}
    `;

    const data = await query<Fighter>(
      dataSql,
      limit <= 0 ? params : [...params, validatedLimit, offset],
    );

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error in getFighters:", error);
    throw new Error("Erreur lors de la récupération des lutteurs");
  }
}

export async function getFighterById(
  id: number,
  options: {
    with_relations?: boolean;
  } = {},
) {
  // "use cache";
  // // cacheTag("fighters", `fighter:${id}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  

  try {
    const { with_relations = true } = options;

    let sql = "SELECT * FROM fighters WHERE id = $1";
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          f.*,
          JSON_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'code', r.code,
            'color', r.color,
            'flag_image', r.flag_image
          ) as region,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', fa.id,
              'title', fa.title,
              'year', fa.year,
              'position', fa.position,
              'description', fa.description,
              'medal_image', fa.medal_image,
              'region_id', fa.region_id,
              'edition_id', fa.edition_id
            ) ORDER BY fa.year DESC
          ) FROM fighter_achievements fa WHERE fa.fighter_id = f.id) as achievements,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ft.id,
              'transfer_date', ft.transfer_date,
              'from_region_id', ft.from_region_id,
              'to_region_id', ft.to_region_id,
              'transfer_fee', ft.transfer_fee,
              'contract_duration', ft.contract_duration,
              'status', ft.status,
              'is_permanent', ft.is_permanent,
              'transfer_reason', ft.transfer_reason
            ) ORDER BY ft.transfer_date DESC
          ) FROM fighter_transfers ft WHERE ft.fighter_id = f.id) as transfers,
          (SELECT COUNT(*) FROM matches m WHERE (m.fighter1_id = f.id OR m.fighter2_id = f.id) AND m.status = 'completed') as total_matches,
          (SELECT COUNT(*) FROM matches m WHERE m.winner_fighter_id = f.id) as wins,
          (SELECT COUNT(*) FROM matches m WHERE m.loser_fighter_id = f.id) as losses
        FROM fighters f
        LEFT JOIN regions r ON f.region_id = r.id
        WHERE f.id = $1
      `;
    }

    const result = await queryOne<Fighter>(sql, params);

    if (!result) {
      throw new Error("Lutteur non trouvé");
    }

    return result;
  } catch (error) {
    console.error("Error in getFighterById:", error);
    throw error;
  }
}

// lib/actions/fighters.ts
export async function createFighter(validatedData: any) {
  try {
    const sql = `
      INSERT INTO fighters (
        first_name, last_name, nickname, birth_date, birth_place, 
        region_id, height, weight, profile_image, cover_image,
        bio, fighting_style, debut_year, ranking, is_active, is_champion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.birth_place || null,
      validatedData.region_id || null,
      validatedData.height || null,
      validatedData.weight || null,
      validatedData.profile_image || null,
      validatedData.cover_image || null,
      validatedData.bio || null,
      validatedData.fighting_style || null,
      validatedData.debut_year || null,
      validatedData.ranking ?? null,
      validatedData.is_active,
      validatedData.is_champion,
    ]);

    revalidatePath("/fighters");
    revalidatePath("/ad/fighters");
    if (validatedData.region_id) {
      revalidatePath(`/admin/regions/${validatedData.region_id}`);
    }

    revalidateTag("fighters", {});

    // Émission WS
    await emitFighterEvent(result[0].id, "fighter_created", {
      id: result[0].id,
      ...validatedData,
    });

    return {
      success: true,
      id: result[0].id,
      message: "Lutteur créé avec succès",
    };
  } catch (error) {
    console.error("Error in createFighter:", error);
    throw new Error(
      `Erreur lors de la création du lutteur: ${(error as Error).message}`,
    );
  }
}

export async function updateFighter(id: number, formData: FormData) {
  try {
    const existing = await getFighterById(id, { with_relations: false });
    if (!existing) {
      throw new Error("Lutteur non trouvé");
    }

    const rawData = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      nickname: formData.get("nickname"),
      birth_date: formData.get("birth_date"),
      birth_place: formData.get("birth_place"),
      region_id: formData.get("region_id"),
      height: formData.get("height"),
      weight: formData.get("weight"),
      profile_image: formData.get("profile_image"),
      cover_image: formData.get("cover_image"),
      bio: formData.get("bio"),
      fighting_style: formData.get("fighting_style"),
      debut_year: formData.get("debut_year"),
      ranking: formData.get("ranking"),
      is_active: formData.get("is_active"),
      is_champion: formData.get("is_champion"),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: (rawData.nickname as string) || undefined,
      birth_date: (rawData.birth_date as string) || undefined,
      birth_place: (rawData.birth_place as string) || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      height: rawData.height ? Number(rawData.height) : undefined,
      weight: rawData.weight ? Number(rawData.weight) : undefined,
      profile_image: (rawData.profile_image as string) || undefined,
      cover_image: (rawData.cover_image as string) || undefined,
      bio: (rawData.bio as string) || undefined,
      fighting_style: (rawData.fighting_style as string) || undefined,
      debut_year: rawData.debut_year ? Number(rawData.debut_year) : undefined,
      ranking: rawData.ranking ? Number(rawData.ranking) : existing.ranking,
      is_active: rawData.is_active === "true",
      is_champion: rawData.is_champion === "true",
    };

    const validatedData = fighterSchema.parse(cleanedData);

    const sql = `
      UPDATE fighters 
      SET 
        first_name = $1, last_name = $2, nickname = $3, birth_date = $4, 
        birth_place = $5, region_id = $6, height = $7, 
        weight = $8, profile_image = $9, cover_image = $10, bio = $11, 
        fighting_style = $12, debut_year = $13, ranking = $14, 
        is_active = $15, is_champion = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
    `;

    await query(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.birth_place || null,
      validatedData.region_id || null,
      validatedData.height || null,
      validatedData.weight || null,
      validatedData.profile_image || null,
      validatedData.cover_image || null,
      validatedData.bio || null,
      validatedData.fighting_style || null,
      validatedData.debut_year || null,
      validatedData.ranking ?? null,
      validatedData.is_active,
      validatedData.is_champion,
      id,
    ]);

    // Le trigger PostgreSQL met à jour automatiquement les compteurs des régions

    revalidatePath("/fighters");
    revalidatePath(`/admin/fighters/${id}`);
    revalidatePath(`/fighters/${id}`);
    if (validatedData.region_id !== existing.region_id) {
      if (existing.region_id) {
        revalidateTag(`region:${existing.region_id}`, {});
      }
      if (validatedData.region_id) {
        revalidateTag(`region:${validatedData.region_id}`, {});
      }
    }

    revalidateTag("fighters", {});
    revalidateTag(`fighter:${id}`, {});

    // 🔥 Émission WS
    await emitFighterEvent(id, "fighter_updated", { id, ...validatedData });

    return {
      success: true,
      message: "Lutteur modifié avec succès",
    };
  } catch (error) {
    console.error("Error in updateFighter:", error);
    if (error instanceof Error) {
      throw new Error(
        `Erreur lors de la modification du lutteur: ${error.message}`,
      );
    }
    throw error;
  }
}

export async function deleteFighter(id: number) {
  try {
    const existing = await getFighterById(id, { with_relations: false });
    if (!existing) {
      throw new Error("Lutteur non trouvé");
    }

    // Vérifier les données liées
    const relatedData = await query(
      `
      SELECT 
        (SELECT COUNT(*) FROM fighter_achievements WHERE fighter_id = $1) as achievement_count,
        (SELECT COUNT(*) FROM fighter_transfers WHERE fighter_id = $1) as transfer_count,
        (SELECT COUNT(*) FROM matches WHERE fighter1_id = $1 OR fighter2_id = $1) as match_count
    `,
      [id],
    );

    const counts = relatedData[0] as {
      achievement_count: string;
      transfer_count: string;
      match_count: string;
    };

    if (parseInt(counts.match_count) > 0) {
      throw new Error(
        `Impossible de supprimer ce lutteur car il est lié à ${counts.match_count} match(s)`,
      );
    }

    const sql = "DELETE FROM fighters WHERE id = $1";
    await query(sql, [id]);

    // Le trigger PostgreSQL met à jour automatiquement le compteur de la région

    revalidateTag("/fighters", {});
    revalidateTag("/admin/fighters", {});
    if (existing.region_id) {
      revalidateTag(`region:${existing.region_id}`, {});
    }

    revalidateTag("fighters", {});
    revalidateTag(`fighter:${id}`, {});

    // 🔥 Émission WS
    await emitFighterEvent(id, "fighter_deleted", { id });

    return {
      success: true,
      message: "Lutteur supprimé avec succès",
    };
  } catch (error) {
    console.error("Error in deleteFighter:", error);
    if (error instanceof Error) {
      throw new Error(
        `Erreur lors de la suppression du lutteur: ${error.message}`,
      );
    }
    throw new Error("Erreur lors de la suppression du lutteur");
  }
}

export async function getFighterStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_fighters,
        COUNT(*) FILTER (WHERE is_active = true) as active_fighters,
        COUNT(*) FILTER (WHERE is_champion = true) as champions,
        AVG(ranking) as avg_ranking,
        AVG(weight) as avg_weight,
        AVG(height) as avg_height,
        MIN(debut_year) as oldest_debut,
        MAX(debut_year) as newest_debut
      FROM fighters
      WHERE is_active = true
    `;

    const result = await queryOne<{
      total_fighters: string;
      active_fighters: string;
      champions: string;
      avg_ranking: string;
      avg_weight: string;
      avg_height: string;
      oldest_debut: string;
      newest_debut: string;
    }>(sql);

    return {
      total_fighters: parseInt(result?.total_fighters ?? "0"),
      active_fighters: parseInt(result?.active_fighters ?? "0"),
      champions: parseInt(result?.champions ?? "0"),
      avg_ranking: parseFloat(result?.avg_ranking ?? "0"),
      avg_weight: parseFloat(result?.avg_weight ?? "0"),
      avg_height: parseFloat(result?.avg_height ?? "0"),
      oldest_debut: parseInt(result?.oldest_debut ?? "0"),
      newest_debut: parseInt(result?.newest_debut ?? "0"),
    };
  } catch (error) {
    console.error("Error in getFighterStats:", error);
    return {
      total_fighters: 0,
      active_fighters: 0,
      champions: 0,
      avg_ranking: 0,
      avg_weight: 0,
      avg_height: 0,
      oldest_debut: 0,
      newest_debut: 0,
    };
  }
}

export async function getFightersForSelect() {
  try {
    const sql = `
      SELECT id, first_name, last_name, nickname, ranking, is_active
      FROM fighters 
      WHERE is_active = true
      ORDER BY ranking ASC, last_name ASC, first_name ASC
    `;

    return await query<{
      id: number;
      first_name: string;
      last_name: string;
      nickname?: string;
      ranking: number;
      is_active: boolean;
    }>(sql);
  } catch (error) {
    console.error("Error in getFightersForSelect:", error);
    return [];
  }
}
