import Node from '../models/Node';
import Transaction from '../models/Transaction';
import ReputationHistory from '../models/ReputationHistory';
import ScoreHistory from '../models/ScoreHistory';
import Notification from '../models/Notification';
import { Blockchain } from '../blockchain/Blockchain';
import { mlClient, MLNodeFeatures, MLEdge } from './mlClient';
import { config } from '../config';
import { Server as SocketServer } from 'socket.io';

/**
 * GBRC Pipeline Orchestrator
 * 
 * Runs all 7 stages of the Graph-Based Reputation Consensus pipeline
 * per batch/block of transactions.
 * 
 * Stage 1: Consensus Deviation Analysis (local)
 * Stage 2: Isolation Forest Anomaly Detection (ML service)
 * Stage 3: Random Forest Classification (ML service)
 * Stage 4: Graph Analytics / NetworkX (ML service)
 * Stage 5: Bayesian Stacking Layer (ML service)
 * Stage 6: Reputation System — Beta-Binomial + EWMA (local)
 * Stage 7: Mitigation Engine — Status thresholds + notifications (local)
 */
export class GBRCPipeline {
  private blockchain: Blockchain;
  private io: SocketServer | null = null;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
  }

  setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  /**
   * Run the full GBRC pipeline for a batch of transaction IDs.
   */
  async runPipeline(transactionIds: string[]): Promise<{
    block: any;
    scores: Record<string, any>;
  }> {
    console.log(`\n[GBRC Pipeline] ══════════════════════════════════════`);
    console.log(`[GBRC Pipeline] Running pipeline for ${transactionIds.length} transactions`);

    // Get participating nodes from transactions
    const transactions = await Transaction.find({ txId: { $in: transactionIds } });
    const nodeIds = new Set<string>();
    transactions.forEach((tx) => {
      nodeIds.add(tx.fromNode);
      nodeIds.add(tx.toNode);
    });

    const nodes = await Node.find({ nodeId: { $in: Array.from(nodeIds) } });
    
    // Get excluded sealers (Quarantined/Slashed)
    const excludedSealers = nodes
      .filter((n) => n.status === 'Quarantine' || n.status === 'Slashed')
      .map((n) => n.nodeId);

    // ── Create Block ──
    const block = await this.blockchain.addBlock(transactionIds, excludedSealers);
    this.emitEvent('block:new', block);

    // ── Stage 1: Consensus Deviation Analysis ──
    console.log('[GBRC Pipeline] Stage 1: Consensus Deviation Analysis');
    const consensusDeviations = this.computeConsensusDeviations(nodes, transactions);

    // ── Stages 2-5: ML Pipeline (call Python service) ──
    console.log('[GBRC Pipeline] Stages 2-5: ML Pipeline (Isolation Forest → RF → Graph → Bayesian)');
    
    // Prepare ML features
    const mlNodes: MLNodeFeatures[] = nodes.map((node) => {
      const txCount = transactions.filter(
        (tx) => tx.fromNode === node.nodeId || tx.toNode === node.nodeId
      ).length;
      const txVolume = transactions
        .filter((tx) => tx.fromNode === node.nodeId || tx.toNode === node.nodeId)
        .reduce((sum, tx) => sum + tx.volume, 0);

      return {
        node_id: node.nodeId,
        tx_frequency: txCount,
        transfer_volume: txVolume,
        consensus_deviation: consensusDeviations[node.nodeId] || 0,
        reputation: node.reputation,
        total_transactions: node.totalTransactions,
        successful_transactions: node.successfulTransactions,
      };
    });

    // Build edges for graph
    const edgeMap = new Map<string, MLEdge>();
    transactions.forEach((tx) => {
      const key = `${tx.fromNode}->${tx.toNode}`;
      if (edgeMap.has(key)) {
        const edge = edgeMap.get(key)!;
        edge.volume += tx.volume;
        edge.count += 1;
      } else {
        edgeMap.set(key, {
          from_node: tx.fromNode,
          to_node: tx.toNode,
          volume: tx.volume,
          count: 1,
        });
      }
    });

    // Also include historical edges
    const allTransactions = await Transaction.find({
      $or: [
        { fromNode: { $in: Array.from(nodeIds) } },
        { toNode: { $in: Array.from(nodeIds) } },
      ],
    });
    allTransactions.forEach((tx) => {
      const key = `${tx.fromNode}->${tx.toNode}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          from_node: tx.fromNode,
          to_node: tx.toNode,
          volume: tx.volume,
          count: 1,
        });
      }
    });

    const mlEdges = Array.from(edgeMap.values());

    // Call ML service
    const mlResult = await mlClient.scoreNodes(mlNodes, mlEdges);

    // ── Stage 6: Reputation System ──
    console.log('[GBRC Pipeline] Stage 6: Reputation System (Beta-Binomial + EWMA)');
    
    const scores: Record<string, any> = {};

    for (const nodeScore of mlResult.scores) {
      const node = nodes.find((n) => n.nodeId === nodeScore.node_id);
      if (!node) continue;

      // Beta-Binomial reputation: (successful + 1) / (total + 2)
      const betaReputation =
        (node.successfulTransactions + 1) / (node.totalTransactions + 2);

      // EWMA smoothing
      const ewmaReputation =
        config.ewmaAlpha * betaReputation + (1 - config.ewmaAlpha) * node.ewmaReputation;

      // ── Stage 7: Mitigation Engine ──
      const finalScore = nodeScore.final_score;
      let newStatus: 'Trusted' | 'Warning' | 'Quarantine' | 'Slashed' = 'Trusted';
      if (finalScore > config.thresholds.slashed) {
        newStatus = 'Slashed';
      } else if (finalScore > config.thresholds.quarantine) {
        newStatus = 'Quarantine';
      } else if (finalScore > config.thresholds.warning) {
        newStatus = 'Warning';
      }

      const statusChanged = node.status !== newStatus;

      // Update node in database
      await Node.findOneAndUpdate(
        { nodeId: node.nodeId },
        {
          reputation: betaReputation,
          ewmaReputation: ewmaReputation,
          status: newStatus,
          centralities: nodeScore.centralities,
          latestScores: {
            rf: nodeScore.rf_score,
            isolation: nodeScore.isolation_score,
            graph: nodeScore.graph_trust_score,
            final: finalScore,
          },
          $inc: { totalTransactions: 1, successfulTransactions: finalScore < config.thresholds.warning ? 1 : 0 },
        }
      );

      // Save reputation history
      await ReputationHistory.create({
        nodeId: node.nodeId,
        reputation: betaReputation,
        ewma: ewmaReputation,
      });

      // Save score history
      await ScoreHistory.create({
        nodeId: node.nodeId,
        batchId: transactionIds[0] || 'manual',
        rf: nodeScore.rf_score,
        isolation: nodeScore.isolation_score,
        graph: nodeScore.graph_trust_score,
        final: finalScore,
        status: newStatus,
      });

      // Stage 7: Generate notifications on status change
      if (statusChanged) {
        console.log(`[GBRC Pipeline] Stage 7: ${node.name} status changed: ${node.status} → ${newStatus}`);
        
        await this.createNotification(node, newStatus, finalScore);

        this.emitEvent('node:statusChange', {
          nodeId: node.nodeId,
          name: node.name,
          oldStatus: node.status,
          newStatus,
          finalScore,
        });
      }

      scores[node.nodeId] = {
        nodeId: node.nodeId,
        name: node.name,
        rfScore: nodeScore.rf_score,
        isolationScore: nodeScore.isolation_score,
        graphTrustScore: nodeScore.graph_trust_score,
        finalScore,
        reputation: betaReputation,
        ewmaReputation,
        status: newStatus,
        centralities: nodeScore.centralities,
      };
    }

    console.log(`[GBRC Pipeline] Pipeline complete. Block #${block.blockNumber}`);
    console.log(`[GBRC Pipeline] ══════════════════════════════════════\n`);

    this.emitEvent('pipeline:progress', { stage: 'complete', blockNumber: block.blockNumber });

    return { block, scores };
  }

  /**
   * Stage 1: Consensus Deviation Analysis
   * Computes how far each node's vote diverges from network consensus.
   * 
   * Simulated voting: each node's "vote" is a trust assessment based on their
   * transaction patterns. Network consensus = median of all votes.
   */
  private computeConsensusDeviations(
    nodes: any[],
    transactions: any[]
  ): Record<string, number> {
    const deviations: Record<string, number> = {};

    // Each node's "vote" = their normalized transaction behavior
    // (volume ratio vs. average, frequency ratio vs. average)
    const nodeVotes: Record<string, number> = {};

    const avgVolume =
      transactions.reduce((sum, tx) => sum + tx.volume, 0) / Math.max(transactions.length, 1);

    for (const node of nodes) {
      const nodeTxs = transactions.filter(
        (tx) => tx.fromNode === node.nodeId || tx.toNode === node.nodeId
      );
      const nodeVolume = nodeTxs.reduce((sum, tx) => sum + tx.volume, 0);
      const nodeFreq = nodeTxs.length;

      // Vote = normalized behavior score (0-1)
      // Extreme volumes or frequencies push vote away from 0.5
      const volumeRatio = avgVolume > 0 ? nodeVolume / (avgVolume * Math.max(nodeFreq, 1)) : 0.5;
      const vote = Math.min(Math.max(1 - Math.abs(volumeRatio - 1), 0), 1);

      nodeVotes[node.nodeId] = vote;
    }

    // Network consensus = median of all votes
    const votes = Object.values(nodeVotes);
    const sortedVotes = [...votes].sort((a, b) => a - b);
    const consensus =
      sortedVotes.length > 0
        ? sortedVotes[Math.floor(sortedVotes.length / 2)]
        : 0.5;

    // Deviation = abs(node_vote - consensus)
    for (const node of nodes) {
      deviations[node.nodeId] = Math.abs(
        (nodeVotes[node.nodeId] || 0.5) - consensus
      );
    }

    return deviations;
  }

  /**
   * Create notification for status change.
   */
  private async createNotification(
    node: any,
    newStatus: string,
    finalScore: number
  ): Promise<void> {
    const severityMap: Record<string, 'info' | 'warning' | 'critical'> = {
      Warning: 'warning',
      Quarantine: 'critical',
      Slashed: 'critical',
      Trusted: 'info',
    };

    const typeMap: Record<string, string> = {
      Warning: 'suspicious',
      Quarantine: 'quarantine',
      Slashed: 'slash',
      Trusted: 'transfer',
    };

    const notification = await Notification.create({
      type: typeMap[newStatus] || 'suspicious',
      message: `Node "${node.name}" status changed to ${newStatus} (Final Score: ${finalScore.toFixed(3)})`,
      severity: severityMap[newStatus] || 'warning',
      nodeId: node.nodeId,
    });

    this.emitEvent('notification:new', notification);
  }

  /**
   * Emit a real-time event via Socket.IO.
   */
  private emitEvent(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
