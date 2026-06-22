import { Link } from 'react-router-dom';
import { useWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';
import { formatDate } from '../lib/formatters';

export function WorkoutListPage() {
  const { data, isLoading } = useWorkouts();
  const deleteWorkout = useDeleteWorkout();

  if (isLoading) return <div className="text-gray-500">Loading workouts...</div>;

  const workouts = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Workouts</h1>
        <Link
          to="/log"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Log Workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No workouts yet.</p>
          <Link to="/log" className="text-blue-600 hover:underline">
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
              <Link to={`/workouts/${w.id}`} className="flex-1">
                <div className="font-medium text-gray-900">
                  {w.session_name || 'Unnamed Workout'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(w.workout_date)} &middot; {w.exercise_count} exercises &middot;{' '}
                  {w.set_count} sets
                </div>
              </Link>
              <button
                onClick={() => {
                  if (confirm('Delete this workout?')) {
                    deleteWorkout.mutate(w.id);
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700 ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
