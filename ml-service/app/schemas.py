from pydantic import BaseModel
from typing import List, Optional, Dict


class NodeFeatures(BaseModel):
    """Input features for a single node in the GBRC pipeline."""
    node_id: str
    tx_frequency: float
    transfer_volume: float
    consensus_deviation: float
    reputation: float
    total_transactions: int = 0
    successful_transactions: int = 0


class InteractionEdge(BaseModel):
    """Edge in the node interaction graph."""
    from_node: str
    to_node: str
    volume: float
    count: int = 1


class ScoringRequest(BaseModel):
    """Request to score a batch of nodes through the GBRC pipeline (Stages 2-5)."""
    nodes: List[NodeFeatures]
    edges: List[InteractionEdge]


class NodeScore(BaseModel):
    """GBRC scoring output for a single node."""
    node_id: str
    isolation_score: float  # Stage 2
    rf_score: float         # Stage 3
    graph_trust_score: float  # Stage 4
    graph_malicious_contribution: float  # 1 - graph_trust_score
    final_score: float      # Stage 5
    centralities: Dict[str, float]


class ScoringResponse(BaseModel):
    """Response with scores for all nodes."""
    scores: List[NodeScore]
    graph_metrics: Dict[str, float]


class TrainingRequest(BaseModel):
    """Training data for ML models."""
    nodes: List[NodeFeatures]
    edges: List[InteractionEdge]
    labels: Optional[List[int]] = None  # 0=benign, 1=malicious (for supervised RF)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    models_loaded: bool
    isolation_forest_fitted: bool
    random_forest_fitted: bool
