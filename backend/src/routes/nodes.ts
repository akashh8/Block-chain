import { Router, Request, Response } from 'express';
import Node from '../models/Node';
import Transaction from '../models/Transaction';
import { mlClient, MLNodeFeatures, MLEdge } from '../services/mlClient';

const router = Router();

// GET /api/nodes — Get all nodes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const nodes = await Node.find().sort({ status: 1, reputation: -1 });
    res.json({ success: true, data: nodes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/nodes/train — Retrain GBRC ML models on the current dataset
router.post('/train', async (_req: Request, res: Response) => {
  try {
    const nodes = await Node.find();
    const transactions = await Transaction.find();
    
    // Get consensus deviations
    const deviations: Record<string, number> = {};
    const nodeVotes: Record<string, number> = {};
    const avgVolume = transactions.reduce((sum, tx) => sum + tx.volume, 0) / Math.max(transactions.length, 1);

    for (const node of nodes) {
      const nodeTxs = transactions.filter(
        (tx) => tx.fromNode === node.nodeId || tx.toNode === node.nodeId
      );
      const nodeVolume = nodeTxs.reduce((sum, tx) => sum + tx.volume, 0);
      const nodeFreq = nodeTxs.length;

      const volumeRatio = avgVolume > 0 ? nodeVolume / (avgVolume * Math.max(nodeFreq, 1)) : 0.5;
      const vote = Math.min(Math.max(1 - Math.abs(volumeRatio - 1), 0), 1);
      nodeVotes[node.nodeId] = vote;
    }

    const votes = Object.values(nodeVotes);
    const sortedVotes = [...votes].sort((a, b) => a - b);
    const consensus = sortedVotes.length > 0 ? sortedVotes[Math.floor(sortedVotes.length / 2)] : 0.5;

    for (const node of nodes) {
      deviations[node.nodeId] = Math.abs((nodeVotes[node.nodeId] || 0.5) - consensus);
    }

    // Build ML node features
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
        consensus_deviation: deviations[node.nodeId] || 0,
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
    const mlEdges = Array.from(edgeMap.values());

    // Labels: 1 for Quarantine/Slashed nodes, 0 for others
    const labels = nodes.map((n) => (n.status === 'Quarantine' || n.status === 'Slashed' ? 1 : 0));

    // Call ML service training endpoint
    await mlClient.trainModels(mlNodes, mlEdges, labels);

    res.json({
      success: true,
      message: `GBRC models retrained successfully on ${nodes.length} nodes and ${transactions.length} transactions.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/nodes/:id — Get node by nodeId
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const node = await Node.findOne({ nodeId: req.params.id });
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });
    res.json({ success: true, data: node });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/nodes/:id/status — Update node status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.id },
      { status },
      { new: true }
    );
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });
    res.json({ success: true, data: node });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
