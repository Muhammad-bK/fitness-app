import { cn } from '../../lib/utils';

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'flex p-1 gap-1 bg-k-bg border border-k-border rounded-[9px]',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 text-center py-[9px] text-sm font-medium rounded-[6px] transition-all cursor-pointer',
              isActive
                ? 'bg-k-elevated text-k-fg shadow-sm'
                : 'text-k-muted hover:text-k-fg'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
