// ═══════════════════════════════════════════════════════════════
// WEBSOCKET HOOK - Custom React hook for WebSocket connections
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  error: string | null;
  latency: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    error: null,
    latency: 0,
  });

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    // Get auth token
    const token = localStorage.getItem('hedgeai_token');
    if (!token) {
      setState(prev => ({ ...prev, error: 'No authentication token found' }));
      console.error('Cannot connect to WebSocket: No authentication token');
      return;
    }

    // Create socket connection
    const socket = io(WEBSOCKET_URL, {
      auth: { token },
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      timeout: 10000, // 10 second timeout
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setState({ connected: true, error: null, latency: 0 });
    });

    socket.on('connected', (data) => {
      console.log('🔗 WebSocket handshake:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setState(prev => ({ ...prev, connected: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({ ...prev, error: error.message, connected: false }));
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({ ...prev, error: error.message || 'Unknown error' }));
    });

    // Ping/pong for latency measurement
    socket.on('pong', (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      setState(prev => ({ ...prev, latency }));
    });

    socketRef.current = socket;
  }, [reconnection, reconnectionAttempts, reconnectionDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({ connected: false, error: null, latency: 0 });
      console.log('WebSocket disconnected manually');
    }
  }, []);

  /**
   * Subscribe to an event
   */
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    } else {
      console.warn(`Cannot subscribe to ${event}: Socket not connected`);
    }
  }, []);

  /**
   * Unsubscribe from an event
   */
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }, []);

  /**
   * Subscribe to portfolio updates
   */
  const subscribePortfolio = useCallback((portfolioId: string) => {
    emit('subscribe:portfolio', portfolioId);
  }, [emit]);

  /**
   * Unsubscribe from portfolio updates
   */
  const unsubscribePortfolio = useCallback((portfolioId: string) => {
    emit('unsubscribe:portfolio', portfolioId);
  }, [emit]);

  /**
   * Subscribe to position updates
   */
  const subscribePosition = useCallback((positionId: string) => {
    emit('subscribe:position', positionId);
  }, [emit]);

  /**
   * Unsubscribe from position updates
   */
  const unsubscribePosition = useCallback((positionId: string) => {
    emit('unsubscribe:position', positionId);
  }, [emit]);

  /**
   * Subscribe to price updates for symbols
   */
  const subscribePrices = useCallback((symbols: string[]) => {
    emit('subscribe:prices', symbols);
  }, [emit]);

  /**
   * Unsubscribe from price updates
   */
  const unsubscribePrices = useCallback((symbols: string[]) => {
    emit('unsubscribe:prices', symbols);
  }, [emit]);

  /**
   * Measure latency
   */
  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // State
    connected: state.connected,
    error: state.error,
    latency: state.latency,
    
    // Connection control
    connect,
    disconnect,
    
    // Event handlers
    on,
    off,
    emit,
    
    // Subscription helpers
    subscribePortfolio,
    unsubscribePortfolio,
    subscribePosition,
    unsubscribePosition,
    subscribePrices,
    unsubscribePrices,
    
    // Utilities
    ping,
  };
};
