"""
Stage 5 — Bayesian Stacking Layer

Combines three signals into the final malicious probability:
  FinalScore = 0.4 * RFScore + 0.3 * IsolationScore + 0.3 * GraphScore

Where GraphScore = (1 - GraphTrustScore) — the malicious contribution from graph.

Bayesian Calibration:
  Treats the weighted score as a prior estimate of malicious probability.
  Uses a Beta distribution prior + Bernoulli likelihood model to produce
  a calibrated posterior probability.
  
  Prior: Beta(alpha_prior, beta_prior) where:
    alpha_prior = weighted_score * strength
    beta_prior = (1 - weighted_score) * strength
  
  The strength parameter controls how much the prior dominates.
  With no additional evidence, posterior ≈ prior, which is the weighted score.
"""

import numpy as np
from scipy.stats import beta as beta_dist
from typing import List
from app.config import RF_WEIGHT, IF_WEIGHT, GRAPH_WEIGHT


class BayesianStacker:
    def __init__(
        self,
        rf_weight: float = RF_WEIGHT,
        if_weight: float = IF_WEIGHT,
        graph_weight: float = GRAPH_WEIGHT,
        prior_strength: float = 10.0,
    ):
        self.rf_weight = rf_weight
        self.if_weight = if_weight
        self.graph_weight = graph_weight
        self.prior_strength = prior_strength

    def compute_weighted_score(
        self,
        rf_score: float,
        isolation_score: float,
        graph_malicious_score: float,
    ) -> float:
        """
        Stage 5 weighted combination:
        FinalScore = 0.4 * RFScore + 0.3 * IsolationScore + 0.3 * GraphMaliciousScore
        """
        return (
            self.rf_weight * rf_score
            + self.if_weight * isolation_score
            + self.graph_weight * graph_malicious_score
        )

    def bayesian_calibrate(self, weighted_score: float) -> float:
        """
        Apply Bayesian calibration to the weighted score.
        
        Uses Beta distribution:
          Prior: Beta(weighted_score * strength, (1 - weighted_score) * strength)
          Posterior mean = alpha / (alpha + beta)
        
        This smooths extreme values and provides calibrated probabilities.
        """
        # Clamp to avoid edge cases
        p = np.clip(weighted_score, 0.01, 0.99)

        alpha = p * self.prior_strength
        beta_param = (1.0 - p) * self.prior_strength

        # Posterior mean of Beta distribution
        posterior_mean = alpha / (alpha + beta_param)

        return float(np.clip(posterior_mean, 0.0, 1.0))

    def score(
        self,
        rf_scores: List[float],
        isolation_scores: List[float],
        graph_malicious_scores: List[float],
    ) -> List[float]:
        """
        Compute final Bayesian-calibrated malicious probability for each node.
        """
        final_scores = []

        for rf, iso, graph_mal in zip(
            rf_scores, isolation_scores, graph_malicious_scores
        ):
            weighted = self.compute_weighted_score(rf, iso, graph_mal)
            calibrated = self.bayesian_calibrate(weighted)
            final_scores.append(calibrated)

        return final_scores


# Singleton instance
bayesian_stacker = BayesianStacker()
