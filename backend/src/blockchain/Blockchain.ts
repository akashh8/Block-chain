import BlockModel from '../models/Block';
import { BlockEngine, BlockData } from './Block';

/**
 * Blockchain — manages the chain stored in MongoDB.
 * Uses a lightweight authority/round-robin sealer to order transactions.
 * Trust/validation governed by GBRC scores, NOT by PoW/PoS/DPoS.
 */
export class Blockchain {
  private sealerPool: string[];
  private currentSealerIndex: number;

  constructor(sealerNodeIds: string[] = []) {
    this.sealerPool = sealerNodeIds;
    this.currentSealerIndex = 0;
  }

  /**
   * Initialize the chain with a genesis block if none exists.
   */
  async initialize(): Promise<void> {
    const existingGenesis = await BlockModel.findOne({ blockNumber: 0 });
    if (!existingGenesis) {
      const genesis = BlockEngine.createGenesisBlock();
      await BlockModel.create(genesis);
      console.log('[Blockchain] Genesis block created:', genesis.hash.substring(0, 16) + '...');
    }
  }

  /**
   * Get the latest block in the chain.
   */
  async getLatestBlock(): Promise<BlockData> {
    const block = await BlockModel.findOne().sort({ blockNumber: -1 }).lean();
    if (!block) throw new Error('No blocks in chain');
    return {
      blockNumber: block.blockNumber,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactions: block.transactions,
      transactionCount: block.transactionCount,
      merkleRoot: block.merkleRoot,
      sealer: block.sealer,
    };
  }

  /**
   * Round-robin sealer selection. Nodes with Quarantine/Slashed status
   * are skipped (enforced by GBRC — they lose validation participation).
   */
  private getNextSealer(excludeNodeIds: string[] = []): string {
    const eligible = this.sealerPool.filter((id) => !excludeNodeIds.includes(id));
    if (eligible.length === 0) return 'SYSTEM';

    const sealer = eligible[this.currentSealerIndex % eligible.length];
    this.currentSealerIndex = (this.currentSealerIndex + 1) % eligible.length;
    return sealer;
  }

  /**
   * Update the sealer pool (called after GBRC status updates).
   */
  updateSealerPool(nodeIds: string[]): void {
    this.sealerPool = nodeIds;
  }

  /**
   * Add a new block with the given transaction IDs.
   */
  async addBlock(transactionIds: string[], excludeSealers: string[] = []): Promise<BlockData> {
    const latestBlock = await this.getLatestBlock();
    const sealer = this.getNextSealer(excludeSealers);

    const newBlock = BlockEngine.createBlock(
      latestBlock.blockNumber + 1,
      latestBlock.hash,
      transactionIds,
      sealer
    );

    await BlockModel.create(newBlock);
    console.log(
      `[Blockchain] Block #${newBlock.blockNumber} created by ${sealer} with ${transactionIds.length} txs`
    );

    return newBlock;
  }

  /**
   * Validate entire chain integrity.
   */
  async validateChain(): Promise<{ valid: boolean; invalidAt?: number; reason?: string; totalBlocks: number }> {
    const blocks = await BlockModel.find().sort({ blockNumber: 1 }).lean();
    const blockData: BlockData[] = blocks.map((b) => ({
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
    return { ...result, totalBlocks: blocks.length };
  }

  /**
   * Get all blocks in the chain.
   */
  async getAllBlocks(): Promise<BlockData[]> {
    const blocks = await BlockModel.find().sort({ blockNumber: -1 }).lean();
    return blocks.map((b) => ({
      blockNumber: b.blockNumber,
      hash: b.hash,
      previousHash: b.previousHash,
      timestamp: b.timestamp,
      transactions: b.transactions,
      transactionCount: b.transactionCount,
      merkleRoot: b.merkleRoot,
      sealer: b.sealer,
    }));
  }

  /**
   * Search blocks by hash prefix, block number, or sealer.
   */
  async searchBlocks(query: string): Promise<BlockData[]> {
    const num = parseInt(query, 10);
    const filter = isNaN(num)
      ? {
          $or: [
            { hash: { $regex: query, $options: 'i' } },
            { sealer: { $regex: query, $options: 'i' } },
          ],
        }
      : {
          $or: [
            { blockNumber: num },
            { hash: { $regex: query, $options: 'i' } },
            { sealer: { $regex: query, $options: 'i' } },
          ],
        };

    const blocks = await BlockModel.find(filter).sort({ blockNumber: -1 }).limit(50).lean();
    return blocks.map((b) => ({
      blockNumber: b.blockNumber,
      hash: b.hash,
      previousHash: b.previousHash,
      timestamp: b.timestamp,
      transactions: b.transactions,
      transactionCount: b.transactionCount,
      merkleRoot: b.merkleRoot,
      sealer: b.sealer,
    }));
  }
}

export { BlockEngine } from './Block';
