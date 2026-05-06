// lib/db/neon-client.ts
import { Pool, PoolConfig } from "pg";

const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Réduit pour éviter trop de connexions simultanées
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Ajout de keepalive
  keepAlive: true,
  // Timeout pour les requêtes longues
  statement_timeout: 15000,
};

class NeonClient {
  private static instance: Pool;

  static getInstance(): Pool {
    const globalForNeon = global as unknown as { neonPool: Pool };

    if (globalForNeon.neonPool) {
      return globalForNeon.neonPool;
    }

    if (!NeonClient.instance) {
      console.log("🔄 Initialisation du pool Neon PostgreSQL...");
      NeonClient.instance = new Pool(dbConfig);
      
      // Gestion des erreurs du pool
      NeonClient.instance.on('error', (err) => {
        console.error('❌ Erreur du pool PostgreSQL:', err.message);
        // Tenter de recréer le pool après une erreur critique ?
      });

      if (process.env.NODE_ENV !== "production") {
        globalForNeon.neonPool = NeonClient.instance;
      }
      
      NeonClient.testConnection();
    }
    return NeonClient.instance;
  }

  private static async testConnection() {
    try {
      const client = await NeonClient.instance.connect();
      const result = await client.query("SELECT NOW() as current_time");
      client.release();
      console.log("✅ Connexion réussie à Neon PostgreSQL :", result.rows[0].current_time);
    } catch (error) {
      console.error("❌ Échec de la connexion à Neon :", (error as Error).message);
    }
  }
}

export const pool = NeonClient.getInstance();

export type QueryValue = string | number | boolean | Date | null;

// Fonction utilitaire avec retry
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    // Attendre puis réessayer
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log(`🔄 Retry query, remaining retries: ${retries}`);
    return executeWithRetry(fn, retries - 1, delay * 2);
  }
}

export async function query<T = any>(
  sql: string,
  params: QueryValue[] = []
): Promise<T[]> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 SQL:", sql.trim().split("\n")[0], "...");
    }
    const result = await executeWithRetry(() => pool.query(sql, params));
    return result.rows as T[];
  } catch (error: any) {
    console.error("❌ Erreur Neon Query:", error.message);
    throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
  }
}

export async function queryOne<T = any>(
  sql: string,
  params: QueryValue[] = []
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result[0] || null;
}

export async function closePool() {
  try {
    await pool.end();
    console.log("🔌 Pool Neon fermé proprement");
  } catch (error) {
    console.error("❌ Erreur lors de la fermeture du pool:", (error as Error).message);
  }
}