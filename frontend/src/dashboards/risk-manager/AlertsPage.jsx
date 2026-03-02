import { useState, useEffect } from "react";
import { C } from "../../constants/colors";
import { Card, Button, Badge, Select } from "../../components/common";
import { alertService } from "../../services/alertService";

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    type: "error",
    condition: "greater_than",
    metric: "var95",
    threshold: "",
    portfolios: "all",
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAllAlerts();
      setAlerts(data || mockAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    console.log('Creating alert rule:', newRule);
    alert(`Alert Rule Created:\n${newRule.name}\nMetric: ${newRule.metric}\nThreshold: ${newRule.threshold}`);
    setShowCreateModal(false);
    setNewRule({
      name: "",
      type: "error",
      condition: "greater_than",
      metric: "var95",
      threshold: "",
      portfolios: "all",
    });
  };

  const handleExportAlerts = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['ID', 'Title', 'Severity', 'Type', 'Message', 'Portfolio', 'Time', 'Status'],
      ...alerts.map(a => [a.id, a.title, a.severity, a.type, a.msg, a.portfolio, a.time, a.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #4CAF50; color: white; font-weight: bold; }</style></head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>Severity</th><th>Type</th><th>Message</th><th>Portfolio</th><th>Time</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(a => `
              <tr>
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td>${a.severity}</td>
                <td>${a.type}</td>
                <td>${a.msg}</td>
                <td>${a.portfolio}</td>
                <td>${a.time}</td>
                <td>${a.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_export_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
      <head>
        <title>Alerts Report - ${new Date().toISOString().split('T')[0]}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .critical { color: #d32f2f; font-weight: bold; }
          .high { color: #f57c00; font-weight: bold; }
          .medium { color: #ffa726; }
          .low { color: #66bb6a; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Risk Alerts Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Alerts:</strong> ${alerts.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>Severity</th><th>Type</th><th>Message</th><th>Portfolio</th><th>Time</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(a => `
              <tr>
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td class="${a.severity}">${a.severity}</td>
                <td>${a.type}</td>
                <td>${a.msg}</td>
                <td>${a.portfolio}</td>
                <td>${a.time}</td>
                <td>${a.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    setShowExportModal(false);
  };

  const mockAlerts = [
    { id: 1, type: "error", severity: "critical", title: "Delta Exposure Limit Breach", msg: "Portfolio delta exceeds 15% threshold — immediate action recommended", time: "5 min ago", portfolio: "Delta Neutral Fund", status: "active" },
    { id: 2, type: "warning", severity: "high", title: "High Gamma Concentration", msg: "Gamma concentration in AAPL exceeds 80% of limit", time: "12 min ago", portfolio: "Volatility Arbitrage", status: "active" },
    { id: 3, type: "warning", severity: "high", title: "VaR Utilization High", msg: "95% VaR utilization at 87% of budget", time: "1 hour ago", portfolio: "All Portfolios", status: "active" },
    { id: 4, type: "error", severity: "critical", title: "Position Size Limit Breach", msg: "TSLA position exceeds individual position limit by $20K", time: "2 hours ago", portfolio: "Straddle Strategy", status: "active" },
    { id: 5, type: "info", severity: "low", title: "Approaching Vega Limit", msg: "Vega exposure at 72% of limit", time: "3 hours ago", portfolio: "Iron Condor", status: "acknowledged" },
    { id: 6, type: "success", severity: "low", title: "Risk Score Improved", msg: "Portfolio risk score decreased from 82 to 74", time: "5 hours ago", portfolio: "All Portfolios", status: "resolved" },
    { id: 7, type: "warning", severity: "medium", title: "Liquidity Warning", msg: "Low liquidity detected in TLT options", time: "6 hours ago", portfolio: "Bond Arbitrage", status: "acknowledged" },
  ];

  const handleDismiss = async (alertId) => {
    try {
      await alertService.dismissAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      alert('Failed to dismiss alert');
    }
  };

  const filteredAlerts = filter === "all" 
    ? alerts 
    : alerts.filter(a => a.type === filter || a.severity === filter || a.status === filter);

  const criticalCount = alerts.filter(a => a.severity === "critical" && a.status === "active").length;
  const highCount = alerts.filter(a => a.severity === "high" && a.status === "active").length;
  const activeCount = alerts.filter(a => a.status === "active").length;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading alerts...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Alerts</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button 
            onClick={handleExportAlerts} 
            style={{ 
              background: C.accent, 
              color: C.white,
              boxShadow: C.shadowSm,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.accentHover;
              e.currentTarget.style.boxShadow = C.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.accent;
              e.currentTarget.style.boxShadow = C.shadowSm;
            }}
          >
            📥 Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>➕ Create Alert Rule</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Critical Alerts</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{criticalCount}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>High Priority</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#D97706" }}>{highCount}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Active Alerts</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{activeCount}</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["all", "critical", "high", "medium", "low", "active", "acknowledged"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              background: filter === f ? C.accent : C.lightGray,
              color: filter === f ? C.white : C.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.2s",
              boxShadow: filter === f ? C.shadowSm : "none",
            }}
            onMouseEnter={(e) => {
              if (filter !== f) {
                e.currentTarget.style.background = C.border;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f) {
                e.currentTarget.style.background = C.lightGray;
              }
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Alert History</h3>
        {filteredAlerts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredAlerts.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 16,
                  borderRadius: 10,
                  background: a.type === "error" ? "#FFF0F0" : a.type === "warning" ? C.warningBg : a.type === "success" ? C.successBg : C.infoBg,
                  border: `1px solid ${
                    a.type === "error" ? C.red + "44" : a.type === "warning" ? "#D9770644" : a.type === "success" ? C.success + "44" : C.info + "44"
                  }`,
                  opacity: a.status === "resolved" ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {a.type === "error" ? "🔴" : a.type === "warning" ? "🟡" : a.type === "success" ? "✅" : "ℹ️"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.title}</span>
                    <Badge variant={a.severity === "critical" ? "red" : a.severity === "high" ? "yellow" : "blue"}>
                      {a.severity}
                    </Badge>
                    {a.status !== "active" && (
                      <Badge variant="gray">{a.status}</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{a.msg}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.textMuted }}>
                    <span>{a.time}</span>
                    <span>• {a.portfolio}</span>
                  </div>
                </div>
                {a.status === "active" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDismiss(a.id)}
                      style={{
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: 6,
                        background: C.lightGray,
                        color: C.text,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                    <button
                      style={{
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: 6,
                        background: C.accent,
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>No alerts match the selected filter</div>
        )}
      </Card>

      {/* Create Alert Rule Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              boxShadow: C.shadowMd,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Create Alert Rule</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., High VaR Alert"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                    Alert Type
                  </label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="error">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                    Metric
                  </label>
                  <select
                    value={newRule.metric}
                    onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="var95">95% VaR</option>
                    <option value="var99">99% VaR</option>
                    <option value="delta">Delta Exposure</option>
                    <option value="gamma">Gamma</option>
                    <option value="vega">Vega</option>
                    <option value="theta">Theta</option>
                    <option value="position_size">Position Size</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                    Condition
                  </label>
                  <select
                    value={newRule.condition}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                    placeholder="e.g., 50000"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                  Apply To
                </label>
                <select
                  value={newRule.portfolios}
                  onChange={(e) => setNewRule({ ...newRule, portfolios: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="all">All Portfolios</option>
                  <option value="delta_neutral">Delta Neutral Fund</option>
                  <option value="iron_condor">Iron Condor Strategy</option>
                  <option value="volatility">Volatility Arbitrage</option>
                  <option value="covered_call">Covered Call Portfolio</option>
                  <option value="straddle">Straddle Strategy</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: "10px 20px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.white,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!newRule.name || !newRule.threshold}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: newRule.name && newRule.threshold ? C.accent : C.lightGray,
                  color: newRule.name && newRule.threshold ? C.white : C.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: newRule.name && newRule.threshold ? "pointer" : "not-allowed",
                }}
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Format Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              boxShadow: C.shadowMd,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export Alerts</h3>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Choose your preferred export format</p>

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
                <div style={{ fontSize: 24 }}>📄</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>CSV File</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Comma-separated values for Excel/Sheets</div>
                </div>
              </button>

              <button
                onClick={exportAsExcel}
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
                <div style={{ fontSize: 24 }}>📊</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Excel File</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>XLS format with formatted table</div>
                </div>
              </button>

              <button
                onClick={exportAsPDF}
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
                <div style={{ fontSize: 24 }}>📑</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>PDF Document</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Print-ready report format</div>
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
                borderRadius: 8,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
