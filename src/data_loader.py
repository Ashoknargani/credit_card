"""
Credit Card Approval Prediction System — ML Pipeline
=====================================================

This module generates a synthetic credit-card-approval dataset that mirrors
the structure of public credit-card application datasets (e.g. the Kaggle
"Credit Card Approval" dataset derived from the UCI Credit Card Applications
data). The dataset is generated deterministically with a fixed random seed so
that training results are reproducible.

The generated CSV is written to data/raw/credit_card_applications.csv
"""

import os
import numpy as np
import pandas as pd

RANDOM_SEED = 42
NUM_ROWS = 6490
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'credit_card_applications.csv')


def _sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -35, 35)))


def generate_dataset(n_rows: int = NUM_ROWS, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate a synthetic credit-card-approval dataset."""
    rng = np.random.default_rng(seed)

    # --- Demographic features ---
    gender = rng.choice(['Male', 'Female'], size=n_rows, p=[0.47, 0.53])
    age = np.clip(rng.normal(43.6, 11.4, size=n_rows), 18, 80).astype(int)
    marital_status = rng.choice(
        ['Married', 'Single', 'Divorced', 'Widowed'],
        size=n_rows,
        p=[0.55, 0.30, 0.10, 0.05],
    )
    family_status = rng.choice(
        ['Civil Marriage', 'Married', 'Single / Not Married', 'Separated', 'Widow'],
        size=n_rows,
        p=[0.12, 0.55, 0.22, 0.06, 0.05],
    )
    children = rng.poisson(0.42, size=n_rows).clip(0, 10)
    education = rng.choice(
        ['Higher Education', 'Secondary', 'Incomplete Higher', 'Lower Secondary', 'Academic Degree'],
        size=n_rows,
        p=[0.30, 0.40, 0.15, 0.10, 0.05],
    )

    # --- Employment features ---
    income_type = rng.choice(
        ['Working', 'Commercial Associate', 'Pensioner', 'State Servant', 'Student'],
        size=n_rows,
        p=[0.52, 0.24, 0.15, 0.08, 0.01],
    )
    employment_status = rng.choice(
        ['Employed', 'Self-employed', 'Unemployed', 'Maternity Leave'],
        size=n_rows,
        p=[0.72, 0.18, 0.08, 0.02],
    )
    employment_duration_years = np.clip(rng.gamma(2.0, 2.5, size=n_rows), 0, 40).round(1)

    # --- Financial features ---
    annual_income = np.clip(rng.lognormal(12.0, 0.45, size=n_rows), 20000, 800000).astype(int)
    housing_type = rng.choice(
        ['House / Apartment', 'With Parents', 'Municipal Apartment', 'Rented Apartment', 'Office Apartment', 'Co-op Apartment'],
        size=n_rows,
        p=[0.60, 0.12, 0.08, 0.12, 0.05, 0.03],
    )
    owns_car = rng.choice([True, False], size=n_rows, p=[0.40, 0.60])
    owns_realty = rng.choice([True, False], size=n_rows, p=[0.65, 0.35])
    existing_loans = rng.poisson(0.65, size=n_rows).clip(0, 10)
    existing_debt = np.clip(rng.gamma(1.5, 18000, size=n_rows), 0, 300000).astype(int)

    # --- Credit features ---
    loan_payment_status = rng.choice(
        ['On Time', 'Delayed', 'Critical'],
        size=n_rows,
        p=[0.70, 0.22, 0.08],
    )
    credit_inquiries = rng.poisson(1.8, size=n_rows).clip(0, 15)
    credit_history_years = np.clip(rng.gamma(2.0, 2.7, size=n_rows), 0, 30).round(1)
    payment_history_score = np.clip(rng.beta(8, 3, size=n_rows), 0, 1).round(2)

    # --- Target generation (ground-truth logistic model + noise) ---
    # Standardize key numerics
    z = (
        -1.85
        + 0.42 * ((age - 43.6) / 11.4)
        + 0.68 * ((employment_duration_years - 5.1) / 4.2)
        + 1.15 * ((annual_income - 185000) / 82000)
        - 0.22 * ((children - 0.42) / 0.72)
        - 0.55 * ((existing_loans - 0.65) / 0.85)
        - 0.95 * ((existing_debt - 42000) / 28000)
        - 0.78 * ((credit_inquiries - 1.8) / 1.5)
        + 0.51 * ((credit_history_years - 5.4) / 3.1)
        + 1.35 * ((payment_history_score - 0.72) / 0.22)
        - 1.05 * (((existing_debt / np.maximum(annual_income, 1)) - 0.23) / 0.19)
    )

    # Categorical contributions
    cat_contrib = np.zeros(n_rows)
    cat_contrib += np.where(gender == 'Female', 0.08, 0)
    cat_contrib += np.where(employment_status == 'Unemployed', -1.40, 0)
    cat_contrib += np.where(employment_status == 'Self-employed', -0.20, 0)
    cat_contrib += np.where(income_type == 'State Servant', 0.30, 0)
    cat_contrib += np.where(income_type == 'Student', -0.60, 0)
    cat_contrib += np.where(loan_payment_status == 'Delayed', -0.85, 0)
    cat_contrib += np.where(loan_payment_status == 'Critical', -1.60, 0)
    cat_contrib += np.where(education == 'Academic Degree', 0.35, 0)
    cat_contrib += np.where(education == 'Lower Secondary', -0.45, 0)
    cat_contrib += np.where(owns_realty, 0.28, 0)
    cat_contrib += np.where(owns_car, 0.15, 0)

    z += cat_contrib
    prob = _sigmoid(z)
    # Add label noise
    noise = rng.normal(0, 0.15, size=n_rows)
    approved = (prob + noise) >= 0.5

    df = pd.DataFrame({
        'gender': gender,
        'age': age,
        'marital_status': marital_status,
        'family_status': family_status,
        'children': children,
        'education': education,
        'income_type': income_type,
        'employment_status': employment_status,
        'employment_duration_years': employment_duration_years,
        'annual_income': annual_income,
        'housing_type': housing_type,
        'owns_car': owns_car,
        'owns_realty': owns_realty,
        'existing_loans': existing_loans,
        'existing_debt': existing_debt,
        'loan_payment_status': loan_payment_status,
        'credit_inquiries': credit_inquiries,
        'credit_history_years': credit_history_years,
        'payment_history_score': payment_history_score,
        'approved': approved.astype(int),
    })

    # Inject ~3% missing values into a few columns
    for col in ['annual_income', 'existing_debt', 'credit_history_years']:
        mask = rng.random(n_rows) < 0.03
        df.loc[mask, col] = np.nan

    return df


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df = generate_dataset()
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Dataset generated: {OUTPUT_PATH}")
    print(f"  Rows: {len(df)}")
    print(f"  Columns: {len(df.columns)}")
    print(f"  Approval rate: {df['approved'].mean():.1%}")
    print(f"  Missing values: {df.isnull().sum().sum()}")


if __name__ == '__main__':
    main()
