import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, Button, Badge } from "../../components/common";

const limits = [
  { id: 1, name: "Position Size Limit", current: 1520000, limit: 1500000, utilization: 101, status: "breach", type: "Position" },
  { id: 2, name: "Delta Exposure Limit", current: 98500, limit: 100000, utilization: 99, status: "warning", type: "Greeks" },
  { id: 3, name: "VaR Budget (95%)", current: 42100, limit: 50000, utilization: 84, status: "warning", type: "Risk" },
  { id: 4, name: "Gamma Limit", current: 6200, limit: 10000, utilization: 62, status: "ok", type: "Greeks" },
  { id: 5, name: "Vega Exposure", current: 28500, limit: 35000, utilization: 81, status: "warning", type: "Greeks" },
  { id: 6, name: "Theta Decay Limit", current: 1850, limit: 3000, utilization: 62, status: "ok", type: "Greeks" },
  { id: 7, name: "Concentration Limit", current: 68, limit: 75, utilization: 91, status: "warning", type: "Risk" },
  { id: 8, name: "Leverage Ratio", current: 2.8, limit: 3.5, utilization: 80, status: "ok", type: "Risk" },
  { id: 9, name: "Drawdown Limit", current: 6.8, limit: 10, utilization: 68, status: "ok", type: "Risk" },
  { id: 10, name: "Counterparty Exposure", current: 420000, limit: 500000, utilization: 84, status: "warning", type: "Credit" },
];

const portfolioLimits = [
  { portfolio: "Delta Neutral Fund", positionLimit: 78, deltaLimit: 92, varLimit: 86, status: "warning" },
  { portfolio: "Iron Condor Strategy", positionLimit: 54, deltaLimit: 61, varLimit: 58, status: "ok" },
  { portfolio: "Volatility Arbitrage", positionLimit: 101, deltaLimit: 98, varLimit: 94, status: "breach" },
  { portfolio: "Covered Call Portfolio", positionLimit: 42, deltaLimit: 38, varLimit: 45, status: "ok" },
  { portfolio: "Straddle Strategy", positionLimit: 89, deltaLimit: 94, varLimit: 91, status: "warning" },
];

