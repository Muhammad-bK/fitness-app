import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useWorkout, useUpdateWorkout } from '../hooks/useWorkouts';
import { useAuthContext } from '../context/AuthContext';
import { paths } from '../routes';
import type { SetWritePayload, WorkoutExerciseWritePayload } from '../types';

interface SetFormData {
  set_type: string;
  weight: string;
  reps: string;
  rest_time_seconds: string;
  had_spotter: boolean;
  paused: boolean;
  pause_at_rep: string;
  notes: string;
}

interface ExerciseFormData {
  exercise_id: string;
  exercise_name: string;
  notes: string;
  sets: SetFormData[];
}

function emptySet(): SetFormData {
  return {
    set_type: 'working',
    weight: '',
    reps: '',
    rest_time_seconds: '',
    had_spotter: false,
    paused: false,
    pause_at_rep: '',
    notes: '',
  };
}

export function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';
  const { data: exerciseData } = useExercises();
  const { data: workoutData, isLoading } = useWorkout(id || '');
  const updateWorkout = useUpdateWorkout();

  const [sessionName, setSessionName] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseFormData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load existing workout data
  useEffect(() => {
    if (workoutData) {
      setSessionName(workoutData.session_name);
      setWorkoutDate(workoutData.workout_date);
      setBodyWeight(
        workoutData.body_weight_kg ? workoutData.body_weight_kg : ''
      );
      setSessionNotes(workoutData.notes);

      const loadedExercises: ExerciseFormData[] =
        workoutData.workout_exercises.map((we) => ({
          exercise_id: we.exercise.id,
          exercise_name: we.exercise.name,
          notes: we.notes,
          sets: we.sets.map((s) => ({
            set_type: s.set_type,
            weight: s.weight_kg ? s.weight_kg : '',
            reps: s.reps.toString(),
            rest_time_seconds: s.rest_time_seconds
              ? s.rest_time_seconds.toString()
              : '',
            had_spotter: s.had_spotter,
            paused: s.paused,
            pause_at_rep: s.pause_at_rep ? s.pause_at_rep.toString() : '',
            notes: s.notes,
          })),
        }));
      setExercises(loadedExercises);
    }
  }, [workoutData]);

  const allExercises = exerciseData?.results ?? [];
  const filteredExercises = searchTerm
    ? allExercises.filter((e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allExercises;

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        notes: '',
        sets: [emptySet()],
      },
    ]);
    setSearchTerm('');
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: [...copy[exIdx].sets, emptySet()],
      };
      return copy;
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: copy[exIdx].sets.filter((_, i) => i !== setIdx),
      };
      return copy;
    });
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof SetFormData,
    value: string | boolean
  ) => {
    setExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      copy[exIdx] = { ...copy[exIdx], sets };
      return copy;
    });
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx] = { ...copy[exIdx], notes };
      return copy;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const exercisePayloads: WorkoutExerciseWritePayload[] = exercises.map(
      (ex, exIdx) => ({
        exercise_id: ex.exercise_id,
        order_in_session: exIdx + 1,
        notes: ex.notes,
        sets: ex.sets.map((s, sIdx): SetWritePayload => ({
          set_number: sIdx + 1,
          set_type: s.set_type,
          weight: s.weight ? parseFloat(s.weight) : null,
          weight_unit: s.weight ? unit : null,
          reps: parseInt(s.reps) || 0,
          rest_time_seconds: s.rest_time_seconds
            ? parseInt(s.rest_time_seconds)
            : null,
          had_spotter: s.had_spotter,
          paused: s.paused,
          pause_at_rep: s.pause_at_rep ? parseInt(s.pause_at_rep) : null,
          notes: s.notes,
        })),
      })
    );

    updateWorkout.mutate(
      {
        id: id || '',
        payload: {
          session_name: sessionName,
          workout_date: workoutDate,
          body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
          body_weight_unit: bodyWeight ? unit : null,
          notes: sessionNotes,
          exercises: exercisePayloads,
        },
      },
      {
        onSuccess: () => navigate(paths.workouts),
      }
    );
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading workout...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Workout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Push Day"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Date
              </label>
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Body Weight ({unit})
              </label>
              <input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Session notes (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Exercises */}
        {exercises.map((ex, exIdx) => (
          <div
            key={exIdx}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{ex.exercise_name}</h3>
              <button
                type="button"
                onClick={() => removeExercise(exIdx)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            {/* Exercise notes */}
            <div className="mb-3">
              <input
                type="text"
                value={ex.notes}
                onChange={(e) => updateExerciseNotes(exIdx, e.target.value)}
                placeholder="Exercise notes (optional)"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Sets table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left text-xs">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Weight ({unit})</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2">Rest (s)</th>
                    <th className="pb-2 w-8">Spot</th>
                    <th className="pb-2 w-8">Pause</th>
                    <th className="pb-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, setIdx) => (
                    <tr key={setIdx} className="border-t border-gray-50">
                      <td className="py-1 text-gray-400">{setIdx + 1}</td>
                      <td className="py-1 pr-1">
                        <select
                          value={set.set_type}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'set_type', e.target.value)
                          }
                          className="border border-gray-300 rounded px-1 py-1 text-xs w-full"
                        >
                          <option value="working">Working</option>
                          <option value="warmup">Warmup</option>
                          <option value="dropset">Dropset</option>
                          <option value="failure">Failure</option>
                        </select>
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'weight', e.target.value)
                          }
                          placeholder="—"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'reps', e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-16"
                          required
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="number"
                          value={set.rest_time_seconds}
                          onChange={(e) =>
                            updateSet(
                              exIdx,
                              setIdx,
                              'rest_time_seconds',
                              e.target.value
                            )
                          }
                          placeholder="—"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-16"
                        />
                      </td>
                      <td className="py-1 text-center">
                        <input
                          type="checkbox"
                          checked={set.had_spotter}
                          onChange={(e) =>
                            updateSet(
                              exIdx,
                              setIdx,
                              'had_spotter',
                              e.target.checked
                            )
                          }
                        />
                      </td>
                      <td className="py-1 text-center">
                        <input
                          type="checkbox"
                          checked={set.paused}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'paused', e.target.checked)
                          }
                        />
                      </td>
                      <td className="py-1">
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, setIdx)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addSet(exIdx)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              + Add Set
            </button>
          </div>
        ))}

        {/* Exercise picker */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Add Exercise
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
          />
          {searchTerm && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
              {filteredExercises.length === 0 ? (
                <div className="p-3 text-sm text-gray-400">No exercises found</div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addExercise(ex.id, ex.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {ex.muscle_group} &middot; {ex.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={exercises.length === 0 || updateWorkout.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {updateWorkout.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(paths.home)}
            className="text-gray-500 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {updateWorkout.isError && (
          <p className="text-red-600 text-sm">
            Failed to save workout. Check your inputs and try again.
          </p>
        )}
      </form>
    </div>
  );
}
