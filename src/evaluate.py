"""
Model evaluation module.

Generates confusion matrices, classification reports, ROC curves,
and a model comparison chart. Saves figures to reports/figures/.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_curve,
    auc,
)

from data_preprocessing import build_preprocessor, preprocess
from feature_engineering import engineer_features
from data_loader import generate_dataset, OUTPUT_PATH
from train import get_models, load_data, RANDOM_SEED

from sklearn.model_selection import train_test_split

FIGURES_DIR = os.path.join(os.path.dirname(__file__), '..', 'reports', 'figures')
METRICS_DIR = os.path.join(os.path.dirname(__file__), '..', 'reports')


def evaluate_all_models():
    """Train all models, generate evaluation plots, and save metrics."""
    os.makedirs(FIGURES_DIR, exist_ok=True)
    os.makedirs(METRICS_DIR, exist_ok=True)

    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )

    models = get_models()
    all_metrics = {}
    roc_data = {}

    for name, config in models.items():
        from sklearn.pipeline import Pipeline
        from sklearn.model_selection import GridSearchCV

        pipeline = Pipeline([
            ('preprocessor', build_preprocessor()),
            ('clf', config['model']),
        ])

        grid = GridSearchCV(pipeline, config['params'], cv=5, scoring='f1', n_jobs=-1, refit=True)
        grid.fit(X_train, y_train)

        y_pred = grid.predict(X_test)
        y_prob = grid.predict_proba(X_test)[:, 1]

        # Metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_prob),
        }
        all_metrics[name] = metrics

        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        fig, ax = plt.subplots(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                    xticklabels=['Rejected', 'Approved'],
                    yticklabels=['Rejected', 'Approved'])
        ax.set_title(f'Confusion Matrix — {name}')
        ax.set_xlabel('Predicted')
        ax.set_ylabel('Actual')
        fig.tight_layout()
        fig.savefig(os.path.join(FIGURES_DIR, f'confusion_matrix_{name.lower().replace(" ", "_")}.png'), dpi=150)
        plt.close(fig)

        # Classification report
        report = classification_report(y_test, y_pred, target_names=['Rejected', 'Approved'], output_dict=True)
        with open(os.path.join(METRICS_DIR, f'classification_report_{name.lower().replace(" ", "_")}.json'), 'w') as f:
            json.dump(report, f, indent=2)

        # ROC curve data
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_data[name] = {'fpr': fpr, 'tpr': tpr, 'auc': auc(fpr, tpr)}

    # ROC curves (all models on one plot)
    fig, ax = plt.subplots(figsize=(8, 6))
    for name, data in roc_data.items():
        ax.plot(data['fpr'], data['tpr'], label=f"{name} (AUC={data['auc']:.3f})")
    ax.plot([0, 1], [0, 1], 'k--', alpha=0.3)
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title('ROC Curves — Model Comparison')
    ax.legend(loc='lower right')
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'roc_curves.png'), dpi=150)
    plt.close(fig)

    # Model comparison bar chart
    fig, ax = plt.subplots(figsize=(10, 6))
    metric_names = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
    model_names = list(all_metrics.keys())
    x = np.arange(len(model_names))
    width = 0.15
    for i, metric in enumerate(metric_names):
        values = [all_metrics[m][metric] for m in model_names]
        ax.bar(x + i * width, values, width, label=metric)
    ax.set_xlabel('Model')
    ax.set_ylabel('Score')
    ax.set_title('Model Comparison — All Metrics')
    ax.set_xticks(x + width * 2)
    ax.set_xticklabels(model_names, rotation=15)
    ax.legend()
    ax.set_ylim(0, 1.05)
    ax.grid(True, axis='y', alpha=0.3)
    fig.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'model_comparison.png'), dpi=150)
    plt.close(fig)

    # Target distribution
    fig, ax = plt.subplots(figsize=(6, 4))
    y.value_counts().plot(kind='bar', ax=ax, color=['#ef4444', '#10b981'])
    ax.set_title('Target Distribution (Approved vs Rejected)')
    ax.set_xlabel('Approved')
    ax.set_ylabel('Count')
    ax.set_xticks([0, 1])
    ax.set_xticklabels(['Rejected', 'Approved'], rotation=0)
    fig.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'target_distribution.png'), dpi=150)
    plt.close(fig)

    # Correlation heatmap
    numeric_df = X.select_dtypes(include=[np.number])
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(numeric_df.corr(), annot=True, fmt='.2f', cmap='coolwarm', ax=ax, vmin=-1, vmax=1)
    ax.set_title('Feature Correlation Heatmap')
    fig.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'correlation_heatmap.png'), dpi=150)
    plt.close(fig)

    # Save metrics summary
    with open(os.path.join(METRICS_DIR, 'evaluation_metrics.json'), 'w') as f:
        json.dump(all_metrics, f, indent=2)

    print(f"Evaluation complete. Figures saved to {FIGURES_DIR}")
    print(f"Metrics saved to {METRICS_DIR}/evaluation_metrics.json")

    # Print comparison table
    print(f"\n{'Model':<25} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10} {'ROC-AUC':>10}")
    print('-' * 75)
    for name, m in all_metrics.items():
        print(f"{name:<25} {m['accuracy']:>10.4f} {m['precision']:>10.4f} {m['recall']:>10.4f} {m['f1']:>10.4f} {m['roc_auc']:>10.4f}")


if __name__ == '__main__':
    evaluate_all_models()
