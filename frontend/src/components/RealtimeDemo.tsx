// ═══════════════════════════════════════════════════════════════
// REALTIME DEMO COMPONENT
// Example usage of real-time features
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';

export const RealtimeDemo = () => {
  const {
    connected,
    error,
    latency,
    portfolioUpdates,
    positionUpdates,
    priceUpdates,
    tradeNotifications,
    riskAlerts,
    alerts,
    subscribeToPortfolio,
    subscribeToPosition,
    subscribeToPrices,
    reconnect,
  } = useRealtime();

  const [portfolioId, setPortfolioId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [symbols, setSymbols] = useState('AAPL,GOOGL,MSFT');

  const handleSubscribePortfolio = () => {
    if (portfolioId.trim()) {
      subscribeToPortfolio(portfolioId.trim());
    }
  };

  const handleSubscribePosition = () => {
    if (positionId.trim()) {
      subscribeToPosition(positionId.trim());
    }
  };

  const handleSubscribePrices = () => {
    if (symbols.trim()) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
      subscribeToPrices(symbolList);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Real-Time Features Demo</h1>
      
      {/* Connection Status */}
      <div style={{ 
        padding: 16, 
        marginBottom: 20, 
        backgroundColor: connected ? '#d4edda' : '#f8d7da',
        border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: 8 
      }}>
        <h3>Connection Status</h3>
        <p><strong>Connected:</strong> {connected ? '✅ Yes' : '❌ No'}</p>
        {error && <p style={{ color: '#721c24' }}><strong>Error:</strong> {error}</p>}
        <p><strong>Latency:</strong> {latency}ms</p>
        {!connected && (
          <button onClick={reconnect} style={{ padding: '8px 16px', marginTop: 8 }}>
            Reconnect
          </button>
        )}
      </div>

      {/* Subscriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <h3>Subscribe to Portfolio</h3>
          <input
            type="text"
            value={portfolioId}
            onChange={(e) => setPortfolioId(e.target.value)}
            placeholder="Portfolio ID"
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button onClick={handleSubscribePortfolio} style={{ width: '100%', padding: 8 }}>
            Subscribe
          </button>
        </div>

        <div>
          <h3>Subscribe to Position</h3>
          <input
            type="text"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            placeholder="Position ID"
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button onClick={handleSubscribePosition} style={{ width: '100%', padding: 8 }}>
            Subscribe
          </button>
        </div>

        <div>
          <h3>Subscribe to Prices</h3>
          <input
            type="text"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            placeholder="Symbols (comma-separated)"
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button onClick={handleSubscribePrices} style={{ width: '100%', padding: 8 }}>
            Subscribe
          </button>
        </div>
      </div>

      {/* Real-Time Updates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Portfolio Updates */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h3>Portfolio Updates ({portfolioUpdates.size})</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Array.from(portfolioUpdates.entries()).map(([id, data]) => (
              <div key={id} style={{ padding: 8, marginBottom: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                <p><strong>ID:</strong> {id}</p>
                <p><strong>Value:</strong> ${data.totalValue?.toLocaleString()}</p>
                <p><strong>P&L:</strong> ${data.pnl?.toLocaleString()}</p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  {new Date(data.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Price Updates */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h3>Price Updates ({priceUpdates.size})</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Array.from(priceUpdates.entries()).map(([symbol, data]) => (
              <div key={symbol} style={{ padding: 8, marginBottom: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                <p><strong>{symbol}</strong></p>
                <p><strong>Price:</strong> ${data.price?.toFixed(2)}</p>
                <p style={{ color: data.change >= 0 ? 'green' : 'red' }}>
                  <strong>Change:</strong> {data.change >= 0 ? '+' : ''}{data.change?.toFixed(2)}%
                </p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  {new Date(data.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Notifications */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h3>Trade Notifications ({tradeNotifications.length})</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {tradeNotifications.map((trade, idx) => (
              <div key={idx} style={{ 
                padding: 8, 
                marginBottom: 8, 
                backgroundColor: trade.type === 'executed' ? '#d4edda' : '#f8d7da', 
                borderRadius: 4 
              }}>
                <p><strong>{trade.type === 'executed' ? '✅' : '❌'} {trade.symbol}</strong></p>
                <p><strong>{trade.side}:</strong> {trade.quantity} @ ${trade.price}</p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  {new Date(trade.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Alerts */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h3>Risk Alerts ({riskAlerts.length})</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {riskAlerts.map((alert, idx) => (
              <div key={idx} style={{ 
                padding: 8, 
                marginBottom: 8, 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: 4 
              }}>
                <p><strong>⚠️ {alert.breachType}</strong></p>
                <p><strong>Current:</strong> {alert.currentValue}</p>
                <p><strong>Threshold:</strong> {alert.threshold}</p>
                <p><strong>Severity:</strong> {alert.severity}</p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  {new Date(alert.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* General Alerts */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 20 }}>
        <h3>General Alerts ({alerts.length})</h3>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ 
              padding: 8, 
              marginBottom: 8, 
              backgroundColor: '#e7f3ff', 
              borderRadius: 4 
            }}>
              <p><strong>🔔 {alert.type}</strong></p>
              <p>{alert.message}</p>
              <p style={{ fontSize: 12, color: '#666' }}>
                {new Date(alert.receivedAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
