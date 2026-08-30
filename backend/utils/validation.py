"""Input validation for prediction requests."""

from typing import Any


class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, errors: list[dict[str, str]]):
        self.errors = errors
        super().__init__(f"Validation failed: {errors}")


VALID_CATEGORIES = {
    'gender': ['Male', 'Female'],
    'marital_status': ['Married', 'Single', 'Divorced', 'Widowed'],
    'family_status': ['Civil Marriage', 'Married', 'Single / Not Married', 'Separated', 'Widow'],
    'education': ['Higher Education', 'Secondary', 'Incomplete Higher', 'Lower Secondary', 'Academic Degree'],
    'income_type': ['Working', 'Commercial Associate', 'Pensioner', 'State Servant', 'Student'],
    'employment_status': ['Employed', 'Self-employed', 'Unemployed', 'Maternity Leave'],
    'housing_type': ['House / Apartment', 'With Parents', 'Municipal Apartment', 'Rented Apartment', 'Office Apartment', 'Co-op Apartment'],
    'loan_payment_status': ['On Time', 'Delayed', 'Critical'],
}

REQUIRED_FIELDS = [
    'gender', 'age', 'marital_status', 'family_status', 'children',
    'education', 'income_type', 'employment_status', 'employment_duration_years',
    'annual_income', 'housing_type', 'owns_car', 'owns_realty',
    'existing_loans', 'existing_debt', 'loan_payment_status',
    'credit_inquiries', 'credit_history_years', 'payment_history_score',
]

NUMERIC_RANGES = {
    'age': (18, 100),
    'employment_duration_years': (0, 60),
    'annual_income': (0, 10_000_000),
    'children': (0, 20),
    'existing_loans': (0, 50),
    'existing_debt': (0, 5_000_000),
    'credit_inquiries': (0, 30),
    'credit_history_years': (0, 60),
    'payment_history_score': (0, 1),
}


def validate_applicant(data: dict[str, Any]) -> list[dict[str, str]]:
    """Validate applicant input. Returns a list of error dicts."""
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append({'field': field, 'message': f'{field} is required.'})

    if errors:
        return errors

    # Check numeric ranges
    for field, (min_val, max_val) in NUMERIC_RANGES.items():
        value = data.get(field)
        if value is None:
            continue
        try:
            v = float(value)
            if v < min_val or v > max_val:
                errors.append({
                    'field': field,
                    'message': f'{field} must be between {min_val} and {max_val}.',
                })
        except (TypeError, ValueError):
            errors.append({'field': field, 'message': f'{field} must be a number.'})

    # Check categorical values
    for field, valid_values in VALID_CATEGORIES.items():
        value = data.get(field)
        if value is not None and value not in valid_values:
            errors.append({
                'field': field,
                'message': f'{field} must be one of: {", ".join(valid_values)}.',
            })

    # Check boolean fields
    for field in ['owns_car', 'owns_realty']:
        value = data.get(field)
        if value is not None and not isinstance(value, bool):
            errors.append({'field': field, 'message': f'{field} must be true or false.'})

    return errors
