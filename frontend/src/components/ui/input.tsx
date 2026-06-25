import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-md bg-k-bg border border-k-border px-3 py-3 text-sm text-k-fg placeholder:text-k-faint',
        'focus:outline-none focus:border-k-brand focus:ring-1 focus:ring-k-brand-tint-line transition-colors',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
