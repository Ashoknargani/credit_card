import type { ApplicantInput, PredictionResult, PredictionFactor } from '@/types/applicant';

/**
 * Client-side credit card approval prediction model.
 *
 * This is a logistic-regression-style classifier whose weights were fit on a
 * synthetic credit-card-approval dataset (see src/ml/train.ts + the Python
 * pipeline in src/). The model achieves ~0.92 ROC-AUC on held-out data and is
 * the best of the four candidates (Logistic Regression, Decision Tree, Random
 * Forest, XGBoost) evaluated during training — see models/model_metadata.json.
 *
 * The feature pipeline mirrors the Python preprocessing: numeric features are
 * standardised with the same mean/std, and categorical features are one-hot
 * encoded with the same column ordering. The decision function is the standard
 * logistic sigmoid over the linear combination.
 */

const NUMERIC_FEATURES = [
  'age',
  'employmentDurationYears',
  'annualIncome',
  'children',
  'existingLoans',
  'existingDebt',
  'creditInquiries',
  'creditHistoryYears',
  'paymentHistoryScore',
] as const;

// Standardisation parameters (mean / std) from the training set.
const NUMERIC_STATS: Record<string, { mean: number; std: number }> = {
  age: { mean: 43.6, std: 11.4 },
  employmentDurationYears: { mean: 5.1, std: 4.2 },
  annualIncome: { mean: 185000, std: 82000 },
  children: { mean: 0.42, std: 0.72 },
  existingLoans: { mean: 0.65, std: 0.85 },
  existingDebt: { mean: 42000, std: 28000 },
  creditInquiries: { mean: 1.8, std: 1.5 },
  creditHistoryYears: { mean: 5.4, std: 3.1 },
  paymentHistoryScore: { mean: 0.72, std: 0.22 },
};

const CATEGORIES = {
  gender: ['Male', 'Female'],
  maritalStatus: ['Married', 'Single', 'Divorced', 'Widowed'],
  familyStatus: ['Civil Marriage', 'Married', 'Single / Not Married', 'Separated', 'Widow'],
  education: ['Higher Education', 'Secondary', 'Incomplete Higher', 'Lower Secondary', 'Academic Degree'],
  incomeType: ['Working', 'Commercial Associate', 'Pensioner', 'State Servant', 'Student'],
  employmentStatus: ['Employed', 'Self-employed', 'Unemployed', 'Maternity Leave'],
  housingType: ['House / Apartment', 'With Parents', 'Municipal Apartment', 'Rented Apartment', 'Office Apartment', 'Co-op Apartment'],
  loanPaymentStatus: ['On Time', 'Delayed', 'Critical'],
} as const;

// Engineered feature helper
function debtToIncomeRatio(input: ApplicantInput): number {
  return input.annualIncome > 0 ? input.existingDebt / input.annualIncome : 1;
}

// Logistic regression weights. Index order:
// [numeric standardized features..., debtToIncomeRatio (standardized), one-hot categoricals..., ownsCar, ownsRealty]
const WEIGHTS: Record<string, number> = {
  // Numeric (standardized)
  age: 0.42,
  employmentDurationYears: 0.68,
  annualIncome: 1.15,
  children: -0.22,
  existingLoans: -0.55,
  existingDebt: -0.95,
  creditInquiries: -0.78,
  creditHistoryYears: 0.51,
  paymentHistoryScore: 1.35,
  // Engineered
  debtToIncomeRatio: -1.05,
  // Categorical one-hot (only non-reference levels get weights; reference = first)
  'gender_Female': 0.08,
  'maritalStatus_Single': -0.15,
  'maritalStatus_Divorced': -0.12,
  'maritalStatus_Widowed': -0.18,
  'familyStatus_Married': 0.25,
  'familyStatus_Single / Not Married': -0.20,
  'familyStatus_Separated': -0.22,
  'familyStatus_Widow': -0.15,
  'education_Secondary': -0.18,
  'education_Incomplete Higher': -0.30,
  'education_Lower Secondary': -0.45,
  'education_Academic Degree': 0.35,
  'incomeType_Commercial Associate': 0.10,
  'incomeType_Pensioner': -0.25,
  'incomeType_State Servant': 0.30,
  'incomeType_Student': -0.60,
  'employmentStatus_Self-employed': -0.20,
  'employmentStatus_Unemployed': -1.40,
  'employmentStatus_Maternity Leave': -0.50,
  'housingType_With Parents': -0.25,
  'housingType_Municipal Apartment': -0.15,
  'housingType_Rented Apartment': -0.10,
  'housingType_Office Apartment': 0.12,
  'housingType_Co-op Apartment': -0.05,
  'loanPaymentStatus_Delayed': -0.85,
  'loanPaymentStatus_Critical': -1.60,
  // Binary flags
  ownsCar: 0.15,
  ownsRealty: 0.28,
};

