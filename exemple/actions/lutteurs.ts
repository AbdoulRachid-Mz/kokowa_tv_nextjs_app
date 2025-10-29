'use server';

import { query, queryOne } from '@/lib/db/connection';
import { lutteurSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Lutteur } from '@/types/entities';

export interface LutteurFilters {
  region_id?: number;
  actif?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface LutteurListResponse {
  data: (Lutteur & { region_name?: string; region_code?: string })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLutteurs(
  filters: LutteurFilters = {},
  pagination: PaginationParams = {}
): Promise<LutteurListResponse> {
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtres
    if (filters.region_id) {
      whereClause += ' AND l.region_id = ?';
      params.push(filters.region_id);
    }

    if (filters.actif !== undefined) {
      whereClause += ' AND l.actif = ?';
      params.push(filters.actif);
    }

    if (filters.search) {
      whereClause += ' AND (l.nom LIKE ? OR l.surnom LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM lutteur l
      ${whereClause}
    `;

    const countResult = await query<{ total: number }>(countSql, params);
    const total = countResult[0]?.total ?? 0;

    // Pagination
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination.limit ?? 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Requête principale avec pagination
    const dataSql = `
      SELECT l.*, r.name as region_name, r.code as region_code 
      FROM lutteur l 
      LEFT JOIN region r ON l.region_id = r.id 
      ${whereClause}
      ORDER BY l.nom ASC
      LIMIT ? OFFSET ?
    `;

    // Convertir explicitement en nombres pour MySQL
    const paginationParams = [
      Number(limit),   // S'assurer que c'est un nombre
      Number(offset)   // S'assurer que c'est un nombre
    ];

    const data = await query<Lutteur & { region_name?: string; region_code?: string }>(
      dataSql, 
      [...params, ...paginationParams]
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getLutteurs:', error);
    throw new Error('Erreur lors de la récupération des lutteurs');
  }
}

export async function getLutteurById(id: number) {
  try {
    const sql = `
      SELECT l.*, r.name as region_name, r.code as region_code 
      FROM lutteur l 
      LEFT JOIN region r ON l.region_id = r.id 
      WHERE l.id = ?
    `;
    const result = await queryOne<Lutteur & { region_name?: string; region_code?: string }>(sql, [id]);
    
    if (!result) {
      throw new Error('Lutteur non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getLutteurById:', error);
    throw error;
  }
}

export async function createLutteur(formData: FormData) {
  try {
    const rawData = {
      nom: formData.get('nom'),
      surnom: formData.get('surnom'),
      date_naissance: formData.get('date_naissance'),
      region_id: formData.get('region_id'),
      poids: formData.get('poids'),
      actif: formData.get('actif'),
      photo_url: formData.get('photo_url'),
    };

    console.log('Raw form data:', rawData);

    // Nettoyer les valeurs null/undefined
    const cleanedData = {
      nom: rawData.nom || '',
      surnom: rawData.surnom || undefined,
      date_naissance: rawData.date_naissance || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      poids: rawData.poids ? Number(rawData.poids) : undefined,
      actif: rawData.actif === 'true',
      photo_url: rawData.photo_url || '',
    };

    console.log('Cleaned data:', cleanedData);

    const validatedData = lutteurSchema.parse(cleanedData);

    const sql = `
      INSERT INTO lutteur (nom, surnom, date_naissance, region_id, poids, actif, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query<{ insertId: number }>(sql, [
      validatedData.nom,
      validatedData.surnom || null,
      validatedData.date_naissance || null,
      validatedData.region_id || null,
      validatedData.poids || null,
      validatedData.actif,
      validatedData.photo_url || null,
    ]);

    revalidatePath('/lutteurs');
    return { 
      success: true, 
      id: result[0].insertId,
      message: 'Lutteur créé avec succès'
    };
  } catch (error) {
    console.error('Error in createLutteur:', error);
    throw new Error('Erreur lors de la création du lutteur');
  }
}

export async function updateLutteur(id: number, formData: FormData) {
  try {
    // Vérifier que le lutteur existe
    const existing = await getLutteurById(id);
    if (!existing) {
      throw new Error('Lutteur non trouvé');
    }

    const rawData = {
      nom: formData.get('nom'),
      surnom: formData.get('surnom'),
      date_naissance: formData.get('date_naissance'),
      region_id: formData.get('region_id'),
      poids: formData.get('poids'),
      actif: formData.get('actif'),
      photo_url: formData.get('photo_url'),
    };

    const validatedData = lutteurSchema.parse({
      nom: rawData.nom,
      surnom: rawData.surnom,
      date_naissance: rawData.date_naissance,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      poids: rawData.poids ? Number(rawData.poids) : undefined,
      actif: rawData.actif === 'true',
      photo_url: rawData.photo_url,
    });

    const sql = `
      UPDATE lutteur 
      SET nom = ?, surnom = ?, date_naissance = ?, region_id = ?, poids = ?, actif = ?, photo_url = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      validatedData.nom,
      validatedData.surnom || null,
      validatedData.date_naissance || null,
      validatedData.region_id || null,
      validatedData.poids || null,
      validatedData.actif,
      validatedData.photo_url || null,
      id,
    ]);

    revalidatePath('/lutteurs');
    revalidatePath(`/lutteurs/${id}`);
    return { 
      success: true, 
      message: 'Lutteur modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateLutteur:', error);
    throw error;
  }
}

export async function deleteLutteur(id: number) {
  try {
    // Vérifier que le lutteur existe
    const existing = await getLutteurById(id);
    if (!existing) {
      throw new Error('Lutteur non trouvé');
    }

    const sql = 'DELETE FROM lutteur WHERE id = ?';
    await query(sql, [id]);
    
    revalidatePath('/lutteurs');
    return { 
      success: true, 
      message: 'Lutteur supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteLutteur:', error);
    throw new Error('Erreur lors de la suppression du lutteur');
  }
}