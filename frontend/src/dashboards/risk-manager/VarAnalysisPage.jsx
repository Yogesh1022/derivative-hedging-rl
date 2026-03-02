import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, MetricCard } from "../../components/common";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

const varHistorical = [
  { month: "Jan", var95: -28500, var99: -42100, actual: -18200 },
  { month: "Feb", var95: -31200, var99: -45800, actual: -22100 },
  { month: "Mar", var95: -26800, var99: -39500, actual: -15800 },
  { month: "Apr", var95: -29400, var99: -43200, actual: -24500 },
  { month: "May", var95: -33100, var99: -48900, actual: -28900 },
  { month: "Jun", var95: -27600, var99: -40700, actual: -19200 },
  { month: "Jul", var95: -30200, var99: -44500, actual: -21800 },
  { month: "Aug", var95: -32800, var99: -48300, actual: -26400 },
  { month: "Sep", var95: -28900, var99: -42600, actual: -20100 },
  { month: "Oct", var95: -31700, var99: -46800, actual: -23700 },
  { month: "Nov", var95: -29800, var99: -43900, actual: -22100 },
  { month: "Dec", var95: -34200, var99: -50400, actual: -29800 },
];

const varByPortfolio = [
  { portfolio: "Delta Neutral Fund", var95: 42100, var99: 58900, exposure: 1250000, sharpe: 1.82 },
  { portfolio: "Iron Condor Strategy", var95: 28500, var99: 39200, exposure: 890000, sharpe: 1.45 },
  { portfolio: "Volatility Arbitrage", var95: 51200, var99: 71800, exposure: 1520000, sharpe: 1.21 },
  { portfolio: "Covered Call Portfolio", var95: 18900, var99: 26100, exposure: 620000, sharpe: 0.98 },
  { portfolio: "Straddle Strategy", var95: 63400, var99: 88700, exposure: 1820000, sharpe: 1.58 },
];

const varBreaches = [
  { date: "2024-12-15", portfolio: "Volatility Arbitrage", varLevel: "99%", actual: -74200, var: -71800 },
  { date: "2024-11-28", portfolio: "Straddle Strategy", varLevel: "95%", actual: -66100, var: -63400 },
  { date: "2024-10-12", portfolio: "Delta Neutral Fund", varLevel: "95%", actual: -43500, var: -42100 },
];

