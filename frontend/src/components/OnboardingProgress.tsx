import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingProgressProps {
  step: number;
  totalSteps?: number;
  variant?: 'horizontal' | 'vertical';
}

const labels = ['Body Stats', 'Goals', 'Workout', 'Plan'];
const descriptions = [
  'Baseline measurements',
  'Goals & targets',
  'Schedule & gym setup',
  'Program approach',
];

export function OnboardingProgress({
  step,
  totalSteps = 4,
  variant = 'horizontal',
}: OnboardingProgressProps) {
  if (variant === 'vertical') {
    return (
      <div className="space-y-1">
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < step;
          const isCurrent = stepNum === step;

          return (
            <div
              key={label}
              className={cn(
                'flex items-start gap-3 rounded-xl px-4 py-3 transition-colors',
                isCurrent && 'bg-k-brand-tint',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isComplete
                    ? 'bg-k-brand text-k-brand-fg'
                    : isCurrent
                    ? 'bg-k-brand text-k-brand-fg'
                    : 'bg-k-elevated text-k-faint',
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <div className="pt-0.5">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-k-fg' : isComplete ? 'text-k-brand' : 'text-k-faint',
                  )}
                >
                  {label}
                </p>
                <p className="text-xs text-k-faint mt-0.5">{descriptions[i]}</p>
              </div>
            </div>
          );
        })}

        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-k-muted">
              Progress
            </span>
            <span className="text-[11px] font-semibold text-k-brand tabular-nums">
              {step * 25}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-k-border overflow-hidden">
            <div
              className="h-full rounded-full bg-k-brand transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 lg:hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-k-muted">
          Step {step} of {totalSteps}
        </span>
        <span className="text-[11px] font-semibold tracking-wider text-k-brand tabular-nums">
          {step * 25}%
        </span>
      </div>

      <div className="flex gap-[5px]">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1 rounded-full transition-all duration-300',
              i + 1 <= step ? 'bg-k-brand' : 'bg-k-border',
            )}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-[10px] font-medium uppercase tracking-wide transition-colors',
              i + 1 < step ? 'text-k-brand' : i + 1 === step ? 'text-k-fg' : 'text-k-faint',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
