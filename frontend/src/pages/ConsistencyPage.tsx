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
import { PageHeader } from '../components/ui/page-header';
import { StatCard } from '../components/ui/stat-card';
import { PeriodSelector } from '../components/ui/period-selector';
import { Card, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';
import { CHART_COLORS, chartAxisProps, chartGridProps } from '../lib/chartTheme';

type Period = 'month' | 'year' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
  { value: 'all', label: 'All' },
];

const tooltipStyle = {
  contentStyle: { background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 },
  labelStyle: { color: '#a1a1aa' },
};

export function ConsistencyPage() {
  const [period, setPeriod] = useState<Period>('year');
  const { data, isLoading, error } = useConsistency(period);

  if (isLoading) return <LoadingState message="Loading consistency data…" />;
  if (error) return <p className="text-k-error">Failed to load consistency data.</p>;
  if (!data) return null;

  const weeklyData = data.weekly_breakdown.map((w) => ({
    week: w.week.slice(5, 10),
    workouts: w.count,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Consistency"
        action={<PeriodSelector period={period} onChange={setPeriod} options={PERIOD_OPTIONS} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {weeklyData.length > 0 && (
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Workouts per Week</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="week" {...chartAxisProps} />
              <YAxis allowDecimals={false} {...chartAxisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="workouts" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {weeklyData.length === 0 && (
        <p className="text-k-muted text-center py-8">No workout data for this period.</p>
      )}
    </div>
  );
}
