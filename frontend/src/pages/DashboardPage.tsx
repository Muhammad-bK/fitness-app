import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '../hooks/useAnalytics';
import { useAuthContext } from '../context/AuthContext';
import { displayWeight, formatWeight } from '../lib/units';
import { paths, exerciseProgressNav } from '../routes';

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-600">Failed to load dashboard.</div>;
  if (!data) return null;

  const weightTrend = data.weight_trend.map((p) => ({
    date: p.date.slice(5),
    weight: displayWeight(Number(p.weight_kg), unit),
  }));

  const frequency = data.workout_frequency.map((w) => ({
    week: w.week.slice(5, 10),
    count: w.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          label="Body Weight"
          value={data.current_weight_kg ? formatWeight(Number(data.current_weight_kg), unit) : '—'}
          sub={
            data.weight_change_30d_kg
              ? `${Number(data.weight_change_30d_kg) >= 0 ? '+' : ''}${formatWeight(Math.abs(Number(data.weight_change_30d_kg)), unit)} (30d)`
              : null
          }
        />
        <Card label="Workouts This Month" value={String(data.workouts_this_month)} />
        <Card
          label="Strongest Lift"
          value={data.strongest_lift ? data.strongest_lift.exercise_name : '—'}
          sub={data.strongest_lift ? `${formatWeight(Number(data.strongest_lift.estimated_1rm_kg), unit)} est. 1RM` : null}
        />
        <Card
          label="Latest PR"
          value={data.latest_pr ? data.latest_pr.exercise_name : '—'}
          sub={data.latest_pr ? `${formatWeight(Number(data.latest_pr.weight_kg), unit)} × ${data.latest_pr.reps} on ${data.latest_pr.date}` : null}
        />
      </div>

      {weightTrend.length > 1 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Body Weight (30d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {frequency.length > 1 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Workout Frequency (12 wks)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={frequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {data.top_exercises.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Exercises (30d)</h2>
          <div className="divide-y divide-gray-100">
            {data.top_exercises.map((ex) => (
              <Link
                key={ex.exercise_id}
                to={paths.analytics.exercise(ex.exercise_id)}
                state={exerciseProgressNav.fromDashboard}
                className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{ex.exercise_name}</span>
                  <span className="text-xs text-gray-500 ml-2">{ex.session_count_30d} sessions</span>
                </div>
                {ex.recent_max_weight_kg && (
                  <span className="text-sm text-gray-600">
                    {formatWeight(Number(ex.recent_max_weight_kg), unit)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
