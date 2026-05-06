// @/actions/sub-groups.ts
"use server";

import { pool, query, queryOne } from "@/lib/db/neon-client";
import { subGroupSchema } from "@/validation/schemas";
import { revalidatePath } from "next/cache";
import { emitSubGroupEvent } from "./realtime";
import {
  SubGroup,
  SubGroupFilters,
  PaginatedResponse,
  Region,
  Match,
} from "@/types";
import { getEditionFighters, getEditionRegions } from "@/actions/editions";

export async function getSubGroups(
  filters: SubGroupFilters = {},
): Promise<PaginatedResponse<SubGroup>> {
  try {
    const {
      group_id,
      search = "",
      page = 1,
      limit = 20,
      with_group = true,
      with_matches = false,
      with_regions = true,
      with_belts = true,
      with_referee = true,
      is_active,
      is_completed,
      period,
      status,
      region1_id,
      region2_id,
      belt_region1,
      belt_region2,
      main_referee_id,
    } = filters;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    const selectFields: string[] = [
      "sg.*",
      "(SELECT COUNT(*) FROM matches m WHERE m.sub_group_id = sg.id) as matches_count",
    ];
    const joins: string[] = [];

    // Filtres de base
    if (group_id) {
      params.push(group_id);
      whereClause += ` AND sg.group_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        sg.name ILIKE $${params.length} 
        OR sg.description ILIKE $${params.length}
      )`;
    }

    if (typeof is_active === "boolean") {
      params.push(is_active);
      whereClause += ` AND sg.is_active = $${params.length}`;
    }

    if (typeof is_completed === "boolean") {
      params.push(is_completed);
      whereClause += ` AND sg.is_completed = $${params.length}`;
    }

    if (period) {
      params.push(period);
      whereClause += ` AND sg.period = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND sg.status = $${params.length}`;
    }

    if (region1_id) {
      params.push(region1_id);
      whereClause += ` AND sg.region1_id = $${params.length}`;
    }

    if (region2_id) {
      params.push(region2_id);
      whereClause += ` AND sg.region2_id = $${params.length}`;
    }

    if (belt_region1) {
      params.push(belt_region1);
      whereClause += ` AND sg.belt_region1 = $${params.length}`;
    }

    if (belt_region2) {
      params.push(belt_region2);
      whereClause += ` AND sg.belt_region2 = $${params.length}`;
    }

    if (main_referee_id) {
      params.push(main_referee_id);
      whereClause += ` AND sg.main_referee_id = $${params.length}`;
    }

    // Jointures hiérarchiques
    joins.push(`
      LEFT JOIN phase_groups pg ON sg.group_id = pg.id
      LEFT JOIN phases p ON pg.phase_id = p.id
      LEFT JOIN competition_editions ce ON p.edition_id = ce.id
      LEFT JOIN competitions c ON ce.competition_id = c.id
    `);

    // Régions
    if (with_regions) {
      joins.push("LEFT JOIN regions r1 ON sg.region1_id = r1.id");
      joins.push("LEFT JOIN regions r2 ON sg.region2_id = r2.id");

      selectFields.push(`
        CASE WHEN r1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code,
            'flag_image', r1.flag_image,
            'color', r1.color,
            'stadium_name', r1.stadium_name,
            'stadium_image', r1.stadium_image
          )
        ELSE NULL END as region1,
        CASE WHEN r2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code,
            'flag_image', r2.flag_image,
            'color', r2.color,
            'stadium_name', r2.stadium_name,
            'stadium_image', r2.stadium_image
          )
        ELSE NULL END as region2
      `);
    }

    // Ceintures
    if (with_belts) {
      joins.push("LEFT JOIN belt b1 ON sg.belt_region1 = b1.id");
      joins.push("LEFT JOIN belt b2 ON sg.belt_region2 = b2.id");

      selectFields.push(`
        CASE WHEN b1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b1.id,
            'color', b1.color,
            'is_active', b1.is_active
          )
        ELSE NULL END as belt1,
        CASE WHEN b2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b2.id,
            'color', b2.color,
            'is_active', b2.is_active
          )
        ELSE NULL END as belt2
      `);
    }

    // Arbitre principal avec sa région
    if (with_referee) {
      joins.push("LEFT JOIN referees ref ON sg.main_referee_id = ref.id");
      joins.push("LEFT JOIN regions ref_r ON ref.region_id = ref_r.id");

      selectFields.push(`
        CASE WHEN ref.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname,
            'profile_image', ref.profile_image,
            'license_number', ref.license_number,
            'certification_level', ref.certification_level,
            'experience_years', ref.experience_years,
            'region_id', ref.region_id,
            'is_active', ref.is_active,
            'region', CASE WHEN ref_r.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref_r.id,
                'name', ref_r.name,
                'code', ref_r.code,
                'flag_image', ref_r.flag_image,
                'color', ref_r.color
              )
            ELSE NULL END
          )
        ELSE NULL END as main_referee
      `);
    }

    // Groupe avec phase, édition et compétition
    if (with_group) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'description', pg.description,
          'is_completed', pg.is_completed,
          'is_active', pg.is_active,
          'date', pg.date,
          'phase', JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_order', p.phase_order,
            'phase_type', p.phase_type,
            'description', p.description,
            'is_completed', p.is_completed,
            'is_active', p.is_active,
            'edition', JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'total_participants', ce.total_participants,
              'prize_pool', ce.prize_pool,
              'is_active', ce.is_active,
              'competition', JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'description', c.description,
                'status', c.status,
                'featured_image', c.featured_image,
                'is_active', c.is_active
              )
            )
          )
        ) as group
      `);
    }

    // Matchs avec leurs relations
    if (with_matches) {
      const isActiveFlag = typeof is_active === "boolean" ? is_active : true;

      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'start_time', m.start_time,
              'end_time', m.end_time,
              'status', m.status,
              'match_result', m.match_result,
              'fighter1_id', m.fighter1_id,
              'fighter2_id', m.fighter2_id,
              'winner_fighter_id', m.winner_fighter_id,
              'loser_fighter_id', m.loser_fighter_id,
              'total_duration', m.total_duration,
              'break_count', m.break_count,
              'audience_count', m.audience_count,
              'video_url', m.video_url,
              'live_stream_url', m.live_stream_url,
              'notes', m.notes,
              'is_active', m.is_active,
              'fighter1', CASE WHEN f1.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f1.id,
                  'first_name', f1.first_name,
                  'last_name', f1.last_name,
                  'nickname', f1.nickname,
                  'ranking', f1.ranking,
                  'profile_image', f1.profile_image,
                  'region', CASE WHEN f1_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f1_r.id,
                      'name', f1_r.name,
                      'code', f1_r.code,
                      'color', f1_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'fighter2', CASE WHEN f2.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f2.id,
                  'first_name', f2.first_name,
                  'last_name', f2.last_name,
                  'nickname', f2.nickname,
                  'ranking', f2.ranking,
                  'profile_image', f2.profile_image,
                  'region', CASE WHEN f2_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f2_r.id,
                      'name', f2_r.name,
                      'code', f2_r.code,
                      'color', f2_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'winner_fighter', CASE WHEN wf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', wf.id,
                  'first_name', wf.first_name,
                  'last_name', wf.last_name,
                  'nickname', wf.nickname
                )
              ELSE NULL END,
              'loser_fighter', CASE WHEN lf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', lf.id,
                  'first_name', lf.first_name,
                  'last_name', lf.last_name,
                  'nickname', lf.nickname
                )
              ELSE NULL END
            ) ORDER BY m.match_number, m.match_date
          ) FROM matches m
          LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
          LEFT JOIN regions f1_r ON f1.region_id = f1_r.id
          LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
          LEFT JOIN regions f2_r ON f2.region_id = f2_r.id
          LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
          LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
          WHERE m.sub_group_id = sg.id
            AND (${isActiveFlag} IS FALSE OR m.is_active = true)
          ),
          '[]'::json
        ) as matches
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM sub_groups sg
      ${joins.join(" ")}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? "0");

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(", ")}
      FROM sub_groups sg
      ${joins.join(" ")}
      ${whereClause}
      ORDER BY sg.sub_group_order ASC, sg.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<SubGroup>(dataSql, [
      ...params,
      validatedLimit,
      offset,
    ]);

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
    console.error("Error in getSubGroups:", error);
    throw new Error("Erreur lors de la récupération des sous-groupes");
  }
}

// ========== AJOUTER L'INTERFACE MANQUANTE ==========
interface GetSubGroupByIdOptions {
  with_relations?: boolean;
  relations?: {
    with_group?: boolean;
    with_phase?: boolean;
    with_edition?: boolean;
    with_competition?: boolean;
    with_fighters?: boolean;
    with_regions?: boolean;
    with_belts?: boolean;
    with_referee?: boolean;
    with_matches?: boolean;
    with_edition_fighters?: boolean;
    with_edition_regions?: boolean;
  };
  is_active?: boolean;
  with_stats?: boolean;
}

export async function getSubGroupById(
  id: number,
  options: GetSubGroupByIdOptions = {},
) {
  try {
    const {
      with_relations = false,
      relations = {},
      is_active,
      with_stats = true,
    } = options;

    const {
      with_group = false,
      with_phase = false,
      with_edition = false,
      with_competition = false,
      with_regions = false,
      with_belts = false,
      with_referee = false,
      with_matches = false,
      with_edition_fighters = false,
      with_edition_regions = false,
    } = relations;

    const params: any[] = [id];
    let whereClause = "WHERE sg.id = $1";

    if (typeof is_active === "boolean") {
      params.push(is_active);
      whereClause += ` AND sg.is_active = $${params.length}`;
    }

    const statsFields = with_stats
      ? [
          `(SELECT COUNT(*) FROM matches WHERE sub_group_id = sg.id) as matches_count`,
          `(SELECT COUNT(*) FROM matches WHERE sub_group_id = sg.id AND status = 'completed') as matches_completed_count`,
          `(SELECT COUNT(DISTINCT fighter1_id) + COUNT(DISTINCT fighter2_id) FROM matches WHERE sub_group_id = sg.id) as fighters_count`,
        ]
      : [];

    if (!with_relations) {
      const sql = `
        SELECT 
          sg.*,
          ${statsFields.length > 0 ? statsFields.join(", ") + "," : ""}
          JSON_BUILD_OBJECT(
            'id', pg.id,
            'name', pg.name,
            'group_order', pg.group_order,
            'phase_id', pg.phase_id
          ) as group
        FROM sub_groups sg
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        ${whereClause}
      `;
      const result = await queryOne<any>(sql, params);
      if (!result) throw new Error("Sous-groupe non trouvé");
      return result;
    }

    const isActiveCondition =
      typeof is_active === "boolean"
        ? is_active
          ? " AND is_active = true"
          : " AND is_active = false"
        : "";

    let sql = `
      SELECT 
        sg.*,
        ${statsFields.length > 0 ? statsFields.join(", ") + "," : ""}
        ${
          with_group
            ? `
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'is_completed', pg.is_completed,
          'is_active', pg.is_active,
          'phase', ${
            with_phase
              ? `
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'edition', ${
                with_edition
                  ? `
                JSON_BUILD_OBJECT(
                  'id', ce.id,
                  'edition_number', ce.edition_number,
                  'year', ce.year,
                  'competition', ${
                    with_competition
                      ? `
                    JSON_BUILD_OBJECT(
                      'id', c.id,
                      'name', c.name,
                      'slug', c.slug
                    )`
                      : "NULL"
                  }
                )`
                  : "NULL"
              }
            )`
              : "NULL"
          }
        ) as group,
        `
            : `'group', NULL,`
        }
        ${
          with_regions
            ? `
        JSON_BUILD_OBJECT('id', r1.id, 'name', r1.name, 'code', r1.code, 'flag_image', r1.flag_image, 'color', r1.color) as region1,
        JSON_BUILD_OBJECT('id', r2.id, 'name', r2.name, 'code', r2.code, 'flag_image', r2.flag_image, 'color', r2.color) as region2,
        `
            : ""
        }
        ${
          with_belts
            ? `
        JSON_BUILD_OBJECT('id', b1.id, 'color', b1.color) as belt1,
        JSON_BUILD_OBJECT('id', b2.id, 'color', b2.color) as belt2,
        `
            : ""
        }
        ${
          with_referee
            ? `
        JSON_BUILD_OBJECT('id', ref.id, 'first_name', ref.first_name, 'last_name', ref.last_name, 'license_number', ref.license_number, 'certification_level', ref.certification_level) as main_referee,
        `
            : ""
        }
        ${
          with_matches
            ? `
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'status', m.status,
              'match_result', m.match_result,
              'match_date', m.match_date,
              'start_time', m.start_time,
              'end_time', m.end_time,
              'fighter1_id', m.fighter1_id,
              'fighter2_id', m.fighter2_id,
              'winner_fighter_id', m.winner_fighter_id,
              'loser_fighter_id', m.loser_fighter_id,
              'total_duration', m.total_duration,
              'break_count', m.break_count
            ) ORDER BY m.match_number
          ) FROM matches m 
          WHERE m.sub_group_id = sg.id ${isActiveCondition.replace("is_active", "m.is_active")}
          ),
          '[]'::json
        ) as matches
        `
            : `'matches', '[]'::json`
        }
        ${
          with_edition_fighters
            ? `
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ef.id,
              'edition_id', ef.edition_id,
              'fighter_id', ef.fighter_id,
              'region_id', ef.region_id,
              'is_champion', ef.is_champion,
              'is_eliminated', ef.is_eliminated,
              'status', ef.status,
              'registration_date', ef.registration_date,
              'fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname,
                'profile_image', f.profile_image,
                'ranking', f.ranking,
                'is_champion', f.is_champion,
                'region', JSON_BUILD_OBJECT(
                  'id', fr.id,
                  'name', fr.name,
                  'code', fr.code,
                  'color', fr.color
                )
              ),
              'region', JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'code', r.code,
                'color', r.color
              )
            )
          ) FROM edition_fighters ef
          INNER JOIN fighters f ON ef.fighter_id = f.id
          LEFT JOIN regions fr ON f.region_id = fr.id
          INNER JOIN regions r ON ef.region_id = r.id
          INNER JOIN competition_editions ce ON ef.edition_id = ce.id
          INNER JOIN phases ph ON ce.id = ph.edition_id
          INNER JOIN phase_groups pg2 ON ph.id = pg2.phase_id
          WHERE pg2.id = sg.group_id AND ef.status = 'registered'
          ),
          '[]'::json
        ) as edition_fighters
        `
            : `'edition_fighters', '[]'::json`
        }
        ${
          with_edition_regions
            ? `
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', er.id,
              'edition_id', er.edition_id,
              'region_id', er.region_id,
              'is_eliminated', er.is_eliminated,
              'points', er.points,
              'status', er.status,
              'registration_date', er.registration_date,
              'region', JSON_BUILD_OBJECT(
                'id', reg.id,
                'name', reg.name,
                'code', reg.code,
                'flag_image', reg.flag_image,
                'color', reg.color,
                'stadium_name', reg.stadium_name,
                'stadium_image', reg.stadium_image
              )
            )
          ) FROM edition_regions er
          INNER JOIN regions reg ON er.region_id = reg.id
          INNER JOIN competition_editions ce ON er.edition_id = ce.id
          INNER JOIN phases ph ON ce.id = ph.edition_id
          INNER JOIN phase_groups pg2 ON ph.id = pg2.phase_id
          WHERE pg2.id = sg.group_id AND er.status = 'approved'
          ),
          '[]'::json
        ) as edition_regions
        `
            : `'edition_regions', '[]'::json`
        }
      FROM sub_groups sg
      LEFT JOIN phase_groups pg ON sg.group_id = pg.id
      ${with_phase ? "LEFT JOIN phases p ON pg.phase_id = p.id" : ""}
      ${with_edition ? "LEFT JOIN competition_editions ce ON p.edition_id = ce.id" : ""}
      ${with_competition ? "LEFT JOIN competitions c ON ce.competition_id = c.id" : ""}
      ${with_regions ? "LEFT JOIN regions r1 ON sg.region1_id = r1.id LEFT JOIN regions r2 ON sg.region2_id = r2.id" : ""}
      ${with_belts ? "LEFT JOIN belt b1 ON sg.belt_region1 = b1.id LEFT JOIN belt b2 ON sg.belt_region2 = b2.id" : ""}
      ${with_referee ? "LEFT JOIN referees ref ON sg.main_referee_id = ref.id" : ""}
      ${whereClause}
    `;

    const result = await queryOne<SubGroup>(sql, params);
    if (!result) throw new Error("Sous-groupe non trouvé");
    return result;
  } catch (error) {
    console.error("Error in getSubGroupById:", error);
    throw error;
  }
}

export async function createSubGroup(formData: FormData) {
  try {
    const rawData = {
      group_id: formData.get("group_id"),
      name: formData.get("name"),
      sub_group_order: formData.get("sub_group_order"),
      description: formData.get("description"),
      region1_id: formData.get("region1_id"),
      region2_id: formData.get("region2_id"),
      belt_region1: formData.get("belt_region1"),
      belt_region2: formData.get("belt_region2"),
      main_referee_id: formData.get("main_referee_id"),
      period: formData.get("period"),
      video_url: formData.get("video_url"),
      status: formData.get("status"),
      is_completed: formData.get("is_completed"),
      is_active: formData.get("is_active"),
    };

    const validatedData = subGroupSchema.parse({
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: (rawData.description as string) || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1
        ? Number(rawData.belt_region1)
        : undefined,
      belt_region2: rawData.belt_region2
        ? Number(rawData.belt_region2)
        : undefined,
      main_referee_id: rawData.main_referee_id
        ? Number(rawData.main_referee_id)
        : undefined,
      period: (rawData.period as any) || undefined,
      video_url: (rawData.video_url as string) || undefined,
      status: (rawData.status as any) || "upcoming",
      is_completed: rawData.is_completed === "true",
      is_active: rawData.is_active === "true",
    });

    const sql = `
      INSERT INTO sub_groups (
        group_id, name, sub_group_order, description, 
        region1_id, region2_id, belt_region1, belt_region2, 
        main_referee_id, period, video_url, status, is_completed, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
      validatedData.period || null,
      validatedData.video_url || null,
      validatedData.status,
      validatedData.is_completed,
      validatedData.is_active,
    ]);

    const id = result[0].id;
    revalidatePath(`/ad/phase-groups/${validatedData.group_id}`);

    // Émettre l'événement temps réel
    emitSubGroupEvent(id, "created", { id, ...validatedData });

    return { success: true, id, message: "Sous-groupe créé avec succès" };
  } catch (error) {
    console.error("Error in createSubGroup:", error);
    throw error;
  }
}

