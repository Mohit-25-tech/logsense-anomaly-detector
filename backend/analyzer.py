"""
analyzer.py — Anomaly detection using scikit-learn Isolation Forest.
Works on parsed log data from MongoDB.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


def detect_anomalies(logs: list[dict], contamination: float = 0.05) -> list[dict]:
    """
    Run Isolation Forest over the parsed logs and return anomalous log entries.

    Feature engineering:
    - Error frequency per minute bucket
    - Level encoded as integer (DEBUG=0, INFO=1, WARNING=2, ERROR=3)
    - Message length

    Parameters
    ----------
    logs : list of parsed log dicts (timestamp, level, module, message)
    contamination : expected fraction of anomalies (default 5 %)

    Returns
    -------
    list of log dicts that were flagged as anomalous
    """
    if not logs:
        return []

    LEVEL_INT = {"DEBUG": 0, "INFO": 1, "WARNING": 2, "ERROR": 3}

    # Build a DataFrame from logs
    df = pd.DataFrame(logs)
    df["level_int"] = df["level"].map(lambda l: LEVEL_INT.get(l.upper(), 1))
    df["msg_len"] = df["message"].apply(len)

    # Try to parse timestamps for time-based features
    df["ts_parsed"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
    df["ts_epoch"] = df["ts_parsed"].apply(
        lambda t: t.timestamp() if pd.notna(t) else 0.0
    )

    # Per-minute error count (rolling window approximation per row)
    if df["ts_epoch"].max() > 0:
        df_sorted = df.sort_values("ts_epoch")
        df_sorted["minute_bucket"] = (df_sorted["ts_epoch"] // 60).astype(int)
        error_counts = (
            df_sorted[df_sorted["level_int"] >= 3]
            .groupby("minute_bucket")
            .size()
            .to_dict()
        )
        df_sorted["errors_per_min"] = df_sorted["minute_bucket"].map(
            lambda b: error_counts.get(b, 0)
        )
        df = df_sorted
    else:
        df["errors_per_min"] = 0

    features = df[["level_int", "msg_len", "errors_per_min"]].values

    # Need at least 2 samples for IsolationForest
    if len(features) < 2:
        return []

    # Clamp contamination so it stays in (0, 0.5]
    effective_contamination = min(max(contamination, 0.001), 0.5)

    clf = IsolationForest(
        n_estimators=100,
        contamination=effective_contamination,
        random_state=42,
    )
    preds = clf.fit_predict(features)  # -1 = anomaly, 1 = normal

    anomaly_indices = np.where(preds == -1)[0]
    original_indices = df.index.tolist()

    anomalies = []
    for i in anomaly_indices:
        original_idx = original_indices[i] if i < len(original_indices) else i
        if original_idx < len(logs):
            anomalies.append(logs[original_idx])

    return anomalies
