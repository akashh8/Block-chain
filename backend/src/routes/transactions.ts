import { Router, Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/transactions — Get all transactions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 }).limit(200);
    res.json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transactions/batch — Submit a batch of transactions (triggers GBRC pipeline)
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { transactions: txData } = req.body;
    if (!txData || !Array.isArray(txData) || txData.length === 0) {
      return res.status(400).json({ success: false, message: 'Transactions array required' });
    }

    // Create transactions
    const txIds: string[] = [];
    for (const tx of txData) {
      const txId = tx.txId || `TX-${uuidv4().substring(0, 8).toUpperCase()}`;
      await Transaction.create({
        txId,
        batchId: tx.batchId,
        fromNode: tx.fromNode,
        toNode: tx.toNode,
        drugId: tx.drugId || 'UNKNOWN',
        quantity: tx.quantity || 0,
        volume: tx.volume || 0,
        timestamp: tx.timestamp || new Date(),
      });
      txIds.push(txId);
    }

    // Run GBRC pipeline (pipeline is injected via app.locals)
    const pipeline = req.app.locals.gbrcPipeline;
    if (pipeline) {
      const result = await pipeline.runPipeline(txIds);
      return res.json({ success: true, data: result });
    }

    res.json({
      success: true,
      data: { message: `${txIds.length} transactions created`, txIds },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/transactions/:txId — Get transaction by ID
router.get('/:txId', async (req: Request, res: Response) => {
  try {
    const tx = await Transaction.findOne({ txId: req.params.txId });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: tx });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
