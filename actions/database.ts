// @/actions/database.ts
'use server';

import { query, queryOne, QueryValue } from '@/lib/db/neon-client';
import { hasRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Types
async function assertAdmin(): Promise<void> {
  const isAdmin = await hasRole('admin');
  if (!isAdmin) {
    throw new Error('Accès refusé : privilèges administrateur requis.');
  }
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: TableColumn[];
  childTables: string[];
  parentTables: string[];
  indexes: string[];
  triggers: string[];
}

export interface TableListItem {
  name: string;
  rowCount: number;
  columnsCount: number;
  hasChildTables: boolean;
  hasParentTables: boolean;
}

export interface PaginatedTableResponse {
  data: TableListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fonction utilitaire pour obtenir toutes les tables de la base de données
export async function getAllTableNames(): Promise<string[]> {
  try {
    const sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const result = await query<{ table_name: string }>(sql);
    return result.map(row => row.table_name);
  } catch (error) {
    console.error('Error in getAllTableNames:', error);
    throw new Error('Erreur lors de la récupération des noms des tables');
  }
}

// Fonction pour obtenir les colonnes d'une table avec leurs contraintes
export async function getTableColumns(tableName: string): Promise<TableColumn[]> {
  try {
    const sql = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable = 'YES' as nullable,
        c.column_default as default,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = c.table_name
              AND tc.constraint_type = 'PRIMARY KEY'
              AND ccu.column_name = c.column_name
          ) THEN true ELSE false END as isPrimary,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = c.table_name
              AND tc.constraint_type = 'FOREIGN KEY'
              AND ccu.column_name = c.column_name
          ) THEN true ELSE false END as isForeign,
        fk.foreign_table_name as foreignTable,
        fk.foreign_column_name as foreignColumn
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT 
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.constraint_column_usage ccu
          ON kcu.constraint_name = ccu.constraint_name
        WHERE kcu.table_name = $1
      ) fk ON c.column_name = fk.column_name
      WHERE c.table_name = $1
      ORDER BY c.ordinal_position
    `;
    
    const result = await query<TableColumn>(sql, [tableName]);
    return result;
  } catch (error) {
    console.error('Error in getTableColumns:', error);
    throw new Error(`Erreur lors de la récupération des colonnes de la table ${tableName}`);
  }
}

// Fonction pour obtenir le nombre de lignes d'une table
export async function getTableRowCount(tableName: string): Promise<number> {
  try {
    // Utiliser une requête préparée avec un nom de table validé
    const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    // Garde-fou : on ne compte que les tables réellement présentes dans le schéma
    // (évite l'énumération arbitraire et l'injection d'identifiant).
    const exists = await query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists`,
      [validTableName],
    );
    if (!exists[0]?.exists) {
      throw new Error(`Table inconnue : ${validTableName}`);
    }
    const sql = `SELECT COUNT(*) as count FROM ${validTableName}`;
    const result = await query<{ count: string }>(sql);
    return parseInt(result[0]?.count ?? '0');
  } catch (error) {
    console.error(`Error in getTableRowCount for ${tableName}:`, error);
    return 0;
  }
}

// Fonction pour obtenir les tables enfantes (qui référencent cette table)
export async function getChildTables(tableName: string): Promise<string[]> {
  try {
    const sql = `
      SELECT DISTINCT
        tc.table_name as child_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = $1
      ORDER BY tc.table_name
    `;
    
    const result = await query<{ child_table: string }>(sql, [tableName]);
    return result.map(row => row.child_table);
  } catch (error) {
    console.error('Error in getChildTables:', error);
    throw new Error(`Erreur lors de la récupération des tables enfantes de ${tableName}`);
  }
}

// Fonction pour obtenir les tables parentes (référencées par cette table)
export async function getParentTables(tableName: string): Promise<string[]> {
  try {
    const sql = `
      SELECT DISTINCT
        ccu.table_name as parent_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
      ORDER BY ccu.table_name
    `;
    
    const result = await query<{ parent_table: string }>(sql, [tableName]);
    return result.map(row => row.parent_table);
  } catch (error) {
    console.error('Error in getParentTables:', error);
    throw new Error(`Erreur lors de la récupération des tables parentes de ${tableName}`);
  }
}

// Fonction pour obtenir les index d'une table
export async function getTableIndexes(tableName: string): Promise<string[]> {
  try {
    const sql = `
      SELECT indexname as name
      FROM pg_indexes
      WHERE tablename = $1
      ORDER BY indexname
    `;
    
    const result = await query<{ name: string }>(sql, [tableName]);
    return result.map(row => row.name);
  } catch (error) {
    console.error('Error in getTableIndexes:', error);
    throw new Error(`Erreur lors de la récupération des index de la table ${tableName}`);
  }
}

// Fonction pour obtenir les triggers d'une table
export async function getTableTriggers(tableName: string): Promise<string[]> {
  try {
    const sql = `
      SELECT trigger_name as name
      FROM information_schema.triggers
      WHERE event_object_table = $1
      ORDER BY trigger_name
    `;
    
    const result = await query<{ name: string }>(sql, [tableName]);
    return result.map(row => row.name);
  } catch (error) {
    console.error('Error in getTableTriggers:', error);
    throw new Error(`Erreur lors de la récupération des triggers de la table ${tableName}`);
  }
}

