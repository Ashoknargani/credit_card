import { CheckCircle2, XCircle, TrendingUp, ShieldCheck, AlertTriangle, ArrowRight, RotateCcw, History } from 'lucide-react';
import type { PredictionResult } from '@/types/applicant';

export function PredictionResultCard({
  result,
  onNew,
  onViewHistory,
}: {
  result: PredictionResult;
  onNew: () => void;
  onViewHistory: () => void;
}) {
  const approved = result.prediction === 'Approved';
  const probPct = (result.probability * 100).toFixed(1);

  const riskConfig = {
    Low: { color: 'text-success-600', bg: 'bg-success-50', border: 'border-success-200', label: 'Low Risk' },
    Medium: { color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200', label: 'Medium Risk' },
    High: { color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', label: 'High Risk' },
  }[result.risk];

  return (
    <div className="card overflow-hidden animate-scale-in">
      {/* Header band */}
      <div className={`relative px-6 py-6 ${approved ? 'bg-gradient-to-br from-success-500 to-success-700' : 'bg-gradient-to-br from-danger-500 to-danger-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            {approved ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            <div>
              <p className="text-xs font-medium text-white/70">Prediction Result</p>
              <p className="font-display text-2xl font-bold">{result.prediction.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-xs font-medium text-white/70">Confidence</p>
            <p className="font-display text-2xl font-bold">{probPct}%</p>
          </div>
        </div>
        {/* Probability bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${probPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5 p-6">
        {/* Risk + probability */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl border ${riskConfig.border} ${riskConfig.bg} p-3.5`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${riskConfig.color}`} />
              <span className="text-xs font-medium text-ink-500">Risk Level</span>
            </div>
            <p className={`mt-1 font-display text-lg font-bold ${riskConfig.color}`}>{riskConfig.label}</p>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-medium text-ink-500">Approval Probability</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold text-brand-700">{probPct}%</p>
          </div>
        </div>

        {/* Key factors */}
        <div>
          <h4 className="mb-3 font-display text-sm font-semibold text-ink-900">
            {approved ? 'Key Positive Factors' : 'Potential Risk Factors'}
          </h4>
          <div className="space-y-2">
            {result.factors.map((factor, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
                  factor.impact === 'positive'
                    ? 'border-success-100 bg-success-50/50'
                    : factor.impact === 'negative'
                    ? 'border-danger-100 bg-danger-50/50'
                    : 'border-ink-100 bg-ink-50'
                }`}
              >
                {factor.impact === 'positive' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
                ) : factor.impact === 'negative' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
                ) : (
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-ink-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-ink-800">{factor.label}</p>
                  <p className="text-xs text-ink-500">{factor.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applicant summary */}
        <div>
          <h4 className="mb-3 font-display text-sm font-semibold text-ink-900">Applicant Summary</h4>
          <div className="grid grid-cols-2 gap-2">
            {result.applicantSummary.map((item, i) => (
              <div key={i} className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-xs text-ink-400">{item.label}</p>
                <p className="text-sm font-medium text-ink-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-ink-100 bg-ink-50 px-3.5 py-2.5">
          <p className="text-xs text-ink-500">
            This is an AI-based prediction for educational purposes only and does not represent an official banking or credit decision.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={onNew} className="btn-secondary flex-1">
            <RotateCcw className="h-4 w-4" /> New Application
          </button>
          <button onClick={onViewHistory} className="btn-primary flex-1">
            <History className="h-4 w-4" /> View History <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
