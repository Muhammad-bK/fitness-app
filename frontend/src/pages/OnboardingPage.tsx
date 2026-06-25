import { useEffect } from 'react';
import { FormProvider, useForm, useFormContext, type Resolver, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingState, useSaveOnboardingProgress, useCompleteOnboarding } from '../hooks/useOnboarding';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { paths } from '../routes';
import { bodyStatsSchema, goalsSchema, planSetupSchema, workoutPreferencesSchema } from '../lib/onboardingSchemas';
import { type OnboardingCompleteValues } from '../lib/onboardingSchemas';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SegmentedControl } from '../components/ui/segmented-control';
import { SelectionChipGroup } from '../components/ui/selection-chip';
import { PlanCard } from '../components/ui/plan-card';
import { cn } from '../lib/utils';
import type { ZodTypeAny } from 'zod';

type OnboardingFormValues = OnboardingCompleteValues;

const stepSchemas: ZodTypeAny[] = [bodyStatsSchema, goalsSchema, workoutPreferencesSchema, planSetupSchema];

const stepHeadings = [
  { title: 'Establish your baseline.', sub: 'Accurate data lets our engine calculate your recovery windows.' },
  { title: 'Define your trajectory.', sub: 'Tell us where you want to go and how fast you want to get there.' },
  { title: 'Set your schedule.', sub: 'We build your program around the time you actually have.' },
  { title: 'Choose your approach.', sub: 'Pick how you want your program to be built.' },
];

const defaultValues: OnboardingFormValues = {
  date_of_birth: '',
  biological_sex: 'male',
  height: '',
  current_weight: '',
  current_body_type: 'lean',
  target_body_type: 'lean',
  goal_type: 'maintain_weight',
  target_weight: '',
  weekly_change_rate: '',
  workout_days_per_week: '3',
  session_length_minutes: '45',
  gym_type: 'commercial',
  experience_level: 'beginner',
  plan_source: 'app_generated',
};

