import { Router, Request, Response } from 'express';
import Inventory from '../models/Inventory';
import Batch from '../models/Batch';
import Node from '../models/Node';

const router = Router();

// GET /api/inventory — Get all inventory
router.get('/', async (_req: Request, res: Response) => {
  try {
    const inventory = await Inventory.find();
    
    // Enrich with node and batch names
    const nodeMap = new Map<string, string>();
    const batchMap = new Map<string, string>();
    const nodes = await Node.find().select('nodeId name');
    const batches = await Batch.find().select('batchId drugName');
    nodes.forEach((n) => nodeMap.set(n.nodeId, n.name));
    batches.forEach((b) => batchMap.set(b.batchId, b.drugName));

    const enriched = inventory.map((item) => ({
      ...item.toObject(),
      nodeName: nodeMap.get(item.nodeId) || item.nodeId,
      drugName: batchMap.get(item.batchId) || item.batchId,
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/inventory/alerts — Get inventory alerts (low stock + expiring + recalled)
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const alerts = await Inventory.find({
      $or: [
        { $expr: { $lte: ['$stock', '$lowStockThreshold'] } },
        { expiryDate: { $lte: ninetyDays } },
        { recalled: true },
      ],
    });

    const nodeMap = new Map<string, string>();
    const batchMap = new Map<string, string>();
    const nodes = await Node.find().select('nodeId name');
    const batches = await Batch.find().select('batchId drugName');
    nodes.forEach((n) => nodeMap.set(n.nodeId, n.name));
    batches.forEach((b) => batchMap.set(b.batchId, b.drugName));

    const enriched = alerts.map((item) => ({
      ...item.toObject(),
      nodeName: nodeMap.get(item.nodeId) || item.nodeId,
      drugName: batchMap.get(item.batchId) || item.batchId,
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