export const VarAnalysisPage = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [showExportModal, setShowExportModal] = useState(false);

  const currentVar95 = 42100;
  const currentVar99 = 58900;
  const avgVar95 = 30250;
  const breachCount = varBreaches.length;

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Portfolio', '95% VaR', '99% VaR', 'Exposure', 'Sharpe Ratio'],
      ...varByPortfolio.map(p => [p.portfolio, p.var95, p.var99, p.exposure, p.sharpe])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `var_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#4CAF50;color:white;}</style></head><body><table><tr><th>Portfolio</th><th>95% VaR</th><th>99% VaR</th><th>Exposure</th><th>Sharpe Ratio</th></tr>${varByPortfolio.map(p => `<tr><td>${p.portfolio}</td><td>${p.var95}</td><td>${p.var99}</td><td>${p.exposure}</td><td>${p.sharpe}</td></tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `var_analysis_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>VaR Analysis Report</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px;}th{background-color:#4CAF50;color:white;}tr:nth-child(even){background-color:#f9f9f9;}@media print{button{display:none;}}</style></head><body><h1>VaR Analysis Report</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><p><strong>95% VaR:</strong> $${(currentVar95/1000).toFixed(1)}K | <strong>99% VaR:</strong> $${(currentVar99/1000).toFixed(1)}K</p><table><tr><th>Portfolio</th><th>95% VaR</th><th>99% VaR</th><th>Exposure</th><th>Sharpe Ratio</th></tr>${varByPortfolio.map(p => `<tr><td>${p.portfolio}</td><td>$${(p.var95/1000).toFixed(1)}K</td><td>$${(p.var99/1000).toFixed(1)}K</td><td>$${(p.exposure/1000000).toFixed(2)}M</td><td>${p.sharpe.toFixed(2)}</td></tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>VaR Analysis</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            style={{
              padding: "6px 14px",
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
          {["1M", "3M", "6M", "1Y", "YTD"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                background: timeframe === tf ? C.accent : C.lightGray,
                color: timeframe === tf ? C.white : C.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: timeframe === tf ? C.shadowSm : "none",
              }}
              onMouseEnter={(e) => {
                if (timeframe !== tf) {
                  e.currentTarget.style.background = C.border;
                }
              }}
              onMouseLeave={(e) => {
                if (timeframe !== tf) {
                  e.currentTarget.style.background = C.lightGray;
                }
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <MetricCard label="95% VaR" value={`$${(currentVar95 / 1000).toFixed(1)}K`} change="8.2%" changeDir="up" icon="📊" accent />
        <MetricCard label="99% VaR" value={`$${(currentVar99 / 1000).toFixed(1)}K`} change="12.1%" changeDir="up" icon="📉" />
        <MetricCard label="Avg VaR (YTD)" value={`$${(avgVar95 / 1000).toFixed(1)}K`} icon="📈" />
        <MetricCard label="Breaches (YTD)" value={breachCount} icon="⚠️" />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Historical VaR vs Actual Losses</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfidenceLevel("95")}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: 4,
                background: confidenceLevel === "95" ? C.accent : C.lightGray,
                color: confidenceLevel === "95" ? C.white : C.text,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              95%
            </button>
            <button
              onClick={() => setConfidenceLevel("99")}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: 4,
                background: confidenceLevel === "99" ? C.accent : C.lightGray,
                color: confidenceLevel === "99" ? C.white : C.text,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              99%
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={varHistorical}>
            <XAxis dataKey="month" stroke={C.textMuted} style={{ fontSize: 11 }} />
            <YAxis stroke={C.textMuted} style={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.abs(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`$${Math.abs(v).toLocaleString()}`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={confidenceLevel === "95" ? "var95" : "var99"} stroke={C.red} strokeWidth={2} dot={false} name={`${confidenceLevel}% VaR`} />
            <Line type="monotone" dataKey="actual" stroke={C.info} strokeWidth={2} dot={false} name="Actual Loss" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>VaR by Portfolio</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "10px 8px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Portfolio</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>95% VaR</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>99% VaR</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Exposure</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>VaR %</th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {varByPortfolio.map((pf, idx) => {
                const varPct = ((pf.var95 / pf.exposure) * 100).toFixed(2);
                return (
                  <tr
                    key={pf.portfolio}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: idx % 2 === 0 ? "transparent" : C.lightGray + "33",
                    }}
                  >
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>{pf.portfolio}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace", color: C.red, fontWeight: 600 }}>
                      ${(pf.var95 / 1000).toFixed(1)}K
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace", color: C.red }}>
                      ${(pf.var99 / 1000).toFixed(1)}K
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>${(pf.exposure / 1000000).toFixed(2)}M</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{varPct}%</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: pf.sharpe > 1.5 ? C.successBg : C.infoBg,
                          color: pf.sharpe > 1.5 ? C.success : C.info,
                          fontWeight: 700,
                        }}
                      >
                        {pf.sharpe.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>VaR Breach History</h3>
        {varBreaches.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {varBreaches.map((breach, idx) => (
              <div
                key={idx}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: C.redGhost,
                  border: `1px solid ${C.red}44`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 4 }}>
                      {breach.portfolio}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{breach.date}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 2 }}>
                      {breach.varLevel} VaR: ${Math.abs(breach.var).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                      Actual: ${Math.abs(breach.actual).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                      Breach: ${Math.abs(breach.actual - breach.var).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No VaR breaches in the selected period
          </div>
        )}
      </Card>

      {/* Export Format Modal */}
      {showExportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: C.shadowMd }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export VaR Analysis</h3>
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
