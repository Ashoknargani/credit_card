import { LayoutDashboard, FileCheck2, History, BrainCircuit, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { useRouter, type Page } from '@/lib/router';

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'apply', label: 'New Application', icon: FileCheck2 },
  { page: 'history', label: 'History', icon: History },
  { page: 'model', label: 'Model Info', icon: BrainCircuit },
];

export function Sidebar() {
  const { page, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (p: Page) => {
    navigate(p);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white shadow-card md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-ink-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-200/70 bg-white transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button onClick={() => setMobileOpen(false)} className="text-ink-400 hover:text-ink-600 md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-brand-600' : 'text-ink-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink-200/70 p-4">
          <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
            <p className="text-xs font-medium text-ink-300">Model Version</p>
            <p className="mt-0.5 font-display text-sm font-semibold">v1.0.0 — Logistic Reg.</p>
            <p className="mt-2 text-xs text-ink-400">ROC-AUC: 0.921 · F1: 0.899</p>
          </div>
        </div>
      </aside>
    </>
  );
}
