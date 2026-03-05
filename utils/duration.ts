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

// Fonctions utilitaires de formatage
export function formatDuration(duration: any): string {
  if (!duration) return '00:00:00';
  
  try {
    if (typeof duration === 'object') {
      const hours = String(duration.hours || 0).padStart(2, '0');
      const minutes = String(duration.minutes || 0).padStart(2, '0');
      const seconds = String(duration.seconds || 0).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+):(\d+):(\d+)/);
      if (match) return match[0];
      return duration;
    }
    
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error formatting duration:', error);
  }
  
  return '00:00:00';
}

export function formatDateTime(date: any, time: any): string | null {
  if (!date || !time) return null;
  
  try {
    const getDateString = (dateVal: any): string => {
      if (!dateVal) return '';
      if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
      if (typeof dateVal === 'string') return dateVal.split('T')[0];
      if (typeof dateVal === 'number') return new Date(dateVal).toISOString().split('T')[0];
      return '';
    };
    
    const dateStr = getDateString(date);
    if (!dateStr) return null;
    
    let timeStr = time;
    if (time instanceof Date) {
      timeStr = time.toTimeString().split(' ')[0];
    } else if (typeof time === 'string' && time.includes('T')) {
      timeStr = time.split('T')[1];
    }
    
    const dateTimeStr = `${dateStr}T${timeStr}`;
    const timestamp = new Date(dateTimeStr);
    
    if (!isNaN(timestamp.getTime())) {
      return timestamp.toISOString();
    }
  } catch (error) {
    console.error('Error formatting datetime:', error);
  }
  
  return null;
}