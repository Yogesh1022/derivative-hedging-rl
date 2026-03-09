# Real-Time Features - Quick Start Integration

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Redis (if not already installed)

**Option A - Docker (Recommended)**:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Option B - Windows (Chocolatey)**:
```bash
choco install redis-64
redis-server
```

**Option C - Linux**:
```bash
sudo apt-get install redis-server
redis-server
```

### Step 2: Add Environment Variables

Add to `backend/.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=  # Optional, leave empty for local development
```

### Step 3: Restart Backend

The backend is already configured with WebSocket support. Just restart:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Redis Publisher connected
✅ Redis Subscriber connected
🔌 WebSocket server initialized
WebSocket:       ws://localhost:5000
```

### Step 4: Integrate RealtimeProvider in Frontend

Update `frontend/TradingRiskPlatform.jsx` (or your main component):

```jsx
import { RealtimeProvider } from './src/contexts/RealtimeContext';

export default function App() {
  const [page, setPage] = useState("landing");
  
  // ... existing code ...

  return (
    <div style={{ fontFamily:"'DM Sans', 'Sora', system-ui, sans-serif", minHeight:"100vh" }}>
      {page === "landing" && <LandingPage onNavigate={navigate} />}
      {page === "signup" && <SignUpPage onNavigate={navigate} />}
      {page === "signin" && <SignInPage onNavigate={navigate} />}
      
      {/* Wrap authenticated pages with RealtimeProvider */}
      {dashRole && (
        <RealtimeProvider>
          <Dashboard role={dashRole} onNavigate={navigate} />
        </RealtimeProvider>
      )}
      
      {(page === "dashboard_admin" || dashRole === "admin") && (
        <RealtimeProvider>
          <AdminDashboard onNavigate={navigate} />
        </RealtimeProvider>
      )}
    </div>
  );
}
```

### Step 5: Use Real-Time Features in Components

**Example 1: Show Connection Status**

```jsx
import { useRealtime } from './src/contexts/RealtimeContext';

function Dashboard({ role }) {
  const { connected, latency } = useRealtime();
  
  return (
    <div>
      {/* Connection indicator */}
      <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        padding: '5px 10px',
        backgroundColor: connected ? '#d4edda' : '#f8d7da',
        borderRadius: 5,
        fontSize: 12
      }}>
        {connected ? `🟢 Live (${latency}ms)` : '🔴 Disconnected'}
      </div>
      
      {/* Your existing dashboard content */}
    </div>
  );
}
```

**Example 2: Real-Time Portfolio Updates**

```jsx
function PortfoliosPage() {
  const { portfolioUpdates, subscribeToPortfolio } = useRealtime();
  const [portfolios, setPortfolios] = useState([]);

  useEffect(() => {
    // Fetch initial portfolios
    portfolioService.getAllPortfolios().then(data => {
      setPortfolios(data);
      
      // Subscribe to real-time updates for each portfolio
      data.forEach(p => subscribeToPortfolio(p.id));
    });
  }, []);

  useEffect(() => {
    // Update local state when real-time data arrives
    setPortfolios(prev => 
      prev.map(p => {
        const update = portfolioUpdates.get(p.id);
        return update ? { ...p, ...update } : p;
      })
    );
  }, [portfolioUpdates]);

  return (
    <div>
      {portfolios.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>Value: ${p.totalValue?.toLocaleString()}</p>
          <p>P&L: ${p.pnl?.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

**Example 3: Trade Notifications Toast**

```jsx
function TradeNotificationToast() {
  const { tradeNotifications } = useRealtime();
  const [visible, setVisible] = useState(false);
  const [latestTrade, setLatestTrade] = useState(null);

  useEffect(() => {
    if (tradeNotifications.length > 0) {
      const latest = tradeNotifications[0];
      setLatestTrade(latest);
      setVisible(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setVisible(false), 5000);
    }
  }, [tradeNotifications]);

  if (!visible || !latestTrade) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      padding: 20,
      backgroundColor: latestTrade.type === 'executed' ? '#d4edda' : '#f8d7da',
      border: `1px solid ${latestTrade.type === 'executed' ? '#c3e6cb' : '#f5c6cb'}`,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>
          {latestTrade.type === 'executed' ? '✅' : '❌'}
        </span>
        <div>
          <strong>
            {latestTrade.type === 'executed' ? 'Trade Executed' : 'Trade Failed'}
          </strong>
          <p style={{ margin: '5px 0 0 0', fontSize: 14 }}>
            {latestTrade.symbol} {latestTrade.side} {latestTrade.quantity} @ ${latestTrade.price}
          </p>
        </div>
        <button 
          onClick={() => setVisible(false)}
          style={{ 
            marginLeft: 'auto', 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: 18
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

**Example 4: Risk Alert Banner**

```jsx
function RiskAlertBanner() {
  const { riskAlerts, clearRiskAlerts } = useRealtime();
  
  if (riskAlerts.length === 0) return null;
  
  const latestAlert = riskAlerts[0];
  
  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong>⚠️ Risk Alert: {latestAlert.breachType}</strong>
          <p style={{ margin: '5px 0 0 0' }}>
            Current: {latestAlert.currentValue} | Threshold: {latestAlert.threshold}
          </p>
        </div>
        <button onClick={clearRiskAlerts}>Dismiss</button>
      </div>
    </div>
  );
}
```

### Step 6: Test It!

1. **Start everything**:
   ```bash
   # Terminal 1 - Redis
   redis-server
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   
   # Terminal 3 - Frontend
   cd frontend && npm run dev
   ```

2. **Login to the app and check browser console** - you should see:
   ```
   ✅ WebSocket connected: <socket-id>
   🔗 WebSocket handshake: {...}
   ```

3. **Execute a trade** - you should immediately see:
   ```
   ✅ Trade executed: {...}
   ```

4. **Watch the dashboard update in real-time!**

## 🎨 Pre-built Components

### Real-Time Indicator Component

Add this anywhere to show connection status:

```jsx
import { useRealtime } from './src/contexts/RealtimeContext';

export function RealtimeIndicator() {
  const { connected, error, latency } = useRealtime();
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 12px',
      backgroundColor: connected ? '#d4edda' : '#f8d7da',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: connected ? '#28a745' : '#dc3545',
      }} />
      <span>
        {connected ? `LIVE ${latency}ms` : error || 'OFFLINE'}
      </span>
    </div>
  );
}
```

Usage:
```jsx
<TopBar>
  <RealtimeIndicator />
