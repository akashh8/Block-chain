import { Router, Request, Response } from 'express';
import Node from '../models/Node';
import ReputationHistory from '../models/ReputationHistory';

const router = Router();

// GET /api/reputation/rankings — Reputation rankings (sorted by ewmaReputation)
router.get('/rankings', async (_req: Request, res: Response) => {
  try {
    const nodes = await Node.find()
      .select('nodeId name role reputation ewmaReputation status latestScores')
      .sort({ ewmaReputation: -1 });
    res.json({ success: true, data: nodes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reputation/history/:nodeId — Reputation history for a node
router.get('/history/:nodeId', async (req: Request, res: Response) => {
  try {
    const history = await ReputationHistory.find({ nodeId: req.params.nodeId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
