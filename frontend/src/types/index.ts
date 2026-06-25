export interface User {
  id: string;
  email: string;
  display_name: string | null;
  unit_preference: 'kg' | 'lbs';
  is_onboarded: boolean;
  onboarding_step: number;
  created_at: string;
}

export interface EquipmentOption {
  id: string;
  name: string;
}

export interface MuscleGroupOption {
  id: string;
  name: string;
}

export interface UserProfile {
  date_of_birth?: string | null;
  biological_sex?: 'male' | 'female' | 'other' | null;
  height?: string | null;
  current_weight?: string | null;
  target_weight?: string | null;
  current_body_type?: 'lean' | 'athletic' | 'bulky' | 'soft' | null;
  target_body_type?: 'lean' | 'athletic' | 'bulky' | 'soft' | null;
  goal_type?: 'lose_weight' | 'build_muscle' | 'maintain_weight' | 'improve_fitness' | null;
  weekly_change_rate?: string | null;
  workout_days_per_week?: number | null;
  session_length_minutes?: number | null;
  gym_type?: 'home' | 'commercial' | 'hybrid' | 'no_gym' | null;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  plan_source?: 'app_generated' | 'build_my_own' | null;
  equipment?: EquipmentOption[];
  target_muscle_groups?: MuscleGroupOption[];
}

export interface OnboardingState {
  is_onboarded: boolean;
  onboarding_step: number;
  profile: UserProfile;
}

export interface OnboardingOptions {
  equipment: EquipmentOption[];
  muscle_groups: MuscleGroupOption[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  category: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';
  is_global: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  set_number: number;
  set_type: 'working' | 'warmup' | 'dropset' | 'failure';
  weight_kg: string | null;
  weight_unit: string | null;
  display_weight: { value: string; unit: string } | null;
  reps: number;
  rest_time_seconds: number | null;
  had_spotter: boolean;
  paused: boolean;
  pause_at_rep: number | null;
  notes: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  order_in_session: number;
  notes: string;
  sets: ExerciseSet[];
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  session_name: string;
  body_weight_kg: string | null;
  body_weight_unit: string | null;
  display_body_weight: { value: string; unit: string } | null;
  workout_date: string;
  notes: string;
  started_at: string | null;
  ended_at: string | null;
  workout_exercises: WorkoutExercise[];
  created_at: string;
}

export interface WorkoutSessionListItem {
  id: string;
  session_name: string;
  body_weight_kg: string | null;
  body_weight_unit: string | null;
  workout_date: string;
  notes: string;
  started_at: string | null;
  ended_at: string | null;
  exercise_count: number;
  set_count: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Write payloads
export interface SetWritePayload {
  set_number: number;
  set_type: string;
  weight?: number | null;
  weight_unit?: string | null;
  reps: number;
  rest_time_seconds?: number | null;
  had_spotter?: boolean;
  paused?: boolean;
  pause_at_rep?: number | null;
  notes?: string;
}

export interface WorkoutExerciseWritePayload {
  exercise_id: string;
  order_in_session: number;
  notes?: string;
  sets: SetWritePayload[];
}

export interface WorkoutWritePayload {
  session_name?: string;
  workout_date: string;
  body_weight?: number | null;
  body_weight_unit?: string | null;
  notes?: string;
  started_at?: string | null;
  ended_at?: string | null;
  exercises: WorkoutExerciseWritePayload[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, string[]>;
  };
}

// Analytics types

export interface BodyWeightPoint {
  date: string;
  weight_kg: string;
}

export interface SmoothedWeekPoint {
  week: string;
  avg_weight_kg: string;
}

export interface BodyWeightAnalytics {
  period: { start: string; end: string };
  daily: BodyWeightPoint[];
  smoothed_weekly: SmoothedWeekPoint[];
  current_weight_kg: string | null;
  net_change_kg: string | null;
}

export interface WeightProgressionPoint {
  date: string;
  max_weight_kg: string;
}

export interface RepProgressionPoint {
  date: string;
  reps_at_top_weight: number;
}

export interface VolumeProgressionPoint {
  date: string;
  total_volume_kg: string;
}

export interface OneRmProgressionPoint {
  date: string;
  estimated_1rm_kg: string;
}

export interface PersonalRecord {
  value_kg: string;
  date: string | null;
}

export interface ExerciseAnalytics {
  exercise: { id: string; name: string };
  period: { start: string; end: string };
  weight_progression: WeightProgressionPoint[];
  rep_progression: RepProgressionPoint[];
  volume_progression: VolumeProgressionPoint[];
  one_rm_progression: OneRmProgressionPoint[];
  personal_records: {
    best_weight: PersonalRecord;
    best_single_session_volume: PersonalRecord;
    best_estimated_1rm: PersonalRecord;
  };
}

export interface WeeklyCount {
  week: string;
  count: number;
}

export interface ConsistencyAnalytics {
  period: { start: string; end: string };
  workouts_this_week: number;
  workouts_this_month: number;
  total_workouts: number;
  current_streak_weeks: number;
  avg_workouts_per_week: number;
  weekly_breakdown: WeeklyCount[];
}

export interface TopExercise {
  exercise_id: string;
  exercise_name: string;
  session_count_30d: number;
  recent_max_weight_kg: string | null;
}

export interface DashboardAnalytics {
  current_weight_kg: string | null;
  weight_change_30d_kg: string | null;
  workouts_this_month: number;
  strongest_lift: {
    exercise_id: string;
    exercise_name: string;
    estimated_1rm_kg: string;
  } | null;
  latest_pr: {
    exercise_name: string;
    estimated_1rm_kg: string;
    weight_kg: string;
    reps: number;
    date: string;
  } | null;
  weight_trend: BodyWeightPoint[];
  workout_frequency: WeeklyCount[];
  top_exercises: TopExercise[];
}
