import { useState, useEffect } from "react";
import { C } from "../../constants/colors";
import { Card, Badge, Button } from "../common";
import { portfolioService } from "../../services/portfolioService";
import { tradeService } from "../../services/tradeService";

export const TradeHistoryPage = () => {
  const [trades, setTrades] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSide, setFilterSide] = useState("all");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPortfolio, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfoliosData, tradesData] = await Promise.all([
        portfolioService.getAllPortfolios(),
        tradeService.getAllTrades({
          portfolioId: selectedPortfolio !== "all" ? selectedPortfolio : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
          limit: 1000,
        }),
      ]);
      setPortfolios(portfoliosData || []);
      setTrades(tradesData || []);
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrade = async (tradeId) => {
    if (!confirm("Are you sure you want to cancel this trade?")) return;

    try {
      await tradeService.cancelTrade(tradeId);
      fetchData();
    } catch (err) {
      console.error("Failed to cancel trade:", err);
      alert("Failed to cancel trade: " + (err.response?.data?.message || err.message));
    }
  };

  const exportAsCSV = () => {
    const headers = ["Date", "Symbol", "Side", "Quantity", "Price", "Total", "Commission", "Status"];
    const rows = filteredTrades.map((t) => [
      new Date(t.createdAt).toLocaleString(),
      t.symbol,
      t.side,
      t.quantity,
      t.price.toFixed(2),
      t.totalValue.toFixed(2),
      t.commission.toFixed(2),
      t.status,
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trade_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(filteredTrades, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trade_history_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Apply client-side filters
  const filteredTrades = trades.filter((trade) => {
    if (filterSide !== "all" && trade.side !== filterSide) return false;
    if (searchSymbol && !trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
    return true;
  });

  const totalTrades = filteredTrades.length;
  const totalVolume = filteredTrades.reduce((sum, t) => sum + t.totalValue, 0);
  const totalCommissions = filteredTrades.reduce((sum, t) => sum + t.commission, 0);
  const buyTrades = filteredTrades.filter((t) => t.side === "BUY").length;
  const sellTrades = filteredTrades.filter((t) => t.side === "SELL").length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
        Loading trade history...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>
          📜 Trade History
        </h2>
        <Button onClick={() => setShowExportModal(true)}>
          📥 Export
        </Button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: C.white,
              padding: 28,
              borderRadius: 12,
              minWidth: 420,
              boxShadow: C.shadowMd,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: C.text }}>
              📥 Export Trade History
            </h3>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
              Choose your preferred export format:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={exportAsCSV}
                style={{
                  padding: "14px 18px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.white,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.lightAccent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.white;
                }}
              >
                <span style={{ fontSize: 20 }}>📋</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Export as CSV</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Spreadsheet format</div>
                </div>
              </button>
              <button
                onClick={exportAsJSON}
                style={{
                  padding: "14px 18px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.white,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.lightAccent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.white;
                }}
              >
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Export as JSON</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Data format</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px",
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
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Total Trades</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalTrades}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
            {buyTrades} BUY • {sellTrades} SELL
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Total Volume</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>${totalVolume.toLocaleString()}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Total Commissions</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.red }}>
            ${totalCommissions.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              PORTFOLIO
            </label>
            <select
              value={selectedPortfolio}
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
              }}
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              STATUS
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="EXECUTED">Executed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              SIDE
            </label>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <option value="all">Buy & Sell</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              SEARCH SYMBOL
            </label>
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="e.g., AAPL"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Trades Table */}
      <Card>
        {filteredTrades.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No trades found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    DATE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    SYMBOL
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    SIDE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    QUANTITY
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    PRICE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    TOTAL
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    COMMISSION
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    STATUS
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "14px 8px", fontSize: 12, color: C.textSub }}>
                      {new Date(trade.createdAt).toLocaleDateString()}
                      <div style={{ fontSize: 10, color: C.textMuted }}>
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 8px", fontWeight: 700, fontSize: 13 }}>
                      {trade.symbol}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "center" }}>
                      <Badge variant={trade.side === "BUY" ? "success" : "error"}>
                        {trade.side}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 600 }}>
                      {trade.quantity}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontSize: 13 }}>
                      ${trade.price.toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                      ${trade.totalValue.toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontSize: 12, color: C.textMuted }}>
                      ${trade.commission.toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "center" }}>
                      <Badge
                        variant={
                          trade.status === "EXECUTED"
                            ? "success"
                            : trade.status === "PENDING"
                            ? "warning"
                            : trade.status === "CANCELLED"
                            ? "default"
                            : "error"
                        }
                      >
                        {trade.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "center" }}>
                      {trade.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelTrade(trade.id)}
                          style={{
                            padding: "4px 10px",
                            border: "none",
                            borderRadius: 4,
                            background: C.red,
                            color: C.white,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
