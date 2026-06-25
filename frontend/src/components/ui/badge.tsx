import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-k-elevated text-k-muted',
        brand: 'bg-k-brand-tint text-k-brand',
        warmup: 'bg-yellow-500/15 text-yellow-400',
        working: 'bg-k-brand-tint text-k-brand',
        dropset: 'bg-purple-500/15 text-purple-400',
        failure: 'bg-red-500/15 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function setTypeBadgeVariant(
  setType: string,
): VariantProps<typeof badgeVariants>['variant'] {
  switch (setType) {
    case 'warmup':
      return 'warmup';
    case 'working':
      return 'working';
    case 'dropset':
      return 'dropset';
    case 'failure':
      return 'failure';
    default:
      return 'default';
  }
}
