import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { C } from "../../constants/colors";
import { pnlData, riskData } from "../../constants/mockData";
import { MetricCard, AnimCounter, Badge, Button, Card } from "../common";
import { CreatePortfolioModal } from "../modals";
import { portfolioService } from "../../services/portfolioService";
import { positionService } from "../../services/positionService";
import { tradeService } from "../../services/tradeService";
import { analyticsService } from "../../services/analyticsService";

export const TraderOverview = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30D");
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [portfoliosData, positionsData, tradesData, statsData] = await Promise.all([
          portfolioService.getAllPortfolios(),
          positionService.getAllPositions(),
          tradeService.getAllTrades({ limit: 10 }),
          analyticsService.getDashboardStats(),
        ]);

        setPortfolios(portfoliosData || []);
        setPositions(positionsData || []);
        setTrades(tradesData || []);
        setDashboardStats(statsData || null);

        // Select first portfolio by default
        if (portfoliosData && portfoliosData.length > 0) {
          setSelectedPortfolio(portfoliosData[0].id);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch portfolio performance when portfolio or period changes
  useEffect(() => {
    const fetchPerformance = async () => {
      if (!selectedPortfolio) return;
      try {
        const data = await analyticsService.getPortfolioPerformance(
          selectedPortfolio,
          selectedPeriod
        );
        setPerformanceData(data);
      } catch (err) {
        console.error("Error fetching performance data:", err);
      }
    };
    fetchPerformance();
  }, [selectedPortfolio, selectedPeriod]);

  const handleCreatePortfolio = async (portfolioData) => {
    try {
      await portfolioService.createPortfolio(portfolioData);
      // Refresh portfolios
      const portfoliosData = await portfolioService.getAllPortfolios();
      setPortfolios(portfoliosData || []);
      setShowCreatePortfolio(false);
    } catch (err) {
      console.error("Error creating portfolio:", err);
      alert("Failed to create portfolio: " + (err.response?.data?.message || err.message));
    }
  };

  // Use analytics stats if available, otherwise calculate from real data
  const totalPortfolioValue =
    dashboardStats?.totalValue ||
    portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalPnL =
    dashboardStats?.totalPnL || portfolios.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const avgRiskScore =
    dashboardStats?.avgRiskScore ||
    (portfolios.length > 0
      ? Math.round(portfolios.reduce((sum, p) => sum + (p.riskScore || 0), 0) / portfolios.length)
      : 0);
  const openPositionsCount =
    dashboardStats?.openPositions || positions.filter((p) => !p.isClosed).length;
  const totalTrades = dashboardStats?.totalTrades || trades.length;

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}
      >
        <div style={{ fontSize: 14, color: C.textMuted }}>Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.red, marginBottom: 8 }}>
            Failed to load dashboard
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <MetricCard
          label="Portfolio Value"
          value={<AnimCounter end={totalPortfolioValue} prefix="$" />}
          change="2.4%"
          changeDir="up"
          icon="💰"
          accent
        />
        <MetricCard
          label="Today's P&L"
          value={
            totalPnL >= 0 ? (
              <AnimCounter end={totalPnL} prefix="+$" />
            ) : (
              <AnimCounter end={Math.abs(totalPnL)} prefix="-$" />
            )
          }
          change="1.2%"
          changeDir={totalPnL >= 0 ? "up" : "down"}
          icon="📈"
        />
        <MetricCard
          label="Risk Score"
          value={`${avgRiskScore}/100`}
          change="3pts"
          changeDir="down"
          icon="🛡"
        />
        <MetricCard label="Open Positions" value={String(openPositionsCount)} icon="🔄" />
      </div>

      {/* Portfolio Selection */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: C.textMuted,
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            SELECT PORTFOLIO
          </label>
          <select
            value={selectedPortfolio || ""}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">All Portfolios</option>
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${(p.totalValue || 0).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Button variant="primary" size="sm" onClick={() => setShowCreatePortfolio(true)}>
            + Create Portfolio
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Portfolio P&L — {selectedPeriod}
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {["1D", "7D", "30D", "3M"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedPeriod(t)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: t === selectedPeriod ? C.red : "transparent",
                    color: t === selectedPeriod ? C.white : C.textSub,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceData?.chartData || pnlData}>
              <defs>
                <linearGradient id="pnlGrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.textMuted }} interval={4} />
              <YAxis
                tick={{ fontSize: 9, fill: C.textMuted }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${v.toLocaleString()}`, "P&L"]}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={C.red}
                strokeWidth={2}
                fill="url(#pnlGrd)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Risk Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {riskData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {riskData.map((d) => (
              <div
                key={d.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: d.color,
                    }}
                  />
                  <span style={{ fontSize: 12, color: C.textSub }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Trades</h3>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        {trades.length === 0 ? (
          <div
            style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}
          >
            No trades yet. Create your first trade to get started.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["ID", "Symbol", "Side", "Qty", "Price", "P&L", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 0.5,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 5).map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: `1px solid ${C.borderLight}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.offWhite)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    style={{
                      padding: "11px 12px",
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: C.textSub,
                    }}
                  >
                    {t.id.substring(0, 8)}
                  </td>
                  <td style={{ padding: "11px 12px", fontWeight: 700 }}>{t.symbol}</td>
                  <td style={{ padding: "11px 12px" }}>
                    <Badge variant={t.side === "BUY" ? "green" : "red"}>{t.side}</Badge>
                  </td>
                  <td style={{ padding: "11px 12px", color: C.textSub }}>{t.quantity}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "monospace" }}>
                    ${t.price.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      fontWeight: 700,
                      color: t.pnl >= 0 ? C.success : C.red,
                    }}
                  >
                    {t.pnl >= 0 ? "+" : ""}${t.pnl ? t.pnl.toFixed(2) : "0.00"}
                  </td>
                  <td style={{ padding: "11px 12px" }}>
                    <Badge
                      variant={
                        t.status === "EXECUTED"
                          ? "green"
                          : t.status === "PENDING"
                          ? "blue"
                          : t.status === "CANCELLED"
                          ? "default"
                          : "red"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && (
        <CreatePortfolioModal
          onClose={() => setShowCreatePortfolio(false)}
          onCreate={handleCreatePortfolio}
        />
      )}
    </div>
  );
};
