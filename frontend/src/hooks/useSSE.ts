// ═══════════════════════════════════════════════════════════════
// SSE HOOK - Custom React hook for Server-Sent Events
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react';

const SSE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface UseSSEOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
}

interface SSEState {
  connected: boolean;
  error: string | null;
  lastEvent: string | null;
}

export const useSSE = (options: UseSSEOptions = {}) => {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<SSEState>({
    connected: false,
    error: null,
    lastEvent: null,
  });

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('SSE already connected');
      return;
    }

    // Get auth token
    const token = localStorage.getItem('hedgeai_token');
    if (!token) {
      setState(prev => ({ ...prev, error: 'No authentication token found' }));
      console.error('Cannot connect to SSE: No authentication token');
      return;
    }

    // Create EventSource with auth header (via query param since EventSource doesn't support headers)
    const url = `${SSE_URL}/api/sse/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    // Event handlers
    eventSource.onopen = () => {
      console.log('✅ SSE connected');
      setState({ connected: true, error: null, lastEvent: null });
      
      // Clear reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE error:', error);
      setState(prev => ({ ...prev, error: 'SSE connection error', connected: false }));
      
      // Close and attempt reconnect
      eventSource.close();
      eventSourceRef.current = null;
      
      if (reconnect && !reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, reconnectInterval);
      }
    };

    // Handle connection event
    eventSource.addEventListener('connected', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log('🔗 SSE handshake:', data);
    });

    // Handle heartbeat
    eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      // Just log periodically
      const data = JSON.parse(event.data);
      if (data.timestamp % 60000 < 1000) { // Log every minute
        console.log('💓 SSE heartbeat:', new Date(data.timestamp).toLocaleTimeString());
      }
    });

    eventSourceRef.current = eventSource;
  }, [reconnect, reconnectInterval]);

  /**
   * Disconnect from SSE stream
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setState({ connected: false, error: null, lastEvent: null });
      console.log('SSE disconnected manually');
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  /**
   * Subscribe to an SSE event
   */
  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (eventSourceRef.current) {
      const listener = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
          setState(prev => ({ ...prev, lastEvent: event }));
        } catch (error) {
          console.error(`Error parsing SSE event ${event}:`, error);
        }
      };
      
      eventSourceRef.current.addEventListener(event, listener);
      
      // Return cleanup function
      return () => {
        eventSourceRef.current?.removeEventListener(event, listener);
      };
    } else {
      console.warn(`Cannot subscribe to ${event}: SSE not connected`);
      return () => {};
    }
  }, []);

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
    lastEvent: state.lastEvent,
    
    // Connection control
    connect,
    disconnect,
    
    // Event subscription
    on,
  };
};
