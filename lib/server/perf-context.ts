// @/lib/server/perf-context.ts
import { AsyncLocalStorage } from "node:async_hooks";

export interface PerfContext {
  requestId: string;
  method: string;
  path: string;
  startedAt: number;
  sampled: boolean;
  stages: Record<string, number>;
  sqlCount: number;
  sqlTimeMs: number;
  slowestSqlMs: number;
  slowestSqlSnippet?: string;
  serializationMs: number;
  responseBytes: number;
  appId?: string;
  status?: number;
}

const storage = new AsyncLocalStorage<PerfContext>();

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function isPerfLogEnabled(): boolean {
  if (process.env.API_PERF_LOG === "true") return true;
  if (process.env.API_PERF_LOG === "false") return false;
  return process.env.NODE_ENV === "development";
}

export function getPerfSampleRate(): number {
  const raw = process.env.API_PERF_SAMPLE_RATE;
  if (raw === undefined) return process.env.NODE_ENV === "production" ? 0.01 : 1;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.01;
}

export function shouldSample(): boolean {
  if (isPerfLogEnabled()) return true;
  return Math.random() < getPerfSampleRate();
}

export function getSlowQueryThresholdMs(): number {
  return envNumber("API_SLOW_QUERY_MS", 250);
}

export function getSlowRequestThresholdMs(): number {
  return envNumber("API_SLOW_REQUEST_MS", 800);
}

export function sanitizeRequestId(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  // Only allow opaque, header-safe identifiers (no spaces, no control chars).
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(trimmed)) return undefined;
  return trimmed;
}

export function createRequestId(incoming?: string | null): string {
  return (
    sanitizeRequestId(incoming) ??
    globalThis.crypto?.randomUUID?.() ??
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

export function createPerfContext(
  request: Request,
  requestId: string,
  sampled = shouldSample(),
): PerfContext {
  let path = "/";
  try {
    path = new URL(request.url).pathname;
  } catch {
    // ignore malformed URL
  }
  return {
    requestId,
    method: request.method,
    path,
    startedAt: performance.now(),
    sampled,
    stages: {},
    sqlCount: 0,
    sqlTimeMs: 0,
    slowestSqlMs: 0,
    serializationMs: 0,
    responseBytes: 0,
  };
}

export function runWithPerfContext<T>(context: PerfContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getPerfContext(): PerfContext | undefined {
  return storage.getStore();
}

export function recordStage(name: string, durationMs: number): void {
  const ctx = getPerfContext();
  if (!ctx) return;
  ctx.stages[name] = Math.max(0, durationMs);
}

/**
 * Extract a safe, parameter-free fingerprint from a SQL string.
 * Never include literal values or parameters (possible PII / secrets).
 */
export function sqlSnippet(sql: string): string {
  const compact = sql.replace(/\s+/g, " ").trim();
  const verb = compact.match(/^([a-z]+)/i)?.[1]?.toUpperCase() ?? "SQL";
  const table =
    compact.match(/\bfrom\s+"?([a-z0-9_.]+)"?/i)?.[1] ??
    compact.match(/\binto\s+"?([a-z0-9_.]+)"?/i)?.[1] ??
    compact.match(/\bupdate\s+"?([a-z0-9_.]+)"?/i)?.[1] ??
    "";
  return `${verb}${table ? ` ${table}` : ""}`.slice(0, 80);
}

export function recordSql(durationMs: number, sql: string): void {
  const ctx = getPerfContext();
  if (!ctx) return;
  ctx.sqlCount += 1;
  ctx.sqlTimeMs += durationMs;
  if (durationMs > ctx.slowestSqlMs) {
    ctx.slowestSqlMs = durationMs;
    ctx.slowestSqlSnippet = sqlSnippet(sql);
  }
}

export function recordSerialization(durationMs: number, bytes: number): void {
  const ctx = getPerfContext();
  if (!ctx) return;
  ctx.serializationMs += durationMs;
  ctx.responseBytes += bytes;
}

export interface PerfLogPayload {
  requestId: string;
  method: string;
  path: string;
  status: number;
  appId?: string;
  totalMs: number;
  appIdMs?: number;
  rateLimitMs?: number;
  authMs?: number;
  permissionsMs?: number;
  handlerMs?: number;
  sqlCount: number;
  sqlMs: number;
  slowestSqlMs: number;
  slowestSql?: string;
  serializationMs: number;
  responseBytes: number;
  sampled: boolean;
}

export function buildPerfLog(ctx: PerfContext, status: number): PerfLogPayload {
  const totalMs = Math.round(performance.now() - ctx.startedAt);
  const round = (value?: number) =>
    value === undefined ? undefined : Math.round(value);
  return {
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    status,
    appId: ctx.appId,
    totalMs,
    appIdMs: round(ctx.stages.appId),
    rateLimitMs: round(ctx.stages.rateLimit),
    authMs: round(ctx.stages.auth),
    permissionsMs: round(ctx.stages.permissions),
    handlerMs: round(ctx.stages.handler),
    sqlCount: ctx.sqlCount,
    sqlMs: Math.round(ctx.sqlTimeMs),
    slowestSqlMs: Math.round(ctx.slowestSqlMs),
    slowestSql: ctx.slowestSqlSnippet,
    serializationMs: Math.round(ctx.serializationMs),
    responseBytes: ctx.responseBytes,
    sampled: ctx.sampled,
  };
}

export function logPerf(ctx: PerfContext, status: number): PerfLogPayload {
  const payload = buildPerfLog(ctx, status);
  if (isPerfLogEnabled() || ctx.sampled) {
    console.log(`[api-perf] ${JSON.stringify(payload)}`);
  } else if (payload.totalMs >= getSlowRequestThresholdMs()) {
    // Always surface genuinely slow requests, even outside the sample.
    console.warn(
      `[api-perf][slow] ${JSON.stringify({ ...payload, sampled: false })}`,
    );
  }
  return payload;
}
