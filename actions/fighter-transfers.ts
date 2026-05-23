// @/actions/fighter-transfers.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { fighterTransferSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, updateTag, cacheLife } from 'next/cache';
import { FighterTransfer, FighterTransferFilters, PaginatedResponse } from '@/types';

export async function getFighterTransfers(
  filters: FighterTransferFilters = {}
): Promise<PaginatedResponse<FighterTransfer>> {
  // "use cache";
  // // cacheTag("fighter-transfers");
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      fighter_id,
      from_region_id,
      to_region_id,
      status,
      date_from,
      date_to,
      with_fighter = true,
      with_regions = true,
      with_approver = false,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields = ['ft.id', 'ft.fighter_id', 'ft.from_region_id', 'ft.to_region_id', 'ft.transfer_date', 'ft.status', 'ft.is_permanent', 'ft.transfer_fee'];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (
        ft.transfer_reason ILIKE $${params.length + 1} OR
        EXISTS (
          SELECT 1 FROM fighters f 
          WHERE f.id = ft.fighter_id 
          AND (f.first_name ILIKE $${params.length + 1} OR f.last_name ILIKE $${params.length + 1})
        )
      )`;
      params.push(`%${search}%`);
    }

    // Filtres supplémentaires
    if (fighter_id !== undefined) {
      whereClause += ` AND ft.fighter_id = $${params.length + 1}`;
      params.push(fighter_id);
    }

    if (from_region_id !== undefined) {
      whereClause += ` AND ft.from_region_id = $${params.length + 1}`;
      params.push(from_region_id);
    }

    if (to_region_id !== undefined) {
      whereClause += ` AND ft.to_region_id = $${params.length + 1}`;
      params.push(to_region_id);
    }

    if (status) {
      whereClause += ` AND ft.status = $${params.length + 1}`;
      params.push(status);
    }

    if (date_from) {
      whereClause += ` AND ft.transfer_date >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ` AND ft.transfer_date <= $${params.length + 1}`;
      params.push(date_to);
    }

    // Jointures si demandées
    if (with_fighter) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'profile_image', f.profile_image
        ) as fighter
      `);
    }

    if (with_regions) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', fr.id,
          'name', fr.name,
          'code', fr.code,
          'color', fr.color
        ) as from_region,
        JSON_BUILD_OBJECT(
          'id', tr.id,
          'name', tr.name,
          'code', tr.code,
          'color', tr.color
        ) as to_region
      `);
    }

    if (with_approver) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as approved_by_user
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighter_transfers ft
      ${with_fighter ? 'LEFT JOIN fighters f ON ft.fighter_id = f.id' : ''}
      ${with_regions ? 'LEFT JOIN regions fr ON ft.from_region_id = fr.id LEFT JOIN regions tr ON ft.to_region_id = tr.id' : ''}
      ${with_approver ? 'LEFT JOIN users u ON ft.approved_by_user_id = u.id' : ''}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM fighter_transfers ft
      ${with_fighter ? 'LEFT JOIN fighters f ON ft.fighter_id = f.id' : ''}
      ${with_regions ? 'LEFT JOIN regions fr ON ft.from_region_id = fr.id LEFT JOIN regions tr ON ft.to_region_id = tr.id' : ''}
      ${with_approver ? 'LEFT JOIN users u ON ft.approved_by_user_id = u.id' : ''}
      ${whereClause}
      ORDER BY ft.transfer_date DESC, ft.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<FighterTransfer>(
      dataSql, 
      [...params, validatedLimit, offset]
    );

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getFighterTransfers:', error);
    throw new Error('Erreur lors de la récupération des transferts');
  }
}

