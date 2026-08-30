import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, FileText, CheckCircle2, XCircle, AlertTriangle, Percent, ArrowRight } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { fetchStats, fetchHistory } from '@/lib/predictionService';
import type { PredictionRow } from '@/lib/supabase';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { SkeletonBlock } from '@/components/Loading';

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  highRisk: number;
  avgProbability: number;
}

export function DashboardPage() {
  const { navigate } = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, h] = await Promise.all([fetchStats(), fetchHistory(50)]);
      setStats(s);
      setHistory(h);
      setLoading(false);
    }
    load();
  }, []);

  const approvalRate = stats && stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  // Time series: last 7 days
  const timeSeries = buildTimeSeries(history);
  const riskDistribution = [
    { label: 'Low', value: history.filter((h) => h.risk === 'Low').length, color: '#10b981' },
    { label: 'Medium', value: history.filter((h) => h.risk === 'Medium').length, color: '#f59e0b' },
    { label: 'High', value: history.filter((h) => h.risk === 'High').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={stats?.total ?? 0}
          icon={FileText}
          color="brand"
          loading={loading}
        />
        <StatCard
          label="Approved"
          value={stats?.approved ?? 0}
          icon={CheckCircle2}
          color="success"
          loading={loading}
        />
        <StatCard
          label="Rejected"
          value={stats?.rejected ?? 0}
          icon={XCircle}
          color="danger"
          loading={loading}
        />
        <StatCard
          label="Approval Rate"
          value={`${approvalRate.toFixed(1)}%`}
          icon={Percent}
          color="brand"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approval donut */}
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink-900">Approval Distribution</h3>
          <p className="mt-0.5 text-sm text-ink-500">Approved vs Rejected</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <SkeletonBlock className="h-40 w-40 rounded-full" />
            </div>
          ) : (
            <div className="mt-6">
              <DonutChart
                segments={[
                  { label: 'Approved', value: stats?.approved ?? 0, color: '#10b981' },
                  { label: 'Rejected', value: stats?.rejected ?? 0, color: '#ef4444' },
                ]}
                centerValue={`${(stats?.total ?? 0)}`}
                centerLabel="Total"
              />
            </div>
          )}
        </div>

        {/* Risk distribution */}
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink-900">Risk Distribution</h3>
          <p className="mt-0.5 text-sm text-ink-500">By predicted risk level</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <SkeletonBlock className="h-40 w-40 rounded-full" />
            </div>
          ) : (
            <div className="mt-6">
              <DonutChart
                segments={riskDistribution}
                centerValue={`${history.filter((h) => h.risk === 'High').length}`}
                centerLabel="High Risk"
              />
            </div>
          )}
        </div>

        {/* Average probability */}
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink-900">Avg. Approval Probability</h3>
          <p className="mt-0.5 text-sm text-ink-500">Across all applications</p>
          {loading ? (
            <SkeletonBlock className="mt-6 h-20 w-full" />
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 py-4">
              <div className="font-display text-4xl font-bold text-brand-600">
                {((stats?.avgProbability ?? 0) * 100).toFixed(1)}%
              </div>
              <div className="flex items-center gap-1.5 text-sm text-ink-500">
                {(stats?.avgProbability ?? 0) >= 0.5 ? (
                  <TrendingUp className="h-4 w-4 text-success-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-500" />
                )}
                <span>{(stats?.avgProbability ?? 0) >= 0.5 ? 'Leaning approved' : 'Leaning rejected'}</span>
              </div>
              <div className="mt-3 w-full">
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
                    style={{ width: `${(stats?.avgProbability ?? 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time series + bar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink-900">Predictions Over Time</h3>
          <p className="mt-0.5 text-sm text-ink-500">Last 7 days</p>
          {loading ? (
            <SkeletonBlock className="mt-6 h-48 w-full" />
          ) : history.length === 0 ? (
            <EmptyState message="No predictions yet" />
          ) : (
            <div className="mt-6">
              <LineChart
                labels={timeSeries.labels}
                data={[
                  { label: 'Approved', values: timeSeries.approved },
                  { label: 'Rejected', values: timeSeries.rejected },
                ]}
              />
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink-900">Application Volume by Day</h3>
          <p className="mt-0.5 text-sm text-ink-500">Total predictions per day</p>
          {loading ? (
            <SkeletonBlock className="mt-6 h-48 w-full" />
          ) : history.length === 0 ? (
            <EmptyState message="No data available" />
          ) : (
            <div className="mt-6">
              <BarChart
                data={timeSeries.labels.map((label, i) => ({
                  label,
                  value: timeSeries.approved[i] + timeSeries.rejected[i],
                  color: '#1d82f5',
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* High risk alert + recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-danger-50">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">High-Risk Applications</h3>
              <p className="text-sm text-ink-500">Flagged for review</p>
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <SkeletonBlock className="h-12 w-full" />
            ) : (
              <div className="font-display text-3xl font-bold text-danger-600">{stats?.highRisk ?? 0}</div>
            )}
            <p className="mt-1 text-sm text-ink-500">
              {stats && stats.total > 0 ? `${((stats.highRisk / stats.total) * 100).toFixed(1)}% of total` : 'No applications yet'}
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">Recent Predictions</h3>
            <button onClick={() => navigate('history')} className="btn-ghost text-brand-600 hover:bg-brand-50">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState message="No predictions yet. Submit an application to see results here." />
          ) : (
            <div className="mt-4 space-y-2">
              {history.slice(0, 5).map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 transition-colors hover:bg-ink-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                        row.prediction === 'Approved' ? 'bg-success-50' : 'bg-danger-50'
                      }`}
                    >
                      {row.prediction === 'Approved' ? (
                        <CheckCircle2 className="h-5 w-5 text-success-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-danger-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{row.prediction}</p>
                      <p className="text-xs text-ink-400">{formatDate(row.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-ink-700">{(row.probability * 100).toFixed(1)}%</span>
                    <RiskBadge risk={row.risk} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: typeof FileText;
  color: 'brand' | 'success' | 'danger';
  loading: boolean;
}) {
  const colorMap = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
    success: { bg: 'bg-success-50', text: 'text-success-600' },
    danger: { bg: 'bg-danger-50', text: 'text-danger-600' },
  };
  const c = colorMap[color];

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
      </div>
      {loading ? (
        <SkeletonBlock className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-3 font-display text-2xl font-bold text-ink-900">{value}</p>
      )}
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map = {
    Low: 'bg-success-50 text-success-700',
    Medium: 'bg-warning-50 text-warning-700',
    High: 'bg-danger-50 text-danger-700',
  };
  return <span className={`badge ${map[risk as keyof typeof map] ?? 'bg-ink-50 text-ink-600'}`}>{risk}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <FileText className="h-10 w-10 text-ink-200" />
      <p className="mt-3 text-sm text-ink-400">{message}</p>
    </div>
  );
}

function buildTimeSeries(history: PredictionRow[]) {
  const days: { date: Date; label: string; approved: number; rejected: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), approved: 0, rejected: 0 });
  }
  for (const row of history) {
    const rowDate = new Date(row.created_at);
    rowDate.setHours(0, 0, 0, 0);
    const day = days.find((d) => d.date.getTime() === rowDate.getTime());
    if (day) {
      if (row.prediction === 'Approved') day.approved++;
      else day.rejected++;
    }
  }
  return {
    labels: days.map((d) => d.label),
    approved: days.map((d) => d.approved),
    rejected: days.map((d) => d.rejected),
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
