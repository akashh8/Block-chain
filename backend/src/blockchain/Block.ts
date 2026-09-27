import CryptoJS from 'crypto-js';

export interface BlockData {
  blockNumber: number;
  hash: string;
  previousHash: string;
  timestamp: Date;
  transactions: string[];
  transactionCount: number;
  merkleRoot: string;
  sealer: string;
}

export class BlockEngine {
  /**
   * Calculate SHA-256 hash from block components.
   * Hash = SHA256(blockNumber + previousHash + timestamp + merkleRoot + transactionsJSON)
   */
  static calculateHash(
    blockNumber: number,
    previousHash: string,
    timestamp: Date,
    transactions: string[],
    merkleRoot: string
  ): string {
    const data = `${blockNumber}${previousHash}${timestamp.toISOString()}${merkleRoot}${JSON.stringify(transactions)}`;
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Calculate Merkle root from transaction IDs.
   * Uses binary hash tree — pairs of tx hashes combined and rehashed up to root.
   */
  static calculateMerkleRoot(transactions: string[]): string {
    if (transactions.length === 0) return CryptoJS.SHA256('').toString();
    if (transactions.length === 1) return CryptoJS.SHA256(transactions[0]).toString();

    let level: string[] = transactions.map((tx) => CryptoJS.SHA256(tx).toString());

    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left; // duplicate last if odd
        nextLevel.push(CryptoJS.SHA256(left + right).toString());
      }
      level = nextLevel;
    }

    return level[0];
  }

  /**
   * Create the genesis block (block 0).
   */
  static createGenesisBlock(): BlockData {
    const timestamp = new Date('2024-01-01T00:00:00Z');
    const merkleRoot = this.calculateMerkleRoot([]);
    const hash = this.calculateHash(0, '0'.repeat(64), timestamp, [], merkleRoot);

    return {
      blockNumber: 0,
      hash,
      previousHash: '0'.repeat(64),
      timestamp,
      transactions: [],
      transactionCount: 0,
      merkleRoot,
      sealer: 'GENESIS',
    };
  }

  /**
   * Create a new block chained to the previous block.
   */
  static createBlock(
    blockNumber: number,
    previousHash: string,
    transactions: string[],
    sealer: string
  ): BlockData {
    const timestamp = new Date();
    const merkleRoot = this.calculateMerkleRoot(transactions);
    const hash = this.calculateHash(blockNumber, previousHash, timestamp, transactions, merkleRoot);

    return {
      blockNumber,
      hash,
      previousHash,
      timestamp,
      transactions,
      transactionCount: transactions.length,
      merkleRoot,
      sealer,
    };
  }

  /**
   * Verify a single block's hash integrity.
   */
  static verifyBlock(block: BlockData): boolean {
    const expectedHash = this.calculateHash(
      block.blockNumber,
      block.previousHash,
      block.timestamp,
      block.transactions,
      block.merkleRoot
    );
    return block.hash === expectedHash;
  }

  /**
   * Verify entire chain integrity — each block references the previous correctly,
   * and all hashes are valid.
   */
  static verifyChain(blocks: BlockData[]): { valid: boolean; invalidAt?: number; reason?: string } {
    if (blocks.length === 0) return { valid: true };

    // Sort by block number
    const sorted = [...blocks].sort((a, b) => a.blockNumber - b.blockNumber);

    for (let i = 0; i < sorted.length; i++) {
      const block = sorted[i];

      // Verify hash integrity
      if (!this.verifyBlock(block)) {
        return {
          valid: false,
          invalidAt: block.blockNumber,
          reason: `Block ${block.blockNumber}: hash mismatch — block data has been tampered with`,
        };
      }

      // Verify chain linkage (skip genesis)
      if (i > 0 && block.previousHash !== sorted[i - 1].hash) {
        return {
          valid: false,
          invalidAt: block.blockNumber,
          reason: `Block ${block.blockNumber}: previousHash does not match Block ${sorted[i - 1].blockNumber}'s hash — chain broken`,
        };
      }
    }

    return { valid: true };
  }
}
