import os

ML_SERVICE_PORT = int(os.getenv("ML_SERVICE_PORT", "8000"))
ML_SERVICE_HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")

# GBRC pipeline weights (Stage 5 — Bayesian Stacking)
RF_WEIGHT = float(os.getenv("RF_WEIGHT", "0.4"))
IF_WEIGHT = float(os.getenv("IF_WEIGHT", "0.3"))
GRAPH_WEIGHT = float(os.getenv("GRAPH_WEIGHT", "0.3"))

# Graph Trust Score weights (Stage 4)
DEGREE_WEIGHT = float(os.getenv("DEGREE_WEIGHT", "0.25"))
BETWEENNESS_WEIGHT = float(os.getenv("BETWEENNESS_WEIGHT", "0.30"))
CLOSENESS_WEIGHT = float(os.getenv("CLOSENESS_WEIGHT", "0.20"))
EIGENVECTOR_WEIGHT = float(os.getenv("EIGENVECTOR_WEIGHT", "0.25"))

# Isolation Forest contamination
IF_CONTAMINATION = float(os.getenv("IF_CONTAMINATION", "0.15"))

# Random Forest
RF_N_ESTIMATORS = int(os.getenv("RF_N_ESTIMATORS", "100"))
