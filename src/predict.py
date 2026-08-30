"""
Prediction module — loads the saved model and runs inference on new applicant data.
"""

import os
import joblib
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'best_model.pkl')


_model_cache = None


def load_model():
    """Load the saved model pipeline (cached after first load)."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run `python src/train.py` first."
        )
    _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def predict(applicant_data: dict) -> dict:
    """
    Run a prediction on a single applicant.

    Args:
        applicant_data: dict with keys matching the training features.

    Returns:
        dict with prediction, probability, and risk.
    """
    model = load_model()
    df = pd.DataFrame([applicant_data])

    prob = float(model.predict_proba(df)[0, 1])
    prediction = 'Approved' if prob >= 0.5 else 'Rejected'

    if prob >= 0.7:
        risk = 'Low'
    elif prob >= 0.4:
        risk = 'Medium'
    else:
        risk = 'High'

    return {
        'prediction': prediction,
        'probability': round(prob, 4),
        'risk': risk,
    }


if __name__ == '__main__':
    # Quick CLI test
    sample = {
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
    result = predict(sample)
    print(result)
