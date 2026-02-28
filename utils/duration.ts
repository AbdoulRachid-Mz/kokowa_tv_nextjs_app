// // ========== HELPERS ==========

// export function formatSecondsToDuration(totalSeconds: number): string {
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = totalSeconds % 60;
//   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
// }

// export function parseDurationToSeconds(duration?: string | null): number {
//   if (!duration) return 0;
//   const parts = duration.split(':').map(Number);
//   if (parts.length === 3) {
//     return parts[0] * 3600 + parts[1] * 60 + parts[2];
//   }
//   if (parts.length === 2) {
//     return parts[0] * 60 + parts[1];
//   }
//   return 0;
// }

export function normalizeDuration(duration: any): string {
  if (!duration) return '00:00:00';

  if (typeof duration === 'string') return duration;

  if (typeof duration === 'object' && 'seconds' in duration) {
    const totalSeconds = duration.seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return '00:00:00';
}