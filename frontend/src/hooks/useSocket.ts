import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types';

const SOCKET_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, isConnected, on };
}

export function useNotificationSocket(onNewNotification: (notification: Notification) => void) {
  const { on, isConnected } = useSocket();

  useEffect(() => {
    const cleanup = on('notification:new', (data: unknown) => {
      onNewNotification(data as Notification);
    });
    return cleanup;
  }, [on, onNewNotification]);

  return { isConnected };
}

export function useNodeStatusSocket(onStatusChange: (data: { nodeId: string; status: string }) => void) {
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on('node:statusChange', (data: unknown) => {
      onStatusChange(data as { nodeId: string; status: string });
    });
    return cleanup;
  }, [on, onStatusChange]);
}

export function useBlockSocket(onNewBlock: (data: unknown) => void) {
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on('block:new', onNewBlock);
    return cleanup;
  }, [on, onNewBlock]);
}

export function useNodeSocket(onStatusChange: (data: unknown) => void) {
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on('node:statusChange', (data: unknown) => {
      onStatusChange(data);
    });
    return cleanup;
  }, [on, onStatusChange]);
}

export function useRecallSocket(onRecall: (data: unknown) => void) {
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on('recall:initiated', (data: unknown) => {
      onRecall(data);
    });
    return cleanup;
  }, [on, onRecall]);
}
