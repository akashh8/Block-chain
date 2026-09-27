"""
GBRC ML Service — FastAPI Application

Provides REST endpoints for the GBRC pipeline (Stages 2-5):
  - POST /api/ml/score-nodes    — Run full pipeline on a batch of nodes
  - POST /api/ml/train          — Retrain ML models on provided data
  - GET  /api/ml/graph-analytics — Return current graph metrics
  - GET  /api/ml/health          — Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.schemas import (
    ScoringRequest,
    ScoringResponse,
    NodeScore,
    TrainingRequest,
    HealthResponse,
)
from app.models.isolation_forest import isolation_forest
from app.models.random_forest import random_forest
from app.models.bayesian_stacking import bayesian_stacker
from app.graph.analytics import graph_analytics
from app.config import ML_SERVICE_HOST, ML_SERVICE_PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gbrc-ml")

app = FastAPI(
    title="GBRC ML Service",
    description="Graph-Based Reputation Consensus — ML & Graph Analytics Pipeline (Stages 2-5)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/ml/score-nodes", response_model=ScoringResponse)
async def score_nodes(request: ScoringRequest):
    """
    Run the full GBRC pipeline (Stages 2-5) on a batch of nodes.
    
    Pipeline:
      Stage 2: Isolation Forest anomaly detection
      Stage 3: Random Forest classification (uses centralities from Stage 4)
      Stage 4: Graph analytics (NetworkX centralities + trust score)
      Stage 5: Bayesian stacking (weighted combination + calibration)
    """
    try:
        nodes = request.nodes
        edges = request.edges

        if not nodes:
            raise HTTPException(status_code=400, detail="No nodes provided")

        logger.info(f"Scoring {len(nodes)} nodes with {len(edges)} edges")

        # ── Stage 4: Graph Analytics (compute first — RF needs centralities) ──
        edge_dicts = [e.dict() for e in edges]
        graph_analytics.build_graph(edge_dicts)
        centralities = graph_analytics.compute_centralities()
        trust_scores = graph_analytics.compute_graph_trust_scores()
        graph_metrics = graph_analytics.get_graph_metrics()

        # ── Stage 2: Isolation Forest ──
        if_features = [
            {
                "tx_frequency": n.tx_frequency,
                "transfer_volume": n.transfer_volume,
                "consensus_deviation": n.consensus_deviation,
                "reputation": n.reputation,
            }
            for n in nodes
        ]
        isolation_scores = isolation_forest.score(if_features)

        # ── Stage 3: Random Forest (needs isolation scores + centralities) ──
        rf_features = []
        for i, n in enumerate(nodes):
            node_centrality = centralities.get(n.node_id, {
                "degree": 0.0, "betweenness": 0.0,
                "closeness": 0.0, "eigenvector": 0.0,
            })
            rf_features.append({
                "consensus_deviation": n.consensus_deviation,
                "isolation_score": isolation_scores[i],
                "degree_centrality": node_centrality["degree"],
                "betweenness_centrality": node_centrality["betweenness"],
                "reputation": n.reputation,
            })

        rf_scores = random_forest.score(rf_features)

        # ── Stage 5: Bayesian Stacking ──
        graph_malicious_scores = [
            1.0 - trust_scores.get(n.node_id, 0.5) for n in nodes
        ]
        final_scores = bayesian_stacker.score(
            rf_scores, isolation_scores, graph_malicious_scores
        )

        # ── Assemble response ──
        node_scores = []
        for i, n in enumerate(nodes):
            node_centrality = centralities.get(n.node_id, {
                "degree": 0.0, "betweenness": 0.0,
                "closeness": 0.0, "eigenvector": 0.0,
            })
            node_scores.append(
                NodeScore(
                    node_id=n.node_id,
                    isolation_score=round(isolation_scores[i], 4),
                    rf_score=round(rf_scores[i], 4),
                    graph_trust_score=round(trust_scores.get(n.node_id, 0.5), 4),
                    graph_malicious_contribution=round(graph_malicious_scores[i], 4),
                    final_score=round(final_scores[i], 4),
                    centralities=node_centrality,
                )
            )

        logger.info(f"Scoring complete. Scores: {[(s.node_id, s.final_score) for s in node_scores]}")

        return ScoringResponse(scores=node_scores, graph_metrics=graph_metrics)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scoring error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/train")
async def train_models(request: TrainingRequest):
    """Retrain ML models on provided data."""
    try:
        nodes = request.nodes
        edges = request.edges
        labels = request.labels

        # Build graph and compute centralities
        edge_dicts = [e.dict() for e in edges]
        graph_analytics.build_graph(edge_dicts)
        centralities = graph_analytics.compute_centralities()

        # Train Isolation Forest
        if_features = [
            {
                "tx_frequency": n.tx_frequency,
                "transfer_volume": n.transfer_volume,
                "consensus_deviation": n.consensus_deviation,
                "reputation": n.reputation,
            }
            for n in nodes
        ]
        isolation_forest.fit(if_features)
        isolation_scores = isolation_forest.score(if_features)

        # Train Random Forest
        rf_features = []
        for i, n in enumerate(nodes):
            node_centrality = centralities.get(n.node_id, {
                "degree": 0.0, "betweenness": 0.0,
                "closeness": 0.0, "eigenvector": 0.0,
            })
            rf_features.append({
                "consensus_deviation": n.consensus_deviation,
                "isolation_score": isolation_scores[i],
                "degree_centrality": node_centrality["degree"],
                "betweenness_centrality": node_centrality["betweenness"],
                "reputation": n.reputation,
            })

        random_forest.fit(
            rf_features, labels if labels else None
        )

        return {
            "status": "ok",
            "message": f"Models trained on {len(nodes)} nodes",
            "isolation_forest_fitted": isolation_forest.is_fitted,
            "random_forest_fitted": random_forest.is_fitted,
        }

    except Exception as e:
        logger.error(f"Training error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/graph-analytics")
async def get_graph_analytics():
    """Return current graph-level metrics and centralities."""
    return {
        "metrics": graph_analytics.get_graph_metrics(),
        "centralities": graph_analytics.centralities,
        "trust_scores": graph_analytics.compute_graph_trust_scores(),
    }


@app.get("/api/ml/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        models_loaded=True,
        isolation_forest_fitted=isolation_forest.is_fitted,
        random_forest_fitted=random_forest.is_fitted,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=ML_SERVICE_HOST,
        port=ML_SERVICE_PORT,
        reload=True,
    )
