// @/actions/editions.ts
"use server";

import { query, queryOne } from "@/lib/db/neon-client";
import {
  competitionEditionSchema,
  editionFighterSchema,
  editionRegionSchema,
} from "@/validation/schemas";
import { revalidatePath } from "next/cache";
import {
  CompetitionEdition,
  EditionFighter,
  EditionFilters,
  EditionRegion,
  PaginatedResponse,
} from "@/types";

export async function getEditions(options: EditionFilters = {}) {
  try {
    const {
      competition_id,
      year,
      search = "",
      page = 1,
      limit = 20,
      offset = 0,
      with_competition = true,
      with_fighters = false,
      with_regions = false,
      with_phases = true,
      is_active,
      with_groups = true,
      with_subGroups = true,
      with_matches = true,
    } = options;

    const baseParams: (string | number | boolean)[] = [];
    let whereClause = "WHERE 1=1";
    let joinClause = "";
    const selectFields = ["ce.*"];

    // Filtres de base avec typage explicite
    if (competition_id) {
      baseParams.push(Number(competition_id));
      whereClause += ` AND ce.competition_id = $${baseParams.length}`;
    }

    if (year) {
      baseParams.push(Number(year));
      whereClause += ` AND ce.year = $${baseParams.length}`;
    }

    if (typeof is_active === "boolean") {
      baseParams.push(is_active);
      whereClause += ` AND ce.is_active = $${baseParams.length}::boolean`;
    }

    if (search) {
      baseParams.push(`%${search}%`);
      if (with_competition) {
        whereClause += ` AND (
          ce.theme ILIKE $${baseParams.length} 
          OR CAST(ce.year AS TEXT) ILIKE $${baseParams.length}
          OR CAST(ce.edition_number AS TEXT) ILIKE $${baseParams.length}
          OR c.name ILIKE $${baseParams.length}
        )`;
      } else {
        whereClause += ` AND (
          ce.theme ILIKE $${baseParams.length} 
          OR CAST(ce.year AS TEXT) ILIKE $${baseParams.length}
          OR CAST(ce.edition_number AS TEXT) ILIKE $${baseParams.length}
        )`;
      }
    }

    // Jointures optionnelles
    if (with_competition) {
      joinClause += " LEFT JOIN competitions c ON ce.competition_id = c.id";
      selectFields.push(`
        JSONB_BUILD_OBJECT(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'status', c.status,
          'featured_image', c.featured_image,
          'is_active', c.is_active,
          'region_id', c.region_id
        ) as competition
      `);
    }

    // Paramètres pour la requête DATA - nous allons gérer chaque section séparément
    const dataParams = [...baseParams];

    // Fighters avec filtre is_active
    if (with_fighters) {
      const isActiveFlag = typeof is_active === "boolean" ? is_active : true;

      selectFields.push(`
        COALESCE(
          (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', ef.id,
              'fighter_id', ef.fighter_id,
              'region_id', ef.region_id,
              'status', ef.status,
              'registration_date', ef.registration_date,
              'fighter', JSONB_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname,
                'ranking', f.ranking,
                'profile_image', f.profile_image,
                'is_active', f.is_active,
                'is_champion', f.is_champion
              )
            ) ORDER BY f.ranking
          ) FROM edition_fighters ef
          JOIN fighters f ON ef.fighter_id = f.id
          WHERE ef.edition_id = ce.id
            AND (${isActiveFlag ? "f.is_active = true" : "1=1"})
          ),
          '[]'::jsonb
        ) as fighters
      `);
    }

    // Regions (pas besoin de filtre is_active pour les régions)
    if (with_regions) {
      selectFields.push(`
        COALESCE(
          (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', er.id,
              'region_id', er.region_id,
              'status', er.status,
              'registration_date', er.registration_date,
              'region', JSONB_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'code', r.code,
                'color', r.color,
                'flag_image', r.flag_image,
                'stadium_name', r.stadium_name,
                'stadium_image', r.stadium_image,
                'total_fighters', r.total_fighters,
                'total_champions', r.total_champions
              )
            ) ORDER BY r.name
          ) FROM edition_regions er
          JOIN regions r ON er.region_id = r.id
          WHERE er.edition_id = ce.id
          ),
          '[]'::jsonb
        ) as regions
      `);
    }

    // Phases avec relations complètes - version simplifiée d'abord
    if (with_phases) {
      // D'abord les phases de base
      selectFields.push(`
        COALESCE(
          (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed,
              'is_active', p.is_active,
              'description', p.description,
              'start_date', p.start_date,
              'end_date', p.end_date
            ) ORDER BY p.phase_order
          ) FROM phases p 
          WHERE p.edition_id = ce.id
            ${
              typeof is_active === "boolean"
                ? `AND p.is_active = ${is_active}`
                : ""
            }
          ),
          '[]'::jsonb
        ) as phases
      `);

      // Si on demande les groupes, faire une requête séparée
      if (with_groups) {
        selectFields.push(`
          COALESCE(
            (SELECT JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', pg.id,
                'phase_id', pg.phase_id,
                'name', pg.name,
                'group_order', pg.group_order,
                'description', pg.description,
                'is_completed', pg.is_completed,
                'is_active', pg.is_active
              ) ORDER BY pg.group_order
            ) FROM phase_groups pg
            WHERE pg.phase_id IN (SELECT id FROM phases WHERE edition_id = ce.id)
              ${
                typeof is_active === "boolean"
                  ? `AND pg.is_active = ${is_active}`
                  : ""
              }
            ),
            '[]'::jsonb
          ) as phase_groups
        `);
      }

      // Si on demande les sous-groupes
      if (with_subGroups) {
        selectFields.push(`
          COALESCE(
            (SELECT JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', sg.id,
                'group_id', sg.group_id,
                'name', sg.name,
                'sub_group_order', sg.sub_group_order,
                'description', sg.description,
                'region1_id', sg.region1_id,
                'region2_id', sg.region2_id,
                'belt_region1', sg.belt_region1,
                'belt_region2', sg.belt_region2,
                'main_referee_id', sg.main_referee_id,
                'is_completed', sg.is_completed,
                'is_active', sg.is_active
              ) ORDER BY sg.sub_group_order
            ) FROM sub_groups sg
            WHERE sg.group_id IN (SELECT id FROM phase_groups WHERE phase_id IN (SELECT id FROM phases WHERE edition_id = ce.id))
              ${
                typeof is_active === "boolean"
                  ? `AND sg.is_active = ${is_active}`
                  : ""
              }
            ),
            '[]'::jsonb
          ) as sub_groups
        `);
      }

      // Si on demande les matches
      if (with_matches) {
        selectFields.push(`
          COALESCE(
            (SELECT JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', m.id,
                'sub_group_id', m.sub_group_id,
                'match_number', m.match_number,
                'match_date', m.match_date,
                'start_time', m.start_time,
                'end_time', m.end_time,
                'fighter1_id', m.fighter1_id,
                'fighter2_id', m.fighter2_id,
                'winner_fighter_id', m.winner_fighter_id,
                'loser_fighter_id', m.loser_fighter_id,
                'match_result', m.match_result,
                'total_duration', m.total_duration,
                'break_count', m.break_count,
                'status', m.status,
                'audience_count', m.audience_count,
                'video_url', m.video_url,
                'live_stream_url', m.live_stream_url,
                'notes', m.notes
              ) ORDER BY m.match_number
            ) FROM matches m
            WHERE m.sub_group_id IN (SELECT id FROM sub_groups WHERE group_id IN (SELECT id FROM phase_groups WHERE phase_id IN (SELECT id FROM phases WHERE edition_id = ce.id)))
              ${
                typeof is_active === "boolean"
                  ? `AND m.is_active = ${is_active}`
                  : ""
              }
            ),
            '[]'::jsonb
          ) as matches
        `);
      }
    }

    // Count (utilise seulement baseParams)
    const countSql = `
      SELECT COUNT(DISTINCT ce.id) as total
      FROM competition_editions ce
      ${joinClause}
      ${whereClause}
    `;

    const countResult = await query<{ total: number }>(countSql, baseParams);
    const total = countResult[0]?.total || 0;

    // Data avec pagination
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const validatedOffset = offset || (page - 1) * validatedLimit;

    // Paramètres pour la requête data (sans les filtres conditionnels des sous-requêtes)
    const paginatedParams = [...baseParams];
    paginatedParams.push(validatedLimit, validatedOffset);

    const dataSql = `
      SELECT ${selectFields.join(", ")}
      FROM competition_editions ce
      ${joinClause}
      ${whereClause}
      ORDER BY ce.year DESC, ce.edition_number DESC
      LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}
    `;

    const data = await query(dataSql, paginatedParams);

    // Traitement supplémentaire pour structurer les données
    const processedData = data.map((edition) => {
      // Si on a des phases, groupes, sous-groupes, matches séparés, on peut les structurer
      if (edition.phases && edition.phase_groups) {
        edition.phases = edition.phases.map((phase: any) => {
          phase.groups =
            edition.phase_groups?.filter(
              (group: any) => group.phase_id === phase.id
            ) || [];
          phase.groups.forEach((group: any) => {
            group.sub_groups =
              edition.sub_groups?.filter(
                (sub: any) => sub.group_id === group.id
              ) || [];
            group.sub_groups.forEach((subGroup: any) => {
              subGroup.matches =
                edition.matches?.filter(
                  (match: any) => match.sub_group_id === subGroup.id
                ) || [];
            });
          });
          return phase;
        });
      }

      // Nettoyer les champs temporaires
      delete edition.phase_groups;
      delete edition.sub_groups;
      delete edition.matches;

      return edition;
    });

    return {
      data: processedData,
      total,
      pagination: {
        page: Math.floor(validatedOffset / validatedLimit) + 1,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  } catch (error) {
    console.error("Error in getEditions:", error);
    throw new Error("Erreur lors de la récupération des éditions");
  }
}

export async function getEditionById(
  id: number,
  options: {
    with_relations?: boolean;
    relations?: {
      with_phases?: boolean;
      with_regions?: boolean;
      with_fighters?: boolean;
      with_groups?: boolean;
      with_subGroups?: boolean;
      with_matches?: boolean;
    };
    is_active?: boolean;
  } = {}
) {
  try {
    const { with_relations = true, relations = {}, is_active } = options;

    // Extraire les relations avec des valeurs par défaut
    const {
      with_phases = true,
      with_regions = true,
      with_fighters = true,
      with_groups = true,
      with_subGroups = true,
      with_matches = true,
    } = relations;

    const params: any[] = [id];
    let whereClause = "WHERE ce.id = $1";

    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === "boolean") {
      params.push(is_active);
      whereClause += ` AND ce.is_active = $${params.length}`;
    }

    // Si with_relations est false, retourner seulement les données de base
    if (!with_relations) {
      const sql = `SELECT * FROM competition_editions ce ${whereClause}`;
      const result = await queryOne<CompetitionEdition>(sql, params);

      if (!result) {
        throw new Error("Édition non trouvée");
      }

      return result;
    }

    // Version avec toutes les relations
    // Créer un tableau pour les paramètres conditionnels
    const conditionalParams: any[] = [];

    // Construire la requête avec les relations dynamiques
    const selectFields = [
      "ce.*",
      `
        JSON_BUILD_OBJECT(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'status', c.status,
          'featured_image', c.featured_image,
          'is_active', c.is_active,
          'region_id', c.region_id,
          'description', c.description
        ) as competition
      `,
    ];

    // Ajouter la relation fighters si demandée
    if (with_fighters) {
      // Si is_active est défini, l'ajouter comme paramètre conditionnel
      if (typeof is_active === "boolean") {
        conditionalParams.push(is_active);
      }

      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ef.id,
              'fighter_id', ef.fighter_id,
              'region_id', ef.region_id,
              'status', ef.status,
              'registration_date', ef.registration_date,
              'created_at', ef.created_at,
              'fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname,
                'slug', f.slug,
                'ranking', f.ranking,
                'profile_image', f.profile_image,
                'is_active', f.is_active,
                'is_champion', f.is_champion,
                'birth_date', f.birth_date,
                'birth_place', f.birth_place,
                'height', f.height,
                'weight', f.weight,
                'fighting_style', f.fighting_style,
                'debut_year', f.debut_year,
                'region', CASE 
                  WHEN f.region_id IS NOT NULL THEN JSON_BUILD_OBJECT(
                    'id', r_f.id,
                    'name', r_f.name,
                    'code', r_f.code,
                    'color', r_f.color,
                    'flag_image', r_f.flag_image
                  )
                  ELSE NULL
                END
              ),
              'edition_region', CASE 
                WHEN ef.region_id IS NOT NULL THEN JSON_BUILD_OBJECT(
                  'id', er_reg.id,
                  'region_id', er_reg.region_id,
                  'status', er_reg.status,
                  'region', JSON_BUILD_OBJECT(
                    'id', r_ef.id,
                    'name', r_ef.name,
                    'code', r_ef.code
                  )
                )
                ELSE NULL
              END
            ) ORDER BY f.last_name, f.first_name
          ) FROM edition_fighters ef
          JOIN fighters f ON ef.fighter_id = f.id
          LEFT JOIN regions r_f ON f.region_id = r_f.id
          LEFT JOIN edition_regions er_reg ON er_reg.edition_id = ce.id AND er_reg.region_id = ef.region_id
          LEFT JOIN regions r_ef ON er_reg.region_id = r_ef.id
          WHERE ef.edition_id = ce.id
            ${
              typeof is_active === "boolean"
                ? `AND ($${
                    params.length + conditionalParams.length
                  }::boolean IS FALSE OR f.is_active = true)`
                : ""
            }
          ),
          '[]'::json
        ) as fighters
      `);
    } else {
      selectFields.push(`'[]'::json as fighters`);
    }

    // Ajouter la relation regions si demandée
    if (with_regions) {
      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', er.id,
              'region_id', er.region_id,
              'status', er.status,
              'registration_date', er.registration_date,
              'created_at', er.created_at,
              'region', JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'code', r.code,
                'color', r.color,
                'flag_image', r.flag_image,
                'stadium_name', r.stadium_name,
                'stadium_image', r.stadium_image,
                'total_fighters', r.total_fighters,
                'total_champions', r.total_champions,
                'description', r.description
              ),
              'fighters_count', (
                SELECT COUNT(*)
                FROM edition_fighters ef
                WHERE ef.edition_id = ce.id 
                  AND ef.region_id = er.region_id
              ),
              'fighters', (
                SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', ef.fighter_id,
                    'first_name', f.first_name,
                    'last_name', f.last_name,
                    'nickname', f.nickname
                  )
                )
                FROM edition_fighters ef
                JOIN fighters f ON ef.fighter_id = f.id
                WHERE ef.edition_id = ce.id 
                  AND ef.region_id = er.region_id
                LIMIT 5
              )
            ) ORDER BY r.name
          ) FROM edition_regions er
          JOIN regions r ON er.region_id = r.id
          WHERE er.edition_id = ce.id
          ),
          '[]'::json
        ) as regions
      `);
    } else {
      selectFields.push(`'[]'::json as regions`);
    }

    // Ajouter la relation phases si demandée
    if (with_phases) {
      // Ajouter les paramètres pour les conditions
      const isActiveFlag = typeof is_active === "boolean" ? is_active : true;
      const conditions = [];

      if (typeof is_active === "boolean") {
        conditionalParams.push(
          isActiveFlag,
          with_groups,
          with_subGroups,
          with_matches
        );
      }

      // Construire la clause conditions pour les phases
      let phaseConditions = "";
      if (typeof is_active === "boolean") {
        phaseConditions = `AND (${isActiveFlag} IS FALSE OR p.is_active = true)`;
      }

      let groupConditions = "";
      if (typeof is_active === "boolean") {
        groupConditions = `AND (${isActiveFlag} IS FALSE OR pg.is_active = true)`;
      }

      let subGroupConditions = "";
      if (typeof is_active === "boolean") {
        subGroupConditions = `AND (${isActiveFlag} IS FALSE OR sg.is_active = true)`;
      }

      let matchConditions = "";
      if (typeof is_active === "boolean") {
        matchConditions = `AND (${isActiveFlag} IS FALSE OR m.is_active = true)`;
      }

      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed,
              'is_active', p.is_active,
              'description', p.description,
              'start_date', p.start_date,
              'end_date', p.end_date,
              'edition_id', p.edition_id,
              'groups', (
                ${
                  with_groups
                    ? `
                  SELECT COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'id', pg.id,
                        'name', pg.name,
                        'group_order', pg.group_order,
                        'description', pg.description,
                        'is_completed', pg.is_completed,
                        'is_active', pg.is_active,
                        'phase_id', pg.phase_id,
                        'sub_groups', (
                          ${
                            with_subGroups
                              ? `
                            SELECT COALESCE(
                              JSON_AGG(
                                JSON_BUILD_OBJECT(
                                  'id', sg.id,
                                  'name', sg.name,
                                  'sub_group_order', sg.sub_group_order,
                                  'description', sg.description,
                                  'region1_id', sg.region1_id,
                                  'region2_id', sg.region2_id,
                                  'belt_region1', sg.belt_region1,
                                  'belt_region2', sg.belt_region2,
                                  'main_referee_id', sg.main_referee_id,
                                  'is_completed', sg.is_completed,
                                  'is_active', sg.is_active,
                                  'group_id', sg.group_id,
                                  'matches', (
                                    ${
                                      with_matches
                                        ? `
                                      SELECT COALESCE(
                                        JSON_AGG(
                                          JSON_BUILD_OBJECT(
                                            'id', m.id,
                                            'match_number', m.match_number,
                                            'match_date', m.match_date,
                                            'start_time', m.start_time,
                                            'end_time', m.end_time,
                                            'fighter1_id', m.fighter1_id,
                                            'fighter2_id', m.fighter2_id,
                                            'winner_fighter_id', m.winner_fighter_id,
                                            'loser_fighter_id', m.loser_fighter_id,
                                            'match_result', m.match_result,
                                            'total_duration', m.total_duration,
                                            'break_count', m.break_count,
                                            'status', m.status,
                                            'audience_count', m.audience_count,
                                            'video_url', m.video_url,
                                            'live_stream_url', m.live_stream_url,
                                            'notes', m.notes,
                                            'sub_group_id', m.sub_group_id,
                                            'is_active', m.is_active,
                                            'created_at', m.created_at,
                                            'updated_at', m.updated_at
                                          ) ORDER BY m.match_number
                                        ),
                                        '[]'::json
                                      )
                                      FROM matches m
                                      WHERE m.sub_group_id = sg.id
                                        ${matchConditions}
                                    `
                                        : `'[]'::json`
                                    }
                                  )
                                ) ORDER BY sg.sub_group_order
                              ),
                              '[]'::json
                            )
                            FROM sub_groups sg
                            WHERE sg.group_id = pg.id
                              ${subGroupConditions}
                          `
                              : `'[]'::json`
                          }
                        )
                      ) ORDER BY pg.group_order
                    ),
                    '[]'::json
                  )
                  FROM phase_groups pg
                  WHERE pg.phase_id = p.id
                    ${groupConditions}
                `
                    : `'[]'::json`
                }
              )
            ) ORDER BY p.phase_order
          ) FROM phases p 
          WHERE p.edition_id = ce.id
            ${phaseConditions}
          ),
          '[]'::json
        ) as phases
      `);
    } else {
      selectFields.push(`'[]'::json as phases`);
    }

    // Ajouter le winner_fighter et winner_region
    selectFields.push(`
      (SELECT JSON_BUILD_OBJECT(
        'id', wf.id,
        'first_name', wf.first_name,
        'last_name', wf.last_name,
        'nickname', wf.nickname,
        'profile_image', wf.profile_image,
        'region_id', wf.region_id
      ) FROM fighters wf WHERE wf.id = ce.winner_fighter_id) as winner_fighter
    `);

    selectFields.push(`
      (SELECT JSON_BUILD_OBJECT(
        'id', wr.id,
        'name', wr.name,
        'code', wr.code,
        'flag_image', wr.flag_image,
        'color', wr.color
      ) FROM regions wr WHERE wr.id = ce.winner_region_id) as winner_region
    `);

    // Ajouter aussi la region de l'édition si elle existe
    selectFields.push(`
      (SELECT JSON_BUILD_OBJECT(
        'id', er.id,
        'name', er.name,
        'code', er.code,
        'color', er.color
      ) FROM regions er WHERE er.id = ce.region_id) as edition_region
    `);

    // Combiner tous les paramètres
    const allParams = [...params, ...conditionalParams];

    // Construire la requête finale
    const sql = `
      SELECT ${selectFields.join(", ")}
      FROM competition_editions ce
      LEFT JOIN competitions c ON ce.competition_id = c.id
      ${whereClause}
    `;

    const result = await queryOne<CompetitionEdition>(sql, allParams);

    if (!result) {
      throw new Error("Édition non trouvée");
    }

    return result;
  } catch (error) {
    console.error("Error in getEditionById:", error);
    throw error;
  }
}

export async function createEdition(formData: FormData) {
  try {
    const rawData = {
      competition_id: formData.get("competition_id"),
      edition_number: formData.get("edition_number"),
      year: formData.get("year"),
      theme: formData.get("theme"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
    };

    const cleanedData = {
      competition_id: Number(rawData.competition_id),
      edition_number: rawData.edition_number
        ? Number(rawData.edition_number)
        : undefined,
      year: Number(rawData.year),
      theme: (rawData.theme as string) || undefined,
      start_date: (rawData.start_date as string) || undefined,
      end_date: (rawData.end_date as string) || undefined,
    };

    // Déterminer le numéro d'édition
    let finalEditionNumber = cleanedData.edition_number;

    if (finalEditionNumber === undefined || finalEditionNumber === null) {
      // Récupérer le plus grand numéro d'édition existant pour cette compétition
      const maxNumberResult = await query<{ max_number: number }>(
        `SELECT COALESCE(MAX(edition_number), 0) as max_number 
         FROM competition_editions WHERE competition_id = $1`,
        [cleanedData.competition_id]
      );

      finalEditionNumber = maxNumberResult[0]?.max_number + 1 || 1;
    } else {
      // Vérifier si le numéro existe déjà
      const existingNumberCheck = await query<{ id: number }>(
        `SELECT id FROM competition_editions 
         WHERE edition_number = $1 AND competition_id = $2`,
        [finalEditionNumber, cleanedData.competition_id]
      );

      if (existingNumberCheck.length > 0) {
        // Trouver le prochain numéro disponible
        const numbersResult = await query<{ edition_number: number }>(
          `SELECT edition_number FROM competition_editions 
           WHERE competition_id = $1 
           ORDER BY edition_number`,
          [cleanedData.competition_id]
        );

        const existingNumbers = numbersResult.map((r) => r.edition_number);
        let nextNumber = finalEditionNumber;

        while (existingNumbers.includes(nextNumber)) {
          nextNumber++;
        }

        finalEditionNumber = nextNumber;
      }
    }

    const sql = `
      INSERT INTO competition_editions (
        competition_id, edition_number, year, theme, 
        start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      cleanedData.competition_id,
      finalEditionNumber,
      cleanedData.year,
      cleanedData.theme || null,
      cleanedData.start_date || null,
      cleanedData.end_date || null,
      true, // is_active par défaut à true
    ]);

    revalidatePath("/ad/competitions");
    revalidatePath(`/ad/competitions/${cleanedData.competition_id}`);

    return {
      success: true,
      id: result[0].id,
      message: `Édition #${finalEditionNumber} (${cleanedData.year}) créée avec succès`,
    };
  } catch (error) {
    console.error("Error in createEdition:", error);
    throw new Error("Erreur lors de la création de l'édition");
  }
}

