"""
Data preprocessing module.

Handles missing-value imputation, duplicate removal, outlier detection,
categorical encoding, and numerical standardization.
"""

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

NUMERIC_FEATURES = [
    'age',
    'employment_duration_years',
    'annual_income',
    'children',
    'existing_loans',
    'existing_debt',
    'credit_inquiries',
    'credit_history_years',
    'payment_history_score',
]

CATEGORICAL_FEATURES = [
    'gender',
    'marital_status',
    'family_status',
    'education',
    'income_type',
    'employment_status',
    'housing_type',
    'loan_payment_status',
]

BINARY_FEATURES = ['owns_car', 'owns_realty']

TARGET = 'approved'


def detect_outliers_iqr(df: pd.DataFrame, column: str) -> int:
    """Count outliers in a numeric column using the IQR method."""
    q1 = df[column].quantile(0.25)
    q3 = df[column].quantile(0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return int(((df[column] < lower) | (df[column] > upper)).sum())


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate records."""
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    if before != after:
        print(f"  Removed {before - after} duplicate rows")
    return df


def impute_missing(df: pd.DataFrame) -> pd.DataFrame:
    """Impute missing values: median for numerics, mode for categoricals."""
    for col in NUMERIC_FEATURES:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            print(f"  Imputed {col} with median={median_val:.2f}")
    for col in CATEGORICAL_FEATURES:
        if df[col].isnull().any():
            mode_val = df[col].mode()[0]
            df[col] = df[col].fillna(mode_val)
            print(f"  Imputed {col} with mode='{mode_val}'")
    return df


def build_preprocessor() -> ColumnTransformer:
    """Build the preprocessing ColumnTransformer for the pipeline."""
    numeric_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])

    categorical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=False)),
    ])

    return ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, NUMERIC_FEATURES),
            ('cat', categorical_pipeline, CATEGORICAL_FEATURES),
            ('binary', 'passthrough', BINARY_FEATURES),
        ],
        remainder='drop',
    )


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Full preprocessing: dedup, impute, return cleaned DataFrame (before encoding)."""
    print("Preprocessing data...")
    df = remove_duplicates(df)
    df = impute_missing(df)

    # Outlier report (informational only — we keep valid financial observations)
    print("  Outlier report (IQR method):")
    for col in ['annual_income', 'existing_debt', 'age']:
        n = detect_outliers_iqr(df, col)
        print(f"    {col}: {n} outliers detected (kept)")

    return df
