import { Server as SocketServer } from 'socket.io';

export function setupSocket(io: SocketServer): void {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    // Client can subscribe to specific node updates
    socket.on('subscribe:node', (nodeId: string) => {
      socket.join(`node:${nodeId}`);
    });

    // Client can unsubscribe
    socket.on('unsubscribe:node', (nodeId: string) => {
      socket.leave(`node:${nodeId}`);
    });
  });
}
