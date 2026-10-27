// lib/db/neon-client.ts
import { Pool, neonConfig, types } from "@neondatabase/serverless";
import type { Pool as PgPool } from "pg";
import ws from "ws";

// Configuration du WebSocket constructor pour l'environnement Node.js / Bun
// Permet de passer par le port 443 (WSS/HTTPS) et contourner le blocage du port standard 5432
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

// Parser INTERVAL (OID 1186) en chaîne pour éviter les problèmes de sérialisation PostgresInterval dans Next.js
types.setTypeParser(1186, (val) => val);

/**
 * Nettoie la chaîne de connexion pour éliminer les paramètres sslmode hérités
 * (tels que sslmode=require) qui provoquent l'avertissement de dépréciation pg-connection-string.
 */
function getSanitizedConnectionString(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    // Retirer sslmode des query params pour éviter l'avertissement pg-connection-string
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    // Si l'URL n'est pas standard, retirer par regex sécurisée
    return rawUrl.replace(/[?&]sslmode=[^&]+/g, "").replace(/\?&/, "?").replace(/\?$/, "");
  }
}

const sanitizedConnectionString = getSanitizedConnectionString(process.env.DATABASE_URL);

class NeonClient {
  private static instance: Pool;

  static getInstance(): Pool {
    const globalForNeon = globalThis as unknown as { neonPool?: Pool };

    if (globalForNeon.neonPool) {
      return globalForNeon.neonPool;
    }

    if (!NeonClient.instance) {
      NeonClient.instance = new Pool({
        connectionString: sanitizedConnectionString,
        max: process.env.NODE_ENV === "production" ? 15 : 8,
        idleTimeoutMillis: 15000,
        connectionTimeoutMillis: 15000,
      });

      // Gestion centralisée des erreurs du pool
      NeonClient.instance.on("error", (err: any) => {
        console.error("❌ Erreur inattendue du pool PostgreSQL Neon:", {
          message: err.message,
          code: (err as any).code,
        });
      });

      // Conservation du pool en mémoire globale pour éviter les fuites lors du fast-refresh
      globalForNeon.neonPool = NeonClient.instance;
    }

    return NeonClient.instance;
  }
}

export const pool: PgPool = NeonClient.getInstance() as unknown as PgPool;

export type QueryValue = string | number | boolean | Date | null | any[];

// Codes d'erreurs PostgreSQL et réseau considérés comme transitoires et éligibles aux retries
const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ENETUNREACH",
  "EPIPE",
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment
]);

function isTransientError(error: any): boolean {
  if (!error) return false;
  if (error.code && TRANSIENT_ERROR_CODES.has(error.code)) return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("connection timeout") ||
    msg.includes("connection terminated") ||
    msg.includes("timeout expired") ||
    msg.includes("server closed the connection") ||
    msg.includes("getaddrinfo") ||
    msg.includes("eai_again") ||
    msg.includes("network error")
  );
}

// Fonction utilitaire avec retry résilient, backoff exponentiel et jitter
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 400,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Ne réessayer que les erreurs de connectivité transitoires
    if (retries <= 0 || !isTransientError(error)) {
      throw error;
    }

    // Calcul du délai avec backoff exponentiel et jitter aléatoire
    const jitter = Math.floor(Math.random() * 100);
    const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;

    console.warn(
      `⚠️ Erreur connexion Neon transitoire (${error.code || error.message}). Nouvelle tentative (${attempt}/3) dans ${delay}ms...`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries - 1, baseDelay, attempt + 1);
  }
}

export async function query<T = any>(
  sql: string,
  params: QueryValue[] = []
): Promise<T[]> {
  try {
    const result = await executeWithRetry(() => pool.query(sql, params));
    return result.rows as T[];
  } catch (error: any) {
    // Journalisation structurée sans fuite de secrets
    console.error("❌ Erreur Neon Query:", {
      message: error.message,
      code: error.code,
      querySnippet: sql.trim().split("\n")[0].substring(0, 100),
    });
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

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    return !!result.rows[0];
  } catch (error) {
    console.error("❌ Échec test connexion Neon:", (error as Error).message);
    return false;
  }
}

export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log("🔌 Pool Neon fermé proprement");
  } catch (error) {
    console.error("❌ Erreur fermeture pool Neon:", (error as Error).message);
  }
}
