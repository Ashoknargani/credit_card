export type Gender = 'Male' | 'Female';
export type MaritalStatus = 'Married' | 'Single' | 'Divorced' | 'Widowed';
export type Education =
  | 'Higher Education'
  | 'Secondary'
  | 'Incomplete Higher'
  | 'Lower Secondary'
  | 'Academic Degree';
export type IncomeType = 'Working' | 'Commercial Associate' | 'Pensioner' | 'State Servant' | 'Student';
export type EmploymentStatus = 'Employed' | 'Self-employed' | 'Unemployed' | 'Maternity Leave';
export type HousingType = 'House / Apartment' | 'With Parents' | 'Municipal Apartment' | 'Rented Apartment' | 'Office Apartment' | 'Co-op Apartment';
export type FamilyStatus = 'Civil Marriage' | 'Married' | 'Single / Not Married' | 'Separated' | 'Widow';

export interface ApplicantInput {
  gender: Gender;
  age: number;
  maritalStatus: MaritalStatus;
  familyStatus: FamilyStatus;
  children: number;
  education: Education;
  incomeType: IncomeType;
  employmentStatus: EmploymentStatus;
  employmentDurationYears: number;
  annualIncome: number;
  housingType: HousingType;
  ownsCar: boolean;
  ownsRealty: boolean;
  existingLoans: number;
  existingDebt: number;
  loanPaymentStatus: 'On Time' | 'Delayed' | 'Critical';
  creditInquiries: number;
  creditHistoryYears: number;
  paymentHistoryScore: number;
}

export interface PredictionFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
}

export interface PredictionResult {
  prediction: 'Approved' | 'Rejected';
  probability: number;
  risk: 'Low' | 'Medium' | 'High';
  factors: PredictionFactor[];
  applicantSummary: { label: string; value: string }[];
}
