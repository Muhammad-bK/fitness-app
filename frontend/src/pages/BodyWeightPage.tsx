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
import { PageHeader } from '../components/ui/page-header';
import { StatCard } from '../components/ui/stat-card';
import { PeriodSelector } from '../components/ui/period-selector';
import { Card, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';
import { CHART_COLORS, chartAxisProps, chartGridProps } from '../lib/chartTheme';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
  { value: 'all', label: 'All' },
];

const tooltipStyle = {
  contentStyle: { background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 },
  labelStyle: { color: '#a1a1aa' },
};

export function BodyWeightPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading, error } = useBodyWeight(period);
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <LoadingState message="Loading body weight data…" />;
  if (error) return <p className="text-k-error">Failed to load body weight data.</p>;
  if (!data) return null;

  const dailyData = data.daily.map((p) => ({
    date: p.date.slice(5),
    daily: displayWeight(Number(p.weight_kg), unit),
  }));

  const smoothedData = data.smoothed_weekly.map((w) => ({
    date: w.week.slice(5, 10),
    smoothed: displayWeight(Number(w.avg_weight_kg), unit),
  }));

  const netChange = data.net_change_kg ? Number(data.net_change_kg) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Body Weight"
        action={<PeriodSelector period={period} onChange={setPeriod} options={PERIOD_OPTIONS} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Current"
          value={data.current_weight_kg ? formatWeight(Number(data.current_weight_kg), unit) : '—'}
        />
        <StatCard
          label="Net Change"
          value={
            data.net_change_kg
              ? `${Number(data.net_change_kg) >= 0 ? '+' : ''}${formatWeight(Number(data.net_change_kg), unit)}`
              : '—'
          }
          valueClassName={
            netChange !== null
              ? netChange < 0
                ? 'text-green-400'
                : netChange > 0
                ? 'text-red-400'
                : undefined
              : undefined
          }
        />
      </div>

      {dailyData.length > 0 && (
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Daily Readings</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" {...chartAxisProps} />
              <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="daily" stroke={CHART_COLORS.primary} dot={{ r: 3, fill: CHART_COLORS.primary }} strokeWidth={2} name="Daily" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {smoothedData.length > 1 && (
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Weekly Average</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={smoothedData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" {...chartAxisProps} />
              <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="smoothed" stroke={CHART_COLORS.secondary} dot={{ r: 3, fill: CHART_COLORS.secondary }} strokeWidth={2} name="Weekly Avg" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {dailyData.length === 0 && (
        <p className="text-k-muted text-center py-8">No body weight data for this period.</p>
      )}
    </div>
  );
}
