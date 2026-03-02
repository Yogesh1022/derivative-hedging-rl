import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { C } from "../../constants/colors";
import { Card, MetricCard } from "../../components/common";

// Mock trending data
const trendingSymbols = [
  { symbol: "AAPL", price: 185.23, change: 2.35, volume: "54.2M", iv: 28.4 },
  { symbol: "MSFT", price: 412.18, change: -1.12, volume: "32.1M", iv: 22.8 },
  { symbol: "SPY", price: 485.20, change: 0.87, volume: "89.4M", iv: 14.2 },
  { symbol: "QQQ", price: 412.48, change: 1.12, volume: "67.3M", iv: 18.6 },
  { symbol: "TSLA", price: 238.45, change: 3.28, volume: "128.5M", iv: 45.2 },
];

const priceHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  spy: 480 + Math.sin(i * 0.3) * 5 + Math.random() * 3,
  vix: 15 + Math.sin(i * 0.4) * 4 + Math.random() * 2,
}));

export const MarketTrends = () => {
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Market Trends Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Trending Symbols'],
      ['Symbol', 'Price', 'Change %', 'Volume', 'IV %'],
      ...trendingSymbols.map(s => [s.symbol, s.price, s.change, s.volume, s.iv])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market_trends_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#E10600;color:white;}.positive{color:#16A34A;font-weight:bold;}.negative{color:#E10600;font-weight:bold;}</style></head><body><h1>Market Trends Analysis</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><table><tr><th>Symbol</th><th>Price</th><th>Change %</th><th>Volume</th><th>Implied Volatility %</th></tr>${trendingSymbols.map(s => `<tr><td><strong>${s.symbol}</strong></td><td>$${s.price.toFixed(2)}</td><td class="${s.change >= 0 ? 'positive' : 'negative'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</td><td>${s.volume}</td><td>${s.iv.toFixed(1)}%</td></tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market_trends_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Market Trends</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#F8FAFC;}h1{color:#1E293B;border-bottom:3px solid #E10600;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin:20px 0;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.08);}th,td{border:1px solid #E2E8F0;padding:12px;text-align:left;font-size:12px;}th{background-color:#E10600;color:white;font-weight:600;}tr:nth-child(even){background-color:#F8FAFC;}.positive{color:#16A34A;font-weight:bold;}.negative{color:#E10600;font-weight:bold;}@media print{button{display:none;}}</style></head><body><h1>📈 Market Trends Analysis</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><table><tr><th>Symbol</th><th>Price</th><th>Change %</th><th>Volume</th><th>IV %</th></tr>${trendingSymbols.map(s => `<tr><td><strong>${s.symbol}</strong></td><td>$${s.price.toFixed(2)}</td><td class="${s.change >= 0 ? 'positive' : 'negative'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</td><td>${s.volume}</td><td>${s.iv.toFixed(1)}%</td></tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Market Trends</h2>
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
          📥 Export Report
        </button>
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
        <MetricCard label="Market Trend" value="Bullish" change="12%" changeDir="up" icon="📈" accent />
        <MetricCard label="Avg IV Rank" value="45.2%" change="3.1%" changeDir="up" icon="🌊" />
        <MetricCard label="Volume Surge" value="+28%" change="High" changeDir="up" icon="📊" />
        <MetricCard label="Correlation" value="0.82" icon="🔗" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
            SPY vs VIX (30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={priceHistory}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.textMuted }} interval={4} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: C.textMuted }}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: C.textMuted }}
                tickFormatter={(v) => `${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spy"
                stroke={C.chartGreen}
                strokeWidth={2.5}
                dot={false}
                name="SPY"
                activeDot={{ r: 6, fill: C.chartGreen }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="vix"
                stroke={C.red}
                strokeWidth={2.5}
                dot={false}
                name="VIX"
                activeDot={{ r: 6, fill: C.red }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Market Regime</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Volatility", "Low", C.success],
              ["Momentum", "Strong", C.success],
              ["Liquidity", "High", C.success],
              ["Skew", "Normal", "#D97706"],
            ].map(([label, status, color]) => (
              <div
                key={label}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: C.offWhite,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${C.borderLight}`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Trending Symbols</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {["Symbol", "Price", "Change", "Volume", "IV"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
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
            {trendingSymbols.map((item) => (
              <tr
                key={item.symbol}
                style={{ borderBottom: `1px solid ${C.borderLight}`, transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.offWhite)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 12px", fontWeight: 700, color: C.text }}>{item.symbol}</td>
                <td style={{ padding: "11px 12px", fontFamily: "monospace", color: C.text }}>
                  ${item.price.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: "11px 12px",
                    fontWeight: 700,
                    color: item.change >= 0 ? C.success : C.red,
                  }}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change.toFixed(2)}%
                </td>
                <td style={{ padding: "11px 12px", color: C.textSub }}>{item.volume}</td>
                <td style={{ padding: "11px 12px", fontFamily: "monospace", color: C.text }}>
                  {item.iv.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
