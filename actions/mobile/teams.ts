"use server";

import { query, queryOne } from "@/lib/db/neon-client";
import { TeamMember, TeamAchievement } from "@/types";

/**
 * Récupère la liste complète de l'équipe avec statistiques pour le mobile
 * Format compatible avec le legacy PHP
 */
export async function getMobileTeamMembers() {
  try {
    // 1. Récupérer les membres avec leurs accomplissements
    const membersSql = `
      SELECT 
        tm.*,
        COALESCE(
          (SELECT JSON_AGG(ta)
           FROM (
             SELECT id, title, description, achievement_date, category, icon, color
             FROM team_achievements
             WHERE team_member_id = tm.id
             ORDER BY achievement_date DESC
           ) ta),
          '[]'::json
        ) as achievements
      FROM team_members tm
      WHERE tm.is_active = TRUE
      ORDER BY tm.position_order ASC, tm.joined_date ASC
    `;

    // 2. Statistiques globales (indépendantes des membres)
    const statsSql = `
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN is_lead = TRUE THEN 1 ELSE 0 END) as total_leads,
        SUM(CASE WHEN role ILIKE '%Développeur%' OR role ILIKE '%Developer%' THEN 1 ELSE 0 END) as total_developers,
        SUM(CASE WHEN role ILIKE '%Design%' THEN 1 ELSE 0 END) as total_designers,
        SUM(CASE WHEN role ILIKE '%Projet%' OR role ILIKE '%Manager%' THEN 1 ELSE 0 END) as total_managers,
        SUM(years_experience) as total_experience,
        SUM(projects_count) as total_projects,
        SUM(contributions_count) as total_contributions
      FROM team_members
      WHERE is_active = TRUE
    `;

    // Une seule vague.
    const [members, statsResult] = await Promise.all([
      query<any>(membersSql),
      queryOne<any>(statsSql),
    ]);

    return {
      success: true,
      data: {
        members: members.map(m => {
          // Supprimer les valeurs nulles comme dans array_filter de PHP
          const filtered = Object.fromEntries(
            Object.entries(m).filter(([_, v]) => v !== null)
          );
          return filtered;
        }),
        summary: {
          total: parseInt(statsResult?.total_members || "0"),
          leads: parseInt(statsResult?.total_leads || "0"),
          developers: parseInt(statsResult?.total_developers || "0"),
          designers: parseInt(statsResult?.total_designers || "0"),
          managers: parseInt(statsResult?.total_managers || "0"),
          total_experience: parseInt(statsResult?.total_experience || "0"),
          total_projects: parseInt(statsResult?.total_projects || "0"),
          total_contributions: parseInt(statsResult?.total_contributions || "0")
        }
      },
      message: "Équipe récupérée avec succès"
    };
  } catch (error) {
    console.error("Error fetching mobile team members:", error);
    return { 
      success: false, 
      message: "Erreur serveur: " + (error as Error).message,
      data: null 
    };
  }
}

/**
 * Récupère les détails complets d'un membre pour le mobile
 */
export async function getMobileTeamMemberDetails(id: number) {
  if (isNaN(id)) return { success: false, error: "ID invalide" };
  
  try {
    const [member, achievements] = await Promise.all([
      queryOne<TeamMember>(`SELECT * FROM team_members WHERE id = $1`, [id]),
      query<TeamAchievement>(
        `SELECT * FROM team_achievements 
         WHERE team_member_id = $1 
         ORDER BY achievement_date DESC`,
        [id],
      ),
    ]);
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    return {
      success: true,
      data: {
        ...member,
        achievements
      }
    };
  } catch (error) {
    console.error(`Error fetching mobile team member ${id}:`, error);
    return { success: false, error: "Failed to fetch member details" };
  }
}
