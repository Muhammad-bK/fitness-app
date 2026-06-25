import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { BackLink } from '../components/ui/back-link';
import { StatCard } from '../components/ui/stat-card';
import { PeriodSelector } from '../components/ui/period-selector';
import { Card, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';
import { CHART_COLORS, chartAxisProps, chartGridProps } from '../lib/chartTheme';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
  { value: 'all', label: 'All' },
];

const tooltipStyle = {
  contentStyle: { background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 },
  labelStyle: { color: '#a1a1aa' },
};

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

  if (isLoading) return <LoadingState message="Loading exercise data…" />;
  if (error) return <p className="text-k-error">Failed to load exercise data.</p>;
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
    <div className="space-y-8">
      <div>
        <BackLink to={prevRoute}>{prevLabel}</BackLink>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-k-fg">{data.exercise.name}</h1>
          <PeriodSelector period={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Best Weight"
          value={pr.best_weight.date ? formatWeight(Number(pr.best_weight.value_kg), unit) : '—'}
          sub={pr.best_weight.date}
        />
        <StatCard
          label="Best Session Volume"
          value={pr.best_single_session_volume.date ? formatWeight(Number(pr.best_single_session_volume.value_kg), unit) : '—'}
          sub={pr.best_single_session_volume.date}
        />
        <StatCard
          label="Best Est. 1RM"
          value={pr.best_estimated_1rm.date ? formatWeight(Number(pr.best_estimated_1rm.value_kg), unit) : '—'}
          sub={pr.best_estimated_1rm.date}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weightData.length > 0 && (
          <ChartSection title="Max Weight per Session">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {oneRmData.length > 0 && (
          <ChartSection title="Estimated 1RM (Epley)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={oneRmData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="1rm" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.secondary }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {volumeData.length > 0 && (
          <ChartSection title="Session Volume">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={volumeData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="volume" stroke={CHART_COLORS.tertiary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.tertiary }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {repData.length > 0 && (
          <ChartSection title="Reps at Top Weight">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={repData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis allowDecimals={false} {...chartAxisProps} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="reps" stroke={CHART_COLORS.quaternary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.quaternary }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}
      </div>

      {weightData.length === 0 && (
        <p className="text-k-muted text-center py-8">No data for this exercise in the selected period.</p>
      )}
    </div>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardTitle className="text-sm font-medium text-k-muted mb-4">{title}</CardTitle>
      {children}
    </Card>
  );
}
