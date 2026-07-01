import { Dumbbell, Calendar } from 'lucide-react';
import { useGenerateWorkout, useTodayWorkout, useWorkoutPlan } from '../hooks/useIntelligence';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingState } from '../components/ui/loading-state';

export function WorkoutPlannerPage() {
  const { data: plan, isLoading: planLoading } = useWorkoutPlan();
  const { data: today, isLoading: todayLoading, isError: noToday } = useTodayWorkout();
  const generate = useGenerateWorkout();

  if (planLoading) return <LoadingState message="Loading workout plan…" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workout Planner"
        description="AI-generated training program based on your goals"
        action={
          <Button onClick={() => generate.mutate({})} disabled={generate.isPending}>
            {plan ? 'Regenerate Plan' : 'Generate Plan'}
          </Button>
        }
      />

      {plan && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-k-muted">Split</p>
            <p className="text-lg font-semibold text-k-fg capitalize">{plan.split.replace(/_/g, ' ')}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-k-muted">Style</p>
            <p className="text-lg font-semibold text-k-fg capitalize">{plan.training_style}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-k-muted">Days/Week</p>
            <p className="text-lg font-semibold text-k-fg">{plan.workouts_per_week}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-k-muted">Sessions</p>
            <p className="text-lg font-semibold text-k-fg">{plan.plan_data.schedule.length}</p>
          </Card>
        </div>
      )}

      {!plan && !generate.isPending && (
        <Card className="p-8 text-center">
          <Dumbbell className="w-12 h-12 text-k-muted mx-auto mb-4" />
          <p className="text-k-muted mb-4">No workout plan yet. Generate one based on your profile.</p>
          <Button onClick={() => generate.mutate({})}>Generate My Plan</Button>
        </Card>
      )}

      {todayLoading && plan && <LoadingState message="Loading today's workout…" />}

      {today && !todayLoading && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-k-brand" />
            <CardTitle className="text-sm font-medium text-k-muted">
              Today — {today.day_label} ({today.date})
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {today.focus_muscles.map((m) => (
              <Badge key={m} variant="secondary">{m}</Badge>
            ))}
          </div>
          <div className="space-y-4">
            {today.exercises.map((ex, i) => (
              <div key={`${ex.name}-${i}`} className="p-4 rounded-lg border border-k-border bg-k-elevated/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-k-fg">{ex.name}</p>
                    <p className="text-xs text-k-muted mt-1">
                      {ex.primary_muscle} · {ex.equipment} · {ex.movement_pattern}
                    </p>
                  </div>
                  {ex.sets && ex.reps && (
                    <p className="text-sm font-medium text-k-brand whitespace-nowrap">
                      {ex.sets}×{ex.reps}
                    </p>
                  )}
                </div>
                {ex.instructions && (
                  <p className="text-xs text-k-muted mt-2 line-clamp-2">{ex.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {noToday && plan && !todayLoading && (
        <p className="text-sm text-k-muted">Could not load today's session. Try regenerating your plan.</p>
      )}

      {plan && (
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Weekly Schedule</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.plan_data.schedule.map((day) => (
              <div key={day.day_index} className="p-4 rounded-lg border border-k-border">
                <p className="font-medium text-k-fg mb-2">{day.day_label}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {day.focus_muscles.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
                <ul className="text-xs text-k-muted space-y-1">
                  {day.exercises.map((ex, i) => (
                    <li key={i}>{ex.name} — {ex.sets}×{ex.reps}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
