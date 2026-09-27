import { Router, Request, Response } from 'express';
import BlockModel from '../models/Block';

const router = Router();

// GET /api/blocks — Get all blocks (newest first)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const blocks = await BlockModel.find().sort({ blockNumber: -1 }).limit(100);
    res.json({ success: true, data: blocks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blocks/search — Search blocks by hash, number, or sealer
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query) return res.json({ success: true, data: [] });

    const num = parseInt(query, 10);
    const filter = isNaN(num)
      ? {
          $or: [
            { hash: { $regex: query, $options: 'i' } },
            { sealer: { $regex: query, $options: 'i' } },
            { transactions: { $in: [query] } },
          ],
        }
      : {
          $or: [
            { blockNumber: num },
            { hash: { $regex: query, $options: 'i' } },
          ],
        };

    const blocks = await BlockModel.find(filter).sort({ blockNumber: -1 }).limit(50);
    res.json({ success: true, data: blocks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blocks/validate — Validate entire chain integrity
router.get('/validate', async (_req: Request, res: Response) => {
  try {
    const blocks = await BlockModel.find().sort({ blockNumber: 1 }).lean();
    // Import BlockEngine for validation
    const { BlockEngine } = await import('../blockchain/Block');
    const blockData = blocks.map((b) => ({
      blockNumber: b.blockNumber,
      hash: b.hash,
      previousHash: b.previousHash,
      timestamp: b.timestamp,
      transactions: b.transactions,
      transactionCount: b.transactionCount,
      merkleRoot: b.merkleRoot,
      sealer: b.sealer,
    }));
    const result = BlockEngine.verifyChain(blockData);
    res.json({ success: true, data: { ...result, totalBlocks: blocks.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blocks/:id — Get block by number or hash
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const num = parseInt(id, 10);
    const block = isNaN(num)
      ? await BlockModel.findOne({ hash: id })
      : await BlockModel.findOne({ blockNumber: num });
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
    res.json({ success: true, data: block });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
