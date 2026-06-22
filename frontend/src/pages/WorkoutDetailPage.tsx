import { useParams, Link } from 'react-router-dom';
import { useWorkout } from '../hooks/useWorkouts';
import { useAuthContext } from '../context/AuthContext';
import { formatDate, formatRestTime } from '../lib/formatters';
import { formatWeight } from '../lib/units';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading } = useWorkout(id!);
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <div className="text-gray-500">Loading...</div>;
  if (!workout) return <div className="text-gray-500">Workout not found.</div>;

  return (
    <div>
      <Link to="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Back to workouts
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {workout.session_name || 'Workout'}
        </h1>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(workout.workout_date)}
          {workout.display_body_weight && (
            <> &middot; BW: {workout.display_body_weight.value} {workout.display_body_weight.unit}</>
          )}
        </div>
        {workout.notes && <p className="text-sm text-gray-600 mt-2">{workout.notes}</p>}
      </div>

      <div className="space-y-4">
        {workout.workout_exercises.map((we) => (
          <div key={we.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{we.exercise.name}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {we.exercise.category}
              </span>
            </div>
            {we.notes && <p className="text-sm text-gray-500 mb-3">{we.notes}</p>}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-100">
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
                  <tr key={set.id} className="border-b border-gray-50">
                    <td className="py-2">{set.set_number}</td>
                    <td className="py-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          set.set_type === 'warmup'
                            ? 'bg-yellow-100 text-yellow-700'
                            : set.set_type === 'working'
                            ? 'bg-blue-100 text-blue-700'
                            : set.set_type === 'dropset'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {set.set_type}
                      </span>
                    </td>
                    <td className="py-2">
                      {set.weight_kg
                        ? formatWeight(parseFloat(set.weight_kg), unit)
                        : 'BW'}
                    </td>
                    <td className="py-2">{set.reps}</td>
                    <td className="py-2 text-gray-400">
                      {formatRestTime(set.rest_time_seconds)}
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
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
        ))}
      </div>
    </div>
  );
}
