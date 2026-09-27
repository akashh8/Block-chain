import { Router, Request, Response } from 'express';
import Batch from '../models/Batch';
import Inventory from '../models/Inventory';
import Notification from '../models/Notification';
import Transaction from '../models/Transaction';
import Node from '../models/Node';

const router = Router();

// POST /api/recall/:batchId — Initiate a drug recall
router.post('/:batchId', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (batch.status === 'recalled') {
      return res.status(400).json({ success: false, message: 'Batch already recalled' });
    }

    // 1. Update batch status
    batch.status = 'recalled';
    await batch.save();

    // 2. Update all inventory entries for this batch
    await Inventory.updateMany(
      { batchId: batch.batchId },
      { recalled: true }
    );

    // 3. Find all nodes holding this batch
    const txs = await Transaction.find({ batchId: batch.batchId });
    const affectedNodeIds = new Set<string>();
    txs.forEach((tx) => {
      affectedNodeIds.add(tx.fromNode);
      affectedNodeIds.add(tx.toNode);
    });

    // 4. Create notifications for all affected nodes
    const affectedNodes = await Node.find({ nodeId: { $in: Array.from(affectedNodeIds) } });
    for (const node of affectedNodes) {
      const notification = await Notification.create({
        type: 'recall',
        message: `DRUG RECALL: ${batch.drugName} (Batch: ${batch.batchId}) has been recalled by ${batch.manufacturer}. Immediate action required.`,
        severity: 'critical',
        nodeId: node.nodeId,
        batchId: batch.batchId,
      });

      // Emit via Socket.IO
      const io = req.app.locals.io;
      if (io) {
        io.emit('notification:new', notification);
        io.emit('recall:initiated', {
          batchId: batch.batchId,
          drugName: batch.drugName,
          manufacturer: batch.manufacturer,
          affectedNodes: affectedNodes.map((n) => ({ nodeId: n.nodeId, name: n.name })),
        });
      }
    }

    // 5. Create a blockchain record for the recall
    const pipeline = req.app.locals.gbrcPipeline;
    if (pipeline) {
      // Create a recall transaction
      const recallTx = await Transaction.create({
        txId: `RECALL-${batch.batchId}`,
        batchId: batch.batchId,
        fromNode: batch.manufacturer,
        toNode: 'RECALL_SYSTEM',
        drugId: batch.drugName,
        quantity: batch.quantity,
        volume: 0,
      });

      // Add to blockchain (without running full pipeline)
      const blockchain = req.app.locals.blockchain;
      if (blockchain) {
        await blockchain.addBlock([recallTx.txId], []);
      }
    }

    res.json({
      success: true,
      data: {
        batch,
        affectedNodes: affectedNodes.map((n) => ({ nodeId: n.nodeId, name: n.name })),
        message: `Recall initiated for ${batch.drugName}. ${affectedNodes.length} nodes notified.`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/recall — Get all recalled batches
router.get('/', async (_req: Request, res: Response) => {
  try {
    const recalled = await Batch.find({ status: 'recalled' }).sort({ updatedAt: -1 });
    res.json({ success: true, data: recalled });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
