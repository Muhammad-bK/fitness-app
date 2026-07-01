import { useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGoalEstimate } from '../hooks/useIntelligence';
import { useAuthContext } from '../context/AuthContext';
import { formatConfidence } from '../lib/fitnessCalculations';
import { formatWeight } from '../lib/units';
import { PageHeader } from '../components/ui/page-header';
import { StatCard } from '../components/ui/stat-card';
import { Card, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingState } from '../components/ui/loading-state';
import { CHART_COLORS, chartAxisProps, chartGridProps } from '../lib/chartTheme';

export function GoalPage() {
  const { user } = useAuthContext();
  const unit = user?.unit_preference ?? 'kg';
  const { refetch, isFetching, isError, data } = useGoalEstimate();
  const ran = useRef(false);

  useEffect(() => {
    if (!ran.current) {
      ran.current = true;
      refetch();
    }
  }, [refetch]);

  if (!data && !isError) return <LoadingState message="Calculating your goal plan…" />;
  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Goal Plan" description="Calorie targets and timeline projection" />
        <p className="text-k-error">Complete your profile in onboarding to generate a goal estimate.</p>
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.weekly_weight_projection.map((p) => ({
    week: `W${p.week}`,
    weight: unit === 'lbs' ? Math.round(p.projected_weight_kg * 2.20462 * 10) / 10 : p.projected_weight_kg,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Goal Plan"
        description="Science-based calorie targets and weight timeline"
        action={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Recalculate
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="BMR" value={`${Math.round(data.bmr)} kcal`} />
        <StatCard label="TDEE" value={`${Math.round(data.tdee)} kcal`} />
        <StatCard label="Daily Target" value={`${Math.round(data.calorie_target)} kcal`} sub={`${data.calorie_adjustment > 0 ? '+' : ''}${data.calorie_adjustment} adjustment`} />
        <StatCard label="Confidence" value={formatConfidence(data.confidence_score)} sub={`${data.confidence_score}% adherence model`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Macro Breakdown</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-k-elevated">
              <p className="text-2xl font-semibold text-k-fg">{data.macro_breakdown.protein_g}g</p>
              <p className="text-xs text-k-muted mt-1">Protein ({data.macro_breakdown.protein_pct}%)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-k-elevated">
              <p className="text-2xl font-semibold text-k-fg">{data.macro_breakdown.carbs_g}g</p>
              <p className="text-xs text-k-muted mt-1">Carbs ({data.macro_breakdown.carbs_pct}%)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-k-elevated">
              <p className="text-2xl font-semibold text-k-fg">{data.macro_breakdown.fat_g}g</p>
              <p className="text-xs text-k-muted mt-1">Fat ({data.macro_breakdown.fat_pct}%)</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Timeline</CardTitle>
          <dl className="space-y-3 text-sm">
            {data.estimated_completion_date && (
              <div className="flex justify-between">
                <dt className="text-k-muted">Estimated completion</dt>
                <dd className="font-medium text-k-fg">{data.estimated_completion_date}</dd>
              </div>
            )}
            {data.weeks_needed != null && (
              <div className="flex justify-between">
                <dt className="text-k-muted">Weeks needed</dt>
                <dd className="font-medium text-k-fg">{data.weeks_needed}</dd>
              </div>
            )}
            {data.weekly_loss_kg != null && (
              <div className="flex justify-between">
                <dt className="text-k-muted">Weekly loss rate</dt>
                <dd className="font-medium text-k-fg">{formatWeight(data.weekly_loss_kg, unit)}/wk</dd>
              </div>
            )}
            {data.weekly_gain_kg != null && (
              <div className="flex justify-between">
                <dt className="text-k-muted">Weekly gain rate</dt>
                <dd className="font-medium text-k-fg">{formatWeight(data.weekly_gain_kg, unit)}/wk</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {chartData.length > 1 && (
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Weekly Weight Projection</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="week" {...chartAxisProps} />
              <YAxis domain={['auto', 'auto']} {...chartAxisProps} />
              <Tooltip
                contentStyle={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Line type="monotone" dataKey="weight" stroke={CHART_COLORS.primary} dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
