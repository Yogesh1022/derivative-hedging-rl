import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, MetricCard } from "../../components/common";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const monthlyReturns = [
  { month: "Jan", returns: 3.2, benchmark: 1.8, alpha: 1.4 },
  { month: "Feb", returns: -1.5, benchmark: -0.8, alpha: -0.7 },
  { month: "Mar", returns: 4.8, benchmark: 2.1, alpha: 2.7 },
  { month: "Apr", returns: 2.3, benchmark: 1.5, alpha: 0.8 },
  { month: "May", returns: 5.1, benchmark: 2.9, alpha: 2.2 },
  { month: "Jun", returns: -2.1, benchmark: -1.2, alpha: -0.9 },
  { month: "Jul", returns: 3.7, benchmark: 2.2, alpha: 1.5 },
  { month: "Aug", returns: 1.9, benchmark: 1.1, alpha: 0.8 },
  { month: "Sep", returns: -0.8, benchmark: 0.3, alpha: -1.1 },
  { month: "Oct", returns: 4.2, benchmark: 2.4, alpha: 1.8 },
  { month: "Nov", returns: 2.8, benchmark: 1.6, alpha: 1.2 },
  { month: "Dec", returns: 3.4, benchmark: 2.0, alpha: 1.4 },
];

const drawdownData = [
  { day: "D1", drawdown: 0 },
  { day: "D5", drawdown: -2.1 },
  { day: "D10", drawdown: -3.5 },
  { day: "D15", drawdown: -5.2 },
  { day: "D20", drawdown: -4.1 },
  { day: "D25", drawdown: -6.8 },
  { day: "D30", drawdown: -5.5 },
  { day: "D35", drawdown: -3.2 },
  { day: "D40", drawdown: -2.1 },
  { day: "D45", drawdown: -4.5 },
  { day: "D50", drawdown: -3.8 },
  { day: "D55", drawdown: -2.4 },
  { day: "D60", drawdown: -1.2 },
];

const strategyPerformance = [
  { strategy: "Delta Neutral", sharpe: 1.82, returns: 18.5, volatility: 10.2, maxDD: -6.8 },
  { strategy: "Iron Condor", sharpe: 1.45, returns: 14.2, volatility: 9.8, maxDD: -8.1 },
  { strategy: "Straddle", sharpe: 1.21, returns: 22.8, volatility: 18.9, maxDD: -12.5 },
  { strategy: "Covered Call", sharpe: 0.98, returns: 9.4, volatility: 9.6, maxDD: -5.2 },
  { strategy: "Bull Spread", sharpe: 1.58, returns: 16.1, volatility: 10.2, maxDD: -7.3 },
];

