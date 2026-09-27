import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { Blockchain } from './blockchain/Blockchain';
import { GBRCPipeline } from './services/gbrcPipeline';
import { setupSocket } from './socket';
import Node from './models/Node';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('[Server] Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('[Server] MongoDB connected');

    // Create HTTP server + Socket.IO
    const server = http.createServer(app);
    const io = new SocketServer(server, {
      cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
    });

    setupSocket(io);
    app.locals.io = io;

    // Initialize Blockchain
    const trustedNodes = await Node.find({ status: { $in: ['Trusted', 'Warning'] } });
    const sealerPool = trustedNodes.map((n) => n.nodeId);
    const blockchain = new Blockchain(sealerPool.length > 0 ? sealerPool : ['SYSTEM']);
    await blockchain.initialize();
    app.locals.blockchain = blockchain;

    // Initialize GBRC Pipeline
    const pipeline = new GBRCPipeline(blockchain);
    pipeline.setSocketServer(io);
    app.locals.gbrcPipeline = pipeline;

    // Start server
    server.listen(config.port, () => {
      console.log(`\n[Server] ═══════════════════════════════════════════`);
      console.log(`[Server] GBRC Backend running on port ${config.port}`);
      console.log(`[Server] MongoDB: ${config.mongoUri}`);
      console.log(`[Server] ML Service: ${config.mlServiceUrl}`);
      console.log(`[Server] CORS Origin: ${config.corsOrigin}`);
      console.log(`[Server] ═══════════════════════════════════════════\n`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
