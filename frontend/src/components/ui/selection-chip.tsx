import { cn } from '../../lib/utils';

interface SelectionChipOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectionChipGroupProps {
  options: SelectionChipOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SelectionChipGroup({
  options,
  value,
  onChange,
  columns = 2,
  className,
}: SelectionChipGroupProps) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-3', gridClass, className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'p-4 rounded-xl border text-left transition-all cursor-pointer',
              isSelected
                ? 'border-k-brand bg-k-brand-tint'
                : 'border-k-border bg-k-bg hover:border-k-border-hover'
            )}
          >
            {option.sublabel && (
              <span
                className={cn(
                  'block text-[11px] font-semibold uppercase tracking-wider mb-1',
                  isSelected ? 'text-k-brand' : 'text-k-muted'
                )}
              >
                {option.sublabel}
              </span>
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isSelected ? 'text-k-brand' : 'text-k-fg'
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
