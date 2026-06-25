import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useExerciseAnalytics } from '../hooks/useAnalytics';
import { useAuthContext } from '../context/AuthContext';
import { displayWeight, formatWeight } from '../lib/units';
import { exerciseProgressNav, type ExerciseProgressLocationState } from '../routes';

type Period = 'week' | 'month' | 'year' | 'all';

export function ExerciseProgressPage() {
  const location = useLocation();
  const navState = location.state as ExerciseProgressLocationState | null;
  const prevRoute = navState?.prevRoute ?? exerciseProgressNav.fromExercises.prevRoute;
  const prevLabel = navState?.prevLabel ?? exerciseProgressNav.fromExercises.prevLabel;

  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [period, setPeriod] = useState<Period>('year');
  const { data, isLoading, error } = useExerciseAnalytics(exerciseId, period);
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <div className="text-gray-500">Loading exercise data...</div>;
  if (error) return <div className="text-red-600">Failed to load exercise data.</div>;
  if (!data) return null;

  const pr = data.personal_records;

  const weightData = data.weight_progression.map((p) => ({
    date: p.date.slice(5),
    weight: displayWeight(Number(p.max_weight_kg), unit),
  }));

  const volumeData = data.volume_progression.map((p) => ({
    date: p.date.slice(5),
    volume: displayWeight(Number(p.total_volume_kg), unit),
  }));

  const oneRmData = data.one_rm_progression.map((p) => ({
    date: p.date.slice(5),
    '1rm': displayWeight(Number(p.estimated_1rm_kg), unit),
  }));

  const repData = data.rep_progression.map((p) => ({
    date: p.date.slice(5),
    reps: p.reps_at_top_weight,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={prevRoute} className="text-sm text-blue-600 hover:underline">
            &larr; {prevLabel}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{data.exercise.name}</h1>
        </div>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <PrCard
          label="Best Weight"
          value={pr.best_weight.date ? formatWeight(Number(pr.best_weight.value_kg), unit) : '—'}
          date={pr.best_weight.date}
        />
        <PrCard
          label="Best Session Volume"
          value={pr.best_single_session_volume.date ? formatWeight(Number(pr.best_single_session_volume.value_kg), unit) : '—'}
          date={pr.best_single_session_volume.date}
        />
        <PrCard
          label="Best Est. 1RM"
          value={pr.best_estimated_1rm.date ? formatWeight(Number(pr.best_estimated_1rm.value_kg), unit) : '—'}
          date={pr.best_estimated_1rm.date}
        />
      </div>

      {weightData.length > 0 && (
        <ChartSection title="Max Weight per Session">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {oneRmData.length > 0 && (
        <ChartSection title="Estimated 1RM (Epley)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={oneRmData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="1rm" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {volumeData.length > 0 && (
        <ChartSection title="Session Volume">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {repData.length > 0 && (
        <ChartSection title="Reps at Top Weight">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={repData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="reps" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {weightData.length === 0 && (
        <p className="text-gray-500 text-center py-8">No data for this exercise in the selected period.</p>
      )}
    </div>
  );
}

function PrCard({ label, value, date }: { label: string; value: string; date: string | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {date && <p className="text-xs text-gray-500 mt-0.5">{date}</p>}
    </div>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string }[] = [
    { value: 'month', label: '30d' },
    { value: 'year', label: '1y' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            period === o.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
