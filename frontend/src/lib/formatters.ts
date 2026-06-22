export function formatRestTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes && secs) return `${minutes}m ${secs}s`;
  if (minutes) return `${minutes}m`;
  return `${secs}s`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
