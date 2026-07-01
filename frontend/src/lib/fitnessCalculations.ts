import type { ActivityLevel, ExperienceLevel, IntelligenceGoalType } from '../types/intelligence';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female',
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function scaleFoodCalories(caloriesPer100g: number, grams: number): number {
  return Math.round((grams / 100) * caloriesPer100g * 10) / 10;
}

export function sumMealCalories(items: { calories: number }[]): number {
  return items.reduce((sum, item) => sum + item.calories, 0);
}

export function mapOnboardingGoal(goal?: string | null): IntelligenceGoalType {
  const map: Record<string, IntelligenceGoalType> = {
    lose_weight: 'fat_loss',
    build_muscle: 'muscle_gain',
    maintain_weight: 'maintenance',
    improve_fitness: 'maintenance',
  };
  return map[goal ?? ''] ?? 'maintenance';
}

export function formatConfidence(score: number): string {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Moderate';
  return 'Low';
}

export function experienceLabel(level: ExperienceLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
