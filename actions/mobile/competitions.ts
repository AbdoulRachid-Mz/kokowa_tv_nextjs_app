'use server';

import { query } from '@/lib/db/neon-client';

export async function getMobileCompetitions(withEditions: boolean = false) {
  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.status,
        c.is_active as "isActive",
        c.featured_image as "featuredImage",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        COUNT(ce.id) as "totalEditions"
      FROM competitions c
      LEFT JOIN competition_editions ce ON c.id = ce.competition_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const competitions = await query(sql);

    // Si on demande les éditions avec les compétitions
    if (withEditions) {
      for (const competition of competitions) {
        competition.editions = await getEditionsForCompetition(competition.id);
      }
    }

    return {
      success: true,
      data: {
        competitions,
        count: competitions.length,
        timestamp: new Date().toISOString()
      },
      message: 'Compétitions récupérées avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileCompetitions:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des compétitions',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function getMobileCompetitionById(id: number, withEditions: boolean = false) {
  try {
    // Récupérer les informations de base de la compétition
    const competitionSql = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.status,
        c.is_active as "isActive",
        c.featured_image as "featuredImage",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        COUNT(ce.id) as "totalEditions"
      FROM competitions c
      LEFT JOIN competition_editions ce ON c.id = ce.competition_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const competitionResult = await query(competitionSql, [id]);
    const competition = competitionResult[0];

    if (!competition) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Compétition non trouvée',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Si on demande les éditions avec la compétition
    if (withEditions) {
      competition.editions = await getEditionsForCompetition(id);
    }

    return {
      success: true,
      data: {
        competition
      },
      message: 'Compétition récupérée avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileCompetitionById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération de la compétition',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Fonction auxiliaire pour récupérer les éditions d'une compétition
async function getEditionsForCompetition(competitionId: number) {
  const sql = `
    SELECT 
      ce.id,
      ce.edition_number as "editionNumber",
      ce.year,
      ce.theme,
      ce.region_id as "regionId",
      r.name as "regionName",
      ce.start_date as "startDate",
      ce.end_date as "endDate",
      ce.winner_fighter_id as "winnerFighterId",
      f.first_name as "winnerFirstName",
      f.last_name as "winnerLastName",
      f.nickname as "winnerNickname",
      ce.is_active as "isActive",
      ce.total_participants as "totalParticipants",
      ce.prize_pool as "prizePool",
      ce.registration_deadline as "registrationDeadline",
      ce.created_at as "createdAt",
      COUNT(ef.id) as "registeredFighters",
      COUNT(er.id) as "registeredRegions"
    FROM competition_editions ce
    LEFT JOIN regions r ON ce.region_id = r.id
    LEFT JOIN fighters f ON ce.winner_fighter_id = f.id
    LEFT JOIN edition_fighters ef ON ce.id = ef.edition_id
    LEFT JOIN edition_regions er ON ce.id = er.edition_id
    WHERE ce.competition_id = $1
    GROUP BY ce.id, r.name, f.first_name, f.last_name, f.nickname
    ORDER BY ce.year DESC, ce.edition_number DESC
  `;

  return await query(sql, [competitionId]);
}