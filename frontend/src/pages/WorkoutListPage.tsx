import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';
import { formatDate } from '../lib/formatters';
import { paths } from '../routes';

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

  if (isLoading) return <div className="text-gray-500">Loading workouts...</div>;

  const workouts = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Workouts</h1>
        <Link
          to={paths.log}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Log Workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No workouts yet.</p>
          <Link to={paths.log} className="text-blue-600 hover:underline">
            Log your first workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <Link to={paths.workout(w.id)} className="flex-1">
                <div className="font-medium text-gray-900">
                  {w.session_name || 'Unnamed Workout'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(w.workout_date)} &middot; {w.exercise_count} exercises &middot;{' '}
                  {w.set_count} sets
                </div>
              </Link>
              <button
                onClick={() => navigate(paths.editWorkout(w.id))}
                className="text-sm text-blue-600 hover:text-blue-700 ml-4"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  setWorkoutToDelete({
                    id: w.id,
                    name: w.session_name || 'Unnamed Workout',
                  })
                }
                className="text-sm text-red-500 hover:text-red-700 ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {workoutToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50"
            onClick={() => setWorkoutToDelete(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900">Delete workout?</h2>
            <p className="text-sm text-gray-600 mt-2">
              This will permanently delete <span className="font-medium">{workoutToDelete.name}</span>.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setWorkoutToDelete(null)}
                disabled={deleteWorkout.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteWorkout.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteWorkout.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
