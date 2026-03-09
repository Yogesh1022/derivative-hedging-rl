import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { C } from "../../constants/colors";
import { Card, Badge, Button, MetricCard } from "../common";
import { CreatePortfolioModal } from "../modals";
import { portfolioService } from "../../services/portfolioService";
import { analyticsService } from "../../services/analyticsService";

export const PortfoliosPage = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPerformance(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getAllPortfolios();
      setPortfolios(data || []);
      if (data && data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (portfolioId) => {
    try {
      const data = await analyticsService.getPortfolioPerformance(portfolioId, "30D");
      setPerformanceData(data);
    } catch (err) {
      console.error("Failed to fetch performance:", err);
    }
  };

  const handleCreatePortfolio = async (portfolioData) => {
    try {
      await portfolioService.createPortfolio(portfolioData);
      await fetchPortfolios();
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create portfolio:", err);
      alert("Failed to create portfolio: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStartEdit = (portfolio) => {
    setEditingPortfolio(portfolio.id);
    setEditName(portfolio.name);
    setEditDescription(portfolio.description || "");
  };

  const handleSaveEdit = async (portfolioId) => {
    try {
      await portfolioService.updatePortfolio(portfolioId, {
        name: editName,
        description: editDescription,
      });
      setEditingPortfolio(null);
      await fetchPortfolios();
    } catch (err) {
      console.error("Failed to update portfolio:", err);
      alert("Failed to update portfolio: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingPortfolio(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!confirm("Are you sure you want to delete this portfolio? This action cannot be undone.")) return;

    try {
      await portfolioService.deletePortfolio(portfolioId);
      await fetchPortfolios();
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(null);
      }
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
      alert("Failed to delete portfolio: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
        Loading portfolios...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>
          💼 Portfolio Management
        </h2>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Portfolio
        </Button>
      </div>

      {showCreateModal && (
        <CreatePortfolioModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePortfolio}
        />
      )}

      {portfolios.length === 0 ? (
        <Card>
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: C.text }}>
              No Portfolios Yet
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
              Create your first portfolio to start trading
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Portfolio
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Portfolio Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {portfolios.map((portfolio) => {
              const isEditing = editingPortfolio === portfolio.id;
              const isSelected = selectedPortfolio?.id === portfolio.id;

              return (
                <Card
                  key={portfolio.id}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? `2px solid ${C.accent}` : undefined,
                    background: isSelected ? C.lightAccent : undefined,
                  }}
                  onClick={() => !isEditing && setSelectedPortfolio(portfolio)}
                >
                  {isEditing ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Portfolio Name"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          marginBottom: 12,
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          marginBottom: 12,
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          fontSize: 12,
                          fontFamily: "inherit",
                          resize: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleSaveEdit(portfolio.id)}
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "none",
                            borderRadius: 6,
                            background: C.success,
                            color: C.white,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            background: C.white,
                            color: C.textSub,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: C.text }}>
                            {portfolio.name}
                          </h3>
                          {portfolio.description && (
                            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
                              {portfolio.description}
                            </p>
                          )}
                        </div>
                        {portfolio.isActive && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Total Value</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
                          ${portfolio.totalValue?.toLocaleString() || "0"}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>P&L</div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: (portfolio.pnl || 0) >= 0 ? C.success : C.red,
                            }}
                          >
                            {(portfolio.pnl || 0) >= 0 ? "+" : ""}${(portfolio.pnl || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>
                            {(portfolio.pnlPercent || 0) >= 0 ? "+" : ""}{(portfolio.pnlPercent || 0).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Risk Score</div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>
                            {portfolio.riskScore || 0}/100
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>
                            σ {((portfolio.volatility || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          paddingTop: 12,
                          borderTop: `1px solid ${C.border}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleStartEdit(portfolio)}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            background: C.white,
                            color: C.text,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                          style={{
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: 6,
                            background: C.redLight,
                            color: C.red,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Selected Portfolio Details */}
          {selectedPortfolio && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: C.text }}>
                {selectedPortfolio.name} - Performance
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <MetricCard
                  label="Sharpe Ratio"
                  value={(selectedPortfolio.sharpeRatio || 0).toFixed(2)}
                  icon="📐"
                  accent
                />
                <MetricCard
                  label="Max Drawdown"
                  value={`${((selectedPortfolio.maxDrawdown || 0) * 100).toFixed(1)}%`}
                  icon="📉"
                />
                <MetricCard
                  label="VaR 95%"
                  value={`$${Math.abs(selectedPortfolio.var95 || 0).toLocaleString()}`}
                  icon="📊"
                />
                <MetricCard
                  label="Cash Balance"
                  value={`$${(selectedPortfolio.cashBalance || 0).toLocaleString()}`}
                  icon="💵"
                />
              </div>

              {performanceData && performanceData.length > 0 && (
                <Card style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: C.text }}>
                    30-Day Performance
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: C.textMuted }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 10, fill: C.textMuted }} />
                      <Tooltip
                        contentStyle={{
                          background: C.white,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={C.accent}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
