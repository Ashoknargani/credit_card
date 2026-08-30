export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Spinner className="h-8 w-8 text-brand-500" />
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}
