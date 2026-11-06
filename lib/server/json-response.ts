// @/lib/server/json-response.ts
import { recordSerialization } from "./perf-context";

/**
 * Sérialise un payload JSON en mesurant le temps de `JSON.stringify` et la
 * taille exacte du corps. Utilisé sur les routes mobiles les plus lourdes
 * pour alimenter l'instrumentation sans bufferiser deux fois la réponse.
 */
export function jsonResponse(
  data: unknown,
  init: ResponseInit & { status?: number } = {},
): Response {
  const startedAt = performance.now();
  const body = JSON.stringify(data);
  const serializationMs = performance.now() - startedAt;

  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  const bytes =
    typeof Buffer !== "undefined"
      ? Buffer.byteLength(body)
      : new TextEncoder().encode(body).length;

  recordSerialization(serializationMs, bytes);

  return new Response(body, {
    ...init,
    headers,
  });
}
