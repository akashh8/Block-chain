import axios from 'axios';
import { config } from '../config';

interface MLNodeFeatures {
  node_id: string;
  tx_frequency: number;
  transfer_volume: number;
  consensus_deviation: number;
  reputation: number;
  total_transactions: number;
  successful_transactions: number;
}

interface MLEdge {
  from_node: string;
  to_node: string;
  volume: number;
  count: number;
}

interface MLNodeScore {
  node_id: string;
  isolation_score: number;
  rf_score: number;
  graph_trust_score: number;
  graph_malicious_contribution: number;
  final_score: number;
  centralities: {
    degree: number;
    betweenness: number;
    closeness: number;
    eigenvector: number;
  };
}

interface MLScoringResponse {
  scores: MLNodeScore[];
  graph_metrics: Record<string, number>;
}

/**
 * Client for communicating with the Python ML service.
 */
export class MLClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.mlServiceUrl;
  }

  /**
   * Score nodes through the ML pipeline (Stages 2-5).
   */
  async scoreNodes(
    nodes: MLNodeFeatures[],
    edges: MLEdge[]
  ): Promise<MLScoringResponse> {
    try {
      const response = await axios.post<MLScoringResponse>(
        `${this.baseUrl}/api/ml/score-nodes`,
        { nodes, edges },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error: any) {
      console.error('[MLClient] Score nodes error:', error.message);
      // Return fallback scores if ML service is unavailable
      return {
        scores: nodes.map((n) => ({
          node_id: n.node_id,
          isolation_score: 0.3,
          rf_score: 0.3,
          graph_trust_score: 0.7,
          graph_malicious_contribution: 0.3,
          final_score: 0.3,
          centralities: { degree: 0, betweenness: 0, closeness: 0, eigenvector: 0 },
        })),
        graph_metrics: { num_nodes: nodes.length, num_edges: edges.length, density: 0, avg_clustering: 0 },
      };
    }
  }

  /**
   * Train ML models on provided data.
   */
  async trainModels(
    nodes: MLNodeFeatures[],
    edges: MLEdge[],
    labels?: number[]
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/ml/train`,
        { nodes, edges, labels },
        { timeout: 60000 }
      );
    } catch (error: any) {
      console.error('[MLClient] Train models error:', error.message);
    }
  }

  /**
   * Check ML service health.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/ml/health`, { timeout: 5000 });
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const mlClient = new MLClient();
export type { MLNodeFeatures, MLEdge, MLNodeScore, MLScoringResponse };
