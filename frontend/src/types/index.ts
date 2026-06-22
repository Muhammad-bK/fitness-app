export interface User {
  id: string;
  email: string;
  display_name: string | null;
  unit_preference: 'kg' | 'lbs';
  created_at: string;
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