</TopBar>
```

## 📊 Test Real-Time Events (via API)

You can manually trigger events for testing:

```bash
# Get auth token first (login via UI, then check localStorage.hedgeai_token)
TOKEN="your_jwt_token_here"

# Test price update
curl -X POST http://localhost:5000/api/realtime/price-update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "price": 150.25,
    "change": 2.5,
    "volume": 1000000
  }'

# Test portfolio update
curl -X POST http://localhost:5000/api/realtime/portfolio-update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "YOUR_PORTFOLIO_ID",
    "totalValue": 1500000,
    "pnl": 50000,
    "positions": 10
  }'

# Test risk breach
curl -X POST http://localhost:5000/api/realtime/risk-breach \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "portfolioId": "YOUR_PORTFOLIO_ID",
    "breachType": "VaR Limit Exceeded",
    "threshold": 100000,
    "currentValue": 125000,
    "severity": "HIGH"
  }'
```

## 🔍 Debugging

### Check if Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Monitor Redis events in real-time:
```bash
redis-cli PSUBSCRIBE '*'
```

### Check WebSocket connection in browser console:
```javascript
// After logging in, check:
console.log('WS Connected:', window.io?._socket?.connected);
```

### View active subscriptions:
```javascript
// In your component:
console.log('Portfolio Updates:', Array.from(portfolioUpdates.entries()));
console.log('Trade Notifications:', tradeNotifications);
console.log('Risk Alerts:', riskAlerts);
```

## ✅ Verification Checklist

- [ ] Redis server is running (`redis-cli ping` returns PONG)
- [ ] Backend shows "WebSocket server initialized"
- [ ] Frontend console shows "WebSocket connected"
- [ ] Connection indicator shows "🟢 LIVE"
- [ ] Trade execution triggers notification
- [ ] Real-time updates appear without page refresh

## 🎯 Next Steps

1. **Add to Trader Dashboard**: Show real-time P&L updates
2. **Add to Risk Manager Dashboard**: Show live risk metrics
3. **Add to Analyst Dashboard**: Show market data feeds
4. **Customize notifications**: Add sound effects, browser notifications
5. **Add charts**: Integrate with charting library for live price charts

---

**That's it!** 🎉 You now have fully functional real-time features in your trading platform.

For detailed API documentation, see [REALTIME_FEATURES_GUIDE.md](./REALTIME_FEATURES_GUIDE.md)
