import { C } from "../../constants/colors";

export const Sidebar = ({ role, activePage, setActivePage, collapsed, setCollapsed }) => {
  const navItems = {
    trader: [
      { id: "overview", icon: "📊", label: "Overview" },
      { id: "portfolios", icon: "💼", label: "Portfolios" },
      { id: "positions", icon: "📋", label: "Positions" },
      { id: "trades", icon: "🔄", label: "Trade History" },
      { id: "ai", icon: "🤖", label: "AI Advisor" },
    ],
    analyst: [
      { id: "overview", icon: "📊", label: "Overview" },
      { id: "trends", icon: "📉", label: "Market Trends" },
      { id: "heatmap", icon: "🌡", label: "Risk Heatmap" },
      { id: "performance", icon: "🏆", label: "Performance" },
      { id: "reports", icon: "📋", label: "Reports" },
    ],
    risk_manager: [
      { id: "overview", icon: "📊", label: "Overview" },
      { id: "exposure", icon: "⚠️", label: "Exposure Table" },
      { id: "var", icon: "📉", label: "VaR Analysis" },
      { id: "alerts", icon: "🔔", label: "Alerts" },
      { id: "limits", icon: "🔒", label: "Risk Limits" },
    ],
  };
  const items = navItems[role] || navItems.trader;
  const roleLabel = { trader: "Trader", analyst: "Analyst", risk_manager: "Risk Manager" }[role] || role;

  return (
    <div
      style={{
        width: collapsed ? 64 : 240,
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 68,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: C.red,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.white,
            fontWeight: 900,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          Δ
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: C.text,
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
            }}
          >
            HedgeAI
          </span>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div
            style={{
              background: C.redGhost,
              borderRadius: 8,
              padding: "6px 10px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.textMuted,
                fontWeight: 600,
                letterSpacing: 1,
                marginBottom: 2,
              }}
            >
              LOGGED IN AS
            </div>
            <div style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>{roleLabel}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {items.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
                background: active ? C.redGhost : "transparent",
                borderLeft: active ? `3px solid ${C.red}` : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? C.red : C.textSub,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.lightGray,
            cursor: "pointer",
            fontSize: 12,
            color: C.textSub,
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
      </div>
    </div>
  );
};
