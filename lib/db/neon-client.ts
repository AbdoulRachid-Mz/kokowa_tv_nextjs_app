import { Pool, PoolConfig } from 'pg';

// Configuration pour Neon
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Client singleton pour éviter les multiples connexions
class NeonClient {
  private static instance: Pool;
  
  static getInstance(): Pool {
    if (!NeonClient.instance) {
      console.log('🔄 Initialisation du client Neon PostgreSQL...');
      NeonClient.instance = new Pool(dbConfig);
      
      // Test de connexion au démarrage
      NeonClient.testConnection();
    }
    return NeonClient.instance;
  }
  
  private static async testConnection() {
    try {
      const client = NeonClient.instance;
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Connexion Neon PostgreSQL établie:', result.rows[0].current_time);
    } catch (error) {
      console.error('❌ Erreur de connexion à Neon:', error);
    }
  }
}

export const pool = NeonClient.getInstance();

export type QueryValue = string | number | boolean | Date | null;

export async function query<T = any>(sql: string, params?: QueryValue[]): Promise<T[]> {
  try {
    console.log('🔍 Neon Query:', sql);
    console.log('📋 Params:', params);
    
    const result = await pool.query(sql, params);
    console.log(`✅ Query réussie: ${result.rows.length} ligne(s)`);
    return result.rows as T[];
  } catch (error) {
    console.error('❌ Erreur query Neon:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

export async function queryOne<T = any>(sql: string, params?: QueryValue[]): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result[0] || null;
}

// Fermer proprement les connexions
export async function closePool() {
  try {
    await pool.end();
    console.log('🔌 Pool Neon fermé');
  } catch (error) {
    console.error('❌ Erreur fermeture pool:', error);
  }
}