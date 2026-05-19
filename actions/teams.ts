"use server";

import { revalidatePath, cacheTag, updateTag } from "next/cache";
import { 
  TeamMember, 
  TeamMemberFilters, 
  TeamAchievement,
  PaginatedResponse 
} from "@/types";
import { teamMemberSchema, teamAchievementSchema, TeamMemberInput, TeamAchievementInput } from "@/validation/schemas";
import { query, queryOne } from "@/lib/db/neon-client";

// Membres de l'équipe

/**
 * Récupère la liste des membres de l'équipe avec filtres et pagination
 */
export async function getTeamMembers(filters: TeamMemberFilters = {}): Promise<PaginatedResponse<TeamMember>> {
  "use cache";
  cacheTag("teams");

  const {
    search,
    is_active,
    is_lead,
    role,
    department,
    page = 1,
    limit = 10,
    sortBy = "position_order",
    sortOrder = "asc",
    with_achievements = false
  } = filters;

  const offset = (page - 1) * limit;
  const queryParams: any[] = [];
  let whereConditions = [];

  if (search) {
    queryParams.push(`%${search}%`);
    whereConditions.push(`(first_name ILIKE $${queryParams.length} OR last_name ILIKE $${queryParams.length} OR nickname ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length})`);
  }

  if (is_active !== undefined && is_active !== "all") {
    const activeBool = is_active === "true" || is_active === true ? 1 : 0;
    queryParams.push(activeBool);
    whereConditions.push(`is_active = $${queryParams.length}`);
  }

  if (is_lead !== undefined && is_lead !== "all") {
    const leadBool = is_lead === "true" || is_lead === true ? 1 : 0;
    queryParams.push(leadBool);
    whereConditions.push(`is_lead = $${queryParams.length}`);
  }

  if (role && role !== "all") {
    queryParams.push(role);
    whereConditions.push(`role = $${queryParams.length}`);
  }

  if (department && department !== "all") {
    queryParams.push(department);
    whereConditions.push(`department = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Compte total
  const countRes = await query(`SELECT COUNT(*) as total FROM team_members ${whereClause}`, queryParams);
  const total = parseInt(countRes[0]?.total || "0");

  // Données
  const dataQuery = `
    SELECT * FROM team_members
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;
  
  let teamMembers = await query<TeamMember>(dataQuery, [...queryParams, limit, offset]);

  // Parse JSON fields from database
  teamMembers = teamMembers.map(member => ({
    ...member,
    expertise: typeof member.expertise === 'string' ? JSON.parse(member.expertise) : member.expertise,
    languages: typeof member.languages === 'string' ? JSON.parse(member.languages) : member.languages,
    social_links: typeof member.social_links === 'string' ? JSON.parse(member.social_links) : member.social_links,
    badges: typeof member.badges === 'string' ? JSON.parse(member.badges) : member.badges
  }));

  // Charger les accomplissements si demandé
  if (with_achievements && teamMembers.length > 0) {
    const memberIds = teamMembers.map(m => m.id);
    const achievements = await query<TeamAchievement>(
      `SELECT * FROM team_achievements WHERE team_member_id = ANY($1::int[]) ORDER BY achievement_date DESC`,
      [memberIds]
    );

    teamMembers = teamMembers.map(member => ({
      ...member,
      achievements: achievements.filter(a => a.team_member_id === member.id)
    }));
  }

  return {
    data: teamMembers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Récupère un membre de l'équipe par son ID
 */
export async function getTeamMemberById(id: number, with_achievements = true): Promise<TeamMember | null> {
  "use cache";
  cacheTag("teams", `team:${id}`);

  if (isNaN(id)) return null;
  const member = await queryOne<TeamMember>(`SELECT * FROM team_members WHERE id = $1`, [id]);
  if (!member) return null;

  // Parse JSON fields from database
  const parsedMember = {
    ...member,
    expertise: typeof member.expertise === 'string' ? JSON.parse(member.expertise) : member.expertise,
    languages: typeof member.languages === 'string' ? JSON.parse(member.languages) : member.languages,
    social_links: typeof member.social_links === 'string' ? JSON.parse(member.social_links) : member.social_links,
    badges: typeof member.badges === 'string' ? JSON.parse(member.badges) : member.badges
  };

  if (with_achievements) {
    const achievements = await query<TeamAchievement>(
      `SELECT * FROM team_achievements WHERE team_member_id = $1 ORDER BY achievement_date DESC`,
      [id]
    );
    parsedMember.achievements = achievements;
  }

  return parsedMember;
}

/**
 * Crée un nouveau membre de l'équipe
 */
export async function createTeamMember(data: TeamMemberInput) {
  const validatedData = teamMemberSchema.parse(data);
  
  // Stringify JSON fields for database storage
  const processedData = {
    ...validatedData,
    expertise: validatedData.expertise ? JSON.stringify(validatedData.expertise) : null,
    languages: validatedData.languages ? JSON.stringify(validatedData.languages) : null,
    social_links: validatedData.social_links ? JSON.stringify(validatedData.social_links) : '{}',
    badges: validatedData.badges ? JSON.stringify(validatedData.badges) : null,
    is_lead: validatedData.is_lead ? 1 : 0,
    is_active: validatedData.is_active ? 1 : 0
  };
  
  const fields = Object.keys(processedData);
  const values = Object.values(processedData);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  
  const res = await query<TeamMember>(
    `INSERT INTO team_members (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  revalidatePath("/(admins)/ad/teams", "page");
  updateTag("teams");
  return res[0];
}

/**
 * Met à jour un membre de l'équipe
 */
export async function updateTeamMember(id: number, data: Partial<TeamMemberInput>) {
  // Process JSON fields and boolean to tinyint conversion
  const processedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (['expertise', 'languages', 'social_links', 'badges'].includes(key) && value !== null && value !== undefined) {
      processedData[key] = JSON.stringify(value);
    } else if (key === 'is_lead' || key === 'is_active') {
      processedData[key] = value ? 1 : 0;
    } else {
      processedData[key] = value;
    }
  }
  
  const fields = Object.keys(processedData);
  const values = Object.values(processedData);
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");

  const res = await query<TeamMember>(
    `UPDATE team_members SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );

  revalidatePath("/(admins)/ad/teams", "page");
  revalidatePath(`/(admins)/ad/teams/${id}`, "page");
  updateTag("teams");
  updateTag(`team:${id}`);
  return res[0];
}

/**
 * Supprime un membre de l'équipe
 */
export async function deleteTeamMember(id: number) {
  await query(`DELETE FROM team_members WHERE id = $1`, [id]);
  revalidatePath("/(admins)/ad/teams", "page");
  updateTag("teams");
  updateTag(`team:${id}`);
  return { success: true };
}

// Accomplissements

/**
 * Récupère les accomplissements pour un membre
 */
export async function getTeamAchievements(memberId: number): Promise<TeamAchievement[]> {
  "use cache";
  cacheTag("team-achievements", `team-achievements:${memberId}`);

  return await query<TeamAchievement>(
    `SELECT * FROM team_achievements WHERE team_member_id = $1 ORDER BY achievement_date DESC`,
    [memberId]
  );
}

/**
 * Ajoute un accomplissement
 */
export async function addTeamAchievement(data: TeamAchievementInput) {
  const validatedData = teamAchievementSchema.parse(data);
  
  const fields = Object.keys(validatedData);
  const values = Object.values(validatedData);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  
  const res = await query<TeamAchievement>(
    `INSERT INTO team_achievements (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  revalidatePath(`/(admins)/ad/teams/${validatedData.team_member_id}`, "page");
  updateTag("teams");
  updateTag(`team:${validatedData.team_member_id}`);
  updateTag("team-achievements");
  updateTag(`team-achievements:${validatedData.team_member_id}`);
  return res[0];
}

/**
 * Met à jour un accomplissement d'équipe
 */
export async function updateTeamAchievement(id: number, data: Partial<TeamAchievementInput>) {
  const processedData: Record<string, any> = {};
  
  // Ne pas inclure team_member_id dans la mise à jour (optionnel)
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'team_member_id') {
      processedData[key] = value;
    }
  }
  
  const fields = Object.keys(processedData);
  const values = Object.values(processedData);
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
  
  const res = await query<TeamAchievement>(
    `UPDATE team_achievements SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  if (res.length > 0) {
    revalidatePath(`/(admins)/ad/teams/${res[0].team_member_id}`, "page");
    updateTag("teams");
    updateTag(`team:${res[0].team_member_id}`);
    updateTag("team-achievements");
    updateTag(`team-achievements:${res[0].team_member_id}`);
  }
  return res[0];
}

/**
 * Supprime un accomplissement
 */
export async function deleteTeamAchievement(id: number) {
  const res = await query<{ team_member_id: number }>(`DELETE FROM team_achievements WHERE id = $1 RETURNING team_member_id`, [id]);
  if (res.length > 0) {
    revalidatePath(`/(admins)/ad/teams/${res[0].team_member_id}`, "page");
    updateTag("teams");
    updateTag(`team:${res[0].team_member_id}`);
    updateTag("team-achievements");
    updateTag(`team-achievements:${res[0].team_member_id}`);
  }
  return { success: true };
}
