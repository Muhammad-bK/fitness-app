export const CHART_COLORS = {
  primary: '#c8f542',
  secondary: '#a78bfa',
  tertiary: '#34d399',
  quaternary: '#fbbf24',
  bar: '#c8f542',
} as const;

export const chartGridProps = {
  strokeDasharray: '3 3',
  stroke: 'rgba(128,128,128,0.15)',
} as const;

export const chartAxisProps = {
  tick: { fontSize: 11, fill: 'var(--color-k-muted)' },
  stroke: 'rgba(128,128,128,0.15)',
} as const;

export function getChartTooltipProps() {
  return {
    contentStyle: {
      background: 'var(--color-k-surface)',
      border: '1px solid var(--color-k-border)',
      borderRadius: 8,
      color: 'var(--color-k-fg)',
    },
    labelStyle: { color: 'var(--color-k-muted)' },
  };
}
