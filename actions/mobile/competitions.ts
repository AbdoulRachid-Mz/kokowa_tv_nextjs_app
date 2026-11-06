'use server';

import { query } from '@/lib/db/neon-client';

export async function getMobileCompetitions(withEditions: boolean = false) {
  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.status,
        c.featured_image as "featuredImage",
        COUNT(ce.id) as "totalEditions"
      FROM competitions c
      LEFT JOIN competition_editions ce ON c.id = ce.competition_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const competitions = await query(sql);

    // Si on demande les éditions avec les compétitions
    if (withEditions && competitions.length > 0) {
      const editionsByCompetition = await getEditionsForCompetitions(
        competitions.map((competition: any) => Number(competition.id)),
      );
      for (const competition of competitions) {
        competition.editions =
          editionsByCompetition.get(Number(competition.id)) ?? [];
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
        c.description,
        c.status,
        c.featured_image as "featuredImage",
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
  const editionsByCompetition = await getEditionsForCompetitions([competitionId]);
  return editionsByCompetition.get(competitionId) ?? [];
}

/**
 * Charge les éditions de plusieurs compétitions en UNE requête.
 * L'ordre (année DESC, numéro DESC) est conservé à l'intérieur de chaque
 * compétition, comme avec l'ancienne boucle.
 */
async function getEditionsForCompetitions(
  competitionIds: number[],
): Promise<Map<number, any[]>> {
  const result = new Map<number, any[]>();
  if (!competitionIds.length) return result;

  const sql = `
    SELECT 
      ce.competition_id as "competitionId",
      ce.id,
      ce.edition_number as "editionNumber",
      ce.year,
      ce.theme,
      r.name as "regionName",
      ce.start_date as "startDate",
      ce.end_date as "endDate",
      f.first_name as "winnerFirstName",
      f.last_name as "winnerLastName",
      f.nickname as "winnerNickname"
    FROM competition_editions ce
    LEFT JOIN regions r ON ce.region_id = r.id
    LEFT JOIN fighters f ON ce.winner_fighter_id = f.id
    WHERE ce.competition_id = ANY($1::int[])
    ORDER BY ce.competition_id, ce.year DESC, ce.edition_number DESC
  `;

  const rows = await query(sql, [competitionIds]);

  for (const row of rows) {
    const competitionId = Number(row.competitionId);
    delete row.competitionId;
    const list = result.get(competitionId);
    if (list) {
      list.push(row);
    } else {
      result.set(competitionId, [row]);
    }
  }

  return result;
}