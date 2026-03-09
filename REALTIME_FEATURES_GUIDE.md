# Real-Time Features Implementation Guide

## 🚀 Overview

This document provides a comprehensive guide to the real-time features implemented in the HedgeAI trading platform using WebSocket (Socket.IO) and Server-Sent Events (SSE).

## 📋 Features Implemented

### 1. WebSocket Integration (Socket.IO)
- ✅ Real-time price updates
- ✅ Live alert notifications
- ✅ Portfolio value streaming
- ✅ Position updates
- ✅ Trade execution notifications
- ✅ Risk limit breach alerts

### 2. Server-Sent Events (SSE)
- ✅ One-way server-to-client streaming
- ✅ Automatic reconnection
- ✅ Heartbeat mechanism
- ✅ Event subscription system

### 3. Redis Pub/Sub
- ✅ Message broker for event distribution
- ✅ Scalable architecture
- ✅ Multiple subscriber support

## 🏗️ Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Frontend  │◄─────►│   Backend   │◄─────►│    Redis    │
│  (React)    │  WS   │  (Node.js)  │ Pub   │   Pub/Sub   │
│             │  SSE  │   Socket.IO │ Sub   │             │
└─────────────┘       └─────────────┘       └─────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────┐       ┌─────────────┐
│  WebSocket  │       │   Events    │
│   Hook      │       │  Publisher  │
└─────────────┘       └─────────────┘
```

## 📦 Backend Components

### 1. Redis Service (`backend/src/services/redis.service.ts`)

Manages Redis Pub/Sub connections for event distribution.

**Key Features:**
- Publisher/Subscriber separation
- Automatic reconnection
- Type-safe channel definitions
- Error handling

**Usage:**
```typescript
import redisService, { CHANNELS } from '../services/redis.service';

// Publish an event
await redisService.publish(CHANNELS.PRICE_UPDATE, {
  symbol: 'AAPL',
  price: 150.25,
  change: 2.5,
  timestamp: new Date().toISOString(),
});

// Subscribe to events
redisService.subscribe(CHANNELS.PRICE_UPDATE, (data) => {
  console.log('Price update:', data);
});
```

**Available Channels:**
- `PRICE_UPDATE` - Real-time price updates
- `PORTFOLIO_UPDATE` - Portfolio value changes
- `PORTFOLIO_VALUE` - Portfolio valuation
- `POSITION_UPDATE` - Position changes
- `TRADE_EXECUTED` - Trade execution notifications
- `TRADE_FAILED` - Failed trade notifications
- `ALERT_NEW` - New alerts
- `ALERT_TRIGGERED` - Triggered alerts
- `RISK_BREACH` - Risk limit breaches

### 2. WebSocket Service (`backend/src/services/websocket.service.ts`)

Manages Socket.IO server and client connections.

**Key Features:**
- JWT authentication
- Room-based subscriptions
- User & role-based filtering
- Redis event forwarding

**Connection Flow:**
1. Client connects with JWT token
2. Server authenticates token
3. Client joins user-specific room
4. Client can subscribe to additional rooms (portfolios, positions, prices)

**Events:**
- Client → Server: `subscribe:portfolio`, `subscribe:position`, `subscribe:prices`
- Server → Client: `portfolio:update`, `position:update`, `price:update`, `trade:executed`, etc.

### 3. SSE Service (`backend/src/services/sse.service.ts`)

Manages Server-Sent Events connections.

**Key Features:**
- Long-lived HTTP connections
- Automatic heartbeat (every 30s)
- Channel-based subscriptions
- Client tracking

**Usage:**
```typescript
import sseService from '../services/sse.service';

// Send event to user
sseService.sendToUser(userId, 'trade:executed', {
  tradeId: '123',
  symbol: 'AAPL',
  status: 'executed',
});

