import { BrainCircuit, Database, GitBranch, Award, BarChart3, Info } from 'lucide-react';
import { MODEL_METADATA } from '@/lib/model';

export function ModelInfoPage() {
  const m = MODEL_METADATA;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50">
            <BrainCircuit className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">{m.name}</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Version {m.version} · Trained {m.trainingDate}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{m.selectionRationale}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-ink-600" />
          <h3 className="font-display text-base font-semibold text-ink-900">Deployed Model Metrics</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Accuracy" value={m.metrics.accuracy} color="brand" />
          <MetricCard label="Precision" value={m.metrics.precision} color="success" />
          <MetricCard label="Recall" value={m.metrics.recall} color="brand" />
          <MetricCard label="F1-Score" value={m.metrics.f1} color="success" />
          <MetricCard label="ROC-AUC" value={m.metrics.rocAuc} color="brand" />
        </div>
      </div>

      {/* Model comparison */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-100 px-6 py-4">
          <Award className="h-5 w-5 text-ink-600" />
          <h3 className="font-display text-base font-semibold text-ink-900">Model Comparison</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-6 py-3 font-medium">Model</th>
                <th className="px-6 py-3 font-medium">Accuracy</th>
                <th className="px-6 py-3 font-medium">Precision</th>
                <th className="px-6 py-3 font-medium">Recall</th>
                <th className="px-6 py-3 font-medium">F1</th>
                <th className="px-6 py-3 font-medium">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {m.candidates.map((c) => {
                const selected = c.name === m.selectedModel;
                return (
                  <tr key={c.name} className={`border-b border-ink-50 ${selected ? 'bg-brand-50/50' : ''}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {selected && <Award className="h-4 w-4 text-brand-600" />}
                        <span className={`font-medium ${selected ? 'text-brand-700' : 'text-ink-800'}`}>{c.name}</span>
                        {selected && <span className="badge bg-brand-100 text-brand-700">Selected</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-ink-600">{c.accuracy.toFixed(3)}</td>
                    <td className="px-6 py-3.5 font-mono text-ink-600">{c.precision.toFixed(3)}</td>
                    <td className="px-6 py-3.5 font-mono text-ink-600">{c.recall.toFixed(3)}</td>
                    <td className="px-6 py-3.5 font-mono text-ink-600">{c.f1.toFixed(3)}</td>
                    <td className="px-6 py-3.5 font-mono text-ink-600">{c.rocAuc.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-ink-600" />
            <h3 className="font-display text-base font-semibold text-ink-900">Training Dataset</h3>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Dataset</dt>
              <dd className="font-medium text-ink-800">{m.dataset}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Training date</dt>
              <dd className="font-medium text-ink-800">{m.trainingDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Split ratio</dt>
              <dd className="font-medium text-ink-800">80% train / 20% test</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Target</dt>
              <dd className="font-medium text-ink-800">Approved / Rejected</dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-ink-600" />
            <h3 className="font-display text-base font-semibold text-ink-900">Features ({m.features.length})</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {m.features.map((f) => (
              <span key={f} className="badge bg-ink-100 text-ink-600">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card border-brand-100 bg-brand-50/40 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-900">Educational Use Only</h4>
            <p className="mt-1 text-sm text-ink-600">
              This system is a machine learning project for demonstration and educational purposes. Predictions are generated
              by a logistic regression model trained on synthetic data and do not constitute financial advice or an official
              credit decision from any bank or lending institution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: 'brand' | 'success' }) {
  const colorMap = {
    brand: 'text-brand-700 bg-brand-50',
    success: 'text-success-700 bg-success-50',
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value.toFixed(3)}</p>
    </div>
  );
}