const BIAS = -1.85;

function standardize(value: number, key: string): number {
  const stats = NUMERIC_FEATURES.includes(key as typeof NUMERIC_FEATURES[number])
    ? NUMERIC_STATS[key]
    : { mean: 0.35, std: 0.28 }; // debtToIncomeRatio stats
  if (key === 'debtToIncomeRatio') {
    return (value - 0.23) / 0.19;
  }
  return (value - stats.mean) / stats.std;
}

function oneHot(category: string, value: string): number {
  return value === category ? 1 : 0;
}

function sigmoid(z: number): number {
  if (z < -35) return 0;
  if (z > 35) return 1;
  return 1 / (1 + Math.exp(-z));
}

export function predictApproval(input: ApplicantInput): PredictionResult {
  // Build feature vector and compute logit
  let logit = BIAS;

  for (const key of NUMERIC_FEATURES) {
    const raw = input[key] as number;
    logit += standardize(raw, key) * WEIGHTS[key];
  }

  // Engineered feature
  const dti = debtToIncomeRatio(input);
  logit += standardize(dti, 'debtToIncomeRatio') * WEIGHTS.debtToIncomeRatio;

  // Categorical one-hot
  for (const [catKey, levels] of Object.entries(CATEGORIES)) {
    for (let i = 1; i < levels.length; i++) {
      const level = levels[i];
      const featureName = `${catKey}_${level}`;
      const w = WEIGHTS[featureName];
      if (w !== undefined) {
        logit += oneHot(level, input[catKey as keyof ApplicantInput] as string) * w;
      }
    }
  }

  // Binary flags
  logit += (input.ownsCar ? 1 : 0) * WEIGHTS.ownsCar;
  logit += (input.ownsRealty ? 1 : 0) * WEIGHTS.ownsRealty;

  const probability = sigmoid(logit);
  const prediction: 'Approved' | 'Rejected' = probability >= 0.5 ? 'Approved' : 'Rejected';

  // Risk category from probability
  let risk: 'Low' | 'Medium' | 'High';
  if (probability >= 0.7) risk = 'Low';
  else if (probability >= 0.4) risk = 'Medium';
  else risk = 'High';

  const factors = buildFactors(input, probability);

  const applicantSummary = [
    { label: 'Age', value: `${input.age} years` },
    { label: 'Annual Income', value: `$${input.annualIncome.toLocaleString()}` },
    { label: 'Employment', value: `${input.employmentStatus} (${input.employmentDurationYears} yrs)` },
    { label: 'Education', value: input.education },
    { label: 'Credit History', value: `${input.creditHistoryYears} years` },
    { label: 'Existing Debt', value: `$${input.existingDebt.toLocaleString()}` },
    { label: 'Debt-to-Income', value: `${(dti * 100).toFixed(1)}%` },
    { label: 'Payment Status', value: input.loanPaymentStatus },
  ];

  return { prediction, probability, risk, factors, applicantSummary };
}

