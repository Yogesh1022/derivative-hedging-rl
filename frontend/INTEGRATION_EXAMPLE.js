// ═══════════════════════════════════════════════════════════════
// EXAMPLE: How to integrate RealtimeProvider into TradingRiskPlatform.jsx
// ═══════════════════════════════════════════════════════════════

/*
  STEP 1: Add import at the top of TradingRiskPlatform.jsx
*/
import { RealtimeProvider } from "./src/contexts/RealtimeContext";

/*
  STEP 2: Wrap authenticated pages with RealtimeProvider
  
  Find the App component export (around line 2812) and update it like this:
*/

export default function App() {
  // ... existing getInitialPage and state code ...

  return (
    <div style={{ fontFamily:"'DM Sans', 'Sora', system-ui, sans-serif", minHeight:"100vh" }}>
      {page === "landing" && <LandingPage onNavigate={navigate} />}
      {page === "signup" && <SignUpPage onNavigate={navigate} />}
      {page === "signin" && <SignInPage onNavigate={navigate} />}
      {page === "forgot_password" && <ForgotPasswordPage onNavigate={navigate} />}
      {isResetPassword && <ResetPasswordPage onNavigate={navigate} token={resetToken || "demo-token"} />}
      
      {/* Wrap authenticated dashboard pages with RealtimeProvider */}
      {dashRole && dashRole !== "admin" && (
        <RealtimeProvider>
          <Dashboard role={dashRole} onNavigate={navigate} />
        </RealtimeProvider>
      )}
      
      {(page === "dashboard_admin" || dashRole === "admin") && (
        <RealtimeProvider>
          <AdminDashboard onNavigate={navigate} />
        </RealtimeProvider>
      )}

      {showChatbot && <Chatbot page={page} />}
    </div>
  );
}

/*
  STEP 3: Add a RealtimeIndicator component to show connection status
  
  Add this component anywhere in your file (before the App component):
*/

const RealtimeIndicator = () => {
  // Import useRealtime at the top: import { useRealtime } from "./src/contexts/RealtimeContext";
  const { connected, error, latency, reconnect } = useRealtime();
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      backgroundColor: connected ? '#d4edda' : '#f8d7da',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      cursor: !connected ? 'pointer' : 'default',
    }}
    onClick={!connected ? reconnect : undefined}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: connected ? '#28a745' : '#dc3545',
        animation: connected ? 'pulse 2s infinite' : 'none',
      }} />
      <span>
        {connected ? `LIVE ${latency}ms` : (error || 'OFFLINE')}
      </span>
    </div>
  );
};

/*
  STEP 4: Add the indicator to the TopBar component
  
  Find the TopBar component (around line 845) and add the indicator:
*/

const TopBar = ({ role, onLogout, onNavigate }) => {
  // ... existing code ...
  
  return (
    <div style={{/* existing styles */}}>
      {/* Left side with role */}
      <div>...</div>
      
      {/* Center - Add RealtimeIndicator here */}
      <RealtimeIndicator />
      
      {/* Right side with user menu */}
      <div>...</div>
    </div>
  );
};

/*
  STEP 5: Use real-time data in your dashboard components
  
  Example: Update TraderOverview to show real-time data
*/

const TraderOverview = () => {
  const { portfolioUpdates, tradeNotifications, subscribeToPortfolio } = useRealtime();
  const [portfolios, setPortfolios] = useState([]);

  useEffect(() => {
    // Fetch initial portfolios
    const fetchData = async () => {
      try {
        const data = await portfolioService.getAllPortfolios();
        setPortfolios(data || []);
        
        // Subscribe to real-time updates
        data?.forEach(p => subscribeToPortfolio(p.id));
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchData();
  }, []);

  // Update portfolios when real-time data arrives
  useEffect(() => {
    if (portfolioUpdates.size > 0) {
      setPortfolios(prev => 
        prev.map(p => {
          const update = portfolioUpdates.get(p.id);
          if (update) {
            return {
              ...p,
              totalValue: update.totalValue || p.totalValue,
              pnl: update.pnl || p.pnl,
              // Add visual indicator that it's updated
              _justUpdated: true,
            };
          }
          return p;
        })
      );
    }
  }, [portfolioUpdates]);

  return (
    <div>
      {/* Show recent trade notifications */}
      {tradeNotifications.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#d4edda',
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
        }}>
          <strong>✅ Trade Executed</strong>
          <p>{tradeNotifications[0].symbol} {tradeNotifications[0].side}</p>
        </div>
      )}
      
      {/* Your existing overview content with updated portfolio data */}
      {portfolios.map(p => (
        <Card key={p.id} style={{
          border: p._justUpdated ? '2px solid #28a745' : '1px solid #E2E2E7',
          transition: 'border 0.3s ease',
        }}>
          <div>Portfolio: {p.name}</div>
          <div>Value: ${p.totalValue?.toLocaleString()}</div>
          <div>P&L: ${p.pnl?.toLocaleString()}</div>
        </Card>
      ))}
    </div>
  );
};

/*
  STEP 6: Add CSS animation for the pulse effect
  
  Add this to your index.css or inline in a <style> tag:
*/

/*
<style>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
*/

/*
  THAT'S IT! Your app now has real-time features! 🎉
  
  When you execute a trade, you'll see:
  1. The connection indicator showing "LIVE" with latency
  2. A toast notification for the trade
  3. Portfolio values updating in real-time
  4. All without page refresh!
  
  For more examples and detailed documentation, see:
  - REALTIME_QUICKSTART.md
  - REALTIME_FEATURES_GUIDE.md
*/
