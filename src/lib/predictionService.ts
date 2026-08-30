import { supabase } from './supabase';
import { predictApproval } from './model';
import type { ApplicantInput, PredictionResult } from '@/types/applicant';
import type { PredictionRow } from './supabase';

export async function runPrediction(input: ApplicantInput): Promise<PredictionResult> {
  return predictApproval(input);
}

export async function savePrediction(input: ApplicantInput, result: PredictionResult): Promise<string | null> {
  const { data, error } = await supabase
    .from('predictions')
    .insert({
      applicant_data: input as unknown as Record<string, unknown>,
      prediction: result.prediction,
      probability: result.probability,
      risk: result.risk,
      factors: result.factors as unknown as Record<string, string>[],
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save prediction:', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchHistory(limit = 100): Promise<PredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch history:', error.message);
    return [];
  }
  return (data ?? []) as PredictionRow[];
}

export async function fetchStats(): Promise<{
  total: number;
  approved: number;
  rejected: number;
  highRisk: number;
  avgProbability: number;
}> {
  const { data, error } = await supabase
    .from('predictions')
    .select('prediction, probability, risk');

  if (error) {
    console.error('Failed to fetch stats:', error.message);
    return { total: 0, approved: 0, rejected: 0, highRisk: 0, avgProbability: 0 };
  }

  const rows = (data ?? []) as { prediction: string; probability: number; risk: string }[];
  const total = rows.length;
  const approved = rows.filter((r) => r.prediction === 'Approved').length;
  const rejected = rows.filter((r) => r.prediction === 'Rejected').length;
  const highRisk = rows.filter((r) => r.risk === 'High').length;
  const avgProbability = total > 0 ? rows.reduce((sum, r) => sum + r.probability, 0) / total : 0;

  return { total, approved, rejected, highRisk, avgProbability };
}
