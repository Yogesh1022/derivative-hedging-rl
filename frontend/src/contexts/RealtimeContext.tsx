// ═══════════════════════════════════════════════════════════════
// REALTIME CONTEXT - Global real-time event management
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface RealtimeContextValue {
  // Connection state
  connected: boolean;
  error: string | null;
  latency: number;
  
  // Portfolio updates
  portfolioUpdates: Map<string, any>;
  subscribeToPortfolio: (portfolioId: string) => void;
  unsubscribeFromPortfolio: (portfolioId: string) => void;
  
  // Position updates
  positionUpdates: Map<string, any>;
  subscribeToPosition: (positionId: string) => void;
  unsubscribeFromPosition: (positionId: string) => void;
  
  // Price updates
  priceUpdates: Map<string, any>;
  subscribeToPrices: (symbols: string[]) => void;
  unsubscribeFromPrices: (symbols: string[]) => void;
  
  // Trade notifications
  tradeNotifications: any[];
  clearTradeNotifications: () => void;
  
  // Risk alerts
  riskAlerts: any[];
  clearRiskAlerts: () => void;
  
  // General alerts
  alerts: any[];
  clearAlerts: () => void;
  
  // Connection control
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  // WebSocket connection
  const {
    connected,
    error,
    latency,
    connect,
    disconnect,
    on,
    off,
    subscribePortfolio: wsSubscribePortfolio,
    unsubscribePortfolio: wsUnsubscribePortfolio,
    subscribePosition: wsSubscribePosition,
    unsubscribePosition: wsUnsubscribePosition,
    subscribePrices: wsSubscribePrices,
    unsubscribePrices: wsUnsubscribePrices,
  } = useWebSocket({ autoConnect: false });

  // State for real-time data
  const [portfolioUpdates, setPortfolioUpdates] = useState<Map<string, any>>(new Map());
  const [positionUpdates, setPositionUpdates] = useState<Map<string, any>>(new Map());
  const [priceUpdates, setPriceUpdates] = useState<Map<string, any>>(new Map());
  const [tradeNotifications, setTradeNotifications] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Auto-connect when authenticated
  useEffect(() => {
    const token = localStorage.getItem('hedgeai_token');
    if (token && !connected) {
      connect();
    }
  }, [connected, connect]);

  // Portfolio update handler
  useEffect(() => {
    if (!connected) return;

    const handlePortfolioUpdate = (data: any) => {
      console.log('📊 Portfolio update:', data);
      setPortfolioUpdates(prev => {
        const updated = new Map(prev);
        updated.set(data.portfolioId, {
          ...data,
          receivedAt: Date.now(),
        });
        return updated;
      });
    };

    const handlePortfolioValue = (data: any) => {
      console.log('💰 Portfolio value:', data);
      setPortfolioUpdates(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.portfolioId) || {};
        updated.set(data.portfolioId, {
          ...existing,
          ...data,
          receivedAt: Date.now(),
        });
        return updated;
      });
    };

    on('portfolio:update', handlePortfolioUpdate);
    on('portfolio:value', handlePortfolioValue);

    return () => {
      off('portfolio:update', handlePortfolioUpdate);
      off('portfolio:value', handlePortfolioValue);
    };
  }, [connected, on, off]);

  // Position update handler
  useEffect(() => {
    if (!connected) return;

    const handlePositionUpdate = (data: any) => {
      console.log('📈 Position update:', data);
      setPositionUpdates(prev => {
        const updated = new Map(prev);
        updated.set(data.positionId, {
          ...data,
          receivedAt: Date.now(),
        });
        return updated;
      });
    };

    on('position:update', handlePositionUpdate);

    return () => {
      off('position:update', handlePositionUpdate);
    };
  }, [connected, on, off]);

  // Price update handler
  useEffect(() => {
    if (!connected) return;

    const handlePriceUpdate = (data: any) => {
      setPriceUpdates(prev => {
        const updated = new Map(prev);
        updated.set(data.symbol, {
          ...data,
          receivedAt: Date.now(),
        });
        return updated;
      });
    };

    on('price:update', handlePriceUpdate);

    return () => {
      off('price:update', handlePriceUpdate);
    };
  }, [connected, on, off]);

  // Trade notification handler
  useEffect(() => {
    if (!connected) return;

    const handleTradeExecuted = (data: any) => {
      console.log('✅ Trade executed:', data);
      setTradeNotifications(prev => [{
        ...data,
        type: 'executed',
        receivedAt: Date.now(),
      }, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleTradeFailed = (data: any) => {
      console.log('❌ Trade failed:', data);
      setTradeNotifications(prev => [{
        ...data,
        type: 'failed',
        receivedAt: Date.now(),
      }, ...prev].slice(0, 50));
    };

    on('trade:executed', handleTradeExecuted);
    on('trade:failed', handleTradeFailed);

    return () => {
      off('trade:executed', handleTradeExecuted);
      off('trade:failed', handleTradeFailed);
    };
  }, [connected, on, off]);

  // Risk alert handler
  useEffect(() => {
    if (!connected) return;

    const handleRiskBreach = (data: any) => {
      console.log('⚠️ Risk breach:', data);
      setRiskAlerts(prev => [{
        ...data,
        receivedAt: Date.now(),
      }, ...prev].slice(0, 100));
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Risk Breach Alert', {
          body: `${data.breachType}: ${data.currentValue} (threshold: ${data.threshold})`,
          icon: '/hedgeai-icon.png',
        });
      }
    };

    on('risk:breach', handleRiskBreach);

    return () => {
      off('risk:breach', handleRiskBreach);
    };
  }, [connected, on, off]);

  // General alert handler
  useEffect(() => {
    if (!connected) return;

    const handleAlert = (data: any) => {
      console.log('🔔 Alert:', data);
      setAlerts(prev => [{
        ...data,
        receivedAt: Date.now(),
      }, ...prev].slice(0, 100));
    };

    const handleAlertTriggered = (data: any) => {
      console.log('🔔 Alert triggered:', data);
      setAlerts(prev => [{
        ...data,
        triggered: true,
        receivedAt: Date.now(),
      }, ...prev].slice(0, 100));
    };

    on('alert:new', handleAlert);
    on('alert:triggered', handleAlertTriggered);

    return () => {
      off('alert:new', handleAlert);
      off('alert:triggered', handleAlertTriggered);
    };
  }, [connected, on, off]);

  // Subscribe/Unsubscribe helpers
  const subscribeToPortfolio = useCallback((portfolioId: string) => {
    wsSubscribePortfolio(portfolioId);
  }, [wsSubscribePortfolio]);

  const unsubscribeFromPortfolio = useCallback((portfolioId: string) => {
    wsUnsubscribePortfolio(portfolioId);
  }, [wsUnsubscribePortfolio]);

  const subscribeToPosition = useCallback((positionId: string) => {
    wsSubscribePosition(positionId);
  }, [wsSubscribePosition]);

  const unsubscribeFromPosition = useCallback((positionId: string) => {
    wsUnsubscribePosition(positionId);
  }, [wsUnsubscribePosition]);

  const subscribeToPrices = useCallback((symbols: string[]) => {
    wsSubscribePrices(symbols);
  }, [wsSubscribePrices]);

  const unsubscribeFromPrices = useCallback((symbols: string[]) => {
    wsUnsubscribePrices(symbols);
  }, [wsUnsubscribePrices]);

  // Clear handlers
  const clearTradeNotifications = useCallback(() => {
    setTradeNotifications([]);
  }, []);

  const clearRiskAlerts = useCallback(() => {
    setRiskAlerts([]);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value: RealtimeContextValue = {
    connected,
    error,
    latency,
    portfolioUpdates,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    positionUpdates,
    subscribeToPosition,
    unsubscribeFromPosition,
    priceUpdates,
    subscribeToPrices,
    unsubscribeFromPrices,
    tradeNotifications,
    clearTradeNotifications,
    riskAlerts,
    clearRiskAlerts,
    alerts,
    clearAlerts,
    reconnect,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
