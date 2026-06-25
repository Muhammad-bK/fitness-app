import { z } from 'zod';

export const bodyStatsSchema = z.object({
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  biological_sex: z.enum(['male', 'female', 'other']),
  height: z.string().min(1, 'Height is required'),
  current_weight: z.string().min(1, 'Current weight is required'),
  current_body_type: z.enum(['lean', 'athletic', 'bulky', 'soft']),
  target_body_type: z.enum(['lean', 'athletic', 'bulky', 'soft']),
});

export const goalsSchema = z.object({
  goal_type: z.enum(['lose_weight', 'build_muscle', 'maintain_weight', 'improve_fitness']),
  target_weight: z.string().min(1, 'Target weight is required'),
  weekly_change_rate: z.string().min(1, 'Weekly change rate is required'),
});

export const workoutPreferencesSchema = z.object({
  workout_days_per_week: z.string().min(1, 'Days per week is required'),
  session_length_minutes: z.string().min(1, 'Session length is required'),
  gym_type: z.enum(['home', 'commercial', 'hybrid', 'no_gym']),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const planSetupSchema = z.object({
  // target_muscle_group_ids: z.array(z.string()).min(1, 'Select at least one target muscle group'),
  plan_source: z.enum(['app_generated', 'build_my_own']),
});

export const onboardingCompleteSchema = bodyStatsSchema
  .merge(goalsSchema)
  .merge(workoutPreferencesSchema)
  .merge(planSetupSchema);

export type BodyStatsFormValues = z.infer<typeof bodyStatsSchema>;
export type GoalsFormValues = z.infer<typeof goalsSchema>;
export type WorkoutPreferencesFormValues = z.infer<typeof workoutPreferencesSchema>;
export type PlanSetupFormValues = z.infer<typeof planSetupSchema>;
export type OnboardingCompleteValues = z.infer<typeof onboardingCompleteSchema>;
