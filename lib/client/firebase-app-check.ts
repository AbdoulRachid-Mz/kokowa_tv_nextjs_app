// lib/client/firebase-app-check.ts
// App Check has been disabled. These exports are kept as no-ops to avoid
// breaking any remaining imports during the transition period.

/**
 * No-op: App Check initialization is disabled.
 */
export function initAppCheck(): void {
  // App Check disabled - no-op
}

/**
 * No-op: Always returns null since App Check is disabled.
 */
export async function getAppCheckToken(): Promise<string | null> {
  return null;
}