export const RiskLimitsPage = () => {
  const [filter, setFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleEditLimit = (limit) => {
    setSelectedLimit(limit);
    setEditValue(limit.limit.toString());
    setShowEditModal(true);
  };

  const handleSaveLimit = () => {
    if (selectedLimit && editValue) {
      // Here you would call an API to update the limit
      console.log(`Updating ${selectedLimit.name} to ${editValue}`);
      alert(`Limit updated: ${selectedLimit.name} = ${editValue}`);
      setShowEditModal(false);
      setSelectedLimit(null);
      setEditValue("");
    }
  };

  const filteredLimits = filter === "all" 
    ? limits 
    : filter === "breach"
    ? limits.filter(l => l.status === "breach")
    : filter === "warning"
    ? limits.filter(l => l.status === "warning")
    : limits.filter(l => l.type.toLowerCase() === filter.toLowerCase());

  const breachCount = limits.filter(l => l.status === "breach").length;
  const warningCount = limits.filter(l => l.status === "warning").length;
  const okCount = limits.filter(l => l.status === "ok").length;

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Limit Name', 'Current', 'Limit', 'Utilization %', 'Status', 'Type'],
      ...limits.map(l => [l.name, l.current, l.limit, l.utilization, l.status, l.type])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_limits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#4CAF50;color:white;}</style></head><body><table><tr><th>Limit Name</th><th>Current</th><th>Limit</th><th>Utilization %</th><th>Status</th><th>Type</th></tr>${limits.map(l => `<tr><td>${l.name}</td><td>${l.current}</td><td>${l.limit}</td><td>${l.utilization}%</td><td>${l.status}</td><td>${l.type}</td></tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_limits_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Risk Limits Report</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px;}th{background-color:#4CAF50;color:white;}tr:nth-child(even){background-color:#f9f9f9;}.breach{color:#d32f2f;font-weight:bold;}.warning{color:#f57c00;font-weight:bold;}.ok{color:#66bb6a;}@media print{button{display:none;}}</style></head><body><h1>Risk Limits Report</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><p><strong>Breaches:</strong> ${breachCount} | <strong>Warnings:</strong> ${warningCount} | <strong>OK:</strong> ${okCount}</p><table><tr><th>Limit Name</th><th>Current</th><th>Limit</th><th>Utilization</th><th>Status</th><th>Type</th></tr>${limits.map(l => `<tr><td>${l.name}</td><td>${l.current.toLocaleString()}</td><td>${l.limit.toLocaleString()}</td><td>${l.utilization}%</td><td class="${l.status}">${l.status.toUpperCase()}</td><td>${l.type}</td></tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Limits Management</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              background: C.accent,
              color: C.white,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: C.shadowSm,
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
          </button>
          <Button onClick={() => setShowEditModal(true)}>⚙️ Configure Limits</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Limit Breaches</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{breachCount}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Warnings</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#D97706" }}>{warningCount}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Within Limits</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.success }}>{okCount}</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "breach", "warning", "position", "greeks", "risk", "credit"].map((f) => (
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
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Global Risk Limits</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredLimits.map((limit) => (
            <div key={limit.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{limit.name}</span>
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>
                    {limit.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>
                    {typeof limit.current === 'number' && limit.current > 1000 
                      ? `$${(limit.current / 1000).toFixed(0)}K` 
                      : limit.current.toLocaleString()} / {typeof limit.limit === 'number' && limit.limit > 1000 
                      ? `$${(limit.limit / 1000).toFixed(0)}K` 
                      : limit.limit.toLocaleString()}
                  </span>
                  <Badge variant={limit.status === "breach" ? "red" : limit.status === "warning" ? "yellow" : "green"}>
                    {limit.status === "ok" ? "OK" : limit.status.toUpperCase()}
                  </Badge>
                  <button
                    onClick={() => handleEditLimit(limit)}
                    style={{
                      padding: "4px 8px",
                      border: "none",
                      borderRadius: 4,
                      background: C.lightGray,
                      color: C.text,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.accent;
                      e.currentTarget.style.color = C.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.lightGray;
                      e.currentTarget.style.color = C.text;
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div style={{ background: C.lightGray, borderRadius: 4, height: 8, position: "relative" }}>
                <div
                  style={{
                    width: `${Math.min(limit.utilization, 100)}%`,
                    height: "100%",
                    background: limit.status === "breach" ? C.red : limit.status === "warning" ? "#D97706" : C.success,
                    borderRadius: 4,
                    transition: "width 0.5s",
                  }}
                />
                {limit.utilization > 100 && (
                  <div
                    style={{
                      position: "absolute",
                      right: -20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.red,
                    }}
                  >
                    +{limit.utilization - 100}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Limit Utilization by Portfolio</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "10px 8px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>
                  Portfolio
                </th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>
                  Position Limit
                </th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>
                  Delta Limit
                </th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>
                  VaR Limit
                </th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolioLimits.map((pf, idx) => (
                <tr
                  key={pf.portfolio}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: idx % 2 === 0 ? "transparent" : C.lightGray + "33",
                  }}
                >
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>{pf.portfolio}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: pf.positionLimit > 100 ? C.red : pf.positionLimit > 80 ? "#D97706" : C.text,
                      }}
                    >
                      {pf.positionLimit}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: pf.deltaLimit > 100 ? C.red : pf.deltaLimit > 80 ? "#D97706" : C.text,
                      }}
                    >
                      {pf.deltaLimit}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: pf.varLimit > 100 ? C.red : pf.varLimit > 80 ? "#D97706" : C.text,
                      }}
                    >
                      {pf.varLimit}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <Badge variant={pf.status === "breach" ? "red" : pf.status === "warning" ? "yellow" : "green"}>
                      {pf.status === "ok" ? "OK" : pf.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Configure Limits Modal */}
      {showEditModal && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: C.shadowMd,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Configure Risk Limits</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {limits.map((limit) => (
                <div key={limit.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: C.lightGray, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{limit.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      Current: {typeof limit.current === 'number' && limit.current > 1000 
                        ? `$${(limit.current / 1000).toFixed(0)}K` 
                        : limit.current.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      Limit: {typeof limit.limit === 'number' && limit.limit > 1000 
                        ? `$${(limit.limit / 1000).toFixed(0)}K` 
                        : limit.limit.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleEditLimit(limit)}
                      style={{
                        padding: "4px 10px",
                        border: "none",
                        borderRadius: 4,
                        background: C.accent,
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowEditModal(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Limit Modal */}
      {selectedLimit && (
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
            zIndex: 1001,
          }}
          onClick={() => {
            setSelectedLimit(null);
            setEditValue("");
          }}
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
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Edit Limit</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
                {selectedLimit.name}
              </label>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                placeholder="Enter new limit value"
              />
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                Current value: {typeof selectedLimit.current === 'number' && selectedLimit.current > 1000 
                  ? `$${(selectedLimit.current / 1000).toFixed(0)}K` 
                  : selectedLimit.current.toLocaleString()}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setSelectedLimit(null);
                  setEditValue("");
                }}
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
                onClick={handleSaveLimit}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: C.accent,
                  color: C.white,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Format Modal */}
      {showExportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: C.shadowMd }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export Risk Limits</h3>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Choose your preferred export format</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={exportAsCSV} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <div style={{ fontSize: 24 }}>📄</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>CSV File</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Comma-separated values for Excel/Sheets</div>
                </div>
              </button>
              <button onClick={exportAsExcel} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <div style={{ fontSize: 24 }}>📊</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Excel File</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>XLS format with formatted table</div>
                </div>
              </button>
              <button onClick={exportAsPDF} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <div style={{ fontSize: 24 }}>📑</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>PDF Document</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Print-ready report format</div>
                </div>
              </button>
            </div>
            <button onClick={() => setShowExportModal(false)} style={{ marginTop: 16, width: "100%", padding: "10px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
