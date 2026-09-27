"""
Stage 4 — Graph Analytics (NetworkX)

Builds the node-interaction graph and computes:
  - Degree Centrality
  - Betweenness Centrality
  - Closeness Centrality
  - Eigenvector Centrality

Combines into a Graph Trust Score (0–1):
  GraphTrustScore = w_d * norm(degree) + w_b * norm(betweenness) 
                    + w_c * norm(closeness) + w_e * norm(eigenvector)

where weights default to: degree=0.25, betweenness=0.30, closeness=0.20, eigenvector=0.25.

Note: Trust is high when centrality scores are healthy (well-connected, integral nodes).
The malicious contribution from graph = (1 - GraphTrustScore).
"""

import networkx as nx
import numpy as np
from typing import List, Dict, Tuple
from app.config import (
    DEGREE_WEIGHT,
    BETWEENNESS_WEIGHT,
    CLOSENESS_WEIGHT,
    EIGENVECTOR_WEIGHT,
)


class GraphAnalytics:
    def __init__(self):
        self.graph: nx.DiGraph = nx.DiGraph()
        self.centralities: Dict[str, Dict[str, float]] = {}

    def build_graph(self, edges: List[dict]) -> None:
        """
        Build a directed graph from interaction edges.
        Edge weight = total transfer volume between nodes.
        """
        self.graph = nx.DiGraph()

        for edge in edges:
            from_node = edge["from_node"]
            to_node = edge["to_node"]
            volume = edge.get("volume", 1.0)
            count = edge.get("count", 1)

            if self.graph.has_edge(from_node, to_node):
                self.graph[from_node][to_node]["weight"] += volume
                self.graph[from_node][to_node]["count"] += count
            else:
                self.graph.add_edge(
                    from_node, to_node, weight=volume, count=count
                )

    def compute_centralities(self) -> Dict[str, Dict[str, float]]:
        """
        Compute all four centrality metrics for each node.
        Returns: { node_id: { degree, betweenness, closeness, eigenvector } }
        """
        if self.graph.number_of_nodes() == 0:
            return {}

        # Convert to undirected for some metrics
        undirected = self.graph.to_undirected()

        # Degree centrality (directed)
        degree = nx.degree_centrality(self.graph)

        # Betweenness centrality (directed, weighted)
        try:
            betweenness = nx.betweenness_centrality(
                self.graph, weight="weight", normalized=True
            )
        except Exception:
            betweenness = {n: 0.0 for n in self.graph.nodes()}

        # Closeness centrality (undirected)
        try:
            closeness = nx.closeness_centrality(undirected)
        except Exception:
            closeness = {n: 0.0 for n in self.graph.nodes()}

        # Eigenvector centrality (undirected, with fallback)
        try:
            eigenvector = nx.eigenvector_centrality(
                undirected, max_iter=1000, weight="weight"
            )
        except (nx.PowerIterationFailedConvergence, nx.NetworkXException):
            # Fallback: use degree centrality as proxy
            eigenvector = degree.copy()

        # Combine into per-node dict
        all_nodes = set(self.graph.nodes())
        self.centralities = {}

        for node in all_nodes:
            self.centralities[node] = {
                "degree": degree.get(node, 0.0),
                "betweenness": betweenness.get(node, 0.0),
                "closeness": closeness.get(node, 0.0),
                "eigenvector": eigenvector.get(node, 0.0),
            }

        return self.centralities

    def compute_graph_trust_scores(self) -> Dict[str, float]:
        """
        Compute the Graph Trust Score for each node (0–1).
        
        Formula:
          GraphTrustScore = w_d * norm(degree) + w_b * norm(betweenness)
                           + w_c * norm(closeness) + w_e * norm(eigenvector)
        
        Normalization: min-max per metric across all nodes.
        """
        if not self.centralities:
            self.compute_centralities()

        if not self.centralities:
            return {}

        nodes = list(self.centralities.keys())
        metrics = ["degree", "betweenness", "closeness", "eigenvector"]
        weights = {
            "degree": DEGREE_WEIGHT,
            "betweenness": BETWEENNESS_WEIGHT,
            "closeness": CLOSENESS_WEIGHT,
            "eigenvector": EIGENVECTOR_WEIGHT,
        }

        # Min-max normalize each metric
        normalized: Dict[str, Dict[str, float]] = {n: {} for n in nodes}

        for metric in metrics:
            values = [self.centralities[n][metric] for n in nodes]
            min_val = min(values)
            max_val = max(values)
            range_val = max_val - min_val if max_val > min_val else 1.0

            for node in nodes:
                normalized[node][metric] = (
                    self.centralities[node][metric] - min_val
                ) / range_val

        # Weighted combination
        trust_scores: Dict[str, float] = {}
        for node in nodes:
            score = sum(
                weights[m] * normalized[node][m] for m in metrics
            )
            trust_scores[node] = float(np.clip(score, 0.0, 1.0))

        return trust_scores

    def get_graph_metrics(self) -> Dict[str, float]:
        """Return overall graph-level metrics."""
        if self.graph.number_of_nodes() == 0:
            return {
                "num_nodes": 0,
                "num_edges": 0,
                "density": 0.0,
                "avg_clustering": 0.0,
            }

        undirected = self.graph.to_undirected()

        return {
            "num_nodes": float(self.graph.number_of_nodes()),
            "num_edges": float(self.graph.number_of_edges()),
            "density": float(nx.density(self.graph)),
            "avg_clustering": float(nx.average_clustering(undirected)),
        }


# Singleton instance
graph_analytics = GraphAnalytics()
