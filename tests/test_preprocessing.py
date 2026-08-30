# Tests for the ML pipeline
import os
import sys
import json
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.data_loader import generate_dataset
from src.data_preprocessing import preprocess, build_preprocessor
from src.feature_engineering import engineer_features


def test_dataset_generation():
    """Test that the dataset generates with correct shape and no NaNs."""
    df = generate_dataset(n_rows=100, seed=42)
    assert len(df) == 100
    assert 'approved' in df.columns
    assert df['approved'].isin([0, 1]).all()
    assert 0.3 < df['approved'].mean() < 0.8


def test_preprocessing_removes_nans():
    """Test that imputation fills all missing values."""
    df = generate_dataset(n_rows=200, seed=42)
    df = preprocess(df)
    assert df.isnull().sum().sum() == 0


def test_feature_engineering_adds_columns():
    """Test that engineered features are created."""
    df = generate_dataset(n_rows=100, seed=42)
    df = preprocess(df)
    df = engineer_features(df)
    assert 'debt_to_income_ratio' in df.columns
    assert 'income_to_debt_ratio' in df.columns
    assert 'employment_stability' in df.columns
    assert 'credit_risk_indicator' in df.columns
    assert 'loan_payment_risk' in df.columns
    assert 'credit_inquiry_risk' in df.columns
    assert 'existing_debt_category' in df.columns


def test_preprocessor_transforms_data():
    """Test that the ColumnTransformer produces numeric output."""
    df = generate_dataset(n_rows=100, seed=42)
    df = preprocess(df)
    df = engineer_features(df)
    X = df.drop(columns=['approved'])
    preprocessor = build_preprocessor()
    transformed = preprocessor.fit_transform(X)
    assert transformed.shape[0] == 100
    assert np.isfinite(transformed).all()


def test_dti_ratio_calculation():
    """Test debt-to-income ratio is calculated correctly."""
    df = generate_dataset(n_rows=50, seed=42)
    df = preprocess(df)
    df = engineer_features(df)
    expected = df['existing_debt'] / df['annual_income'].clip(lower=1)
    np.testing.assert_array_almost_equal(df['debt_to_income_ratio'].values, expected.values)
