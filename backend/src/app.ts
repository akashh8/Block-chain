import express from 'express';
import cors from 'cors';
import { config } from './config';

// Import routes
import nodesRouter from './routes/nodes';
import blocksRouter from './routes/blocks';
import transactionsRouter from './routes/transactions';
import batchesRouter from './routes/batches';
import reputationRouter from './routes/reputation';
import analyticsRouter from './routes/analytics';
import inventoryRouter from './routes/inventory';
import notificationsRouter from './routes/notifications';
import recallRouter from './routes/recall';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/nodes', nodesRouter);
app.use('/api/blocks', blocksRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/reputation', reputationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/recall', recallRouter);

// Pipeline trigger route
app.post('/api/pipeline/run', async (_req, res) => {
  try {
    const pipeline = app.locals.gbrcPipeline;
    if (!pipeline) {
      return res.status(500).json({ success: false, message: 'Pipeline not initialized' });
    }
    // Get recent unprocessed transactions
    const Transaction = (await import('./models/Transaction')).default;
    const recentTxs = await Transaction.find().sort({ timestamp: -1 }).limit(20);
    const txIds = recentTxs.map((tx) => tx.txId);
    
    if (txIds.length === 0) {
      return res.json({ success: true, data: { message: 'No transactions to process' } });
    }

    const result = await pipeline.runPipeline(txIds);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
