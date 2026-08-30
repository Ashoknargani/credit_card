import { CreditCard } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
        <CreditCard className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-ink-900">CrediScan</span>
        <span className="ml-1 text-xs font-medium text-ink-400">AI</span>
      </div>
    </div>
  );
}