export async function updateEdition(id: number, formData: FormData) {
  try {
    const existing = await getEditionById(id, { with_relations: false });
    if (!existing) {
      throw new Error("Édition non trouvée");
    }

    const rawData = {
      competition_id: formData.get("competition_id"),
      edition_number: formData.get("edition_number"),
      year: formData.get("year"),
      theme: formData.get("theme"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
    };

    const cleanedData = {
      competition_id: Number(rawData.competition_id),
      edition_number: Number(rawData.edition_number),
      year: Number(rawData.year),
      theme: (rawData.theme as string) || undefined,
      start_date: (rawData.start_date as string) || undefined,
      end_date: (rawData.end_date as string) || undefined,
    };

    const validatedData = competitionEditionSchema.parse(cleanedData);

    const sql = `
      UPDATE competition_editions 
      SET 
        competition_id = $1, edition_number = $2, year = $3, 
        theme = $4, start_date = $5, end_date = $6
      WHERE id = $7
    `;

    await query(sql, [
      validatedData.competition_id,
      validatedData.edition_number,
      validatedData.year,
      validatedData.theme || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      id,
    ]);

    revalidatePath("/competitions");
    revalidatePath(`/competitions/${validatedData.competition_id}`);
    revalidatePath(`/editions/${id}`);
    return {
      success: true,
      message: "Édition modifiée avec succès",
    };
  } catch (error) {
    console.error("Error in updateEdition:", error);
    throw error;
  }
}

export async function deleteEdition(id: number) {
  try {
    const existing = await getEditionById(id, { with_relations: false });
    if (!existing) {
      throw new Error("Édition non trouvée");
    }

    // Vérifier les données liées
    const relatedData = await query(
      `
      SELECT 
        (SELECT COUNT(*) FROM phases WHERE edition_id = $1) as phase_count,
        (SELECT COUNT(*) FROM edition_fighters WHERE edition_id = $1) as fighter_count,
        (SELECT COUNT(*) FROM edition_regions WHERE edition_id = $1) as region_count
    `,
      [id]
    );

    const counts = relatedData[0];
    if (
      counts.phase_count > 0 ||
      counts.fighter_count > 0 ||
      counts.region_count > 0
    ) {
      throw new Error(
        `Impossible de supprimer cette édition car elle contient des données liées: 
        ${counts.phase_count} phase(s), ${counts.fighter_count} lutteur(s), ${counts.region_count} région(s)`
      );
    }

    const sql = "DELETE FROM competition_editions WHERE id = $1";
    await query(sql, [id]);

    revalidatePath("/competitions");
    revalidatePath(`/competitions/${existing.competition_id}`);
    return {
      success: true,
      message: "Édition supprimée avec succès",
    };
  } catch (error) {
    console.error("Error in deleteEdition:", error);
    throw new Error("Erreur lors de la suppression de l'édition");
  }
}

export interface EditionParticipantsFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  region_id?: number;
  with_region?: boolean;
  with_fighter?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Récupérer les lutteurs participants d'une édition
export async function getEditionFighters(
  editionId: number,
  options: EditionParticipantsFilters = {}
): Promise<PaginatedResponse<any>> {
  try {
    const {
      search = "",
      page = 1,
      limit = 20,
      status,
      region_id,
      with_region = true,
      with_fighter = true,
      sort_by = "ranking",
      sort_order = "asc",
    } = options;

    let whereClause = "WHERE ef.edition_id = $1";
    const params: any[] = [editionId];
    const selectFields: string[] = ["ef.*"];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        f.first_name ILIKE $${params.length} 
        OR f.last_name ILIKE $${params.length}
        OR f.nickname ILIKE $${params.length}
      )`;
    }

    // Filtre par statut
    if (status) {
      params.push(status);
      whereClause += ` AND ef.status = $${params.length}`;
    }

    // Filtre par région
    if (region_id) {
      params.push(region_id);
      whereClause += ` AND f.region_id = $${params.length}`;
    }

    // Jointures
    let joinClause = "FROM edition_fighters ef";

    if (with_fighter || search || region_id) {
      joinClause += " JOIN fighters f ON ef.fighter_id = f.id";
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname,
          'ranking', f.ranking,
          'profile_image', f.profile_image,
          'is_active', f.is_active,
          'is_champion', f.is_champion
        ) as fighter
      `);
    }

    if (with_region) {
      joinClause += " LEFT JOIN regions r ON f.region_id = r.id";
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color
        ) as region
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT ef.id) as total
      ${joinClause}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? "0");

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Ordre de tri
    let orderClause = "ORDER BY ";
    switch (sort_by) {
      case "name":
        orderClause += "f.first_name, f.last_name";
        break;
      case "ranking":
        orderClause += "f.ranking";
        break;
      case "registration_date":
        orderClause += "ef.registration_date";
        break;
      case "status":
        orderClause += "ef.status";
        break;
      default:
        orderClause += "f.ranking";
    }
    orderClause += ` ${sort_order.toUpperCase()}`;

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(", ")}
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query(dataSql, [...params, validatedLimit, offset]);

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
    console.error("Error in getEditionFighters:", error);
    throw new Error("Erreur lors de la récupération des lutteurs de l'édition");
  }
}

