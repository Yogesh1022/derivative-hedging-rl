import { useState, useEffect } from "react";
import { C } from "../../constants/colors";
import { Card, Badge, Button } from "../common";
import { portfolioService } from "../../services/portfolioService";
import { positionService } from "../../services/positionService";

export const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedPortfolio, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfoliosData, positionsData] = await Promise.all([
        portfolioService.getAllPortfolios(),
        positionService.getAllPositions(
          selectedPortfolio !== "all" ? selectedPortfolio : undefined,
          filterStatus === "closed"
        ),
      ]);
      setPortfolios(portfoliosData || []);
      setPositions(positionsData || []);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (positionId) => {
    if (!confirm("Are you sure you want to close this position?")) return;

    try {
      await positionService.closePosition(positionId);
      fetchData();
    } catch (err) {
      console.error("Failed to close position:", err);
      alert("Failed to close position: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStartEdit = (position) => {
    setEditingPosition(position.id);
    setEditQuantity(position.quantity.toString());
    setEditPrice(position.currentPrice.toString());
  };

  const handleSaveEdit = async (positionId) => {
    try {
      await positionService.updatePosition(positionId, {
        quantity: parseFloat(editQuantity),
        currentPrice: parseFloat(editPrice),
      });
      setEditingPosition(null);
      fetchData();
    } catch (err) {
      console.error("Failed to update position:", err);
      alert("Failed to update position: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingPosition(null);
    setEditQuantity("");
    setEditPrice("");
  };

  const filteredPositions = positions;

  const totalMarketValue = filteredPositions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  const totalUnrealizedPnL = filteredPositions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
        Loading positions...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>
          📊 Position Management
        </h2>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Total Positions</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{filteredPositions.length}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Market Value</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>${totalMarketValue.toLocaleString()}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Unrealized P&L</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: totalUnrealizedPnL >= 0 ? C.success : C.red }}>
            {totalUnrealizedPnL >= 0 ? "+" : ""}${totalUnrealizedPnL.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
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
        <div style={{ flex: 1, minWidth: 200 }}>
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
            <option value="open">Open Positions</option>
            <option value="closed">Closed Positions</option>
          </select>
        </div>
      </div>

      {/* Positions Table */}
      <Card>
        {filteredPositions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No positions found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    SYMBOL
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    TYPE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    QUANTITY
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    AVG PRICE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    CURRENT
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    MKT VALUE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    P&L
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    GREEKS
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textMuted }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((position) => {
                  const isEditing = editingPosition === position.id;
                  const pnl = position.unrealizedPnL || 0;
                  const pnlPercent = position.avgPrice > 0 
                    ? ((position.currentPrice - position.avgPrice) / position.avgPrice * 100).toFixed(2)
                    : 0;

                  return (
                    <tr
                      key={position.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isEditing ? C.bgLight : "transparent",
                      }}
                    >
                      <td style={{ padding: "14px 8px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{position.symbol}</div>
                        {position.assetType === "OPTION" && (
                          <div style={{ fontSize: 10, color: C.textMuted }}>
                            {position.optionType} ${position.strikePrice}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <Badge variant={position.assetType === "STOCK" ? "default" : "info"}>
                          {position.assetType}
                        </Badge>
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            style={{
                              width: 80,
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: `1px solid ${C.border}`,
                              fontSize: 12,
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{position.quantity}</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontSize: 13 }}>
                        ${position.avgPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            step="0.01"
                            style={{
                              width: 80,
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: `1px solid ${C.border}`,
                              fontSize: 12,
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            ${position.currentPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                        ${(position.marketValue || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: pnl >= 0 ? C.success : C.red, fontSize: 13 }}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>
                          {pnl >= 0 ? "+" : ""}{pnlPercent}%
                        </div>
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "center", fontSize: 11 }}>
                        {position.delta !== null && position.delta !== undefined ? (
                          <div>
                            <div>Δ {position.delta.toFixed(3)}</div>
                            {position.gamma && <div style={{ color: C.textMuted }}>Γ {position.gamma.toFixed(3)}</div>}
                          </div>
                        ) : (
                          <span style={{ color: C.textMuted }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "center" }}>
                        {!position.isClosed && (
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(position.id)}
                                  style={{
                                    padding: "4px 10px",
                                    border: "none",
                                    borderRadius: 4,
                                    background: C.success,
                                    color: C.white,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: "4px 10px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    background: C.white,
                                    color: C.textSub,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(position)}
                                  style={{
                                    padding: "4px 10px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
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
                                  onClick={() => handleClosePosition(position.id)}
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
                                  Close
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {position.isClosed && (
                          <Badge variant="default">Closed</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