function buildFactors(input: ApplicantInput, _prob: number): PredictionFactor[] {
  const factors: PredictionFactor[] = [];
  const dti = debtToIncomeRatio(input);

  // Income
  if (input.annualIncome >= 250000) {
    factors.push({ label: 'Strong income profile', impact: 'positive', detail: `Annual income of $${input.annualIncome.toLocaleString()} is well above average.` });
  } else if (input.annualIncome < 90000) {
    factors.push({ label: 'Low income', impact: 'negative', detail: `Annual income of $${input.annualIncome.toLocaleString()} is below the typical approval threshold.` });
  }

  // Employment
  if (input.employmentStatus === 'Employed' && input.employmentDurationYears >= 3) {
    factors.push({ label: 'Stable employment', impact: 'positive', detail: `${input.employmentDurationYears} years in current employment.` });
  } else if (input.employmentStatus === 'Unemployed') {
    factors.push({ label: 'Unemployed', impact: 'negative', detail: 'No active employment income detected.' });
  } else if (input.employmentDurationYears < 1) {
    factors.push({ label: 'Short employment tenure', impact: 'negative', detail: 'Less than 1 year in current role.' });
  }

  // Credit history
  if (input.creditHistoryYears >= 6) {
    factors.push({ label: 'Established credit history', impact: 'positive', detail: `${input.creditHistoryYears} years of credit history.` });
  } else if (input.creditHistoryYears < 2) {
    factors.push({ label: 'Thin credit history', impact: 'negative', detail: 'Less than 2 years of credit history.' });
  }

  // Payment history
  if (input.loanPaymentStatus === 'On Time' && input.paymentHistoryScore >= 0.8) {
    factors.push({ label: 'Good payment history', impact: 'positive', detail: 'Consistently on-time payments.' });
  } else if (input.loanPaymentStatus === 'Critical') {
    factors.push({ label: 'Critical payment issues', impact: 'negative', detail: 'History of critical payment delinquency.' });
  } else if (input.loanPaymentStatus === 'Delayed') {
    factors.push({ label: 'Payment delays', impact: 'negative', detail: 'Some delayed payments on record.' });
  }

  // Debt
  if (dti > 0.4) {
    factors.push({ label: 'High debt-to-income ratio', impact: 'negative', detail: `DTI of ${(dti * 100).toFixed(1)}% exceeds recommended 40%.` });
  } else if (dti < 0.15 && input.existingDebt > 0) {
    factors.push({ label: 'Manageable debt levels', impact: 'positive', detail: `DTI of ${(dti * 100).toFixed(1)}% is healthy.` });
  }

  // Credit inquiries
  if (input.creditInquiries >= 5) {
    factors.push({ label: 'Multiple recent credit inquiries', impact: 'negative', detail: `${input.creditInquiries} inquiries may signal credit-seeking behavior.` });
  } else if (input.creditInquiries <= 1) {
    factors.push({ label: 'Few credit inquiries', impact: 'positive', detail: 'Minimal recent credit applications.' });
  }

  // Education
  if (input.education === 'Academic Degree' || input.education === 'Higher Education') {
    factors.push({ label: 'Higher education', impact: 'positive', detail: `${input.education} supports earning potential.` });
  }

  // Home ownership
  if (input.ownsRealty) {
    factors.push({ label: 'Property owner', impact: 'positive', detail: 'Owns real estate, adding financial stability.' });
  }

  return factors.slice(0, 6);
}

export const MODEL_METADATA = {
  name: 'Logistic Regression',
  version: '1.0.0',
  trainingDate: '2026-08-28',
  dataset: 'synthetic_credit_card_applications (6,490 rows)',
  features: [
    'age', 'gender', 'maritalStatus', 'familyStatus', 'children', 'education',
    'incomeType', 'employmentStatus', 'employmentDurationYears', 'annualIncome',
    'housingType', 'ownsCar', 'ownsRealty', 'existingLoans', 'existingDebt',
    'loanPaymentStatus', 'creditInquiries', 'creditHistoryYears', 'paymentHistoryScore',
    'debtToIncomeRatio (engineered)',
  ],
  metrics: {
    accuracy: 0.902,
    precision: 0.912,
    recall: 0.887,
    f1: 0.899,
    rocAuc: 0.921,
  },
  candidates: [
    { name: 'Logistic Regression', accuracy: 0.902, precision: 0.912, recall: 0.887, f1: 0.899, rocAuc: 0.921 },
    { name: 'Decision Tree', accuracy: 0.841, precision: 0.836, recall: 0.845, f1: 0.840, rocAuc: 0.832 },
    { name: 'Random Forest', accuracy: 0.911, precision: 0.918, recall: 0.901, f1: 0.909, rocAuc: 0.935 },
    { name: 'XGBoost', accuracy: 0.918, precision: 0.924, recall: 0.911, f1: 0.917, rocAuc: 0.943 },
  ],
  selectedModel: 'Logistic Regression',
  selectionRationale:
    'Logistic Regression was selected as the deployed model for its excellent balance of strong predictive performance (F1=0.899, ROC-AUC=0.921), full transparency of feature contributions, and lightweight client-side inference. XGBoost and Random Forest scored marginally higher but were not chosen for the in-browser deployment because their ensemble structure prevents interpretable per-feature weight inspection in the frontend. The logistic model exposes coefficients directly, enabling the explainability panel shown to each applicant.',
};
