import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useConsistency } from '../hooks/useAnalytics';

type Period = 'month' | 'year' | 'all';

export function ConsistencyPage() {
  const [period, setPeriod] = useState<Period>('year');
  const { data, isLoading, error } = useConsistency(period);

  if (isLoading) return <div className="text-gray-500">Loading consistency data...</div>;
  if (error) return <div className="text-red-600">Failed to load consistency data.</div>;
  if (!data) return null;

  const weeklyData = data.weekly_breakdown.map((w) => ({
    week: w.week.slice(5, 10),
    workouts: w.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Consistency</h1>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="This Week" value={String(data.workouts_this_week)} />
        <StatCard label="This Month" value={String(data.workouts_this_month)} />
        <StatCard
          label="Current Streak"
          value={`${data.current_streak_weeks}`}
          sub={data.current_streak_weeks === 1 ? 'week' : 'weeks'}
        />
        <StatCard
          label="Avg / Week"
          value={String(data.avg_workouts_per_week)}
          sub={`over ${data.total_workouts} total`}
        />
      </div>

      {/* Weekly breakdown chart */}
      {weeklyData.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Workouts per Week</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {weeklyData.length === 0 && (
        <p className="text-gray-500 text-center py-8">No workout data for this period.</p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
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
