# Tests for the prediction module
import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.predict import predict, load_model


SAMPLE_APPLICANT = {
    'gender': 'Male',
    'age': 35,
    'marital_status': 'Married',
    'family_status': 'Married',
    'children': 1,
    'education': 'Higher Education',
    'income_type': 'Working',
    'employment_status': 'Employed',
    'employment_duration_years': 5.0,
    'annual_income': 180000,
    'housing_type': 'House / Apartment',
    'owns_car': True,
    'owns_realty': True,
    'existing_loans': 1,
    'existing_debt': 30000,
    'loan_payment_status': 'On Time',
    'credit_inquiries': 1,
    'credit_history_years': 6.0,
    'payment_history_score': 0.85,
}


def test_model_loads():
    """Test that the saved model can be loaded."""
    model = load_model()
    assert model is not None


def test_prediction_output_shape():
    """Test that prediction returns the expected keys."""
    result = predict(SAMPLE_APPLICANT)
    assert 'prediction' in result
    assert 'probability' in result
    assert 'risk' in result
    assert result['prediction'] in ['Approved', 'Rejected']
    assert 0 <= result['probability'] <= 1
    assert result['risk'] in ['Low', 'Medium', 'High']


def test_prediction_approved_applicant():
    """Test that a strong applicant is approved."""
    result = predict(SAMPLE_APPLICANT)
    assert result['prediction'] == 'Approved'
    assert result['probability'] > 0.5


def test_prediction_rejected_applicant():
    """Test that a weak applicant is rejected."""
    rejected = {**SAMPLE_APPLICANT,
                'employment_status': 'Unemployed',
                'annual_income': 20000,
                'existing_debt': 150000,
                'loan_payment_status': 'Critical',
                'credit_inquiries': 10,
                'payment_history_score': 0.1}
    result = predict(rejected)
    assert result['prediction'] == 'Rejected'
    assert result['probability'] < 0.5