export async function updateSubGroup(id: number, formData: FormData) {
  try {
    const rawData = {
      group_id: formData.get("group_id"),
      name: formData.get("name"),
      sub_group_order: formData.get("sub_group_order"),
      description: formData.get("description"),
      region1_id: formData.get("region1_id"),
      region2_id: formData.get("region2_id"),
      belt_region1: formData.get("belt_region1"),
      belt_region2: formData.get("belt_region2"),
      main_referee_id: formData.get("main_referee_id"),
      period: formData.get("period"),
      video_url: formData.get("video_url"),
      status: formData.get("status"),
      is_completed: formData.get("is_completed"),
      is_active: formData.get("is_active"),
    };

    const validatedData = subGroupSchema.parse({
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: (rawData.description as string) || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1
        ? Number(rawData.belt_region1)
        : undefined,
      belt_region2: rawData.belt_region2
        ? Number(rawData.belt_region2)
        : undefined,
      main_referee_id: rawData.main_referee_id
        ? Number(rawData.main_referee_id)
        : undefined,
      period: (rawData.period as any) || undefined,
      video_url: (rawData.video_url as string) || undefined,
      status: (rawData.status as any) || "upcoming",
      is_completed: rawData.is_completed === "true",
      is_active: rawData.is_active === "true",
    });

    const sql = `
      UPDATE sub_groups SET
        group_id = $1, name = $2, sub_group_order = $3, description = $4, 
        region1_id = $5, region2_id = $6, belt_region1 = $7, belt_region2 = $8, 
        main_referee_id = $9, period = $10, video_url = $11, status = $12, 
        is_completed = $13, is_active = $14
      WHERE id = $15
    `;

    await query(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
      validatedData.period || null,
      validatedData.video_url || null,
      validatedData.status,
      validatedData.is_completed,
      validatedData.is_active,
      id,
    ]);

    revalidatePath(`/ad/sub-groups/${id}`);
    revalidatePath(`/ad/phase-groups/${validatedData.group_id}`);

    // Émettre l'événement temps réel
    emitSubGroupEvent(id, "updated", { id, ...validatedData });

    return { success: true, message: "Rencontre mis à jour avec succès" };
  } catch (error) {
    console.error("Error in updateSubGroup:", error);
    throw error;
  }
}

