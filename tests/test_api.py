# Tests for the Flask API
import os
import sys
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app import create_app
from backend.utils.validation import validate_applicant


VALID_INPUT = {
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


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


def test_health_endpoint(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'


def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.get_json()
    assert 'status' in data


def test_valid_prediction(client):
    """Test a valid prediction request."""
    response = client.post('/api/predict', json=VALID_INPUT)
    assert response.status_code == 200
    data = response.get_json()
    assert 'prediction' in data
    assert 'probability' in data
    assert 'risk' in data
    assert data['prediction'] in ['Approved', 'Rejected']


def test_missing_fields(client):
    """Test that missing required fields return 422."""
    incomplete = {**VALID_INPUT}
    del incomplete['annual_income']
    response = client.post('/api/predict', json=incomplete)
    assert response.status_code == 422
    data = response.get_json()
    assert 'error' in data


def test_invalid_age(client):
    """Test that an invalid age returns 422."""
    invalid = {**VALID_INPUT, 'age': 150}
    response = client.post('/api/predict', json=invalid)
    assert response.status_code == 422


def test_invalid_category(client):
    """Test that an invalid categorical value returns 422."""
    invalid = {**VALID_INPUT, 'gender': 'Other'}
    response = client.post('/api/predict', json=invalid)
    assert response.status_code == 422


def test_negative_income(client):
    """Test that negative income returns 422."""
    invalid = {**VALID_INPUT, 'annual_income': -5000}
    response = client.post('/api/predict', json=invalid)
    assert response.status_code == 422


def test_invalid_json(client):
    """Test that invalid JSON returns 400."""
    response = client.post('/api/predict', data='not json', content_type='application/json')
    assert response.status_code == 400


def test_history_endpoint(client):
    """Test the history endpoint returns a list."""
    response = client.get('/api/history')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)


def test_stats_endpoint(client):
    """Test the stats endpoint returns aggregate data."""
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total' in data
    assert 'approved' in data
    assert 'rejected' in data


def test_validation_function_directly():
    """Test the validation function directly."""
    errors = validate_applicant(VALID_INPUT)
    assert len(errors) == 0

    invalid = {**VALID_INPUT, 'age': 5}
    errors = validate_applicant(invalid)
    assert len(errors) > 0
    assert any(e['field'] == 'age' for e in errors)
