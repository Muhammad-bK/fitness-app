import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBodyWeight } from '../hooks/useAnalytics';
import { useAuthContext } from '../context/AuthContext';
import { displayWeight, formatWeight } from '../lib/units';

type Period = 'week' | 'month' | 'year' | 'all';

export function BodyWeightPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading, error } = useBodyWeight(period);
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <div className="text-gray-500">Loading body weight data...</div>;
  if (error) return <div className="text-red-600">Failed to load body weight data.</div>;
  if (!data) return null;

  const dailyData = data.daily.map((p) => ({
    date: p.date.slice(5),
    daily: displayWeight(Number(p.weight_kg), unit),
  }));

  const smoothedData = data.smoothed_weekly.map((w) => ({
    date: w.week.slice(5, 10),
    smoothed: displayWeight(Number(w.avg_weight_kg), unit),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Body Weight</h1>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Current</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.current_weight_kg ? formatWeight(Number(data.current_weight_kg), unit) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Net Change</p>
          <p className={`text-2xl font-bold mt-1 ${
            data.net_change_kg && Number(data.net_change_kg) < 0 ? 'text-green-600'
              : data.net_change_kg && Number(data.net_change_kg) > 0 ? 'text-red-600'
              : 'text-gray-900'
          }`}>
            {data.net_change_kg
              ? `${Number(data.net_change_kg) >= 0 ? '+' : ''}${formatWeight(Number(data.net_change_kg), unit)}`
              : '—'}
          </p>
        </div>
      </div>

      {dailyData.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Daily Readings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="daily" stroke="#2563eb" dot={{ r: 3 }} strokeWidth={2} name="Daily" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {smoothedData.length > 1 && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Weekly Average</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={smoothedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="smoothed" stroke="#8b5cf6" dot={{ r: 3 }} strokeWidth={2} name="Weekly Avg" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {dailyData.length === 0 && (
        <p className="text-gray-500 text-center py-8">No body weight data for this period.</p>
      )}
    </div>
  );
}

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string }[] = [
    { value: 'week', label: '7d' },
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