export async function getFighterTransferById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  // "use cache";
  // // cacheTag("fighter-transfers", `fighter-transfer:${id}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  

  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM fighter_transfers WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          ft.*,
          JSON_BUILD_OBJECT(
            'id', f.id,
            'first_name', f.first_name,
            'last_name', f.last_name,
            'nickname', f.nickname,
            'profile_image', f.profile_image,
            'is_active', f.is_active,
            'region_id', f.region_id
          ) as fighter,
          JSON_BUILD_OBJECT(
            'id', fr.id,
            'name', fr.name,
            'code', fr.code,
            'color', fr.color
          ) as from_region,
          JSON_BUILD_OBJECT(
            'id', tr.id,
            'name', tr.name,
            'code', tr.code,
            'color', tr.color
          ) as to_region,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name
          ) as approved_by_user
        FROM fighter_transfers ft
        LEFT JOIN fighters f ON ft.fighter_id = f.id
        LEFT JOIN regions fr ON ft.from_region_id = fr.id
        LEFT JOIN regions tr ON ft.to_region_id = tr.id
        LEFT JOIN users u ON ft.approved_by_user_id = u.id
        WHERE ft.id = $1
      `;
    }

    const result = await queryOne<FighterTransfer>(sql, params);
    
    if (!result) {
      throw new Error('Transfert non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getFighterTransferById:', error);
    throw error;
  }
}

export async function createFighterTransfer(validatedData: any, userId?: number) {
  try {
    // Vérifier que le lutteur existe
    const fighterCheck = await queryOne(
      'SELECT id, region_id FROM fighters WHERE id = $1',
      [validatedData.fighter_id]
    );
    
    if (!fighterCheck) {
      throw new Error('Lutteur non trouvé');
    }

    // Vérifier que la région d'origine correspond à la région actuelle du lutteur
    if (fighterCheck.region_id !== validatedData.from_region_id) {
      throw new Error('La région d\'origine ne correspond pas à la région actuelle du lutteur');
    }

    // Vérifier que les régions sont différentes
    if (validatedData.from_region_id === validatedData.to_region_id) {
      throw new Error('Les régions d\'origine et de destination doivent être différentes');
    }

    const sql = `
      INSERT INTO fighter_transfers (
        fighter_id, from_region_id, to_region_id, transfer_date,
        transfer_reason, transfer_fee, contract_duration, 
        is_permanent, approved_by_user_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.fighter_id,
      validatedData.from_region_id,
      validatedData.to_region_id,
      validatedData.transfer_date,
      validatedData.transfer_reason || null,
      validatedData.transfer_fee || null,
      validatedData.contract_duration || null,
      validatedData.is_permanent,
      validatedData.status === 'approved' ? userId : null,
      validatedData.status,
    ]);

    revalidatePath("/transfers");
    revalidatePath("/ad/transfers");
    revalidatePath(`/admin/fighters/${validatedData.fighter_id}`);
    revalidatePath(`/admin/regions/${validatedData.from_region_id}`);
    revalidatePath(`/admin/regions/${validatedData.to_region_id}`);
    updateTag("fighter-transfers");
    updateTag("fighters");
    updateTag("regions");

    return { 
      success: true, 
      id: result[0].id,
      message: "Transfert créé avec succès",
    };
  } catch (error) {
    console.error("Error in createFighterTransfer:", error);
    throw new Error(`Erreur lors de la création du transfert: ${(error as Error).message}`);
  }
}