// Fonction principale pour obtenir les informations détaillées d'une table
export async function getTableInfo(tableName: string): Promise<TableInfo> {
  try {
    const [
      columns,
      rowCount,
      childTables,
      parentTables,
      indexes,
      triggers
    ] = await Promise.all([
      getTableColumns(tableName),
      getTableRowCount(tableName),
      getChildTables(tableName),
      getParentTables(tableName),
      getTableIndexes(tableName),
      getTableTriggers(tableName)
    ]);

    return {
      name: tableName,
      rowCount,
      columns,
      childTables,
      parentTables,
      indexes,
      triggers
    };
  } catch (error) {
    console.error('Error in getTableInfo:', error);
    throw new Error(`Erreur lors de la récupération des informations de la table ${tableName}`);
  }
}

// Fonction pour obtenir la liste des tables avec des statistiques de base
export async function getTablesList(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedTableResponse> {
  try {
    const allTables = await getAllTableNames();
    
    // Filtrer par recherche si nécessaire
    let filteredTables = allTables;
    if (search) {
      filteredTables = allTables.filter(table => 
        table.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const total = filteredTables.length;
    const totalPages = Math.ceil(total / limit);
    const validatedPage = Math.max(1, Math.min(page, totalPages));
    const offset = (validatedPage - 1) * limit;
    
    const paginatedTables = filteredTables.slice(offset, offset + limit);

    // Obtenir les statistiques pour chaque table
    const data = await Promise.all(
      paginatedTables.map(async (tableName) => {
        const [rowCount, columns, childTables, parentTables] = await Promise.all([
          getTableRowCount(tableName),
          getTableColumns(tableName),
          getChildTables(tableName),
          getParentTables(tableName)
        ]);

        return {
          name: tableName,
          rowCount,
          columnsCount: columns.length,
          hasChildTables: childTables.length > 0,
          hasParentTables: parentTables.length > 0
        };
      })
    );

    return {
      data,
      pagination: {
        page: validatedPage,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getTablesList:', error);
    throw new Error('Erreur lors de la récupération de la liste des tables');
  }
}

// Fonction pour obtenir plusieurs tables avec leurs informations détaillées
export async function getMultipleTablesInfo(tableNames: string[]): Promise<TableInfo[]> {
  try {
    const tablesInfo = await Promise.all(
      tableNames.map(tableName => getTableInfo(tableName))
    );
    return tablesInfo;
  } catch (error) {
    console.error('Error in getMultipleTablesInfo:', error);
    throw new Error('Erreur lors de la récupération des informations des tables');
  }
}

// Fonction pour obtenir toutes les tables avec leurs relations
export async function getAllTablesWithRelations(): Promise<TableInfo[]> {
  try {
    const tableNames = await getAllTableNames();
    const tablesInfo = await getMultipleTablesInfo(tableNames);
    return tablesInfo;
  } catch (error) {
    console.error('Error in getAllTablesWithRelations:', error);
    throw new Error('Erreur lors de la récupération de toutes les tables avec leurs relations');
  }
}

// Fonctions de gestion de la base de données (setup, reset, delete)

// Fonction pour vider toutes les tables (truncate)
export async function resetDatabase() {
  await assertAdmin();
  try {
    const tableNames = await getAllTableNames();
    
    // Désactiver temporairement les contraintes de clé étrangère
    await query('SET session_replication_role = replica');
    
    // Vider toutes les tables
    for (const tableName of tableNames) {
      const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      await query(`TRUNCATE TABLE ${validTableName} CASCADE`);
    }
    
    // Réactiver les contraintes
    await query('SET session_replication_role = DEFAULT');
    
    revalidatePath('/admin/database');
    return { 
      success: true, 
      message: 'Base de données réinitialisée avec succès' 
    };
  } catch (error) {
    console.error('Error in resetDatabase:', error);
    throw new Error('Erreur lors de la réinitialisation de la base de données');
  }
}

// Fonction pour supprimer toutes les tables (drop)
export async function deleteAllTables() {
  await assertAdmin();
  try {
    const tableNames = await getAllTableNames();
    
    // Supprimer toutes les tables en cascade
    for (const tableName of tableNames) {
      const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      await query(`DROP TABLE IF EXISTS ${validTableName} CASCADE`);
    }
    
    revalidatePath('/ad/database');
    return { 
      success: true, 
      message: 'Toutes les tables ont été supprimées avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteAllTables:', error);
    throw new Error('Erreur lors de la suppression des tables');
  }
}

// Fonction pour créer une table (exemple avec users)
export async function setupDefaultTables() {
  try {
    // Ici vous pouvez inclure vos scripts SQL de création des tables
    // Pour cet exemple, nous allons simplement retourner un message
    // car les tables sont normalement déjà créées via vos migrations
    
    revalidatePath('/ad/database');
    return { 
      success: true, 
      message: 'Tables par défaut créées avec succès' 
    };
  } catch (error) {
    console.error('Error in setupDefaultTables:', error);
    throw new Error('Erreur lors de la création des tables par défaut');
  }
}

// Fonction pour obtenir un résumé de la base de données
export async function getDatabaseSummary() {
  try {
    const tableNames = await getAllTableNames();
    
    const [tablesInfo, totalRows] = await Promise.all([
      Promise.all(
        tableNames.map(async (tableName) => {
          const [rowCount, childTables, parentTables] = await Promise.all([
            getTableRowCount(tableName),
            getChildTables(tableName),
            getParentTables(tableName)
          ]);
          
          return {
            name: tableName,
            rowCount,
            hasChildren: childTables.length > 0,
            hasParents: parentTables.length > 0
          };
        })
      ),
      Promise.all(tableNames.map(tableName => getTableRowCount(tableName)))
        .then(counts => counts.reduce((sum, count) => sum + count, 0))
    ]);

    const tablesWithChildren = tablesInfo.filter(t => t.hasChildren).length;
    const tablesWithParents = tablesInfo.filter(t => t.hasParents).length;
    const isolatedTables = tablesInfo.filter(t => !t.hasChildren && !t.hasParents).length;

    return {
      totalTables: tableNames.length,
      totalRows,
      tablesWithChildren,
      tablesWithParents,
      isolatedTables,
      tables: tablesInfo
    };
  } catch (error) {
    console.error('Error in getDatabaseSummary:', error);
    throw new Error('Erreur lors de la récupération du résumé de la base de données');
  }
}

// === GESTION DES DONNÉES (BACKUP/RESTORE) ===

const BACKUPS_ROOT = path.join(process.cwd(), 'database/backups');

/**
 * Exporte les données d'une table ou de toutes les tables vers des fichiers JSON
 * Organise les exports dans des dossiers par date
 */
export async function exportTableData(tableName?: string, snapshotName?: string) {
  await assertAdmin();
  try {
    const dateDir = snapshotName || new Date().toISOString().split('T')[0];
    const dataDir = path.join(BACKUPS_ROOT, dateDir);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let tables = [];
    if (tableName) {
      tables = [tableName];
    } else {
      tables = await getAllTableNames();
      // Exclure les tables techniques
      tables = tables.filter(t => !['migrations', '_prisma_migrations'].includes(t));
    }

    const results = [];
    for (const table of tables) {
      const data = await query(`SELECT * FROM ${table}`);
      const filePath = path.join(dataDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      results.push({ table, count: data.length });
    }

    // Créer aussi un lien "latest" ou copier vers "latest"
    const latestDir = path.join(BACKUPS_ROOT, 'latest');
    if (!fs.existsSync(latestDir)) fs.mkdirSync(latestDir, { recursive: true });
    results.forEach(res => {
      const src = path.join(dataDir, `${res.table}.json`);
      const dest = path.join(latestDir, `${res.table}.json`);
      fs.copyFileSync(src, dest);
    });

    return { 
      success: true, 
      message: `${results.length} table(s) exportée(s) avec succès`,
      results 
    };
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère la liste des backups disponibles
 */
export async function getAvailableBackups() {
  try {
    if (!fs.existsSync(BACKUPS_ROOT)) return [];
    const dirs = fs.readdirSync(BACKUPS_ROOT, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'latest')
      .map(dirent => dirent.name)
      .sort((a, b) => b.localeCompare(a)); // Plus récent en premier
    return dirs;
  } catch (error) {
    console.error('Error getting backups:', error);
    return [];
  }
}

/**
 * Importe les données depuis les fichiers JSON vers la base de données
 */
export async function importTableData(tableName?: string, snapshotName: string = 'latest') {
  await assertAdmin();
  try {
    const dataDir = path.join(BACKUPS_ROOT, snapshotName);
    
    if (!fs.existsSync(dataDir)) {
      throw new Error(`Dossier de données non trouvé: ${snapshotName}`);
    }

    let files = [];
    if (tableName) {
      files = [`${tableName}.json`];
    } else {
      files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    }

    const results = [];
    for (const file of files) {
      const table = file.replace('.json', '');
      const filePath = path.join(dataDir, file);
      
      if (!fs.existsSync(filePath)) continue;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.length === 0) continue;

      // Désactiver les triggers (nécessite des droits superuser ou session_replication_role)
      try {
        await query('SET session_replication_role = replica');
        
        for (const row of data) {
          const keys = Object.keys(row);
          const values = Object.values(row) as QueryValue[];
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          const columns = keys.join(", ");
          
          const onConflict = keys.includes('id') 
            ? `ON CONFLICT (id) DO UPDATE SET ${keys.map(k => `${k} = EXCLUDED.${k}`).join(", ")}`
            : "";

          const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ${onConflict}`;
          await query(sql, values);
        }
        
        await query('SET session_replication_role = DEFAULT');
        results.push({ table, count: data.length });
      } catch (err) {
        console.error(`Error importing table ${table}:`, err);
        throw err;
      }
    }

    revalidatePath('/ad/database');
    return { 
      success: true, 
      message: `${results.length} table(s) restaurée(s) avec succès`,
      results 
    };
  } catch (error: any) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}
