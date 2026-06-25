import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full appearance-none rounded-md bg-k-bg border border-k-border px-3 py-3 text-sm text-k-fg',
        'focus:outline-none focus:border-k-brand focus:ring-1 focus:ring-k-brand-tint-line transition-colors',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23888\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

NativeSelect.displayName = 'NativeSelect';
