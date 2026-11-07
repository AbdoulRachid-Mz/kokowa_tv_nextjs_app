export const debugTimings: string[] = [];
export function dlog(msg: string) {
  if (process.env.NODE_ENV === "production") return;
  debugTimings.push(`${new Date().toISOString()} ${msg}`);
}
