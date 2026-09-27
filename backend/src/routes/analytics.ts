import { Router, Request, Response } from 'express';
import Node from '../models/Node';
import Transaction from '../models/Transaction';
import BlockModel from '../models/Block';
import ScoreHistory from '../models/ScoreHistory';

const router = Router();

// GET /api/analytics/dashboard — Executive dashboard stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [nodes, totalTx, totalBatches, totalBlocks] = await Promise.all([
      Node.find(),
      Transaction.countDocuments(),
      (await import('../models/Batch')).default.countDocuments(),
      BlockModel.countDocuments(),
    ]);

    const statusCounts = {
      Trusted: 0,
      Warning: 0,
      Quarantine: 0,
      Slashed: 0,
    };
    let totalRep = 0;

    nodes.forEach((n) => {
      statusCounts[n.status as keyof typeof statusCounts]++;
      totalRep += n.ewmaReputation;
    });

    const networkTrust = nodes.length > 0 ? totalRep / nodes.length : 0;

    res.json({
      success: true,
      data: {
        totalBatches,
        activeNodes: nodes.length,
        networkTrust: Math.round(networkTrust * 100) / 100,
        totalTransactions: totalTx,
        totalBlocks,
        maliciousNodes: statusCounts.Quarantine + statusCounts.Slashed,
        trustedNodes: statusCounts.Trusted,
        warningNodes: statusCounts.Warning,
        quarantinedNodes: statusCounts.Quarantine,
        slashedNodes: statusCounts.Slashed,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/trust-distribution — Trust status distribution
router.get('/trust-distribution', async (_req: Request, res: Response) => {
  try {
    const result = await Node.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = result.reduce((sum, r) => sum + r.count, 0);
    const data = result.map((r) => ({
      status: r._id,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/transaction-volume — Transaction volume over time
router.get('/transaction-volume', async (_req: Request, res: Response) => {
  try {
    const result = await Transaction.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          volume: { $sum: '$volume' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);
    const data = result.map((r) => ({
      date: r._id,
      volume: r.volume,
      count: r.count,
    }));
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/centrality — Centrality scores for all nodes
router.get('/centrality', async (_req: Request, res: Response) => {
  try {
    const nodes = await Node.find()
      .select('nodeId name role centralities status')
      .sort({ name: 1 });
    res.json({ success: true, data: nodes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/scores/:nodeId — Score history for a node
router.get('/scores/:nodeId', async (req: Request, res: Response) => {
  try {
    const history = await ScoreHistory.find({ nodeId: req.params.nodeId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/graph — Graph data for visualization
router.get('/graph', async (_req: Request, res: Response) => {
  try {
    const nodes = await Node.find();
    const transactions = await Transaction.find();

    // Build graph nodes
    const graphNodes = nodes.map((n) => ({
      id: n.nodeId,
      name: n.name,
      role: n.role,
      status: n.status,
      reputation: n.ewmaReputation,
      val: Math.max(n.totalTransactions, 3),
    }));

    // Build graph edges (aggregate by from->to)
    const edgeMap = new Map<string, { source: string; target: string; volume: number }>();
    transactions.forEach((tx) => {
      const key = `${tx.fromNode}->${tx.toNode}`;
      if (edgeMap.has(key)) {
        edgeMap.get(key)!.volume += tx.volume;
      } else {
        edgeMap.set(key, {
          source: tx.fromNode,
          target: tx.toNode,
          volume: tx.volume,
        });
      }
    });

    res.json({
      success: true,
      data: {
        nodes: graphNodes,
        links: Array.from(edgeMap.values()),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
