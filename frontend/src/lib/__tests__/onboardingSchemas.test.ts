import { describe, it, expect } from 'vitest';
import {
  bodyStatsSchema,
  goalsSchema,
  workoutPreferencesSchema,
  planSetupSchema,
  onboardingCompleteSchema,
} from '../onboardingSchemas';

const validBodyStats = {
  date_of_birth: '1995-04-12',
  biological_sex: 'male' as const,
  height: '180',
  current_weight: '80',
  current_body_type: 'athletic' as const,
  target_body_type: 'lean' as const,
};

const validGoals = {
  goal_type: 'build_muscle' as const,
  target_weight: '85',
  weekly_change_rate: '0.25',
};

const validWorkoutPrefs = {
  workout_days_per_week: '4',
  session_length_minutes: '60',
  gym_type: 'commercial' as const,
  experience_level: 'intermediate' as const,
};

const validPlanSetup = {
  plan_source: 'app_generated' as const,
};

describe('bodyStatsSchema', () => {
  it('accepts a valid body stats payload', () => {
    expect(bodyStatsSchema.safeParse(validBodyStats).success).toBe(true);
  });

  it('rejects a missing date of birth', () => {
    const result = bodyStatsSchema.safeParse({ ...validBodyStats, date_of_birth: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid biological_sex enum value', () => {
    const result = bodyStatsSchema.safeParse({ ...validBodyStats, biological_sex: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid body type enum value', () => {
    const result = bodyStatsSchema.safeParse({ ...validBodyStats, current_body_type: 'huge' });
    expect(result.success).toBe(false);
  });
});

describe('goalsSchema', () => {
  it('accepts a valid goals payload', () => {
    expect(goalsSchema.safeParse(validGoals).success).toBe(true);
  });

  it('rejects an empty target weight', () => {
    const result = goalsSchema.safeParse({ ...validGoals, target_weight: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid goal_type', () => {
    const result = goalsSchema.safeParse({ ...validGoals, goal_type: 'get_swole' });
    expect(result.success).toBe(false);
  });
});

describe('workoutPreferencesSchema', () => {
  it('accepts valid workout preferences', () => {
    expect(workoutPreferencesSchema.safeParse(validWorkoutPrefs).success).toBe(true);
  });

  it('rejects an invalid gym_type', () => {
    const result = workoutPreferencesSchema.safeParse({ ...validWorkoutPrefs, gym_type: 'garage' });
    expect(result.success).toBe(false);
  });
});

describe('planSetupSchema', () => {
  it('accepts a valid plan source', () => {
    expect(planSetupSchema.safeParse(validPlanSetup).success).toBe(true);
  });

  it('rejects an invalid plan source', () => {
    const result = planSetupSchema.safeParse({ plan_source: 'magic' });
    expect(result.success).toBe(false);
  });
});

describe('onboardingCompleteSchema', () => {
  it('accepts a fully merged valid payload', () => {
    const result = onboardingCompleteSchema.safeParse({
      ...validBodyStats,
      ...validGoals,
      ...validWorkoutPrefs,
      ...validPlanSetup,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when a required field from any sub-schema is missing', () => {
    const result = onboardingCompleteSchema.safeParse({
      ...validBodyStats,
      ...validGoals,
      ...validWorkoutPrefs,
      // plan_source omitted
    });
    expect(result.success).toBe(false);
  });
});
