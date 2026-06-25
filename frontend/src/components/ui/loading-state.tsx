interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 py-12 justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-k-brand border-t-transparent animate-spin" />
      <p className="text-sm text-k-muted">{message}</p>
    </div>
  );
}
