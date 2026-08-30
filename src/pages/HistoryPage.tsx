import { useEffect, useState, useMemo } from 'react';
import { Search, CheckCircle2, XCircle, X, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { fetchHistory } from '@/lib/predictionService';
import type { PredictionRow } from '@/lib/supabase';
import { SkeletonBlock } from '@/components/Loading';
import { showToast } from '@/components/Toast';

type SortField = 'created_at' | 'probability' | 'prediction';
type SortDir = 'asc' | 'desc';
type FilterPrediction = 'all' | 'Approved' | 'Rejected';
type FilterRisk = 'all' | 'Low' | 'Medium' | 'High';

const PAGE_SIZE = 10;

export function HistoryPage() {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterPrediction, setFilterPrediction] = useState<FilterPrediction>('all');
  const [filterRisk, setFilterRisk] = useState<FilterRisk>('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<PredictionRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchHistory(500);
      setRows(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...rows];

    if (filterPrediction !== 'all') {
      result = result.filter((r) => r.prediction === filterPrediction);
    }
    if (filterRisk !== 'all') {
      result = result.filter((r) => r.risk === filterRisk);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const data = r.applicant_data;
        return (
          r.id.toLowerCase().includes(q) ||
          r.prediction.toLowerCase().includes(q) ||
          r.risk.toLowerCase().includes(q) ||
          String(data?.annualIncome ?? '').includes(q) ||
          String(data?.age ?? '').includes(q) ||
          String(data?.employmentStatus ?? '').toLowerCase().includes(q)
        );
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'probability') cmp = a.probability - b.probability;
      else cmp = a.prediction.localeCompare(b.prediction);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [rows, filterPrediction, filterRisk, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      showToast('warning', 'No data to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Prediction', 'Probability', 'Risk'];
    const lines = filtered.map((r) =>
      [r.id, r.created_at, r.prediction, r.probability.toFixed(4), r.risk]
        .map((v) => `"${v}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediction-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'History exported as CSV.');
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by ID, age, income..."
              className="input pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Prediction"
              value={filterPrediction}
              onChange={(v) => { setFilterPrediction(v as FilterPrediction); setPage(0); }}
              options={['all', 'Approved', 'Rejected']}
            />
            <FilterDropdown
              label="Risk"
              value={filterRisk}
              onChange={(v) => { setFilterRisk(v as FilterRisk); setPage(0); }}
              options={['all', 'Low', 'Medium', 'High']}
            />
            <button onClick={exportCsv} className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-ink-200" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink-700">No predictions found</h3>
            <p className="mt-1 text-sm text-ink-400">
              {rows.length === 0 ? 'Submit an application to start building history.' : 'Try adjusting your filters or search.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Applicant ID</th>
                    <SortHeader label="Date" field="created_at" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="Prediction" field="prediction" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="Probability" field="probability" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-5 py-3 font-medium">Risk</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50">
                      <td className="px-5 py-3.5 font-mono text-xs text-ink-500">{row.id.slice(0, 8)}...</td>
                      <td className="px-5 py-3.5 text-ink-600">{formatDate(row.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.prediction === 'Approved' ? (
                            <CheckCircle2 className="h-4 w-4 text-success-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-danger-600" />
                          )}
                          <span className="font-medium text-ink-800">{row.prediction}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ink-700">{(row.probability * 100).toFixed(1)}%</td>
                      <td className="px-5 py-3.5">
                        <RiskBadge risk={row.risk} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setSelected(row)} className="btn-ghost text-brand-600 hover:bg-brand-50">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3">
                <p className="text-xs text-ink-400">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-ghost disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-sm font-medium text-ink-600">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-ghost disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th className="px-5 py-3 font-medium">
      <button onClick={() => onSort(field)} className={`flex items-center gap-1 hover:text-ink-700 ${active ? 'text-ink-700' : ''}`}>
        {label}
        {active && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-400">{label}:</span>
      <select
        className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 focus:border-brand-400 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'all' ? 'All' : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    Low: 'bg-success-50 text-success-700',
    Medium: 'bg-warning-50 text-warning-700',
    High: 'bg-danger-50 text-danger-700',
  };
  return <span className={`badge ${map[risk] ?? 'bg-ink-50 text-ink-600'}`}>{risk}</span>;
}

function DetailModal({ row, onClose }: { row: PredictionRow; onClose: () => void }) {
  const data = row.applicant_data;
  const factors = (row.factors ?? []) as { label: string; impact: string; detail: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto scrollbar-thin rounded-2xl bg-white shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            {row.prediction === 'Approved' ? (
              <CheckCircle2 className="h-6 w-6 text-success-600" />
            ) : (
              <XCircle className="h-6 w-6 text-danger-600" />
            )}
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">{row.prediction}</h3>
              <p className="text-xs text-ink-400">{formatDate(row.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-xs text-ink-400">Probability</p>
              <p className="font-display text-lg font-bold text-brand-700">{(row.probability * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-xs text-ink-400">Risk</p>
              <p className="font-display text-lg font-bold text-ink-800">{row.risk}</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-xs text-ink-400">ID</p>
              <p className="font-mono text-xs font-bold text-ink-800">{row.id.slice(0, 8)}</p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-display text-sm font-semibold text-ink-900">Applicant Information</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data).filter(([k]) => !['ownsCar', 'ownsRealty'].includes(k)).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-ink-50 px-3 py-2">
                  <p className="text-xs capitalize text-ink-400">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm font-medium text-ink-800">{formatValue(key, value)}</p>
                </div>
              ))}
              <div className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-xs text-ink-400">Owns Car</p>
                <p className="text-sm font-medium text-ink-800">{data.ownsCar ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-xs text-ink-400">Owns Real Estate</p>
                <p className="text-sm font-medium text-ink-800">{data.ownsRealty ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {factors.length > 0 && (
            <div>
              <h4 className="mb-2 font-display text-sm font-semibold text-ink-900">Key Factors</h4>
              <div className="space-y-1.5">
                {factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={f.impact === 'positive' ? 'text-success-600' : f.impact === 'negative' ? 'text-danger-600' : 'text-ink-400'}>
                      {f.impact === 'positive' ? '✓' : f.impact === 'negative' ? '⚠' : '•'}
                    </span>
                    <div>
                      <span className="font-medium text-ink-800">{f.label}</span>
                      <span className="text-ink-500"> — {f.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    if (key === 'annualIncome' || key === 'existingDebt') return `$${value.toLocaleString()}`;
    return String(value);
  }
  return String(value);
}
