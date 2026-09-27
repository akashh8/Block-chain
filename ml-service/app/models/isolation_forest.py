"""
Stage 2 — Isolation Forest Anomaly Detection

Trains/scores an IsolationForest on node features:
  - Transaction frequency
  - Transfer volume
  - Consensus deviation
  - Reputation score

Output: Anomaly Score normalized to 0–1 (higher = more anomalous).
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Tuple
from app.config import IF_CONTAMINATION


class IsolationForestModel:
    def __init__(self, contamination: float = IF_CONTAMINATION):
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
        )
        self.is_fitted = False

    def _prepare_features(self, features_list: List[dict]) -> np.ndarray:
        """Extract feature matrix from node feature dicts."""
        return np.array([
            [
                f["tx_frequency"],
                f["transfer_volume"],
                f["consensus_deviation"],
                f["reputation"],
            ]
            for f in features_list
        ])

    def fit(self, features_list: List[dict]) -> None:
        """Train the Isolation Forest on historical node data."""
        X = self._prepare_features(features_list)
        if X.shape[0] < 2:
            return
        self.model.fit(X)
        self.is_fitted = True

    def score(self, features_list: List[dict]) -> List[float]:
        """
        Score nodes. Returns anomaly scores normalized to 0–1.
        
        IsolationForest.decision_function returns negative scores for anomalies.
        We transform: anomaly_score = 1 - sigmoid(decision_score)
        so that higher values = more anomalous.
        """
        X = self._prepare_features(features_list)

        if not self.is_fitted:
            # If not yet fitted, fit on current data
            if X.shape[0] >= 2:
                self.model.fit(X)
                self.is_fitted = True
            else:
                return [0.5] * len(features_list)

        # decision_function: more negative = more anomalous
        raw_scores = self.model.decision_function(X)

        # Normalize to 0–1 using sigmoid-like transformation
        # Shift and scale so that anomalies (negative scores) map to high values
        normalized = self._normalize_scores(raw_scores)

        return normalized.tolist()

    def _normalize_scores(self, raw_scores: np.ndarray) -> np.ndarray:
        """
        Normalize Isolation Forest scores to 0–1.
        Uses sigmoid transformation: score = 1 / (1 + exp(k * raw))
        where k controls steepness. Higher raw = more normal, so we invert.
        """
        k = 5.0  # steepness
        sigmoid = 1.0 / (1.0 + np.exp(k * raw_scores))
        return np.clip(sigmoid, 0.0, 1.0)


# Singleton instance
isolation_forest = IsolationForestModel()
