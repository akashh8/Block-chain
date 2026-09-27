"""
Stage 3 — Random Forest Classification

Trains/scores a RandomForestClassifier on features:
  - Consensus deviation
  - Isolation score (from Stage 2)
  - Degree centrality
  - Betweenness centrality
  - Reputation score

Output: Malicious Probability (RFScore) in 0–1.

When no labeled training data is available, uses semi-supervised approach:
generates synthetic labels from feature thresholds.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List, Optional
from app.config import RF_N_ESTIMATORS


class RandomForestModel:
    def __init__(self, n_estimators: int = RF_N_ESTIMATORS):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=10,
            min_samples_split=3,
            random_state=42,
            n_jobs=-1,
            class_weight="balanced",
        )
        self.is_fitted = False

    def _prepare_features(self, features_list: List[dict]) -> np.ndarray:
        """Extract feature matrix for RF classification."""
        return np.array([
            [
                f["consensus_deviation"],
                f["isolation_score"],
                f["degree_centrality"],
                f["betweenness_centrality"],
                f["reputation"],
            ]
            for f in features_list
        ])

    def _generate_synthetic_labels(self, features_list: List[dict]) -> np.ndarray:
        """
        Generate synthetic labels when no ground truth is available.
        Heuristic: nodes with high deviation + high isolation score + low reputation
        are labeled as potentially malicious.
        """
        labels = []
        for f in features_list:
            # Weighted heuristic score
            suspicion = (
                0.35 * f["consensus_deviation"]
                + 0.35 * f["isolation_score"]
                + 0.30 * (1.0 - f["reputation"])
            )
            labels.append(1 if suspicion > 0.55 else 0)

        return np.array(labels)

    def fit(
        self, features_list: List[dict], labels: Optional[List[int]] = None
    ) -> None:
        """Train the Random Forest classifier."""
        X = self._prepare_features(features_list)

        if labels is None:
            y = self._generate_synthetic_labels(features_list)
        else:
            y = np.array(labels)

        # Need at least 2 samples and both classes
        if X.shape[0] < 2:
            return

        unique_classes = np.unique(y)
        if len(unique_classes) < 2:
            # Add a synthetic sample for the missing class
            if 1 not in unique_classes:
                synthetic = X.mean(axis=0) + np.random.randn(X.shape[1]) * 0.5
                X = np.vstack([X, synthetic.reshape(1, -1)])
                y = np.append(y, 1)
            else:
                synthetic = X.mean(axis=0) - np.random.randn(X.shape[1]) * 0.5
                X = np.vstack([X, synthetic.reshape(1, -1)])
                y = np.append(y, 0)

        self.model.fit(X, y)
        self.is_fitted = True

    def score(self, features_list: List[dict]) -> List[float]:
        """
        Score nodes — return malicious probability (0–1).
        Uses predict_proba to get calibrated probabilities.
        """
        X = self._prepare_features(features_list)

        if not self.is_fitted:
            # Auto-fit with synthetic labels
            self.fit(features_list)

        if not self.is_fitted:
            return [0.3] * len(features_list)

        # probability of class 1 (malicious)
        probas = self.model.predict_proba(X)

        # Handle case where model only has 1 class
        if probas.shape[1] == 1:
            return [0.3] * len(features_list)

        return probas[:, 1].tolist()


# Singleton instance
random_forest = RandomForestModel()
