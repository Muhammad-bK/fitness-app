import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string | null;
  valueClassName?: string;
  className?: string;
}

export function StatCard({ label, value, sub, valueClassName, className }: StatCardProps) {
  return (
    <div className={cn('bg-k-surface border border-k-border rounded-xl p-5', className)}>
      <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-k-muted">{label}</p>
      <p className={cn('text-2xl font-semibold tracking-tight text-k-fg mt-1.5', valueClassName)}>
        {value}
      </p>
      {sub && <p className="text-xs text-k-faint mt-1">{sub}</p>}
    </div>
  );
}
