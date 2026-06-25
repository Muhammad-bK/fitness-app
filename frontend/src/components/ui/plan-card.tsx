import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlanCardProps {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  badge?: string;
  title: string;
  description: string;
  features: string[];
  className?: string;
}

export function PlanCard({
  value,
  selected,
  onSelect,
  badge,
  title,
  description,
  features,
  className,
}: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'w-full text-left p-6 rounded-xl border-2 transition-all cursor-pointer',
        selected
          ? 'border-k-brand bg-k-brand-tint'
          : 'border-k-border bg-k-surface hover:border-k-border-hover',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {badge && (
          <span
            className={cn(
              'text-[10px] uppercase tracking-[0.12em] font-semibold',
              selected ? 'text-k-brand' : 'text-k-muted'
            )}
          >
            {badge}
          </span>
        )}
        <span
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-auto',
            selected ? 'bg-k-brand border-k-brand' : 'border-k-border-hover bg-transparent'
          )}
        >
          {selected && <Check className="w-3 h-3 text-k-brand-fg" strokeWidth={3} />}
        </span>
      </div>

      <h3
        className={cn(
          'text-lg font-semibold',
          selected ? 'text-k-brand' : 'text-k-fg'
        )}
      >
        {title}
      </h3>
      <p className="text-sm text-k-muted mt-2 leading-relaxed">{description}</p>

      <ul className="mt-5 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-xs text-k-muted">
            <span className="w-1 h-1 rounded-full bg-k-brand flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}
