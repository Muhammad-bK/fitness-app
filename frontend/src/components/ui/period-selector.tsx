import { cn } from '../../lib/utils';

interface PeriodSelectorProps<T extends string> {
  period: T;
  onChange: (period: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function PeriodSelector<T extends string>({
  period,
  onChange,
  options,
  className,
}: PeriodSelectorProps<T>) {
  return (
    <div className={cn('inline-flex gap-1 bg-k-bg border border-k-border rounded-lg p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            period === o.value
              ? 'bg-k-elevated text-k-fg'
              : 'text-k-muted hover:text-k-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