// Broadcast to all clients
sseService.broadcast('market:alert', {
  message: 'Market volatility detected',
});
```

### 4. Real-Time Routes

**WebSocket Status** (`GET /api/realtime/status`)
- Get connection status and metrics

**Event Publishing** (for testing):
- `POST /api/realtime/price-update`
- `POST /api/realtime/portfolio-update`
- `POST /api/realtime/trade-executed`
- `POST /api/realtime/risk-breach`
- `POST /api/realtime/alert`

**SSE Endpoints:**
- `GET /api/sse/stream` - Establish SSE connection
- `POST /api/sse/subscribe` - Subscribe to channels
- `GET /api/sse/status` - Get SSE status

## 🎨 Frontend Components

### 1. useWebSocket Hook (`frontend/src/hooks/useWebSocket.ts`)

Custom React hook for WebSocket management.

**Usage:**
```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function MyComponent() {
  const { connected, on, emit, subscribePortfolio } = useWebSocket();

  useEffect(() => {
    // Subscribe to portfolio updates
    const handler = (data) => {
      console.log('Portfolio update:', data);
    };
    
    on('portfolio:update', handler);
    subscribePortfolio('portfolio-id-123');

    return () => {
      off('portfolio:update', handler);
    };
  }, []);

  return <div>Connected: {connected ? 'Yes' : 'No'}</div>;
}
```

**API:**
```typescript
{
  // State
  connected: boolean;
  error: string | null;
  latency: number;
  
  // Connection
  connect: () => void;
  disconnect: () => void;
  
  // Events
  on: (event: string, handler: Function) => void;
  off: (event: string, handler?: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  
  // Subscriptions
  subscribePortfolio: (portfolioId: string) => void;
  unsubscribePortfolio: (portfolioId: string) => void;
  subscribePosition: (positionId: string) => void;
  unsubscribePosition: (positionId: string) => void;
  subscribePrices: (symbols: string[]) => void;
  unsubscribePrices: (symbols: string[]) => void;
  
  // Utilities
  ping: () => void;
}
```

### 2. useSSE Hook (`frontend/src/hooks/useSSE.ts`)

Custom React hook for Server-Sent Events.

**Usage:**
```typescript
import { useSSE } from '../hooks/useSSE';

function MyComponent() {
  const { connected, on } = useSSE();

  useEffect(() => {
    const cleanup = on('trade:executed', (data) => {
      console.log('Trade executed:', data);
    });

    return cleanup;
  }, [on]);

  return <div>SSE Connected: {connected ? 'Yes' : 'No'}</div>;
}
```

### 3. RealtimeContext (`frontend/src/contexts/RealtimeContext.tsx`)

Global context provider for real-time features.

**Usage:**
```typescript
import { RealtimeProvider, useRealtime } from '../contexts/RealtimeContext';

// Wrap your app
function App() {
  return (
    <RealtimeProvider>
      <Dashboard />
    </RealtimeProvider>
  );
}

// Use in components
function Dashboard() {
  const {
    connected,
    portfolioUpdates,
    tradeNotifications,
    riskAlerts,
    subscribeToPortfolio,
  } = useRealtime();

  useEffect(() => {
    subscribeToPortfolio('my-portfolio-id');
  }, []);

  return (
    <div>
      <h1>Real-Time Dashboard</h1>
      {Array.from(portfolioUpdates.entries()).map(([id, data]) => (
        <div key={id}>
          Portfolio {id}: ${data.totalValue}
        </div>
      ))}
    </div>
  );
}
```

**Available Data:**
```typescript
{
  // Connection
  connected: boolean;
  error: string | null;
  latency: number;
  
  // Updates (as Maps)
  portfolioUpdates: Map<string, any>;
  positionUpdates: Map<string, any>;
  priceUpdates: Map<string, any>;
  
  // Notifications (as Arrays)
  tradeNotifications: any[];
  riskAlerts: any[];
  alerts: any[];
  
  // Subscriptions
  subscribeToPortfolio: (id: string) => void;
  unsubscribeFromPortfolio: (id: string) => void;
  subscribeToPosition: (id: string) => void;
  unsubscribeFromPosition: (id: string) => void;
  subscribeToPrices: (symbols: string[]) => void;
  unsubscribeFromPrices: (symbols: string[]) => void;
  
  // Utilities
  clearTradeNotifications: () => void;
  clearRiskAlerts: () => void;
  clearAlerts: () => void;
  reconnect: () => void;
}
```

## 🔧 Configuration

### Environment Variables

Add to `.env`:
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional

# CORS (already configured)
CORS_ORIGIN=http://localhost:5174
```

### Frontend Configuration

Add to `frontend/.env`:
```bash
VITE_API_URL=http://localhost:5000
```

## 🚀 Usage Examples

### Example 1: Real-Time Portfolio Monitoring

```typescript
function PortfolioMonitor({ portfolioId }) {
  const { portfolioUpdates, subscribeToPortfolio } = useRealtime();
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    subscribeToPortfolio(portfolioId);
  }, [portfolioId]);

  useEffect(() => {
    const update = portfolioUpdates.get(portfolioId);
    if (update) {
      setPortfolio(update);
    }
  }, [portfolioUpdates, portfolioId]);

  return (
    <div>
      <h2>Portfolio Value</h2>
      <p>${portfolio?.totalValue?.toLocaleString()}</p>
      <p style={{ color: portfolio?.pnl >= 0 ? 'green' : 'red' }}>
        P&L: ${portfolio?.pnl?.toLocaleString()}
      </p>
    </div>
  );
}
```

### Example 2: Live Price Ticker

```typescript
function PriceTicker({ symbols }) {
  const { priceUpdates, subscribeToPrices } = useRealtime();

  useEffect(() => {
    subscribeToPrices(symbols);
  }, [symbols]);

  return (
    <div>
      {symbols.map(symbol => {
        const price = priceUpdates.get(symbol);
        return (
          <div key={symbol}>
            <strong>{symbol}</strong>: ${price?.price?.toFixed(2)}
            <span style={{ color: price?.change >= 0 ? 'green' : 'red' }}>
              {price?.change >= 0 ? '+' : ''}{price?.change?.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### Example 3: Trade Notifications

```typescript
function TradeNotifications() {
  const { tradeNotifications, clearTradeNotifications } = useRealtime();

  return (
    <div>
      <h2>Recent Trades</h2>
      <button onClick={clearTradeNotifications}>Clear</button>
      {tradeNotifications.map((trade, idx) => (
        <div key={idx} style={{
          backgroundColor: trade.type === 'executed' ? '#d4edda' : '#f8d7da'
        }}>
          {trade.type === 'executed' ? '✅' : '❌'}
          {trade.symbol} {trade.side} {trade.quantity} @ ${trade.price}
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Risk Alerts

```typescript
function RiskAlertMonitor() {
  const { riskAlerts } = useRealtime();

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div>
      <h2>Risk Alerts</h2>
      {riskAlerts.map((alert, idx) => (
        <div key={idx} style={{ backgroundColor: '#fff3cd', padding: 10 }'>
          <strong>⚠️ {alert.breachType}</strong>
          <p>Current: {alert.currentValue} | Threshold: {alert.threshold}</p>
          <p>Severity: {alert.severity}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Testing

### Test WebSocket Connection

```bash
# In browser console
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('portfolio:update', (data) => console.log('Portfolio update:', data));
socket.emit('subscribe:portfolio', 'portfolio-id-123');
```

### Test SSE Connection

```javascript
const token = localStorage.getItem('hedgeai_token');
const eventSource = new EventSource(
  `http://localhost:5000/api/sse/stream?token=${token}`
);

eventSource.addEventListener('trade:executed', (e) => {
  console.log('Trade executed:', JSON.parse(e.data));
});
```

### Publish Test Events

```bash
# Price update
curl -X POST http://localhost:5000/api/realtime/price-update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "price": 150.25,
    "change": 2.5,
    "volume": 1000000
  }'

# Trade execution
curl -X POST http://localhost:5000/api/realtime/trade-executed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "tradeId": "trade-123",
    "symbol": "AAPL",
    "side": "BUY",
    "quantity": 100,
    "price": 150.25
  }'
```

## 📊 Performance Considerations

### Scalability
- **Redis Pub/Sub**: Enables horizontal scaling of WebSocket servers
- **Room-based subscriptions**: Reduces unnecessary message broadcasting
- **Event throttling**: Consider throttling high-frequency updates (prices)

### Optimization Tips
1. **Batch Updates**: Group multiple updates into single messages
2. **Delta Updates**: Send only changed fields instead of full objects
3. **Compression**: Enable WebSocket compression for large payloads
4. **Connection Pooling**: Reuse Redis connections
5. **Message TTL**: Set expiration on Redis messages

### Monitoring
- Track active WebSocket connections
- Monitor Redis Pub/Sub throughput
- Measure message latency
- Log connection errors

## 🔒 Security

### Authentication
- ✅ JWT token validation for WebSocket connections
- ✅ JWT token validation for SSE connections
- ✅ User-specific room isolation

### Best Practices
- Use HTTPS/WSS in production
- Validate all incoming events
- Implement rate limiting
- Sanitize event data
- Log security events

## 🐛 Troubleshooting

### WebSocket not connecting
1. Check JWT token validity
2. Verify CORS configuration
3. Check firewall/proxy settings
4. Ensure backend server is running

### Redis connection failed
1. Verify Redis server is running: `redis-cli ping`
2. Check Redis host/port configuration
3. Verify Redis password (if set)

### Events not received
1. Check if subscribed to correct channel
2. Verify event is being published
3. Check Redis Pub/Sub: `redis-cli PSUBSCRIBE '*'`
4. Check browser console for errors

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [React Hooks](https://react.dev/reference/react)

## ✅ Checklist

- [x] Redis service implementation
- [x] WebSocket server setup
- [x] SSE endpoints
- [x] Real-time event publishing
- [x] Frontend WebSocket hook
- [x] Frontend SSE hook
- [x] Real-time context provider
- [x] Demo component
- [x] Trade execution notifications
- [x] Documentation

## 🎯 Next Steps

1. **Install Redis**:
   ```bash
   # Windows (via Chocolatey)
   choco install redis-64

   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Start Redis**:
   ```bash
   redis-server
   ```

3. **Test the implementation**:
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Open browser and check console for WebSocket connection
   - Execute a trade and watch for real-time notification

4. **Integration**: Wrap your app with `RealtimeProvider` and start using real-time features!

---

**Implementation Status**: ✅ **COMPLETE**

All real-time features are implemented and ready for use. The system supports WebSocket bidirectional communication, SSE one-way streaming, and Redis Pub/Sub for scalable event distribution.
