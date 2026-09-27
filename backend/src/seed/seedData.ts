/**
 * GBRC Seed Script
 *
 * Clears all collections, then seeds:
 * 1. Nodes (12 supply chain participants)
 * 2. Drug batches (8 products)
 * 3. Transactions (50+ with anomalous patterns)
 * 4. Genesis block + blocks for seeded transactions
 * 5. Inventory records
 * 6. Initial reputation history
 *
 * Usage: npm run seed
 */

import mongoose from 'mongoose';
import { config } from '../config';
import Node from '../models/Node';
import BlockModel from '../models/Block';
import Transaction from '../models/Transaction';
import Batch from '../models/Batch';
import ReputationHistory from '../models/ReputationHistory';
import ScoreHistory from '../models/ScoreHistory';
import Inventory from '../models/Inventory';
import Notification from '../models/Notification';
import { Blockchain } from '../blockchain/Blockchain';
import { NODES, BATCHES, generateTransactions, INVENTORY_DATA } from './dataset';

async function seed(): Promise<void> {
  console.log('\n═══════════════════════════════════════════');
  console.log('  GBRC Database Seed Script');
  console.log('═══════════════════════════════════════════\n');

  // Connect to MongoDB
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);
  console.log('[Seed] Connected\n');

  // Clear all collections
  console.log('[Seed] Clearing existing data...');
  await Promise.all([
    Node.deleteMany({}),
    BlockModel.deleteMany({}),
    Transaction.deleteMany({}),
    Batch.deleteMany({}),
    ReputationHistory.deleteMany({}),
    ScoreHistory.deleteMany({}),
    Inventory.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('[Seed] All collections cleared\n');

  // 1. Seed Nodes
  console.log('[Seed] Creating nodes...');
  const anomalousNodes = ['DST-004', 'PHR-004', 'PHR-005'];
  for (const nodeData of NODES) {
    const isAnomalous = anomalousNodes.includes(nodeData.nodeId);
    await Node.create({
      ...nodeData,
      reputation: isAnomalous ? 0.35 + Math.random() * 0.15 : 0.7 + Math.random() * 0.25,
      ewmaReputation: isAnomalous ? 0.3 + Math.random() * 0.15 : 0.7 + Math.random() * 0.25,
      status: 'Trusted',
      centralities: { degree: 0, betweenness: 0, closeness: 0, eigenvector: 0 },
      latestScores: { rf: 0, isolation: 0, graph: 0, final: 0 },
      totalTransactions: 0,
      successfulTransactions: 0,
    });
  }
  console.log(`[Seed] Created ${NODES.length} nodes\n`);

  // 2. Seed Batches
  console.log('[Seed] Creating drug batches...');
  for (const batchData of BATCHES) {
    await Batch.create({
      ...batchData,
      qrPayload: JSON.stringify({
        batchId: batchData.batchId,
        drugName: batchData.drugName,
        manufacturer: batchData.manufacturer,
        verifyUrl: `/api/batches/${batchData.batchId}/verify`,
      }),
    });
  }
  console.log(`[Seed] Created ${BATCHES.length} drug batches\n`);

  // 3. Seed Transactions
  console.log('[Seed] Creating transactions...');
  const transactions = generateTransactions();
  for (const txData of transactions) {
    await Transaction.create(txData);

    // Update node transaction counts
    await Node.updateOne({ nodeId: txData.fromNode }, { $inc: { totalTransactions: 1, successfulTransactions: 1 } });
    await Node.updateOne({ nodeId: txData.toNode }, { $inc: { totalTransactions: 1, successfulTransactions: 1 } });
  }
  console.log(`[Seed] Created ${transactions.length} transactions\n`);

  // Lower success rate for anomalous nodes
  for (const anomId of anomalousNodes) {
    const node = await Node.findOne({ nodeId: anomId });
    if (node) {
      const reduced = Math.floor(node.successfulTransactions * 0.5);
      await Node.updateOne({ nodeId: anomId }, { successfulTransactions: reduced });
    }
  }

  // 4. Create blockchain with seeded transactions
  console.log('[Seed] Building blockchain...');
  const blockchain = new Blockchain(NODES.map((n) => n.nodeId));
  await blockchain.initialize();

  // Group transactions into blocks (roughly by time period)
  const sortedTxs = [...transactions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const blockSize = 8;
  for (let i = 0; i < sortedTxs.length; i += blockSize) {
    const batch = sortedTxs.slice(i, i + blockSize);
    const txIds = batch.map((tx) => tx.txId);
    await blockchain.addBlock(txIds, []);
  }

  const blockCount = await BlockModel.countDocuments();
  console.log(`[Seed] Created ${blockCount} blocks (including genesis)\n`);

  // 5. Seed Inventory
  console.log('[Seed] Creating inventory records...');
  for (const inv of INVENTORY_DATA) {
    await Inventory.create(inv);
  }
  console.log(`[Seed] Created ${INVENTORY_DATA.length} inventory records\n`);

  // 6. Create initial reputation history
  console.log('[Seed] Creating reputation history...');
  const allNodes = await Node.find();
  for (const node of allNodes) {
    // Create 5 history entries per node (simulating past updates)
    for (let i = 4; i >= 0; i--) {
      const jitter = (Math.random() - 0.5) * 0.1;
      await ReputationHistory.create({
        nodeId: node.nodeId,
        timestamp: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        reputation: Math.max(0, Math.min(1, node.reputation + jitter)),
        ewma: Math.max(0, Math.min(1, node.ewmaReputation + jitter * 0.8)),
      });
    }
  }
  console.log(`[Seed] Created reputation history entries\n`);

  // 7. Create sample notifications
  console.log('[Seed] Creating sample notifications...');
  await Notification.create([
    {
      type: 'transfer',
      message: 'New batch transfer: Amoxicillin 500mg from PharmaCure Labs to MediFlow Distribution',
      severity: 'info',
      nodeId: 'MFG-001',
      batchId: 'BAT-2024-001',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'suspicious',
      message: 'Anomalous transaction volume detected at DarkNet Distributors — 5x above network average',
      severity: 'warning',
      nodeId: 'DST-004',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'inventory',
      message: 'Low stock alert: Metformin 850mg at WellCare Rx — 80 units remaining (threshold: 200)',
      severity: 'warning',
      nodeId: 'PHR-002',
      batchId: 'BAT-2024-002',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      type: 'suspicious',
      message: 'Structuring pattern detected at QuickFix Pharmacy — multiple rapid-fire small transactions',
      severity: 'warning',
      nodeId: 'PHR-005',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ]);
  console.log('[Seed] Created sample notifications\n');

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('  Seed Complete!');
  console.log('═══════════════════════════════════════════');
  console.log(`  Nodes:          ${NODES.length}`);
  console.log(`  Drug Batches:   ${BATCHES.length}`);
  console.log(`  Transactions:   ${transactions.length}`);
  console.log(`  Blocks:         ${blockCount}`);
  console.log(`  Inventory:      ${INVENTORY_DATA.length}`);
  console.log(`  Anomalous:      ${anomalousNodes.join(', ')}`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('[Seed] Error:', error);
  process.exit(1);
});