// Récupérer les régions participantes d'une édition
export async function getEditionRegions(
  editionId: number,
  options: EditionParticipantsFilters = {}
): Promise<PaginatedResponse<any>> {
  try {
    const {
      search = "",
      page = 1,
      limit = 20,
      status,
      with_region = true,
      sort_by = "name",
      sort_order = "asc",
    } = options;

    let whereClause = "WHERE er.edition_id = $1";
    const params: any[] = [editionId];
    const selectFields: string[] = ["er.*"];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        r.name ILIKE $${params.length} 
        OR r.code ILIKE $${params.length}
      )`;
    }

    // Filtre par statut
    if (status) {
      params.push(status);
      whereClause += ` AND er.status = $${params.length}`;
    }

    // Jointures
    let joinClause = "FROM edition_regions er";

    if (with_region || search) {
      joinClause += " JOIN regions r ON er.region_id = r.id";
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color,
          'total_fighters', r.total_fighters,
          'total_champions', r.total_champions,
          'flag_image', r.flag_image
        ) as region
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT er.id) as total
      ${joinClause}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? "0");

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Ordre de tri
    let orderClause = "ORDER BY ";
    switch (sort_by) {
      case "name":
        orderClause += "r.name";
        break;
      case "code":
        orderClause += "r.code";
        break;
      case "total_fighters":
        orderClause += "r.total_fighters";
        break;
      case "registration_date":
        orderClause += "er.registration_date";
        break;
      case "status":
        orderClause += "er.status";
        break;
      default:
        orderClause += "r.name";
    }
    orderClause += ` ${sort_order.toUpperCase()}`;

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(", ")}
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query(dataSql, [...params, validatedLimit, offset]);

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
    console.error("Error in getEditionRegions:", error);
    throw new Error("Erreur lors de la récupération des régions de l'édition");
  }
}

// Gestion des lutteurs d'édition
export async function addFighterToEdition(
  editionId: number,
  fighterId: number,
  status: string = "registered",
  regionId?: number
) {
  try {
    const validatedData = editionFighterSchema.parse({
      edition_id: editionId,
      fighter_id: fighterId,
      region_id: regionId,
      status: status as any,
    });
    // console.log(validatedData)

    // Vérifier si le lien existe déjà
    const existing = await query<{ id: number; region_id: number | null }>(
      `SELECT id, region_id FROM edition_fighters WHERE edition_id = $1 AND fighter_id = $2`,
      [validatedData.edition_id, validatedData.fighter_id]
    );

    let returnedId: number;

    if (existing.length > 0) {
      // Mettre à jour le statut et éventuellement la region_id si fournie
      const updateResult = await query<{ id: number }>(
        `UPDATE edition_fighters 
         SET status = $3${regionId !== undefined ? ", region_id = $4" : ""} 
         WHERE edition_id = $1 AND fighter_id = $2 RETURNING id`,
        regionId !== undefined
          ? [
              validatedData.edition_id,
              validatedData.fighter_id,
              validatedData.status,
              regionId,
            ]
          : [
              validatedData.edition_id,
              validatedData.fighter_id,
              validatedData.status,
            ]
      );
      returnedId = updateResult[0].id;
    } else {
      // Insérer un nouveau lien avec region_id si fournie
      const insertResult = await query<{ id: number }>(
        `INSERT INTO edition_fighters (edition_id, fighter_id, status${
          regionId !== undefined ? ", region_id" : ""
        }) 
         VALUES ($1, $2, $3${
           regionId !== undefined ? ", $4" : ""
         }) RETURNING id`,
        regionId !== undefined
          ? [
              validatedData.edition_id,
              validatedData.fighter_id,
              validatedData.status,
              regionId,
            ]
          : [
              validatedData.edition_id,
              validatedData.fighter_id,
              validatedData.status,
            ]
      );
      returnedId = insertResult[0].id;
    }

    revalidatePath(`/ad/editions/${editionId}/figthers`);
    revalidatePath(`/ad/editions/${editionId}`);
    return {
      success: true,
      id: returnedId,
      message: "Lutteur ajouté à l'édition avec succès",
    };
  } catch (error) {
    console.error("Error in addFighterToEdition:", error);
    throw new Error("Erreur lors de l'ajout du lutteur à l'édition");
  }
}

// Gestion des régions d'édition
export async function addRegionToEdition(
  editionId: number,
  regionId: number,
  status: string = "registered"
) {
  try {
    const validatedData = editionRegionSchema.parse({
      edition_id: editionId,
      region_id: regionId,
      status: status as any,
    });

    const sql = `
      INSERT INTO edition_regions (edition_id, region_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (edition_id, region_id) DO UPDATE SET status = $3
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.edition_id,
      validatedData.region_id,
      validatedData.status,
    ]);

    revalidatePath(`/ad/editions/${editionId}/regions`);
    revalidatePath(`/ad/editions/${editionId}`);
    return {
      success: true,
      id: result[0].id,
      message: "Région ajoutée à l'édition avec succès",
    };
  } catch (error) {
    console.error("Error in addRegionToEdition:", error);
    throw new Error("Erreur lors de l'ajout de la région à l'édition");
  }
}

