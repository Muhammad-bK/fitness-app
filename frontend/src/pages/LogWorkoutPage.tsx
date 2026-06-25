import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useCreateWorkout } from '../hooks/useWorkouts';
import { useAuthContext } from '../context/AuthContext';
import { paths } from '../routes';
import type { SetWritePayload, WorkoutExerciseWritePayload } from '../types';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Card, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NativeSelect } from '../components/ui/native-select';
import { cn } from '../lib/utils';

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

const compactInput = 'py-1.5 px-2 text-xs h-auto';

export function LogWorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';
  const { data: exerciseData } = useExercises();
  const createWorkout = useCreateWorkout();

  const [sessionName, setSessionName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split('T')[0] ?? '',
  );
  const [bodyWeight, setBodyWeight] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseFormData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const allExercises = exerciseData?.results ?? [];
  const filteredExercises = searchTerm
    ? allExercises.filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : allExercises;

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setExercises((prev) => [
      ...prev,
      { exercise_id: exerciseId, exercise_name: exerciseName, notes: '', sets: [emptySet()] },
    ]);
    setSearchTerm('');
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((exercise, index) =>
        index === exIdx
          ? { ...exercise, sets: [...exercise.sets, emptySet()] }
          : exercise,
      ),
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((exercise, index) =>
        index === exIdx
          ? { ...exercise, sets: exercise.sets.filter((_, i) => i !== setIdx) }
          : exercise,
      ),
    );
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof SetFormData,
    value: string | boolean,
  ) => {
    setExercises((prev) =>
      prev.map((exercise, index) => {
        if (index !== exIdx) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set, i) =>
            i === setIdx ? { ...set, [field]: value } : set,
          ),
        };
      }),
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const exercisePayloads: WorkoutExerciseWritePayload[] = exercises.map((ex, exIdx) => ({
      exercise_id: ex.exercise_id,
      order_in_session: exIdx + 1,
      notes: ex.notes,
      sets: ex.sets.map((s, sIdx): SetWritePayload => ({
        set_number: sIdx + 1,
        set_type: s.set_type,
        weight: s.weight ? parseFloat(s.weight) : null,
        weight_unit: s.weight ? unit : null,
        reps: parseInt(s.reps) || 0,
        rest_time_seconds: s.rest_time_seconds ? parseInt(s.rest_time_seconds) : null,
        had_spotter: s.had_spotter,
        paused: s.paused,
        pause_at_rep: s.pause_at_rep ? parseInt(s.pause_at_rep) : null,
        notes: s.notes,
      })),
    }));

    createWorkout.mutate(
      {
        session_name: sessionName,
        workout_date: workoutDate,
        body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
        body_weight_unit: bodyWeight ? unit : null,
        notes: sessionNotes,
        exercises: exercisePayloads,
      },
      { onSuccess: () => { void navigate(paths.home); } },
    );
  };

  return (
    <div>
      <PageHeader title="Log Workout" className="mb-8" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Session Name</Label>
              <Input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Push Day"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Body Weight ({unit})</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Notes</Label>
            <Input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Session notes (optional)"
            />
          </div>
        </Card>

        {exercises.map((ex, exIdx) => (
          <Card key={exIdx}>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{ex.exercise_name}</CardTitle>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeExercise(exIdx)}>
                Remove
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-k-muted text-left text-xs border-b border-k-border">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Weight ({unit})</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2">Rest (s)</th>
                    <th className="pb-2 w-8">Spot</th>
                    <th className="pb-2 w-8">Pause</th>
                    <th className="pb-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, setIdx) => (
                    <tr key={setIdx} className="border-t border-k-border/50">
                      <td className="py-2 text-k-faint">{setIdx + 1}</td>
                      <td className="py-2 pr-2">
                        <NativeSelect
                          value={set.set_type}
                          onChange={(e) => updateSet(exIdx, setIdx, 'set_type', e.target.value)}
                          className={cn(compactInput, 'w-full min-w-[90px]')}
                        >
                          <option value="working">Working</option>
                          <option value="warmup">Warmup</option>
                          <option value="dropset">Dropset</option>
                          <option value="failure">Failure</option>
                        </NativeSelect>
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                          placeholder="—"
                          className={cn(compactInput, 'w-20')}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                          className={cn(compactInput, 'w-16')}
                          required
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          value={set.rest_time_seconds}
                          onChange={(e) => updateSet(exIdx, setIdx, 'rest_time_seconds', e.target.value)}
                          placeholder="—"
                          className={cn(compactInput, 'w-16')}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={set.had_spotter}
                          onChange={(e) => updateSet(exIdx, setIdx, 'had_spotter', e.target.checked)}
                          className="accent-k-brand"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={set.paused}
                          onChange={(e) => updateSet(exIdx, setIdx, 'paused', e.target.checked)}
                          className="accent-k-brand"
                        />
                      </td>
                      <td className="py-2">
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, setIdx)}
                            className="text-k-faint hover:text-k-error text-xs"
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

            <Button type="button" variant="ghost" size="sm" onClick={() => addSet(exIdx)} className="mt-3">
              + Add Set
            </Button>
          </Card>
        ))}

        <Card>
          <Label className="mb-2 block">Add Exercise</Label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises…"
            className="mb-2"
          />
          {searchTerm && (
            <div className="max-h-48 overflow-y-auto border border-k-border rounded-lg">
              {filteredExercises.length === 0 ? (
                <div className="p-3 text-sm text-k-faint">No exercises found</div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addExercise(ex.id, ex.name)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-k-elevated border-b border-k-border/50 last:border-0 transition-colors"
                  >
                    <span className="font-medium text-k-fg">{ex.name}</span>
                    <span className="text-k-faint ml-2 text-xs">
                      {ex.muscle_group} &middot; {ex.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={exercises.length === 0 || createWorkout.isPending}
          >
            {createWorkout.isPending ? 'Saving…' : 'Save Workout'}
          </Button>
          <Button type="button" variant="outline" size="md" onClick={() => navigate(paths.home)}>
            Cancel
          </Button>
        </div>

        {createWorkout.isError && (
          <p className="text-k-error text-sm">Failed to save workout. Check your inputs and try again.</p>
        )}
      </form>
    </div>
  );
}
