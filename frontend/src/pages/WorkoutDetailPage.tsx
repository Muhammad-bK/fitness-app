import { useParams } from 'react-router-dom';
import { useWorkout } from '../hooks/useWorkouts';
import { useAuthContext } from '../context/AuthContext';
import { formatDate, formatRestTime } from '../lib/formatters';
import { formatWeight } from '../lib/units';
import { paths } from '../routes';
import { BackLink } from '../components/ui/back-link';
import { Badge, setTypeBadgeVariant } from '../components/ui/badge';
import { Card, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading } = useWorkout(id!);
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <LoadingState />;
  if (!workout) return <p className="text-k-muted">Workout not found.</p>;

  return (
    <div>
      <BackLink to={paths.workouts}>Back to workouts</BackLink>

      <Card className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-k-fg">
          {workout.session_name || 'Workout'}
        </h1>
        <div className="text-sm text-k-muted mt-1">
          {formatDate(workout.workout_date)}
          {workout.display_body_weight && (
            <> &middot; BW: {workout.display_body_weight.value} {workout.display_body_weight.unit}</>
          )}
        </div>
        {workout.notes && <p className="text-sm text-k-muted mt-3">{workout.notes}</p>}
      </Card>

      <div className="space-y-4">
        {workout.workout_exercises.map((we) => (
          <Card key={we.id}>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{we.exercise.name}</CardTitle>
              <Badge variant="default">{we.exercise.category}</Badge>
            </div>
            {we.notes && <p className="text-sm text-k-muted mb-4">{we.notes}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-k-muted text-left border-b border-k-border">
                    <th className="pb-2 font-medium">Set</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Weight</th>
                    <th className="pb-2 font-medium">Reps</th>
                    <th className="pb-2 font-medium">Rest</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {we.sets.map((set) => (
                    <tr key={set.id} className="border-b border-k-border/50">
                      <td className="py-2.5 text-k-muted">{set.set_number}</td>
                      <td className="py-2.5">
                        <Badge variant={setTypeBadgeVariant(set.set_type)}>{set.set_type}</Badge>
                      </td>
                      <td className="py-2.5 text-k-fg">
                        {set.weight_kg
                          ? formatWeight(parseFloat(set.weight_kg), unit)
                          : 'BW'}
                      </td>
                      <td className="py-2.5 text-k-fg">{set.reps}</td>
                      <td className="py-2.5 text-k-muted">
                        {formatRestTime(set.rest_time_seconds)}
                      </td>
                      <td className="py-2.5 text-k-faint text-xs">
                        {[
                          set.had_spotter && 'spotter',
                          set.paused && `paused@${set.pause_at_rep}`,
                          set.notes,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
