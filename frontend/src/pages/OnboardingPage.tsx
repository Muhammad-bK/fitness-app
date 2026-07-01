import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useOnboardingOptions, useOnboardingState, useSaveOnboardingProgress, useCompleteOnboarding } from '../hooks/useOnboarding';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { paths } from '../routes';
import { bodyStatsSchema, goalsSchema, planSetupSchema, workoutPreferencesSchema } from '../lib/onboardingSchemas';
import { type OnboardingCompleteValues } from '../lib/onboardingSchemas';

const steps = [
  { id: 1, label: 'Body Stats' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Workout Preferences' },
  { id: 4, label: 'Plan Setup' },
];

const stepSchemas = [bodyStatsSchema, goalsSchema, workoutPreferencesSchema, planSetupSchema];

const defaultValues = {
  date_of_birth: '',
  biological_sex: 'male',
  height: '',
  current_weight: '',
  current_body_type: 'lean',
  target_body_type: 'lean',
  goal_type: 'maintain_weight',
  target_weight: '',
  weekly_change_rate: '',
  workout_days_per_week: 3,
  session_length_minutes: 45,
  gym_type: 'commercial',
  equipment_ids: [],
  experience_level: 'beginner',
  target_muscle_group_ids: [],
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
  const { data: options, isLoading: optionsLoading } = useOnboardingOptions();
  const { data: onboardingState, isLoading: stateLoading } = useOnboardingState();
  const saveProgress = useSaveOnboardingProgress();
  const completeOnboarding = useCompleteOnboarding();

  const step = onboardingState?.onboarding_step ? onboardingState.onboarding_step : 1;
  const currentSchema = stepSchemas[step - 1];

  const methods = useForm<OnboardingCompleteValues>({
    resolver: zodResolver(currentSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, watch, reset, formState } = methods;
  const values = watch();

  useEffect(() => {
    if (onboardingState) {
      reset({
        ...defaultValues,
        ...onboardingState.profile,
        workout_days_per_week: onboardingState.profile.workout_days_per_week?.toString() ?? '3',
        session_length_minutes: onboardingState.profile.session_length_minutes?.toString() ?? '45',
        equipment_ids: onboardingState.profile.equipment?.map((equipment) => equipment.id) ?? [],
        target_muscle_group_ids: onboardingState.profile.target_muscle_groups?.map((group) => group.id) ?? [],
      });
    }
  }, [onboardingState, reset]);

  useEffect(() => {
    if (onboardingState?.is_onboarded) {
      navigate(paths.home, { replace: true });
    }
  }, [onboardingState, navigate]);

  const stepContent = useMemo(() => {
    const commonSelects = (
      <div className="space-y-4">
        {step === 1 && (
          <>
            <Field label="Date of Birth" name="date_of_birth" type="date" />
            <Select label="Biological Sex" name="biological_sex" options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]} />
            <Field label="Height" name="height" type="number" step="0.1" placeholder="cm" />
            <Field label="Current Weight" name="current_weight" type="number" step="0.1" placeholder="kg" />
            <Select label="Current Body Type" name="current_body_type" options={[
              { value: 'lean', label: 'Lean' },
              { value: 'athletic', label: 'Athletic' },
              { value: 'bulky', label: 'Bulky' },
              { value: 'soft', label: 'Soft' },
            ]} />
            <Select label="Target Body Type" name="target_body_type" options={[
              { value: 'lean', label: 'Lean' },
              { value: 'athletic', label: 'Athletic' },
              { value: 'bulky', label: 'Bulky' },
              { value: 'soft', label: 'Soft' },
            ]} />
          </>
        )}
        {step === 2 && (
          <>
            <Select label="Goal Type" name="goal_type" options={[
              { value: 'lose_weight', label: 'Lose weight' },
              { value: 'build_muscle', label: 'Build muscle' },
              { value: 'maintain_weight', label: 'Maintain weight' },
              { value: 'improve_fitness', label: 'Improve fitness' },
            ]} />
            <Field label="Target Weight" name="target_weight" type="number" step="0.1" placeholder="kg" />
            <Field label="Weekly Change Rate" name="weekly_change_rate" type="number" step="0.1" placeholder="kg per week" />
          </>
        )}
        {step === 3 && (
          <>
            <Field label="Workout Days Per Week" name="workout_days_per_week" type="number" min="1" max="7" />
            <Field label="Session Length (minutes)" name="session_length_minutes" type="number" min="10" max="300" />
            <Select label="Gym Type" name="gym_type" options={[
              { value: 'home', label: 'Home' },
              { value: 'commercial', label: 'Commercial' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'no_gym', label: 'No gym' },
            ]} />
            <MultiSelectField label="Equipment" name="equipment_ids" options={options?.equipment ?? []} />
            <Select label="Experience Level" name="experience_level" options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]} />
          </>
        )}
        {step === 4 && (
          <>
            <MultiSelectField label="Target Muscle Groups" name="target_muscle_group_ids" options={options?.muscle_groups ?? []} />
            <Select label="Plan Source" name="plan_source" options={[
              { value: 'app_generated', label: 'App Generated Plan' },
              { value: 'build_my_own', label: 'Build My Own Plan' },
            ]} />
          </>
        )}
      </div>
    );

    return commonSelects;
  }, [options?.equipment, options?.muscle_groups, step]);

  const handleStepSave = async (nextStep: number) => {
    const safePayload = {
      ...buildPayload(values as OnboardingCompleteValues),
      onboarding_step: nextStep,
    };

    await saveProgress.mutateAsync({ profile: safePayload, onboarding_step: nextStep });
    navigate(paths.onboarding);
  };

  const handleComplete = async () => {
    await completeOnboarding.mutateAsync(buildPayload(values as OnboardingCompleteValues));
    navigate(paths.home, { replace: true });
  };

  if (stateLoading || optionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading onboarding…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl bg-white p-8 rounded-lg shadow">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Welcome to your fitness setup</h1>
          <p className="mt-2 text-gray-600">Complete your introductory setup to get personalized workouts and analytics.</p>
        </div>
        <OnboardingProgress step={step} />
        <FormProvider {...methods}>
          <form className="space-y-6" onSubmit={handleSubmit(step === 4 ? handleComplete : () => void 0)}>
            {stepContent}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) {
                    saveProgress.mutate({ onboarding_step: step - 1 });
                    navigate(paths.onboarding);
                  }
                }}
                disabled={step === 1}
                className="rounded px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!formState.isValid || saveProgress.isLoading || completeOnboarding.isLoading}
                onClick={async () => {
                  if (step < 4) {
                    await handleStepSave(step + 1);
                  } else {
                    await handleComplete();
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {step === 4 ? 'Finish Setup' : 'Next'}
              </button>
            </div>
            {(saveProgress.isError || completeOnboarding.isError) && (
              <p className="text-red-600 text-sm">
                Failed to save. Please try again.
              </p>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

function Field({ label, name, type, step, min, max, placeholder }: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        type={type ?? 'text'}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...useFormContext().register(name)}
      />
      <ErrorMessage name={name} />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...useFormContext().register(name)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorMessage name={name} />
    </div>
  );
}

function MultiSelectField({ label, name, options }: { label: string; name: string; options: { id: string; name: string }[] }) {
  const { register } = useFormContext();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm">
            <input type="checkbox" value={option.id} {...register(name)} />
            <span>{option.name}</span>
          </label>
        ))}
      </div>
      <ErrorMessage name={name} />
    </div>
  );
}

function ErrorMessage({ name }: { name: string }) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;
  if (!error) return null;
  return <p className="mt-1 text-sm text-red-600">{String(error)}</p>;
}
