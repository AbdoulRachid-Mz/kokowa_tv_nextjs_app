'use server';

import { query } from '@/lib/db/neon-client';

export async function getMobileTransfers(filters: {
  fighter_id?: number;
  region_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
} = {}) {
  try {
    const {
      fighter_id,
      region_id,
      status,
      limit = 50,
      offset = 0,
      search
    } = filters;

    // Valider le statut si fourni
    if (status && !['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return {
        success: false,
        error: {
          code: 400,
          message: 'Statut invalide. Valeurs acceptées: pending, approved, rejected, completed',
          timestamp: new Date().toISOString()
        }
      };
    }

    if (fighter_id) {
      return await getTransfersByFighter(fighter_id, status, limit, offset);
    } else if (region_id) {
      return await getTransfersByRegion(region_id, status, limit, offset);
    } else {
      return await getAllTransfers(status, limit, offset);
    }
  } catch (error) {
    console.error('Error in getMobileTransfers:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des transferts',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Fonctions auxiliaires
async function getAllTransfers(status: string | null = null, limit: number = 50, offset: number = 0, search?: string) {
  let sql = `
    SELECT 
      ft.id,
      ft.transfer_date as "transferDate",
      ft.transfer_reason as "transferReason",
      ft.transfer_fee as "transferFee",
      ft.contract_duration as "contractDuration",
      ft.is_permanent as "isPermanent",
      ft.status,
      
      -- Lutteur
      ft.fighter_id as "fighterId",
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.nickname as "fighterNickname",
      f.profile_image as "fighterProfileImage",
      f.region_id as "currentRegionId",
      
      -- Région d'origine
      ft.from_region_id as "fromRegionId",
      fr.name as "fromRegionName",
      
      -- Région de destination
      ft.to_region_id as "toRegionId",
      tr.name as "toRegionName",
      
      -- Approbateur
      ft.approved_by_user_id as "approvedByUserId",
      u.username as "approvedByUsername",
      u.first_name as "approvedByFirstName",
      u.last_name as "approvedByLastName"

    FROM fighter_transfers ft
    JOIN fighters f ON ft.fighter_id = f.id
    JOIN regions fr ON ft.from_region_id = fr.id
    JOIN regions tr ON ft.to_region_id = tr.id
    LEFT JOIN users u ON ft.approved_by_user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];
  
  if (status) {
    sql += ` AND ft.status = $${params.length + 1}`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (f.first_name ILIKE $${params.length + 1} OR f.last_name ILIKE $${params.length + 1} OR f.nickname ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  sql += ` ORDER BY ft.transfer_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const transfers = await query(sql, params);

  // Formater les transferts selon le modèle
  const formattedTransfers = transfers.map((t: any) => ({
    id: t.id,
    transferDate: t.transferDate,
    transferReason: t.transferReason,
    transferFee: t.transferFee,
    contractDuration: t.contractDuration,
    isPermanent: t.isPermanent,
    status: t.status,
    fighter: {
      id: t.fighterId,
      firstName: t.fighterFirstName,
      lastName: t.fighterLastName,
      nickname: t.fighterNickname,
      profileImage: t.fighterProfileImage,
      currentRegionId: t.currentRegionId
    },
    fromRegion: {
      id: t.fromRegionId,
      name: t.fromRegionName
    },
    toRegion: {
      id: t.toRegionId,
      name: t.toRegionName
    },
    approvedBy: t.approvedByUserId ? {
      id: t.approvedByUserId,
      username: t.approvedByUsername,
      firstName: t.approvedByFirstName,
      lastName: t.approvedByLastName
    } : null
  }));

  // Compter le total pour la pagination
  let countSql = `SELECT COUNT(*) as total FROM fighter_transfers ft WHERE 1=1`;
  const countParams: any[] = [];
  if (status) {
    countSql += ` AND ft.status = $${countParams.length + 1}`;
    countParams.push(status);
  }
  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult[0]?.total || '0');

  return {
    success: true,
    data: {
      transfers: formattedTransfers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + formattedTransfers.length < total
      },
      filters: {
        status
      },
      timestamp: new Date().toISOString()
    },
    message: 'Transferts récupérés avec succès'
  };
}

async function getTransfersByFighter(fighterId: number, status: string | null = null, limit: number = 50, offset: number = 0, search?: string) {
  // D'abord vérifier que le lutteur existe
  const fighterExists = await query("SELECT id FROM fighters WHERE id = $1", [fighterId]);
  
  if (fighterExists.length === 0) {
    return {
      success: false,
      error: {
        code: 404,
        message: 'Lutteur non trouvé',
        timestamp: new Date().toISOString()
      }
    };
  }

  let sql = `
    SELECT 
      ft.id,
      ft.transfer_date as "transferDate",
      ft.transfer_reason as "transferReason",
      ft.transfer_fee as "transferFee",
      ft.contract_duration as "contractDuration",
      ft.is_permanent as "isPermanent",
      ft.status,

      
      -- Lutteur
      ft.fighter_id as "fighterId",
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.nickname as "fighterNickname",
      f.profile_image as "fighterProfileImage",
      f.region_id as "currentRegionId",
      
      -- Région d'origine
      ft.from_region_id as "fromRegionId",
      fr.name as "fromRegionName",
      fr.code as "fromRegionCode",
      fr.flag_image as "fromRegionFlagImage",
      
      -- Région de destination
      ft.to_region_id as "toRegionId",
      tr.name as "toRegionName",
      tr.code as "toRegionCode",
      tr.flag_image as "toRegionFlagImage",

      -- Approbateur
      ft.approved_by_user_id as "approvedByUserId",
      u.username as "approvedByUsername",
      u.first_name as "approvedByFirstName",
      u.last_name as "approvedByLastName"

    FROM fighter_transfers ft
    JOIN fighters f ON ft.fighter_id = f.id
    JOIN regions fr ON ft.from_region_id = fr.id
    JOIN regions tr ON ft.to_region_id = tr.id
    LEFT JOIN users u ON ft.approved_by_user_id = u.id
    WHERE ft.fighter_id = $1
  `;

  const params: any[] = [fighterId];
  
  if (status) {
    sql += ` AND ft.status = $${params.length + 1}`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (f.id = $${params.length + 1} OR fr.id = $${params.length + 1} OR tr.id = $${params.length + 1} OR u.username LIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  sql += ` ORDER BY ft.transfer_date DESC, ft.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(limit, offset);

  const transfers = await query(sql, params);

  // Compter le total pour la pagination
  const total = await getTotalTransfersByFighter(fighterId, status, search);

  // Récupérer les infos du lutteur
  const fighterInfo = await getFighterInfo(fighterId);

  return {
    success: true,
    data: {
      fighter: fighterInfo,
      transfers: formatTransfers(transfers),
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + transfers.length) < total
      },
      filters: {
        fighter_id: fighterId,
        status,
        search
      },
      timestamp: new Date().toISOString()
    },
    message: 'Transferts du lutteur récupérés avec succès'
  };
}

async function getTransfersByRegion(regionId: number, status: string | null = null, limit: number = 50, offset: number = 0, search?: string) {
  // D'abord vérifier que la région existe
  const regionExists = await query("SELECT id FROM regions WHERE id = $1", [regionId]);
  
  if (regionExists.length === 0) {
    return {
      success: false,
      error: {
        code: 404,
        message: 'Région non trouvée',
        timestamp: new Date().toISOString()
      }
    };
  }

  let sql = `
    SELECT 
      ft.id,
      ft.transfer_date as "transferDate",
      ft.transfer_reason as "transferReason",
      ft.transfer_fee as "transferFee",
      ft.contract_duration as "contractDuration",
      ft.is_permanent as "isPermanent",
      ft.status,
      ft.created_at as "createdAt",
      
      -- Lutteur
      ft.fighter_id as "fighterId",
      f.first_name as "fighterFirstName",
      f.last_name as "fighterLastName",
      f.nickname as "fighterNickname",
      f.profile_image as "fighterProfileImage",
      f.region_id as "currentRegionId",
      
      -- Région d'origine
      ft.from_region_id as "fromRegionId",
      fr.name as "fromRegionName",
      fr.code as "fromRegionCode",
      fr.flag_image as "fromRegionFlagImage",
      
      -- Région de destination
      ft.to_region_id as "toRegionId",
      tr.name as "toRegionName",
      tr.code as "toRegionCode",
      tr.flag_image as "toRegionFlagImage",
      
      -- Approbateur
      ft.approved_by_user_id as "approvedByUserId",
      u.username as "approvedByUsername",
      u.first_name as "approvedByFirstName",
      u.last_name as "approvedByLastName"

    FROM fighter_transfers ft
    JOIN fighters f ON ft.fighter_id = f.id
    JOIN regions fr ON ft.from_region_id = fr.id
    JOIN regions tr ON ft.to_region_id = tr.id
    LEFT JOIN users u ON ft.approved_by_user_id = u.id
    WHERE (ft.from_region_id = $1 OR ft.to_region_id = $1)
  `;

  const params: any[] = [regionId];
  
  if (status) {
    sql += ` AND ft.status = $${params.length + 1}`;
    params.push(status);
  }

  sql += ` ORDER BY ft.transfer_date DESC, ft.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(limit, offset);

  const transfers = await query(sql, params);

  // Compter le total pour la pagination
  const total = await getTotalTransfersByRegion(regionId, status, search);

  // Récupérer les infos de la région
  const regionInfo = await getRegionInfo(regionId);

  return {
    success: true,
    data: {
      region: regionInfo,
      transfers: formatTransfers(transfers),
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + transfers.length) < total
      },
      filters: {
        region_id: regionId,
        status
      },
      timestamp: new Date().toISOString()
    },
    message: 'Transferts de la région récupérés avec succès'
  };
}

function formatTransfers(transfers: any[]) {
  return transfers.map(transfer => ({
    id: transfer.id,
    transferDate: transfer.transferDate,
    transferReason: transfer.transferReason,
    transferFee: transfer.transferFee,
    contractDuration: transfer.contractDuration,
    isPermanent: Boolean(transfer.isPermanent),
    status: transfer.status,
    
    fighter: {
      id: transfer.fighterId,
      firstName: transfer.fighterFirstName,
      lastName: transfer.fighterLastName,
      nickname: transfer.fighterNickname,
      profileImage: transfer.fighterProfileImage,
      currentRegionId: transfer.currentRegionId
    },
    
    fromRegion: {
      id: transfer.fromRegionId,
      name: transfer.fromRegionName
    },
    
    toRegion: {
      id: transfer.toRegionId,
      name: transfer.toRegionName
    },
    
    approvedBy: transfer.approvedByUserId ? {
      id: transfer.approvedByUserId,
      username: transfer.approvedByUsername,
      firstName: transfer.approvedByFirstName,
      lastName: transfer.approvedByLastName
    } : null
  }));
}

// Méthodes utilitaires
async function getTotalTransfersByFighter(fighterId: number, status: string | null = null, search?: string) {
  let sql = "SELECT COUNT(*) as total FROM fighter_transfers WHERE fighter_id = $1";
  const params: any[] = [fighterId];
  
  if (status) {
    sql += " AND status = $2";
    params.push(status);
  }

  const result = await query<{ total: string }>(sql, params);
  return parseInt(result[0]?.total ?? '0');
}

async function getTotalTransfersByRegion(regionId: number, status: string | null = null, search?: string) {
  let sql = "SELECT COUNT(*) as total FROM fighter_transfers WHERE from_region_id = $1 OR to_region_id = $1";
  const params: any[] = [regionId];
  
  if (status) {
    sql += " AND status = $2";
    params.push(status);
  }

  if (search) {
    sql += " AND (fighter_id = $3 OR from_region_id = $3 OR to_region_id = $3 OR approved_by_user_id = $3)";
    params.push(search);
  }

  const result = await query<{ total: string }>(sql, params);
  return parseInt(result[0]?.total ?? '0');
}

async function getFighterInfo(fighterId: number) {
  const sql = `
    SELECT 
      id, first_name as "firstName", last_name as "lastName", 
      nickname, profile_image as "profileImage", region_id as "regionId"
    FROM fighters 
    WHERE id = $1
  `;
  
  const result = await query(sql, [fighterId]);
  return result[0];
}

async function getRegionInfo(regionId: number) {
  const sql = `
    SELECT 
      id, name
    FROM regions 
    WHERE id = $1
  `;
  
  const result = await query(sql, [regionId]);
  return result[0];
}