// lib/db/neon-client.ts
import {
  Pool as NeonPool,
  neonConfig,
  types as neonTypes,
} from "@neondatabase/serverless";
import { Pool as NodePgPool, types as nodePgTypes } from "pg";
import type { Pool as PgPool } from "pg";
import ws from "ws";
import {
  getSlowQueryThresholdMs,
  isPerfLogEnabled,
  recordSql,
  sqlSnippet,
} from "@/lib/server/perf-context";

// Configuration du WebSocket constructor pour l'environnement Node.js / Bun
// Permet de passer par le port 443 (WSS/HTTPS) et contourner le blocage du port standard 5432
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

// Parser INTERVAL (OID 1186) en chaîne pour éviter les problèmes de sérialisation PostgresInterval dans Next.js
neonTypes.setTypeParser(1186, (val) => val);
try {
  // Le driver `pg` est utilisé uniquement en dev/test (DB_DRIVER=pg).
  nodePgTypes.setTypeParser(1186, (val) => val);
} catch {
  // ignore : le driver pg n'est pas disponible dans certains runtimes edge
}

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
    return rawUrl
      .replace(/[?&]sslmode=[^&]+/g, "")
      .replace(/\?&/, "?")
      .replace(/\?$/, "");
  }
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const sanitizedConnectionString = getSanitizedConnectionString(
  process.env.DATABASE_URL,
);

// `DB_DRIVER=pg` permet de pointer vers un PostgreSQL local (dev) ou vers le
// pooler Neon (prod) avec le driver TCP `pg`. Par défaut (non défini), on
// utilise le driver serverless `@neondatabase/serverless` (WebSocket/HTTPS),
// compatible avec les environnements où le port 5432 est bloqué.
const useNodePg = ["pg", "node", "node-pg"].includes(
  (process.env.DB_DRIVER || "").toLowerCase(),
);

class NeonClient {
  private static instance: PgPool;

  static getInstance(): PgPool {
    const globalForNeon = globalThis as unknown as { neonPool?: PgPool };

    if (globalForNeon.neonPool) {
      return globalForNeon.neonPool;
    }

    if (!NeonClient.instance) {
      const config = {
        connectionString: sanitizedConnectionString,
        max: envInt(
          "DB_POOL_MAX",
          process.env.NODE_ENV === "production" ? 15 : 8,
        ),
        idleTimeoutMillis: envInt("DB_IDLE_TIMEOUT_MS", 15000),
        // Échouer vite plutôt que de laisser une requête attendre 15 s.
        connectionTimeoutMillis: envInt("DB_CONNECTION_TIMEOUT_MS", 10000),
      };

      NeonClient.instance = (
        useNodePg ? new NodePgPool(config) : new NeonPool(config)
      ) as unknown as PgPool;

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

export const pool: PgPool = NeonClient.getInstance();

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

/**
 * Une requête est considérée comme lecture seule si elle ne peut pas modifier
 * de données. En cas de doute (WITH contenant un DML, appel de fonction
 * inconnue, etc.), on renvoie `false` : mieux vaut ne pas réessayer que de
 * dupliquer une écriture.
 */
export function isReadOnlyQuery(sql: string): boolean {
  const normalized = sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .trim();

  if (/^(select|show|explain|values)\b/i.test(normalized)) return true;

  if (/^with\b/i.test(normalized)) {
    // Un CTE peut contenir INSERT/UPDATE/DELETE/MERGE : pas de retry.
    return !/\b(insert|update|delete|merge)\b/i.test(normalized);
  }

  return false;
}

function getRetryAttempts(): number {
  return envInt("DB_RETRY_ATTEMPTS", 2);
}

// Fonction utilitaire avec retry résilient, backoff exponentiel et jitter.
// N'est appelée que pour les requêtes classées lecture seule.
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = getRetryAttempts(),
  baseDelay = 400,
  attempt = 1,
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
    const delay = Math.min(800, baseDelay * Math.pow(2, attempt - 1)) + jitter;

    console.warn(
      `⚠️ Erreur connexion Neon transitoire (${error.code || "network"}). Nouvelle tentative (${attempt}/${getRetryAttempts()}) dans ${delay}ms...`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries - 1, baseDelay, attempt + 1);
  }
}

export interface QueryOptions {
  /**
   * Force ou interdit le retry. Par défaut, seules les lectures sont
   * réessayées. Ne jamais mettre `true` sur une écriture non idempotente.
   */
  retryable?: boolean;
}

export async function query<T = any>(
  sql: string,
  params: QueryValue[] = [],
  options: QueryOptions = {},
): Promise<T[]> {
  const canRetry = options.retryable ?? isReadOnlyQuery(sql);
  const startedAt = performance.now();

  try {
    const result = canRetry
      ? await executeWithRetry(() => pool.query(sql, params))
      : await pool.query(sql, params);

    const durationMs = performance.now() - startedAt;
    recordSql(durationMs, sql);

    if (durationMs >= getSlowQueryThresholdMs()) {
      console.warn(
        `[db-perf][slow-query] ${JSON.stringify({
          ms: Math.round(durationMs),
          query: sqlSnippet(sql),
          rows: result.rowCount ?? result.rows?.length ?? 0,
          retryable: canRetry,
        })}`,
      );
    } else if (isPerfLogEnabled() && process.env.NODE_ENV !== "test") {
      console.debug(
        `[db-perf] ${JSON.stringify({
          ms: Math.round(durationMs),
          query: sqlSnippet(sql),
          rows: result.rowCount ?? result.rows?.length ?? 0,
        })}`,
      );
    }

    return result.rows as T[];
  } catch (error: any) {
    recordSql(performance.now() - startedAt, sql);

    // Journalisation structurée sans fuite de secrets ni de PII :
    // on n'écrit ni les paramètres, ni la requête complète, ni le message brut
    // (qui peut contenir une valeur dupliquée, un e-mail, etc.).
    console.error("❌ Erreur Neon Query:", {
      code: error?.code,
      constraint: error?.constraint,
      table: error?.table,
      query: sqlSnippet(sql),
      retryable: canRetry,
    });
    throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
  }
}

export async function queryOne<T = any>(
  sql: string,
  params: QueryValue[] = [],
  options: QueryOptions = {},
): Promise<T | null> {
  const result = await query<T>(sql, params, options);
  return result[0] || null;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const startedAt = performance.now();
    const result = await pool.query("SELECT NOW() as current_time");
    recordSql(performance.now() - startedAt, "SELECT NOW()");
    return !!result.rows[0];
  } catch (error) {
    console.error("❌ Échec test connexion Neon:", (error as Error).message);
    return false;
  }
}

export function getPoolStats() {
  const stats = pool as unknown as {
    totalCount?: number;
    idleCount?: number;
    waitingCount?: number;
  };
  return {
    total: stats.totalCount ?? null,
    idle: stats.idleCount ?? null,
    waiting: stats.waitingCount ?? null,
  };
}

export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log("🔌 Pool Neon fermé proprement");
  } catch (error) {
    console.error("❌ Erreur fermeture pool Neon:", (error as Error).message);
  }
}