export async function updateFighterTransfer(id: number, formData: FormData, userId?: number) {
  try {
    const existing = await getFighterTransferById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Transfert non trouvé');
    }

    const rawData = {
      fighter_id: formData.get('fighter_id'),
      from_region_id: formData.get('from_region_id'),
      to_region_id: formData.get('to_region_id'),
      transfer_date: formData.get('transfer_date'),
      transfer_reason: formData.get('transfer_reason'),
      transfer_fee: formData.get('transfer_fee'),
      contract_duration: formData.get('contract_duration'),
      is_permanent: formData.get('is_permanent'),
      status: formData.get('status'),
    };

    const cleanedData = {
      fighter_id: Number(rawData.fighter_id),
      from_region_id: Number(rawData.from_region_id),
      to_region_id: Number(rawData.to_region_id),
      transfer_date: rawData.transfer_date as string,
      transfer_reason: rawData.transfer_reason as string || undefined,
      transfer_fee: rawData.transfer_fee ? Number(rawData.transfer_fee) : undefined,
      contract_duration: rawData.contract_duration ? Number(rawData.contract_duration) : undefined,
      is_permanent: rawData.is_permanent === 'true',
      status: rawData.status as 'pending' | 'approved' | 'rejected' | 'completed',
    };

    const validatedData = fighterTransferSchema.parse(cleanedData);

    // Si le statut passe à "approved", mettre à jour la région du lutteur
    if (validatedData.status === 'approved' && existing.status !== 'approved') {
      // Mettre à jour la région du lutteur
      await query(
        'UPDATE fighters SET region_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [validatedData.to_region_id, validatedData.fighter_id]
      );
    }

    // Si le transfert était approuvé et change de statut, rétablir la région d'origine
    if (existing.status === 'approved' && validatedData.status !== 'approved') {
      await query(
        'UPDATE fighters SET region_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [validatedData.from_region_id, validatedData.fighter_id]
      );
    }

    const sql = `
      UPDATE fighter_transfers 
      SET 
        fighter_id = $1, from_region_id = $2, to_region_id = $3,
        transfer_date = $4, transfer_reason = $5, transfer_fee = $6,
        contract_duration = $7, is_permanent = $8, status = $9,
        approved_by_user_id = $10
      WHERE id = $11
    `;
    
    const approvedByUserId = validatedData.status === 'approved' ? userId : null;

    await query(sql, [
      validatedData.fighter_id,
      validatedData.from_region_id,
      validatedData.to_region_id,
      validatedData.transfer_date,
      validatedData.transfer_reason || null,
      validatedData.transfer_fee || null,
      validatedData.contract_duration || null,
      validatedData.is_permanent,
      validatedData.status,
      approvedByUserId ?? null,
      id,
    ]);

    revalidatePath('/transfers');
    revalidatePath(`/admin/transfers/${id}`);
    revalidatePath(`/admin/fighters/${validatedData.fighter_id}`);
    revalidatePath(`/admin/regions/${validatedData.from_region_id}`);
    revalidatePath(`/admin/regions/${validatedData.to_region_id}`);

    // Si les régions ont changé, revalider les anciennes régions
    if (validatedData.from_region_id !== existing.from_region_id) {
      revalidatePath(`/admin/regions/${existing.from_region_id}`);
    }
    if (validatedData.to_region_id !== existing.to_region_id) {
      revalidatePath(`/admin/regions/${existing.to_region_id}`);
    }
    
    updateTag("fighter-transfers");
    updateTag(`fighter-transfer:${id}`);
    updateTag("fighters");
    updateTag("regions");
    
    return { 
      success: true, 
      message: 'Transfert modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateFighterTransfer:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la modification du transfert: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteFighterTransfer(id: number) {
  try {
    const existing = await getFighterTransferById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Transfert non trouvé');
    }

    // Si le transfert était approuvé, rétablir la région d'origine du lutteur
    if (existing.status === 'approved') {
      await query(
        'UPDATE fighters SET region_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [existing.from_region_id, existing.fighter_id]
      );
    }

    const sql = 'DELETE FROM fighter_transfers WHERE id = $1';
    await query(sql, [id]);

    revalidatePath('/transfers');
    revalidatePath('/admin/transfers');
    revalidatePath(`/admin/fighters/${existing.fighter_id}`);
    revalidatePath(`/admin/regions/${existing.from_region_id}`);
    revalidatePath(`/admin/regions/${existing.to_region_id}`);
    
    updateTag("fighter-transfers");
    updateTag(`fighter-transfer:${id}`);
    updateTag("fighters");
    updateTag("regions");
    
    return { 
      success: true, 
      message: 'Transfert supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteFighterTransfer:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la suppression du transfert: ${error.message}`);
    }
    throw new Error('Erreur lors de la suppression du transfert');
  }
}

export async function getTransferStats() {
  // "use cache";
  // // cacheTag("fighter-transfers");
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  

  try {
    const sql = `
      SELECT 
        COUNT(*) as total_transfers,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_transfers,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_transfers,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_transfers,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_transfers,
        COUNT(*) FILTER (WHERE is_permanent = true) as permanent_transfers,
        AVG(transfer_fee) as avg_transfer_fee,
        SUM(transfer_fee) as total_transfer_fees,
        MIN(transfer_date) as oldest_transfer,
        MAX(transfer_date) as newest_transfer
      FROM fighter_transfers
      WHERE status IN ('approved', 'completed')
    `;
    
    const result = await queryOne<{
      total_transfers: string;
      completed_transfers: string;
      approved_transfers: string;
      pending_transfers: string;
      rejected_transfers: string;
      permanent_transfers: string;
      avg_transfer_fee: string;
      total_transfer_fees: string;
      oldest_transfer: string;
      newest_transfer: string;
    }>(sql);
    
    return {
      total_transfers: parseInt(result?.total_transfers ?? '0'),
      completed_transfers: parseInt(result?.completed_transfers ?? '0'),
      approved_transfers: parseInt(result?.approved_transfers ?? '0'),
      pending_transfers: parseInt(result?.pending_transfers ?? '0'),
      rejected_transfers: parseInt(result?.rejected_transfers ?? '0'),
      permanent_transfers: parseInt(result?.permanent_transfers ?? '0'),
      avg_transfer_fee: parseFloat(result?.avg_transfer_fee ?? '0'),
      total_transfer_fees: parseFloat(result?.total_transfer_fees ?? '0'),
      oldest_transfer: result?.oldest_transfer || null,
      newest_transfer: result?.newest_transfer || null,
    };
  } catch (error) {
    console.error('Error in getTransferStats:', error);
    return {
      total_transfers: 0,
      completed_transfers: 0,
      approved_transfers: 0,
      pending_transfers: 0,
      rejected_transfers: 0,
      permanent_transfers: 0,
      avg_transfer_fee: 0,
      total_transfer_fees: 0,
      oldest_transfer: null,
      newest_transfer: null,
    };
  }
}