export async function deleteSubGroup(id: number) {
  try {
    const subGroup = await getSubGroupById(id, { with_relations: false });
    if (!subGroup) throw new Error("Rencontre non trouvée");

    const sql = "DELETE FROM sub_groups WHERE id = $1";
    await query(sql, [id]);

    revalidatePath(`/ad/phase-groups/${subGroup.group_id}`);

    // Émettre l'événement temps réel
    emitSubGroupEvent(id, "deleted", { id });

    return { success: true, message: "Sous-groupe supprimé avec succès" };
  } catch (error) {
    console.error("Error in deleteSubGroup:", error);
    throw error;
  }
}

export async function completeSubGroup(id: number) {
  try {
    const sql =
      "UPDATE sub_groups SET is_completed = true, status = 'completed' WHERE id = $1";
    await query(sql, [id]);

    const subGroup = await getSubGroupById(id, { with_relations: false });
    revalidatePath(`/ad/sub-groups/${id}`);
    if (subGroup?.group_id) {
      revalidatePath(`/ad/phase-groups/${subGroup.group_id}`);
    }

    emitSubGroupEvent(id, "updated", {
      id,
      is_completed: true,
      status: "completed",
    });

    return { success: true, message: "Rencontre marquée comme terminée" };
  } catch (error) {
    console.error("Error in completeSubGroup:", error);
    throw error;
  }
}
