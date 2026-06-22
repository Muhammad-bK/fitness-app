export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}

export function calculateSetVolume(weightKg: number | null, reps: number): number {
  if (weightKg === null || weightKg <= 0) return 0;
  return Math.round(weightKg * reps * 100) / 100;
}
