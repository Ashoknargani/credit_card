"""
Feature engineering module.

Creates meaningful derived features from the raw applicant data.
"""

import pandas as pd


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features to the DataFrame."""
    df = df.copy()

    # Debt-to-Income Ratio — higher is riskier
    df['debt_to_income_ratio'] = df['existing_debt'] / df['annual_income'].clip(lower=1)

    # Income-to-Debt Ratio — higher is safer (inverse of DTI)
    df['income_to_debt_ratio'] = df['annual_income'] / df['existing_debt'].clip(lower=1)

    # Employment Stability — years per year of age
    df['employment_stability'] = df['employment_duration_years'] / df['age'].clip(lower=18)

    # Credit Risk Indicator — composite of inquiries and payment history
    df['credit_risk_indicator'] = (
        df['credit_inquiries'] * 0.3 + (1 - df['payment_history_score']) * 0.7
    )

    # Loan Payment Risk — binary flag for delayed/critical payment status
    df['loan_payment_risk'] = df['loan_payment_status'].isin(['Delayed', 'Critical']).astype(int)

    # Credit Inquiry Risk — flag for high number of inquiries
    df['credit_inquiry_risk'] = (df['credit_inquiries'] >= 5).astype(int)

    # Existing Debt Category — binned debt levels
    df['existing_debt_category'] = pd.cut(
        df['existing_debt'],
        bins=[-1, 0, 25000, 75000, 200000, float('inf')],
        labels=['None', 'Low', 'Medium', 'High', 'Very High'],
    ).astype(str)

    print(f"  Engineered 7 new features:")
    print("    - debt_to_income_ratio")
    print("    - income_to_debt_ratio")
    print("    - employment_stability")
    print("    - credit_risk_indicator")
    print("    - loan_payment_risk")
    print("    - credit_inquiry_risk")
    print("    - existing_debt_category")

    return df
