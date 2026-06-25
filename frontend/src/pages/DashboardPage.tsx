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
import { PageHeader } from '../components/ui/page-header';
import { StatCard } from '../components/ui/stat-card';
import { Card, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';
import { CHART_COLORS, chartAxisProps, chartGridProps } from '../lib/chartTheme';

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';

  if (isLoading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <p className="text-k-error">Failed to load dashboard.</p>;
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
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Your training overview at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Body Weight"
          value={data.current_weight_kg ? formatWeight(Number(data.current_weight_kg), unit) : '—'}
          sub={
            data.weight_change_30d_kg
              ? `${Number(data.weight_change_30d_kg) >= 0 ? '+' : ''}${formatWeight(Math.abs(Number(data.weight_change_30d_kg)), unit)} (30d)`
              : null
          }
        />
        <StatCard label="Workouts This Month" value={String(data.workouts_this_month)} />
        <StatCard
          label="Strongest Lift"
          value={data.strongest_lift ? data.strongest_lift.exercise_name : '—'}
          sub={data.strongest_lift ? `${formatWeight(Number(data.strongest_lift.estimated_1rm_kg), unit)} est. 1RM` : null}
        />
        <StatCard
          label="Latest PR"
          value={data.latest_pr ? data.latest_pr.exercise_name : '—'}
          sub={data.latest_pr ? `${formatWeight(Number(data.latest_pr.weight_kg), unit)} × ${data.latest_pr.reps} on ${data.latest_pr.date}` : null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weightTrend.length > 1 && (
          <Card>
            <CardTitle className="text-sm font-medium text-k-muted mb-4">Body Weight (30d)</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightTrend}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Line type="monotone" dataKey="weight" stroke={CHART_COLORS.primary} dot={{ r: 3, fill: CHART_COLORS.primary }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {frequency.length > 1 && (
          <Card>
            <CardTitle className="text-sm font-medium text-k-muted mb-4">Workout Frequency (12 wks)</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={frequency}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="week" {...chartAxisProps} />
                <YAxis allowDecimals={false} {...chartAxisProps} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {data.top_exercises.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <CardTitle className="text-sm font-medium text-k-muted">Top Exercises (30d)</CardTitle>
          </div>
          <div className="divide-y divide-k-border">
            {data.top_exercises.map((ex) => (
              <Link
                key={ex.exercise_id}
                to={paths.analytics.exercise(ex.exercise_id)}
                state={exerciseProgressNav.fromDashboard}
                className="flex items-center justify-between px-6 py-3 hover:bg-k-elevated/50 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-k-fg">{ex.exercise_name}</span>
                  <span className="text-xs text-k-muted ml-2">{ex.session_count_30d} sessions</span>
                </div>
                {ex.recent_max_weight_kg && (
                  <span className="text-sm text-k-muted">
                    {formatWeight(Number(ex.recent_max_weight_kg), unit)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
