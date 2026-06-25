import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function BackLink({ to, children, className }: BackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-k-muted hover:text-k-fg transition-colors mb-4',
        className,
      )}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {children}
    </Link>
  );
}
