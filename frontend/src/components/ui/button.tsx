import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-k-brand text-k-brand-fg rounded-full hover:bg-k-brand-strong active:bg-k-brand-strong',
        ghost:
          'bg-transparent text-k-muted hover:text-k-fg rounded-full',
        outline:
          'bg-transparent border border-k-border text-k-fg rounded-full hover:border-k-border-hover',
        destructive:
          'bg-red-500/15 text-red-400 rounded-full hover:bg-red-500/25',
      },
      size: {
        sm: 'text-sm px-4 py-2',
        md: 'text-sm px-6 py-[11px]',
        lg: 'text-base px-8 py-3',
        icon: 'w-10 h-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