function buildPayload(data: OnboardingCompleteValues) {
  return {
    date_of_birth: data.date_of_birth,
    biological_sex: data.biological_sex,
    height: data.height,
    current_weight: data.current_weight,
    target_weight: data.target_weight,
    current_body_type: data.current_body_type,
    target_body_type: data.target_body_type,
    goal_type: data.goal_type,
    weekly_change_rate: data.weekly_change_rate,
    workout_days_per_week: Number(data.workout_days_per_week),
    session_length_minutes: Number(data.session_length_minutes),
    gym_type: data.gym_type,
    experience_level: data.experience_level,
    plan_source: data.plan_source,
  };
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { data: onboardingState, isLoading: stateLoading } = useOnboardingState();
  const saveProgress = useSaveOnboardingProgress();
  const completeOnboarding = useCompleteOnboarding();

  const step = onboardingState?.onboarding_step && onboardingState.onboarding_step > 0
    ? onboardingState.onboarding_step
    : 1;
  const currentSchema = stepSchemas[step - 1];

  const methods = useForm<OnboardingFormValues>({
    // Step schemas differ per step; zodResolver needs a runtime schema reference.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic per-step Zod schema
    resolver: zodResolver(currentSchema as any) as unknown as Resolver<OnboardingFormValues>,
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    if (onboardingState) {
      reset({
        date_of_birth: onboardingState.profile.date_of_birth ?? '',
        biological_sex: onboardingState.profile.biological_sex ?? 'male',
        height: onboardingState.profile.height ?? '',
        current_weight: onboardingState.profile.current_weight ?? '',
        target_weight: onboardingState.profile.target_weight ?? '',
        current_body_type: onboardingState.profile.current_body_type ?? 'lean',
        target_body_type: onboardingState.profile.target_body_type ?? 'lean',
        goal_type: onboardingState.profile.goal_type ?? 'maintain_weight',
        weekly_change_rate: onboardingState.profile.weekly_change_rate ?? '',
        workout_days_per_week: onboardingState.profile.workout_days_per_week?.toString() ?? '3',
        session_length_minutes: onboardingState.profile.session_length_minutes?.toString() ?? '45',
        gym_type: onboardingState.profile.gym_type ?? 'commercial',
        experience_level: onboardingState.profile.experience_level ?? 'beginner',
        plan_source: onboardingState.profile.plan_source ?? 'app_generated',
      });
    }
  }, [onboardingState, reset]);

  useEffect(() => {
    if (onboardingState?.is_onboarded) {
      void navigate(paths.home, { replace: true });
    }
  }, [onboardingState, navigate]);

  const handleStepSave = async (nextStep: number, data: OnboardingFormValues) => {
    await saveProgress.mutateAsync({
      profile: buildPayload(data),
      onboarding_step: nextStep,
    });
    void navigate(paths.onboarding);
  };

  const handleComplete = async (data: OnboardingFormValues) => {
    await completeOnboarding.mutateAsync(buildPayload(data));
    void navigate(paths.home, { replace: true });
  };

  if (stateLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-k-brand border-t-transparent animate-spin" />
          <p className="text-sm text-k-muted">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const heading = stepHeadings[step - 1] ?? stepHeadings[0]!;

  return (
    <div className="px-6 py-10">
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16 lg:items-start">
        {/* Sidebar — desktop stepper */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-k-brand mb-6">
            Account Setup
          </p>
          <OnboardingProgress step={step} variant="vertical" />
        </aside>

        {/* Main content */}
        <div className="min-w-0">
          <div className="mb-8 lg:mb-0">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-k-brand">
              Setup · Step {step} of 4
            </span>
            <h1 className="mt-3 text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.05] text-k-fg">
              {heading.title}
            </h1>
            <p className="mt-3 text-[15px] lg:text-base leading-relaxed text-k-muted max-w-2xl">
              {heading.sub}
            </p>
          </div>

          <OnboardingProgress step={step} variant="horizontal" />

          <Card className="mt-2">
            <FormProvider {...methods}>
              <form
                className="flex flex-col"
                onSubmit={handleSubmit(handleComplete)}
              >
                <div className="space-y-6">
                  {step === 1 && <StepBodyStats />}
                  {step === 2 && <StepGoals />}
                  {step === 3 && <StepWorkoutPreferences />}
                  {step === 4 && <StepPlan />}
                </div>

                {(saveProgress.isError || completeOnboarding.isError) && (
                  <p className="mt-4 text-sm text-k-error">
                    Failed to save. Please try again.
                  </p>
                )}

                <div className="mt-8 pt-6 border-t border-k-border flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      if (step > 1) {
                        saveProgress.mutate({ onboarding_step: step - 1 });
                        void navigate(paths.onboarding);
                      }
                    }}
                    disabled={step === 1}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={!formState.isValid || saveProgress.isPending || completeOnboarding.isPending}
                    onClick={handleSubmit(async (data) => {
                      if (step < 4) {
                        await handleStepSave(step + 1, data);
                      } else {
                        await handleComplete(data);
                      }
                    })}
                    className="gap-2 min-w-[140px]"
                  >
                    {saveProgress.isPending || completeOnboarding.isPending ? (
                      <span className="w-4 h-4 rounded-full border-2 border-k-brand-fg border-t-transparent animate-spin" />
                    ) : (
                      <>
                        {step === 4 ? 'Finish Setup' : 'Next Step'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Body Stats ─── */
function StepBodyStats() {
  const { register, control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <FormField label="Date of Birth" error={errors.date_of_birth?.message}>
        <Input type="date" {...register('date_of_birth')} />
      </FormField>

      <div>
        <Label className="mb-3 block">Biological Sex</Label>
        <Controller
          name="biological_sex"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Height (cm)" error={errors.height?.message}>
          <Input type="number" step="0.1" placeholder="cm" {...register('height')} />
        </FormField>
        <FormField label="Weight (kg)" error={errors.current_weight?.message}>
          <Input type="number" step="0.1" placeholder="kg" {...register('current_weight')} />
        </FormField>
      </div>

      <div>
        <Label className="mb-3 block">Current Body Type</Label>
        <Controller
          name="current_body_type"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              columns={4}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'lean', label: 'Lean', sublabel: 'Type' },
                { value: 'athletic', label: 'Athletic', sublabel: 'Type' },
                { value: 'bulky', label: 'Bulky', sublabel: 'Type' },
                { value: 'soft', label: 'Soft', sublabel: 'Type' },
              ]}
            />
          )}
        />
      </div>

      <div>
        <Label className="mb-3 block">Target Body Type</Label>
        <Controller
          name="target_body_type"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              columns={4}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'lean', label: 'Lean', sublabel: 'Goal' },
                { value: 'athletic', label: 'Athletic', sublabel: 'Goal' },
                { value: 'bulky', label: 'Bulky', sublabel: 'Goal' },
                { value: 'soft', label: 'Soft', sublabel: 'Goal' },
              ]}
            />
          )}
        />
      </div>
    </div>
  );
}

