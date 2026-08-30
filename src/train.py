"""
Model training module.

Trains four classification models, performs hyperparameter tuning,
and selects the best model based on F1-score and ROC-AUC.
"""

import json
import os
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from data_preprocessing import build_preprocessor, preprocess, NUMERIC_FEATURES, CATEGORICAL_FEATURES, BINARY_FEATURES
from feature_engineering import engineer_features
from data_loader import generate_dataset, OUTPUT_PATH

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
RANDOM_SEED = 42


def load_data():
    """Load or generate the dataset and apply preprocessing + feature engineering."""
    if os.path.exists(OUTPUT_PATH):
        df = pd.read_csv(OUTPUT_PATH)
        print(f"Loaded dataset from {OUTPUT_PATH}")
    else:
        print("Dataset not found. Generating synthetic dataset...")
        df = generate_dataset()

    df = preprocess(df)
    df = engineer_features(df)

    X = df.drop(columns=['approved'])
    y = df['approved']
    return X, y


def get_models():
    """Return candidate models with their hyperparameter grids."""
    models = {
        'Logistic Regression': {
            'model': LogisticRegression(max_iter=1000, random_state=RANDOM_SEED),
            'params': {
                'clf__C': [0.1, 1.0, 10.0],
                'clf__penalty': ['l2'],
            },
        },
        'Decision Tree': {
            'model': DecisionTreeClassifier(random_state=RANDOM_SEED),
            'params': {
                'clf__max_depth': [5, 10, 20, None],
                'clf__min_samples_split': [2, 10, 20],
            },
        },
        'Random Forest': {
            'model': RandomForestClassifier(random_state=RANDOM_SEED, n_jobs=-1),
            'params': {
                'clf__n_estimators': [100, 200],
                'clf__max_depth': [10, 20, None],
            },
        },
    }

    if XGBOOST_AVAILABLE:
        models['XGBoost'] = {
            'model': XGBClassifier(
                random_state=RANDOM_SEED,
                eval_metric='logloss',
                use_label_encoder=False,
            ),
            'params': {
                'clf__n_estimators': [100, 200],
                'clf__max_depth': [3, 6],
                'clf__learning_rate': [0.05, 0.1],
            },
        }

    return models


def train_and_evaluate():
    """Train all models, evaluate, select the best, and save artifacts."""
    X, y = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    print(f"Train approval rate: {y_train.mean():.1%} | Test approval rate: {y_test.mean():.1%}")

    models = get_models()
    results = {}
    best_f1 = -1
    best_roc_auc = -1
    best_name = None
    best_pipeline = None

    for name, config in models.items():
        print(f"\n--- Training {name} ---")
        pipeline = Pipeline([
            ('preprocessor', build_preprocessor()),
            ('clf', config['model']),
        ])

        grid = GridSearchCV(
            pipeline,
            config['params'],
            cv=5,
            scoring='f1',
            n_jobs=-1,
            refit=True,
        )
        grid.fit(X_train, y_train)

        y_pred = grid.predict(X_test)
        y_prob = grid.predict_proba(X_test)[:, 1]

        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_prob)

        results[name] = {
            'accuracy': round(accuracy, 4),
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1': round(f1, 4),
            'rocAuc': round(roc_auc, 4),
            'best_params': {k: str(v) for k, v in grid.best_params_.items()},
        }

        print(f"  Accuracy: {accuracy:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall: {recall:.4f}")
        print(f"  F1: {f1:.4f}")
        print(f"  ROC-AUC: {roc_auc:.4f}")
        print(f"  Best params: {grid.best_params_}")

        # Select best by F1 (primary) then ROC-AUC (tiebreaker)
        if f1 > best_f1 or (f1 == best_f1 and roc_auc > best_roc_auc):
            best_f1 = f1
            best_roc_auc = roc_auc
            best_name = name
            best_pipeline = grid.best_estimator_

    print(f"\n{'='*50}")
    print(f"Best model: {best_name}")
    print(f"  F1: {best_f1:.4f} | ROC-AUC: {best_roc_auc:.4f}")
    print(f"{'='*50}")

    # Save model
    os.makedirs(MODELS_DIR, exist_ok=True)
    import joblib
    model_path = os.path.join(MODELS_DIR, 'best_model.pkl')
    joblib.dump(best_pipeline, model_path)
    print(f"\nSaved model to {model_path}")

    # Save metadata
    feature_list = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES + [
        'debt_to_income_ratio', 'income_to_debt_ratio', 'employment_stability',
        'credit_risk_indicator', 'loan_payment_risk', 'credit_inquiry_risk',
        'existing_debt_category',
    ]

    metadata = {
        'name': best_name,
        'version': '1.0.0',
        'trainingDate': datetime.now().strftime('%Y-%m-%d'),
        'dataset': f'synthetic_credit_card_applications ({len(X)} rows)',
        'features': feature_list,
        'metrics': results[best_name],
        'candidates': [
            {'name': n, **{k: v for k, v in r.items() if k != 'best_params'}}
            for n, r in results.items()
        ],
        'selectedModel': best_name,
        'selectionRationale': (
            f'{best_name} was selected as the best model based on F1-score ({best_f1:.4f}) '
            f'and ROC-AUC ({best_roc_auc:.4f}), the primary criteria for this imbalanced '
            f'classification problem.'
        ),
    }

    metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {metadata_path}")

    # Print comparison table
    print(f"\n{'='*60}")
    print(f"{'Model':<25} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10} {'ROC-AUC':>10}")
    print(f"{'-'*60}")
    for name, r in results.items():
        marker = ' *' if name == best_name else '  '
        print(f"{name:<23}{marker} {r['accuracy']:>10.4f} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1']:>10.4f} {r['rocAuc']:>10.4f}")
    print(f"{'='*60}")
    print("* = selected")

    return results, best_name, best_pipeline


if __name__ == '__main__':
    train_and_evaluate()
