import { ShieldCheck } from 'lucide-react';
import { useRouter, type Page } from '@/lib/router';

const TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of application volume and approval trends' },
  apply: { title: 'New Application', subtitle: 'Enter applicant details to predict credit card approval' },
  history: { title: 'Prediction History', subtitle: 'Browse, search, and review past predictions' },
  model: { title: 'Model Information', subtitle: 'Technical details about the deployed ML model' },
};

export function Header() {
  const { page } = useRouter();
  const { title, subtitle } = TITLES[page];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <div className="pl-10 md:pl-0">
          <h1 className="font-display text-xl font-bold text-ink-900 md:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 sm:flex">
          <ShieldCheck className="h-4 w-4 text-success-600" />
          <span className="text-xs font-medium text-success-700">Model Active</span>
        </div>
      </div>
    </header>
  );
}