export const PerformancePage = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Performance Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Timeframe:', timeframe],
      [''],
      ['Monthly Returns'],
      ['Month', 'Returns %', 'Benchmark %', 'Alpha %'],
      ...monthlyReturns.map(m => [m.month, m.returns, m.benchmark, m.alpha]),
      [''],
      ['Strategy Performance Comparison'],
      ['Strategy', 'Sharpe Ratio', 'Returns %', 'Volatility %', 'Max Drawdown %'],
      ...strategyPerformance.map(s => [s.strategy, s.sharpe, s.returns, s.volatility, s.maxDD])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:center;}th{background-color:#E10600;color:white;}.positive{color:#16A34A;font-weight:bold;}.negative{color:#E10600;font-weight:bold;}</style></head><body><h1>Performance Analytics</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><p><strong>Timeframe:</strong> ${timeframe}</p><h2>Monthly Returns</h2><table><tr><th>Month</th><th>Returns %</th><th>Benchmark %</th><th>Alpha %</th></tr>${monthlyReturns.map(m => `<tr><td>${m.month}</td><td class="${m.returns >= 0 ? 'positive' : 'negative'}">${m.returns}%</td><td>${m.benchmark}%</td><td class="${m.alpha >= 0 ? 'positive' : 'negative'}">${m.alpha}%</td></tr>`).join('')}</table><h2>Strategy Performance</h2><table><tr><th>Strategy</th><th>Sharpe Ratio</th><th>Returns %</th><th>Volatility %</th><th>Max DD %</th></tr>${strategyPerformance.map(s => `<tr><td><strong>${s.strategy}</strong></td><td>${s.sharpe.toFixed(2)}</td><td>${s.returns}%</td><td>${s.volatility}%</td><td class="negative">${s.maxDD}%</td></tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance_analytics_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Performance Analytics</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#F8FAFC;}h1{color:#1E293B;border-bottom:3px solid #E10600;padding-bottom:10px;}h2{color:#475569;margin-top:25px;}table{width:100%;border-collapse:collapse;margin:15px 0;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.08);}th,td{border:1px solid #E2E8F0;padding:10px;text-align:center;font-size:11px;}th{background-color:#E10600;color:white;font-weight:600;}tr:nth-child(even){background-color:#F8FAFC;}.positive{color:#16A34A;font-weight:bold;}.negative{color:#E10600;font-weight:bold;}@media print{button{display:none;}}</style></head><body><h1>📊 Performance Analytics</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><p><strong>Timeframe:</strong> ${timeframe}</p><h2>Monthly Returns vs Benchmark</h2><table><tr><th>Month</th><th>Returns %</th><th>Benchmark %</th><th>Alpha %</th></tr>${monthlyReturns.map(m => `<tr><td>${m.month}</td><td class="${m.returns >= 0 ? 'positive' : 'negative'}">${m.returns}%</td><td>${m.benchmark}%</td><td class="${m.alpha >= 0 ? 'positive' : 'negative'}">${m.alpha}%</td></tr>`).join('')}</table><h2>Strategy Performance Comparison</h2><table><tr><th>Strategy</th><th>Sharpe</th><th>Returns %</th><th>Volatility %</th><th>Max DD %</th></tr>${strategyPerformance.map(s => `<tr><td><strong>${s.strategy}</strong></td><td>${s.sharpe.toFixed(2)}</td><td>${s.returns}%</td><td>${s.volatility}%</td><td class="negative">${s.maxDD}%</td></tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Performance Analytics</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["1M", "3M", "6M", "1Y", "YTD", "ALL"].map((tf) => (
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
        </div>
      </div>

      {showExportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: C.white, padding: 28, borderRadius: 12, minWidth: 420, boxShadow: C.shadowMd }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: C.text }}>📥 Export Report</h3>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Choose your preferred export format:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={exportAsExcel} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Export as Excel</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Formatted spreadsheet (.xls)</div>
                </div>
              </button>
              <button onClick={exportAsPDF} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Export as PDF</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Print-optimized document (.pdf)</div>
                </div>
              </button>
              <button onClick={exportAsCSV} style={{ padding: "14px 18px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.lightAccent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Export as CSV</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Raw data file (.csv)</div>
                </div>
              </button>
            </div>
            <button onClick={() => setShowExportModal(false)} style={{ marginTop: 16, width: "100%", padding: "10px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, color: C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <MetricCard
          label="Total Return"
          value="27.3%"
          change="4.2%"
          changeDir="up"
          icon="📈"
          accent
        />
        <MetricCard
          label="Sharpe Ratio"
          value="1.82"
          change="0.12"
          changeDir="up"
          icon="⚡"
        />
        <MetricCard label="Max Drawdown" value="-6.8%" icon="📉" />
        <MetricCard
          label="Win Rate"
          value="68.5%"
          change="2.1%"
          changeDir="up"
          icon="🎯"
        />
        <MetricCard label="Calmar Ratio" value="4.01" icon="📊" />
        <MetricCard
          label="Information Ratio"
          value="1.34"
          change="0.08"
          changeDir="up"
          icon="ℹ️"
        />
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Monthly Returns vs Benchmark
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyReturns}>
            <XAxis dataKey="month" stroke={C.textMuted} style={{ fontSize: 11 }} />
            <YAxis stroke={C.textMuted} style={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="returns" fill={C.chartBlue} radius={[6, 6, 0, 0]} name="Portfolio Returns (%)" />
            <Bar dataKey="benchmark" fill={C.chartOrange} radius={[6, 6, 0, 0]} name="Benchmark (%)" />
            <Bar dataKey="alpha" fill={C.chartGreen} radius={[6, 6, 0, 0]} name="Alpha (%)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Drawdown Analysis
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={drawdownData}>
            <XAxis dataKey="day" stroke={C.textMuted} style={{ fontSize: 11 }} />
            <YAxis stroke={C.textMuted} style={{ fontSize: 11 }} />
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
              dataKey="drawdown"
              stroke={C.red}
              strokeWidth={2.5}
              dot={false}
              name="Drawdown (%)"
              activeDot={{ r: 6, fill: C.red }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: C.warningBg,
            borderRadius: 8,
            fontSize: 12,
            color: "#D97706",
            border: `1px solid ${C.warning}33`,
          }}
        >
          <strong>Max Drawdown:</strong> -6.8% on Day 25 | <strong>Recovery Time:</strong> 35 days
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Strategy Performance Comparison
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Strategy
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Sharpe Ratio
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Returns (%)
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Volatility (%)
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Max DD (%)
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: C.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {strategyPerformance.map((strat, idx) => (
                <tr
                  key={strat.strategy}
                  style={{
                    borderBottom: `1px solid ${C.borderLight}`,
                    background: idx % 2 === 0 ? "transparent" : C.offWhite,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.lightGray)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : C.offWhite)}
                >
                  <td style={{ padding: "12px 8px", fontWeight: 600, color: C.text }}>{strat.strategy}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: strat.sharpe > 1.5 ? C.successBg : C.infoBg,
                        color: strat.sharpe > 1.5 ? C.success : C.info,
                        fontWeight: 700,
                      }}
                    >
                      {strat.sharpe.toFixed(2)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      color: strat.returns > 15 ? C.success : C.text,
                      fontWeight: 600,
                    }}
                  >
                    {strat.returns}%
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: C.text }}>{strat.volatility}%</td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      color: strat.maxDD < -10 ? C.red : C.text,
                      fontWeight: 600,
                    }}
                  >
                    {strat.maxDD}%
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", fontSize: 14 }}>
                    {"⭐".repeat(Math.min(5, Math.floor(strat.sharpe * 2.5)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
