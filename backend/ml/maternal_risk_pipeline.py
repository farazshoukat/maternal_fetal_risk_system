"""
================================================================================
  MATERNAL HEALTH RISK PREDICTION PIPELINE
  Maternal-Fetal Risk System — Backend ML Module
================================================================================

DISCLAIMER:
  This model is strictly for EDUCATIONAL and RESEARCH purposes.
  It must NOT be used as a substitute for professional medical diagnosis,
  clinical judgment, or treatment decisions. Always consult a qualified
  healthcare provider for medical advice.

  Model outputs should be treated as decision-support signals only,
  subject to review by certified clinicians.

Dependencies: scikit-learn, xgboost, pandas, numpy, matplotlib, seaborn
================================================================================
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

import warnings
warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use("Agg")  # non-interactive backend — required for headless / Windows
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_auc_score,
    f1_score,
)
from sklearn.pipeline import Pipeline
from sklearn.inspection import permutation_importance

import xgboost as xgb

import joblib
import os

# ─────────────────────────────────────────────────────────────────────────────
# 1. CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

RANDOM_STATE = 42
TEST_SIZE = 0.20
OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

TARGET_COLUMN = "RiskLevel"
FEATURE_COLUMNS = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate"]

# Clinical reference ranges used for outlier context (not hard filters)
CLINICAL_BOUNDS = {
    "Age":         (10, 70),
    "SystolicBP":  (60, 200),
    "DiastolicBP": (40, 140),
    "BS":          (3.0, 30.0),   # mmol/L
    "BodyTemp":    (35.0, 42.0),  # Celsius
    "HeartRate":   (40, 180),
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. DATA LOADING & SYNTHETIC GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def load_or_generate_data(filepath: str = "maternal_health_risk.csv") -> pd.DataFrame:
    """
    Load dataset from CSV if available; otherwise synthesise a representative
    sample that mirrors the UCI Maternal Health Risk dataset distribution.
    Replace the CSV path with the actual dataset in production.
    """
    if os.path.exists(filepath):
        print(f"[DATA] Loaded dataset from: {filepath}")
        df = pd.read_csv(filepath)
    else:
        print("[DATA] Dataset not found — generating synthetic data for demonstration.")
        df = _generate_synthetic_data(n=1000)
        df.to_csv(filepath, index=False)
        print(f"[DATA] Synthetic dataset saved to: {filepath}")
    return df


def _generate_synthetic_data(n: int = 1000) -> pd.DataFrame:
    """Generate a synthetic maternal health dataset mirroring UCI distributions."""
    rng = np.random.default_rng(RANDOM_STATE)
    n_low  = int(n * 0.40)
    n_mid  = int(n * 0.33)
    n_high = n - n_low - n_mid

    def _make_segment(size, sbp_mu, dbp_mu, bs_mu, temp_mu, hr_mu, label):
        return pd.DataFrame({
            "Age":         rng.integers(18, 45, size=size).astype(float),
            "SystolicBP":  rng.normal(sbp_mu,  10, size=size).clip(70, 180),
            "DiastolicBP": rng.normal(dbp_mu,   8, size=size).clip(40, 120),
            "BS":          rng.normal(bs_mu,    1.5, size=size).clip(4.0, 20.0),
            "BodyTemp":    rng.normal(temp_mu,  0.4, size=size).clip(36.0, 41.0),
            "HeartRate":   rng.normal(hr_mu,    8,  size=size).clip(50, 160),
            TARGET_COLUMN: label,
        })

    low  = _make_segment(n_low,  120, 80,  7.0,  98.0, 76, "low risk")
    mid  = _make_segment(n_mid,  135, 90,  9.5,  99.0, 85, "mid risk")
    high = _make_segment(n_high, 155, 100, 14.0, 100.0, 95, "high risk")

    df = pd.concat([low, mid, high], ignore_index=True).sample(frac=1, random_state=RANDOM_STATE)
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. EXPLORATORY DATA ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

def run_eda(df: pd.DataFrame) -> None:
    """Print summary stats and save distribution plots."""
    print("\n" + "="*60)
    print("  EXPLORATORY DATA ANALYSIS")
    print("="*60)
    print(f"\nShape: {df.shape}")
    print(f"\nClass Distribution:\n{df[TARGET_COLUMN].value_counts()}")
    print(f"\nMissing Values:\n{df.isnull().sum()}")
    print(f"\nDescriptive Statistics:\n{df[FEATURE_COLUMNS].describe().round(2)}")

    # Distribution plots
    fig, axes = plt.subplots(2, 3, figsize=(15, 8))
    fig.suptitle("Feature Distributions by Risk Level", fontsize=14, fontweight="bold")
    palette = {"low risk": "#2ecc71", "mid risk": "#f39c12", "high risk": "#e74c3c"}
    axes = axes.flatten()

    for i, col in enumerate(FEATURE_COLUMNS):
        for label, color in palette.items():
            subset = df[df[TARGET_COLUMN] == label][col]
            axes[i].hist(subset, bins=25, alpha=0.6, label=label, color=color)
        axes[i].set_title(col)
        axes[i].set_xlabel(col)
        axes[i].legend(fontsize=8)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "feature_distributions.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"\n[EDA] Distribution plot saved → {path}")

    # Correlation heatmap
    plt.figure(figsize=(8, 6))
    corr = df[FEATURE_COLUMNS].corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", square=True, linewidths=0.5)
    plt.title("Feature Correlation Matrix")
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "correlation_heatmap.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[EDA] Correlation heatmap saved → {path}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame):
    """
    Steps:
      1. Clamp values to clinical bounds (soft outlier handling)
      2. Isolation Forest for anomaly flagging (not removal by default)
      3. Encode target variable
      4. Train/test split (stratified)
      5. StandardScaler fit on training set only (prevent data leakage)

    Returns:
      X_train, X_test, y_train, y_test, scaler, label_encoder, feature_names
    """
    print("\n" + "="*60)
    print("  PREPROCESSING")
    print("="*60)

    df = df.copy()

    # 4.1 — Soft clamp to clinical bounds
    for col, (lo, hi) in CLINICAL_BOUNDS.items():
        if col in df.columns:
            before = df[col].between(lo, hi).sum()
            df[col] = df[col].clip(lo, hi)
            after  = df[col].between(lo, hi).sum()
            print(f"  [CLIP] {col}: {len(df) - before} values clamped to [{lo}, {hi}]")

    # 4.2 — Isolation Forest anomaly flagging
    iso = IsolationForest(contamination=0.05, random_state=RANDOM_STATE)
    df["anomaly_flag"] = iso.fit_predict(df[FEATURE_COLUMNS])
    n_anomalies = (df["anomaly_flag"] == -1).sum()
    print(f"  [ANOMALY] Isolation Forest flagged {n_anomalies} potential outliers "
          f"({n_anomalies/len(df)*100:.1f}%) — flagged but RETAINED for clinical review.")
    df = df.drop(columns=["anomaly_flag"])

    # 4.3 — Encode target
    le = LabelEncoder()
    df["RiskEncoded"] = le.fit_transform(df[TARGET_COLUMN])
    print(f"  [ENCODE] Classes: {dict(zip(le.classes_, le.transform(le.classes_)))}")

    X = df[FEATURE_COLUMNS].values
    y = df["RiskEncoded"].values

    # 4.4 — Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )
    print(f"  [SPLIT] Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")

    # 4.5 — Feature scaling (fit on train only)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)
    print("  [SCALE] StandardScaler applied (fitted on training set only)")

    return X_train, X_test, y_train, y_test, scaler, le, FEATURE_COLUMNS


# ─────────────────────────────────────────────────────────────────────────────
# 5. MODEL TRAINING & CROSS-VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def build_models() -> dict:
    """Return model definitions."""
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_split=5,
            class_weight="balanced",   # handles class imbalance
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }
    return models


def train_and_evaluate(models: dict, X_train, X_test, y_train, y_test, le) -> dict:
    """
    Train each model, run 5-fold stratified CV, evaluate on held-out test set.
    Healthcare-focused metrics: Recall & F1-Score are primary.
    """
    print("\n" + "="*60)
    print("  MODEL TRAINING & EVALUATION")
    print("="*60)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    results = {}

    for name, model in models.items():
        print(f"\n{'─'*50}")
        print(f"  Model: {name}")
        print(f"{'─'*50}")

        # Cross-validation (macro F1 — balances across all risk classes)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv,
                                    scoring="f1_macro", n_jobs=-1)
        print(f"  CV Macro-F1:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        # Fit on full training set
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Classification report
        report = classification_report(y_test, y_pred,
                                       target_names=le.classes_,
                                       output_dict=True)
        print(f"\n  Classification Report (Test Set):")
        print(classification_report(y_test, y_pred, target_names=le.classes_))

        # ⚠️ Healthcare safety note: Recall for "high risk" is CRITICAL
        hr_idx = list(le.classes_).index("high risk")
        high_risk_recall = report["high risk"]["recall"]
        print(f"  ⚠  High-Risk Recall: {high_risk_recall:.4f}  "
              f"(Minimising false negatives — safety-critical metric)")

        # Confusion matrix
        _plot_confusion_matrix(y_test, y_pred, le.classes_, name)

        results[name] = {
            "model":            model,
            "cv_f1_macro_mean": cv_scores.mean(),
            "cv_f1_macro_std":  cv_scores.std(),
            "classification_report": report,
            "high_risk_recall": high_risk_recall,
            "y_pred":           y_pred,
        }

    return results


def _plot_confusion_matrix(y_true, y_pred, class_names, model_name: str) -> None:
    cm = confusion_matrix(y_true, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_names)
    fig, ax = plt.subplots(figsize=(7, 6))
    disp.plot(ax=ax, colorbar=False, cmap="Blues")
    ax.set_title(f"Confusion Matrix — {model_name}", fontsize=12, fontweight="bold")
    plt.tight_layout()
    fname = model_name.lower().replace(" ", "_")
    path = os.path.join(OUTPUT_DIR, f"confusion_matrix_{fname}.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"  [PLOT] Confusion matrix saved → {path}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. MODEL COMPARISON & SELECTION
# ─────────────────────────────────────────────────────────────────────────────

def select_best_model(results: dict) -> tuple[str, dict]:
    """
    Primary criterion: High-Risk Recall (patient safety).
    Secondary criterion: Macro F1-Score (overall balance).
    """
    print("\n" + "="*60)
    print("  MODEL COMPARISON")
    print("="*60)

    comparison = []
    for name, res in results.items():
        macro_f1 = res["classification_report"]["macro avg"]["f1-score"]
        comparison.append({
            "Model":             name,
            "CV Macro-F1 Mean":  f"{res['cv_f1_macro_mean']:.4f}",
            "CV Macro-F1 Std":   f"±{res['cv_f1_macro_std']:.4f}",
            "Test Macro-F1":     f"{macro_f1:.4f}",
            "High-Risk Recall":  f"{res['high_risk_recall']:.4f}",
        })

    comp_df = pd.DataFrame(comparison)
    print(f"\n{comp_df.to_string(index=False)}")

    # Select by highest High-Risk Recall, break ties by CV Macro-F1
    best_name = max(results.items(),
                    key=lambda kv: (kv[1]["high_risk_recall"],
                                    kv[1]["cv_f1_macro_mean"]))[0]
    print(f"\n✅ Best Model Selected: {best_name}  "
          f"(High-Risk Recall: {results[best_name]['high_risk_recall']:.4f})")
    return best_name, results[best_name]


# ─────────────────────────────────────────────────────────────────────────────
# 7. FEATURE IMPORTANCE & INTERPRETABILITY
# ─────────────────────────────────────────────────────────────────────────────

def explain_model(model, X_test, y_test, feature_names: list, model_name: str) -> None:
    """
    Two interpretability layers:
      - Native feature importance (impurity / gain-based)
      - Permutation importance (model-agnostic, more reliable)
    """
    print("\n" + "="*60)
    print("  FEATURE IMPORTANCE & INTERPRETABILITY")
    print("="*60)

    # --- Native importance ---
    if hasattr(model, "feature_importances_"):
        native_imp = pd.Series(model.feature_importances_, index=feature_names)
        native_imp = native_imp.sort_values(ascending=False)
        print(f"\n  Native Feature Importances ({model_name}):")
        for feat, imp in native_imp.items():
            bar = "█" * int(imp * 40)
            print(f"    {feat:<14} {imp:.4f}  {bar}")

    # --- Permutation importance (safer for correlated features) ---
    perm = permutation_importance(model, X_test, y_test,
                                  n_repeats=15, random_state=RANDOM_STATE, n_jobs=-1)
    perm_imp = pd.Series(perm.importances_mean, index=feature_names)
    perm_imp = perm_imp.sort_values(ascending=False)

    print(f"\n  Permutation Importances ({model_name}) [mean drop in Macro-F1]:")
    for feat, imp in perm_imp.items():
        bar = "█" * max(0, int(imp * 200))
        print(f"    {feat:<14} {imp:.4f}  {bar}")

    # Plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle(f"Feature Importance — {model_name}", fontsize=13, fontweight="bold")

    if hasattr(model, "feature_importances_"):
        native_imp.plot(kind="barh", ax=axes[0], color="#3498db", edgecolor="white")
        axes[0].set_title("Native (Impurity / Gain)")
        axes[0].invert_yaxis()

    perm_imp.plot(kind="barh", ax=axes[1], color="#e74c3c", edgecolor="white")
    axes[1].set_title("Permutation Importance")
    axes[1].invert_yaxis()

    plt.tight_layout()
    fname = model_name.lower().replace(" ", "_")
    path = os.path.join(OUTPUT_DIR, f"feature_importance_{fname}.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"\n  [PLOT] Feature importance chart saved → {path}")


# ─────────────────────────────────────────────────────────────────────────────
# 8. MODEL FAIRNESS CHECK
# ─────────────────────────────────────────────────────────────────────────────

def fairness_check(model, scaler, le, df_original: pd.DataFrame) -> None:
    """
    Demographic Parity & Equal Opportunity check.
    Uses Age as a proxy demographic group (since gender/ethnicity data is absent).
    This demonstrates the fairness audit pattern — extend with real demographic
    columns (e.g., ethnicity, socioeconomic status) when available.

    Checks:
      - Positive Rate Parity: Are high-risk predictions uniformly distributed?
      - Equal Opportunity: Is High-Risk Recall consistent across age groups?
    """
    print("\n" + "="*60)
    print("  MODEL FAIRNESS AUDIT")
    print("="*60)
    print("  [NOTE] Using 'Age Group' as proxy demographic — extend with real")
    print("         demographic attributes (ethnicity, SES) in production.\n")

    df = df_original.copy()

    # Create age bins
    df["AgeGroup"] = pd.cut(df["Age"],
                            bins=[0, 25, 35, 45, 100],
                            labels=["<25", "25-35", "35-45", "45+"])

    X_all = scaler.transform(df[FEATURE_COLUMNS].values)
    y_pred_all = model.predict(X_all)
    y_true_all = le.transform(df[TARGET_COLUMN])

    high_risk_label = list(le.classes_).index("high risk")

    rows = []
    for group in df["AgeGroup"].cat.categories:
        mask = (df["AgeGroup"] == group).values
        if mask.sum() == 0:
            continue
        y_t = y_true_all[mask]
        y_p = y_pred_all[mask]

        n = mask.sum()
        positive_rate = (y_p == high_risk_label).mean()

        # Equal opportunity — recall for high-risk class in this group
        hr_mask = (y_t == high_risk_label)
        recall_hr = (y_p[hr_mask] == high_risk_label).mean() if hr_mask.sum() > 0 else float("nan")

        rows.append({
            "Age Group":        group,
            "N":                n,
            "Predicted High-Risk Rate": f"{positive_rate:.3f}",
            "High-Risk Recall": f"{recall_hr:.3f}" if not np.isnan(recall_hr) else "N/A",
        })

    fair_df = pd.DataFrame(rows)
    print(fair_df.to_string(index=False))

    # Disparity check
    rates = [float(r["Predicted High-Risk Rate"]) for r in rows]
    max_disparity = max(rates) - min(rates)
    threshold = 0.10  # 10 percentage-point disparity flag

    print(f"\n  Demographic Parity Disparity: {max_disparity:.3f}")
    if max_disparity > threshold:
        print(f"  ⚠️  FAIRNESS ALERT: Disparity > {threshold:.0%} threshold.")
        print("      Investigate for potential age-related bias before deployment.")
    else:
        print(f"  ✅ Fairness check passed (disparity ≤ {threshold:.0%}).")

    print("\n  Recommended additional checks in production:")
    print("    • Equalized odds across ethnicity / socioeconomic strata")
    print("    • Calibration curves per demographic group")
    print("    • Disparate impact ratio (≥ 0.80 recommended per EEOC 4/5ths rule)")


# ─────────────────────────────────────────────────────────────────────────────
# 9. MODEL PERSISTENCE
# ─────────────────────────────────────────────────────────────────────────────

def save_artifacts(model, scaler, le, model_name: str) -> None:
    """Serialize trained model, scaler, and encoder for FastAPI inference."""
    fname = model_name.lower().replace(" ", "_")
    joblib.dump(model,  os.path.join(OUTPUT_DIR, f"{fname}_model.pkl"))
    joblib.dump(scaler, os.path.join(OUTPUT_DIR, "scaler.pkl"))
    joblib.dump(le,     os.path.join(OUTPUT_DIR, "label_encoder.pkl"))
    print(f"\n[SAVE] Model artifacts saved to → ./{OUTPUT_DIR}/")
    print(f"       Model:         {fname}_model.pkl")
    print(f"       Scaler:        scaler.pkl")
    print(f"       Label Encoder: label_encoder.pkl")


# ─────────────────────────────────────────────────────────────────────────────
# 10. INFERENCE HELPER  (used by FastAPI endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def predict_risk(vitals: dict, model_path: str, scaler_path: str, le_path: str) -> dict:
    """
    Single-patient inference helper.

    Args:
        vitals: Dict with keys matching FEATURE_COLUMNS.
                e.g. {"Age": 28, "SystolicBP": 130, "DiastolicBP": 88,
                       "BS": 8.5, "BodyTemp": 98.6, "HeartRate": 80}
    Returns:
        {"risk_level": str, "probabilities": dict, "disclaimer": str}
    """
    model  = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    le     = joblib.load(le_path)

    X = np.array([[vitals[f] for f in FEATURE_COLUMNS]])
    X_scaled = scaler.transform(X)

    pred_class = model.predict(X_scaled)[0]
    pred_proba = model.predict_proba(X_scaled)[0]

    return {
        "risk_level":    le.inverse_transform([pred_class])[0],
        "probabilities": dict(zip(le.classes_, pred_proba.round(4).tolist())),
        "disclaimer":    (
            "⚠️ This prediction is generated by an ML model for research purposes only. "
            "It must be reviewed and validated by a qualified clinician before any "
            "clinical decision is made."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 11. MAIN PIPELINE ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "="*60)
    print("  MATERNAL HEALTH RISK -- ML PIPELINE")
    print("  WARNING: RESEARCH/EDUCATIONAL USE ONLY")
    print("="*60)

    # Step 1: Data
    df = load_or_generate_data()

    # Step 2: EDA
    run_eda(df)

    # Step 3: Preprocess
    X_train, X_test, y_train, y_test, scaler, le, feature_names = preprocess(df)

    # Step 4: Train & evaluate all models
    models   = build_models()
    results  = train_and_evaluate(models, X_train, X_test, y_train, y_test, le)

    # Step 5: Select best
    best_name, best_result = select_best_model(results)
    best_model = best_result["model"]

    # Step 6: Explain
    explain_model(best_model, X_test, y_test, feature_names, best_name)

    # Step 7: Fairness audit
    fairness_check(best_model, scaler, le, df)

    # Step 8: Save artifacts
    save_artifacts(best_model, scaler, le, best_name)

    print("\n" + "="*60)
    print("  PIPELINE COMPLETE")
    print(f"  Best Model : {best_name}")
    print(f"  High-Risk Recall : {best_result['high_risk_recall']:.4f}")
    print("  Outputs saved to ./outputs/")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
