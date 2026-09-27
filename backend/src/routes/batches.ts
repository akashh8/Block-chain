import { Router, Request, Response } from 'express';
import Batch from '../models/Batch';

const router = Router();

// GET /api/batches — Get all drug batches
router.get('/', async (_req: Request, res: Response) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/batches/:batchId — Get batch by ID
router.get('/:batchId', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/batches/:batchId/verify — QR Verification: authenticity + recall status
router.get('/:batchId/verify', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.json({
        success: true,
        data: { authentic: false, recalled: false, message: 'Batch not found in blockchain' },
      });
    }

    // Check if batch exists in any block (chain verification)
    const BlockModel = (await import('../models/Block')).default;
    const Transaction = (await import('../models/Transaction')).default;
    const txs = await Transaction.find({ batchId: batch.batchId });
    const txIds = txs.map((tx) => tx.txId);
    const blockWithBatch = await BlockModel.findOne({ transactions: { $in: txIds } });

    res.json({
      success: true,
      data: {
        authentic: !!blockWithBatch,
        recalled: batch.status === 'recalled',
        batchId: batch.batchId,
        drugName: batch.drugName,
        manufacturer: batch.manufacturer,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        status: batch.status,
        blockNumber: blockWithBatch?.blockNumber,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/batches — Create a new drug batch
router.post('/', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.create({
      ...req.body,
      qrPayload: JSON.stringify({
        batchId: req.body.batchId,
        drugName: req.body.drugName,
        manufacturer: req.body.manufacturer,
        verifyUrl: `/api/batches/${req.body.batchId}/verify`,
      }),
    });
    res.status(201).json({ success: true, data: batch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
