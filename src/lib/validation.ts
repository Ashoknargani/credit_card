import type { ApplicantInput } from '@/types/applicant';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateApplicant(input: Partial<ApplicantInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.age === undefined || input.age < 18 || input.age > 100) {
    errors.push({ field: 'age', message: 'Age must be between 18 and 100.' });
  }
  if (input.annualIncome === undefined || input.annualIncome < 0 || input.annualIncome > 10_000_000) {
    errors.push({ field: 'annualIncome', message: 'Annual income must be between $0 and $10,000,000.' });
  }
  if (input.employmentDurationYears === undefined || input.employmentDurationYears < 0 || input.employmentDurationYears > 60) {
    errors.push({ field: 'employmentDurationYears', message: 'Employment duration must be between 0 and 60 years.' });
  }
  if (input.children === undefined || input.children < 0 || input.children > 20) {
    errors.push({ field: 'children', message: 'Number of children must be between 0 and 20.' });
  }
  if (input.existingLoans !== undefined && (input.existingLoans < 0 || input.existingLoans > 50)) {
    errors.push({ field: 'existingLoans', message: 'Existing loans must be between 0 and 50.' });
  }
  if (input.existingDebt !== undefined && (input.existingDebt < 0 || input.existingDebt > 5_000_000)) {
    errors.push({ field: 'existingDebt', message: 'Existing debt must be between $0 and $5,000,000.' });
  }
  if (input.creditInquiries !== undefined && (input.creditInquiries < 0 || input.creditInquiries > 30)) {
    errors.push({ field: 'creditInquiries', message: 'Credit inquiries must be between 0 and 30.' });
  }
  if (input.creditHistoryYears !== undefined && (input.creditHistoryYears < 0 || input.creditHistoryYears > 60)) {
    errors.push({ field: 'creditHistoryYears', message: 'Credit history must be between 0 and 60 years.' });
  }
  if (input.paymentHistoryScore !== undefined && (input.paymentHistoryScore < 0 || input.paymentHistoryScore > 1)) {
    errors.push({ field: 'paymentHistoryScore', message: 'Payment history score must be between 0 and 1.' });
  }

  return errors;
}
