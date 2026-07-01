export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type IntelligenceGoalType = 'fat_loss' | 'muscle_gain' | 'maintenance';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface MacroBreakdown {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  protein_pct: number;
  fat_pct: number;
  carbs_pct: number;
}

export interface WeeklyProjection {
  week: number;
  projected_weight_kg: number;
  date: string;
}


export interface GoalEstimate {
  bmr: number;
  tdee: number;
  calorie_target: number;
  calorie_adjustment: number;
  macro_breakdown: MacroBreakdown;
  estimated_completion_date: string | null;
  weeks_needed: number | null;
  weekly_weight_projection: WeeklyProjection[];
  weekly_loss_kg: number | null;
  weekly_gain_kg: number | null;
  confidence_score: number;
}

export interface GoalEstimateRequest {
  age?: number;
  gender?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number | null;
  activity_level?: ActivityLevel;
  goal_type?: IntelligenceGoalType;
  experience_level?: ExperienceLevel;
  calorie_adjustment?: number;
}

export interface FoodItem {
  fdc_id: number;
  name: string;
  brand?: string | null;
  serving_size_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
  ingredients?: string | null;
}

export interface FoodSearchResponse {
  results: FoodItem[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: string;
  fdc_id: number;
  food_name: string;
  grams: string;
  meal_type: MealType;
  logged_date: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  nutrients: {
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  created_at: string;
}

export interface FoodLogPayload {
  fdc_id: number;
  grams: number;
  food_name?: string;
  meal_type?: MealType;
  logged_date?: string;
}

export interface DailyFoodLog {
  date: string;
  entries: FoodLogEntry[];
  daily_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface CatalogExercise {
  name: string;
  type: string;
  primary_muscle: string;
  primary_muscle_group: string;
  sub_region: string | null;
  secondary_muscles: string[];
  equipment: string;
  difficulty: string;
  instructions: string;
  movement_pattern: string;
  sets?: number;
  reps?: number;
  rest_seconds?: number;
  training_style?: string;
}

export interface WorkoutDay {
  day_index: number;
  day_label: string;
  focus_muscles: string[];
  exercises: CatalogExercise[];
}

export interface GeneratedWorkoutPlan {
  id: string;
  plan_data: {
    split: string;
    training_style: string;
    workouts_per_week: number;
    schedule: WorkoutDay[];
    progressive_overload: {
      upper_body_increase_pct: [number, number];
      lower_body_increase_pct: [number, number];
      rule: string;
    };
  };
  split: string;
  training_style: string;
  workouts_per_week: number;
  is_active: boolean;
  created_at: string;
}

export interface TodayWorkout {
  date: string;
  day_label: string;
  focus_muscles: string[];
  exercises: CatalogExercise[];
}

export interface FitnessProgress {
  goal_estimate: {
    calorie_target: number;
    macro_breakdown: { protein_g: number; fat_g: number; carbs_g: number };
    estimated_completion_date: string | null;
    confidence_score: number;
    weekly_projection: { week: number; weight_kg: number; date: string }[];
  } | null;
  nutrition_30d: {
    period: { start: string; end: string };
    daily: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
    days_logged: number;
  };
  workouts_30d: number;
  body_weight_trend: { date: string; weight_kg: number }[];
  active_workout_plan_id: string | null;
}

export interface MuscleAnatomy {
  [group: string]: { group: string; sub_regions: string[] };
}
