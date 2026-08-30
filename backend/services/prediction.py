"""
Prediction service — wraps the ML model and adds explainability.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.predict import load_model, predict as model_predict
from backend.utils.validation import validate_applicant, ValidationError


def build_factors(applicant_data: dict, probability: float) -> list[dict]:
    """Generate human-readable explanation factors."""
    factors = []
    annual_income = applicant_data.get('annual_income', 0)
    existing_debt = applicant_data.get('existing_debt', 0)
    employment_status = applicant_data.get('employment_status', '')
    employment_duration = applicant_data.get('employment_duration_years', 0)
    credit_history = applicant_data.get('credit_history_years', 0)
    payment_status = applicant_data.get('loan_payment_status', '')
    payment_score = applicant_data.get('payment_history_score', 0)
    credit_inquiries = applicant_data.get('credit_inquiries', 0)
    education = applicant_data.get('education', '')
    owns_realty = applicant_data.get('owns_realty', False)

    dti = existing_debt / max(annual_income, 1)

    if annual_income >= 250000:
        factors.append({'label': 'Strong income profile', 'impact': 'positive',
                        'detail': f'Annual income of ${annual_income:,} is well above average.'})
    elif annual_income < 90000:
        factors.append({'label': 'Low income', 'impact': 'negative',
                        'detail': f'Annual income of ${annual_income:,} is below typical threshold.'})

    if employment_status == 'Employed' and employment_duration >= 3:
        factors.append({'label': 'Stable employment', 'impact': 'positive',
                        'detail': f'{employment_duration} years in current employment.'})
    elif employment_status == 'Unemployed':
        factors.append({'label': 'Unemployed', 'impact': 'negative',
                        'detail': 'No active employment income detected.'})

    if credit_history >= 6:
        factors.append({'label': 'Established credit history', 'impact': 'positive',
                        'detail': f'{credit_history} years of credit history.'})
    elif credit_history < 2:
        factors.append({'label': 'Thin credit history', 'impact': 'negative',
                        'detail': 'Less than 2 years of credit history.'})

    if payment_status == 'On Time' and payment_score >= 0.8:
        factors.append({'label': 'Good payment history', 'impact': 'positive',
                        'detail': 'Consistently on-time payments.'})
    elif payment_status == 'Critical':
        factors.append({'label': 'Critical payment issues', 'impact': 'negative',
                        'detail': 'History of critical payment delinquency.'})

    if dti > 0.4:
        factors.append({'label': 'High debt-to-income ratio', 'impact': 'negative',
                        'detail': f'DTI of {dti*100:.1f}% exceeds recommended 40%.'})
    elif dti < 0.15 and existing_debt > 0:
        factors.append({'label': 'Manageable debt levels', 'impact': 'positive',
                        'detail': f'DTI of {dti*100:.1f}% is healthy.'})

    if credit_inquiries >= 5:
        factors.append({'label': 'Multiple recent credit inquiries', 'impact': 'negative',
                        'detail': f'{credit_inquiries} inquiries may signal credit-seeking behavior.'})

    if education in ('Academic Degree', 'Higher Education'):
        factors.append({'label': 'Higher education', 'impact': 'positive',
                        'detail': f'{education} supports earning potential.'})

    if owns_realty:
        factors.append({'label': 'Property owner', 'impact': 'positive',
                        'detail': 'Owns real estate, adding financial stability.'})

    return factors[:6]


def run_prediction(applicant_data: dict) -> dict:
    """Validate input, run prediction, and return enriched result."""
    errors = validate_applicant(applicant_data)
    if errors:
        raise ValidationError(errors)

    result = model_predict(applicant_data)
    factors = build_factors(applicant_data, result['probability'])

    return {
        **result,
        'factors': factors,
    }