export async function removeFighterFromEdition(
  editionId: number,
  fighterId: number
) {
  try {
    const sql = `
      DELETE FROM edition_fighters
      WHERE edition_id = $1 AND fighter_id = $2
    `;

    await query(sql, [editionId, fighterId]);

    revalidatePath(`/ad/editions/${editionId}/figthers`);
    revalidatePath(`/ad/editions/${editionId}`);
    return {
      success: true,
      message: "Lutteur retiré de l'édition avec succès",
    };
  } catch (error) {
    console.error("Error in removeFighterFromEdition:", error);
    throw new Error("Erreur lors du retrait du lutteur de l'édition");
  }
}

export async function removeRegionFromEdition(
  editionId: number,
  regionId: number
) {
  try {
    const sql = `
      DELETE FROM edition_regions
      WHERE edition_id = $1 AND region_id = $2
    `;

    await query(sql, [editionId, regionId]);

    revalidatePath(`/ad/editions/${editionId}/regions`);
    revalidatePath(`/ad/editions/${editionId}`);
    return {
      success: true,
      message: "Région retirée de l'édition avec succès",
    };
  } catch (error) {
    console.error("Error in removeRegionFromEdition:", error);
    throw new Error("Erreur lors du retrait de la région de l'édition");
  }
}

export async function updateEditionFighter(
  editionId: number,
  fighterId: number,
  updates: Partial<
    Pick<
      EditionFighter,
      "status" | "region_id" | "is_champion" | "is_eliminated"
    >
  >
) {
  try {
    const allowed: (keyof EditionFighter)[] = [
      "status",
      "region_id",
      "is_champion",
      "is_eliminated",
    ];
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [k, v] of Object.entries(updates)) {
      if (!allowed.includes(k as any)) continue;
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    if (!fields.length) throw new Error("Aucune donnée valide à mettre à jour");

    values.push(editionId, fighterId); // WHERE
    const sql = `
      UPDATE edition_fighters
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE edition_id = $${idx++} AND fighter_id = $${idx}
      RETURNING *
    `;

    const rows = await query<EditionFighter>(sql, values);
    if (!rows.length) throw new Error("EditionFighter introuvable");

    revalidatePath(`/ad/editions/${editionId}/fighters`);
    revalidatePath(`/ad/editions/${editionId}`);
    return { success: true, data: rows[0] };
  } catch (e) {
    console.error("updateEditionFighter error:", e);
    throw new Error("Erreur lors de la mise à jour du lutteur de l'édition");
  }
}

