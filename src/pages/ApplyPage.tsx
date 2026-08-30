import { useState, type ReactNode } from 'react';
import type { ApplicantInput } from '@/types/applicant';
import { validateApplicant, type ValidationError } from '@/lib/validation';
import { runPrediction, savePrediction } from '@/lib/predictionService';
import { PredictionResultCard } from '@/components/PredictionResultCard';
import { showToast } from '@/components/Toast';
import { LoadingOverlay } from '@/components/Loading';
import { useRouter } from '@/lib/router';
import { ChevronRight, User, Briefcase, Wallet, CreditCard, RotateCcw } from 'lucide-react';

const DEFAULT_INPUT: ApplicantInput = {
  gender: 'Male',
  age: 35,
  maritalStatus: 'Married',
  familyStatus: 'Married',
  children: 1,
  education: 'Higher Education',
  incomeType: 'Working',
  employmentStatus: 'Employed',
  employmentDurationYears: 5,
  annualIncome: 180000,
  housingType: 'House / Apartment',
  ownsCar: true,
  ownsRealty: true,
  existingLoans: 1,
  existingDebt: 30000,
  loanPaymentStatus: 'On Time',
  creditInquiries: 1,
  creditHistoryYears: 6,
  paymentHistoryScore: 0.85,
};

export function ApplyPage() {
  const { navigate } = useRouter();
  const [input, setInput] = useState<ApplicantInput>(DEFAULT_INPUT);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runPrediction>> | null>(null);

  const update = <K extends keyof ApplicantInput>(key: K, value: ApplicantInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => prev.filter((e) => e.field !== key));
  };

  const handleSubmit = async () => {
    const validationErrors = validateApplicant(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      showToast('error', `Please fix ${validationErrors.length} field${validationErrors.length > 1 ? 's' : ''} before submitting.`);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const predictionResult = await runPrediction(input);
      setResult(predictionResult);
      const id = await savePrediction(input, predictionResult);
      if (id) {
        showToast('success', 'Prediction saved to history.');
      } else {
        showToast('warning', 'Prediction completed but could not be saved to history.');
      }
    } catch {
      showToast('error', 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput(DEFAULT_INPUT);
    setResult(null);
    setErrors([]);
  };

  const getFieldError = (field: string): string | undefined =>
    errors.find((e) => e.field === field)?.message;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      {/* Form */}
      <div className="xl:col-span-3">
        <div className="card p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Credit Card Eligibility Form</h2>
              <p className="mt-0.5 text-sm text-ink-500">Fill in all sections to get an instant prediction.</p>
            </div>
            <button onClick={handleReset} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>

          <div className="space-y-8">
            {/* Personal */}
            <FormSection icon={User} title="Personal Information" subtitle="Demographics and background">
              <Field label="Age" error={getFieldError('age')}>
                <NumberInput value={input.age} onChange={(v) => update('age', v)} min={18} max={100} />
              </Field>
              <Field label="Gender">
                <SelectInput
                  value={input.gender}
                  onChange={(v) => update('gender', v as ApplicantInput['gender'])}
                  options={['Male', 'Female']}
                />
              </Field>
              <Field label="Marital Status">
                <SelectInput
                  value={input.maritalStatus}
                  onChange={(v) => update('maritalStatus', v as ApplicantInput['maritalStatus'])}
                  options={['Married', 'Single', 'Divorced', 'Widowed']}
                />
              </Field>
              <Field label="Family Status">
                <SelectInput
                  value={input.familyStatus}
                  onChange={(v) => update('familyStatus', v as ApplicantInput['familyStatus'])}
                  options={['Civil Marriage', 'Married', 'Single / Not Married', 'Separated', 'Widow']}
                />
              </Field>
              <Field label="Number of Children" error={getFieldError('children')}>
                <NumberInput value={input.children} onChange={(v) => update('children', v)} min={0} max={20} />
              </Field>
              <Field label="Education">
                <SelectInput
                  value={input.education}
                  onChange={(v) => update('education', v as ApplicantInput['education'])}
                  options={['Higher Education', 'Secondary', 'Incomplete Higher', 'Lower Secondary', 'Academic Degree']}
                />
              </Field>
            </FormSection>

            {/* Employment */}
            <FormSection icon={Briefcase} title="Employment Information" subtitle="Work and income type">
              <Field label="Employment Status">
                <SelectInput
                  value={input.employmentStatus}
                  onChange={(v) => update('employmentStatus', v as ApplicantInput['employmentStatus'])}
                  options={['Employed', 'Self-employed', 'Unemployed', 'Maternity Leave']}
                />
              </Field>
              <Field label="Employment Duration (years)" error={getFieldError('employmentDurationYears')}>
                <NumberInput value={input.employmentDurationYears} onChange={(v) => update('employmentDurationYears', v)} min={0} max={60} step={0.5} />
              </Field>
              <Field label="Income Type">
                <SelectInput
                  value={input.incomeType}
                  onChange={(v) => update('incomeType', v as ApplicantInput['incomeType'])}
                  options={['Working', 'Commercial Associate', 'Pensioner', 'State Servant', 'Student']}
                />
              </Field>
            </FormSection>

            {/* Financial */}
            <FormSection icon={Wallet} title="Financial Information" subtitle="Income, assets, and existing obligations">
              <Field label="Annual Income ($)" error={getFieldError('annualIncome')}>
                <NumberInput value={input.annualIncome} onChange={(v) => update('annualIncome', v)} min={0} max={10_000_000} step={5000} />
              </Field>
              <Field label="Housing Type">
                <SelectInput
                  value={input.housingType}
                  onChange={(v) => update('housingType', v as ApplicantInput['housingType'])}
                  options={['House / Apartment', 'With Parents', 'Municipal Apartment', 'Rented Apartment', 'Office Apartment', 'Co-op Apartment']}
                />
              </Field>
              <Field label="Owns a Car">
                <ToggleInput value={input.ownsCar} onChange={(v) => update('ownsCar', v)} />
              </Field>
              <Field label="Owns Real Estate">
                <ToggleInput value={input.ownsRealty} onChange={(v) => update('ownsRealty', v)} />
              </Field>
              <Field label="Existing Loans" error={getFieldError('existingLoans')}>
                <NumberInput value={input.existingLoans} onChange={(v) => update('existingLoans', v)} min={0} max={50} />
              </Field>
              <Field label="Existing Debt ($)" error={getFieldError('existingDebt')}>
                <NumberInput value={input.existingDebt} onChange={(v) => update('existingDebt', v)} min={0} max={5_000_000} step={1000} />
              </Field>
            </FormSection>

            {/* Credit */}
            <FormSection icon={CreditCard} title="Credit Information" subtitle="Credit history and payment behavior">
              <Field label="Loan Payment Status">
                <SelectInput
                  value={input.loanPaymentStatus}
                  onChange={(v) => update('loanPaymentStatus', v as ApplicantInput['loanPaymentStatus'])}
                  options={['On Time', 'Delayed', 'Critical']}
                />
              </Field>
              <Field label="Credit Inquiries" error={getFieldError('creditInquiries')}>
                <NumberInput value={input.creditInquiries} onChange={(v) => update('creditInquiries', v)} min={0} max={30} />
              </Field>
              <Field label="Credit History (years)" error={getFieldError('creditHistoryYears')}>
                <NumberInput value={input.creditHistoryYears} onChange={(v) => update('creditHistoryYears', v)} min={0} max={60} step={0.5} />
              </Field>
              <Field label={`Payment History Score: ${(input.paymentHistoryScore * 100).toFixed(0)}%`} error={getFieldError('paymentHistoryScore')}>
                <SliderInput value={input.paymentHistoryScore} onChange={(v) => update('paymentHistoryScore', v)} min={0} max={1} step={0.01} />
              </Field>
            </FormSection>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-3 text-base">
              {loading ? 'Analyzing...' : 'Predict Approval'}
              {!loading && <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Result panel */}
      <div className="xl:col-span-2">
        <div className="sticky top-24">
          {loading ? (
            <div className="card p-6">
              <LoadingOverlay message="Running model inference..." />
            </div>
          ) : result ? (
            <PredictionResultCard result={result} onNew={handleReset} onViewHistory={() => navigate('history')} />
          ) : (
            <div className="card p-8">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50">
                  <CreditCard className="h-8 w-8 text-brand-500" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink-900">Ready to Predict</h3>
                <p className="mt-1 max-w-xs text-sm text-ink-500">
                  Fill in the applicant details and click Predict Approval to see the result, probability, and risk factors here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100">
          <Icon className="h-5 w-5 text-ink-600" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-400">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      className="input"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function ToggleInput({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-ink-200'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <input
      type="range"
      className="w-full accent-brand-600"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
