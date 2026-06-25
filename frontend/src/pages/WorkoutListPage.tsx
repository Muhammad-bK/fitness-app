import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';
import { formatDate } from '../lib/formatters';
import { paths } from '../routes';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';

export function WorkoutListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useWorkouts();
  const deleteWorkout = useDeleteWorkout();
  const [workoutToDelete, setWorkoutToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!workoutToDelete) return;
    deleteWorkout.mutate(workoutToDelete.id, {
      onSuccess: () => setWorkoutToDelete(null),
    });
  };

  if (isLoading) return <LoadingState message="Loading workouts…" />;

  const workouts = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="My Workouts"
        action={
          <Button asChild variant="primary" size="md">
            <Link to={paths.log}>Log Workout</Link>
          </Button>
        }
        className="mb-8"
      />

      {workouts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-k-muted mb-3">No workouts yet.</p>
          <Link to={paths.log} className="text-sm text-k-brand hover:underline">
            Log your first workout
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <Card key={w.id} className="p-4 flex items-center justify-between gap-4">
              <Link to={paths.workout(w.id)} className="flex-1 min-w-0">
                <div className="font-medium text-k-fg truncate">
                  {w.session_name || 'Unnamed Workout'}
                </div>
                <div className="text-sm text-k-muted mt-1">
                  {formatDate(w.workout_date)} &middot; {w.exercise_count} exercises &middot;{' '}
                  {w.set_count} sets
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(paths.editWorkout(w.id))}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setWorkoutToDelete({
                      id: w.id,
                      name: w.session_name || 'Unnamed Workout',
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {workoutToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setWorkoutToDelete(null)}
          />
          <Card className="relative w-full max-w-sm">
            <h2 className="text-lg font-semibold text-k-fg">Delete workout?</h2>
            <p className="text-sm text-k-muted mt-2">
              This will permanently delete <span className="font-medium text-k-fg">{workoutToDelete.name}</span>.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setWorkoutToDelete(null)}
                disabled={deleteWorkout.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
                onClick={handleConfirmDelete}
                disabled={deleteWorkout.isPending}
              >
                {deleteWorkout.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