export async function updateEditionRegion(
  editionId: number,
  regionId: number,
  updates: Partial<Pick<EditionRegion, "status" | "is_eliminated" | "points">>
) {
  try {
    const allowed: (keyof EditionRegion)[] = [
      "status",
      "is_eliminated",
      "points",
    ];
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [k, v] of Object.entries(updates)) {
      if (!allowed.includes(k as any)) continue;
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    if (!fields.length) throw new Error("Aucune donnée valide à mettre à jour");

    values.push(editionId, regionId); // WHERE
    const sql = `
      UPDATE edition_regions
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE edition_id = $${idx++} AND region_id = $${idx}
      RETURNING *
    `;

    const rows = await query<EditionRegion>(sql, values);
    if (!rows.length) throw new Error("EditionRegion introuvable");

    revalidatePath(`/ad/editions/${editionId}/regions`);
    revalidatePath(`/ad/editions/${editionId}`);
    return { success: true, data: rows[0] };
  } catch (e) {
    console.error("updateEditionRegion error:", e);
    throw new Error("Erreur lors de la mise à jour de la région de l'édition");
  }
}

export async function getEditionsStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_editions,
        COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE) as upcoming,
        COUNT(*) FILTER (WHERE start_date < CURRENT_DATE AND end_date >= CURRENT_DATE) as ongoing,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as completed,
        AVG(total_participants) as avg_participants,
        MAX(total_participants) as max_participants
      FROM competition_editions
    `;

    const result = await queryOne<{
      total_editions: string;
      upcoming: string;
      ongoing: string;
      completed: string;
      avg_participants: string;
      max_participants: string;
    }>(sql);

    return {
      total_editions: parseInt(result?.total_editions ?? "0"),
      upcoming: parseInt(result?.upcoming ?? "0"),
      ongoing: parseInt(result?.ongoing ?? "0"),
      completed: parseInt(result?.completed ?? "0"),
      avg_participants: parseFloat(result?.avg_participants ?? "0"),
      max_participants: parseInt(result?.max_participants ?? "0"),
    };
  } catch (error) {
    console.error("Error in getEditionsStats:", error);
    return {
      total_editions: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      avg_participants: 0,
      max_participants: 0,
    };
  }
}