/* ─── Step 2: Goals ─── */
function StepGoals() {
  const { register, control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-3 block">Goal Type</Label>
        <Controller
          name="goal_type"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'lose_weight', label: 'Lose Fat', sublabel: 'Cut' },
                { value: 'build_muscle', label: 'Gain Muscle', sublabel: 'Build' },
                { value: 'maintain_weight', label: 'Maintenance', sublabel: 'Hold' },
                { value: 'improve_fitness', label: 'Improve Fitness', sublabel: 'Recomp' },
              ]}
            />
          )}
        />
      </div>

      <FormField label="Target Weight (kg)" error={errors.target_weight?.message}>
        <Input type="number" step="0.1" placeholder="e.g. 80" {...register('target_weight')} />
      </FormField>

      <FormField label="Weekly Change Rate (kg/week)" error={errors.weekly_change_rate?.message}>
        <Input type="number" step="0.1" placeholder="e.g. 0.5" {...register('weekly_change_rate')} />
        <p className="mt-2 text-[11px] text-k-faint">
          Recommended: 0.25–0.75 kg/week for sustainable progress
        </p>
      </FormField>
    </div>
  );
}

/* ─── Step 3: Workout Preferences ─── */
function StepWorkoutPreferences() {
  const { register, control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Days / Week" error={errors.workout_days_per_week?.message}>
          <Input type="number" min="1" max="7" placeholder="e.g. 4" {...register('workout_days_per_week')} />
        </FormField>
        <FormField label="Session (min)" error={errors.session_length_minutes?.message}>
          <Input type="number" min="10" max="300" placeholder="e.g. 60" {...register('session_length_minutes')} />
        </FormField>
      </div>

      <div>
        <Label className="mb-3 block">Gym Setup</Label>
        <Controller
          name="gym_type"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'commercial', label: 'Commercial Gym', sublabel: 'Gym' },
                { value: 'home', label: 'Home Gym', sublabel: 'Gym' },
                { value: 'hybrid', label: 'Hybrid', sublabel: 'Gym' },
                { value: 'no_gym', label: 'No Equipment', sublabel: 'Gym' },
              ]}
            />
          )}
        />
      </div>

      <div>
        <Label className="mb-3 block">Experience Level</Label>
        <Controller
          name="experience_level"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
          )}
        />
      </div>
    </div>
  );
}

/* ─── Step 4: Plan ─── */
function StepPlan() {
  const { control } = useFormContext<OnboardingFormValues>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Controller
        name="plan_source"
        control={control}
        render={({ field }) => (
          <>
            <PlanCard
              value="app_generated"
              selected={field.value === 'app_generated'}
              onSelect={field.onChange}
              badge="Recommended"
              title="Generate my plan"
              description="Our engine designs a periodized program from your inputs."
              features={['Auto-adjusts weekly', 'Recovery-aware', 'Built in under a minute']}
            />
            <PlanCard
              value="build_my_own"
              selected={field.value === 'build_my_own'}
              onSelect={field.onChange}
              badge="Power user"
              title="Build my own plan"
              description="Hand-pick splits, exercises, sets, and reps yourself."
              features={['Full exercise library', 'Custom splits', 'Manual progression']}
            />
          </>
        )}
      />
    </div>
  );
}

/* ─── Shared field wrapper ─── */
function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-k-error">{error}</p>}
    </div>
  );
}
