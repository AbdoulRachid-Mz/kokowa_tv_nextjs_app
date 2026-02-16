import { Pool, PoolConfig } from "pg";

const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

class NeonClient {
  private static instance: Pool;

  static getInstance(): Pool {
    // Utiliser globalThis pour éviter de créer plusieurs pools en développement
    const globalForNeon = global as unknown as { neonPool: Pool };

    if (globalForNeon.neonPool) {
      return globalForNeon.neonPool;
    }

    if (!NeonClient.instance) {
      console.log("🔄 Initialisation du pool Neon PostgreSQL...");
      NeonClient.instance = new Pool(dbConfig);
      
      // En développement, on attache au global
      if (process.env.NODE_ENV !== "production") {
        globalForNeon.neonPool = NeonClient.instance;
      }
      
      NeonClient.testConnection();
    }
    return NeonClient.instance;
  }

  private static async testConnection() {
    try {
      const client = NeonClient.instance;
      const result = await client.query("SELECT NOW() as current_time");
      console.log("✅ Connexion réussie à Neon PostgreSQL :", result.rows[0].current_time);
    } catch (error) {
      console.error("❌ Échec de la connexion à Neon :", (error as Error).message);
    }
  }
}

export const pool = NeonClient.getInstance();

export type QueryValue = string | number | boolean | Date | null;

export async function query<T = any>(
  sql: string,
  params: QueryValue[] = []
): Promise<T[]> {
  try {
    // Log minimal pour debug (uniquement en développement)
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 SQL:", sql.trim().split("\n")[0], "...");
    }

    const result = await pool.query(sql, params);
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
