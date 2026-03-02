import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { C } from "../../constants/colors";
import { volData, heatData } from "../../constants/mockData";
import { MetricCard, Card } from "../common";
import { analyticsService } from "../../services/analyticsService";

export const AnalystOverview = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getPerformanceMetrics("30D");
        setPerformanceMetrics(data);
      } catch (error) {
        console.error("Failed to fetch performance metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
        Loading analytics...
      </div>
    );

  const sharpeRatio = Number(performanceMetrics?.sharpeRatio) || 1.72;
  const volatility = Number(performanceMetrics?.volatility) || 18.4;
  const maxDrawdown = Number(performanceMetrics?.maxDrawdown) || -7.4;
  const winRate = Number(performanceMetrics?.winRate) || 68.2;

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Analyst Overview Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Performance Metrics'],
      ['Metric', 'Value'],
      ['Sharpe Ratio', sharpeRatio.toFixed(2)],
      ['30d Volatility', `${volatility.toFixed(1)}%`],
      ['Max Drawdown', `${maxDrawdown.toFixed(1)}%`],
      ['Win Rate', `${winRate.toFixed(1)}%`]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analyst_overview_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#E10600;color:white;}.metric-value{font-weight:bold;color:#1E293B;}</style></head><body><h1>Analyst Overview</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><table><tr><th>Performance Metric</th><th>Value</th></tr><tr><td>Sharpe Ratio</td><td class="metric-value">${sharpeRatio.toFixed(2)}</td></tr><tr><td>30d Volatility</td><td class="metric-value">${volatility.toFixed(1)}%</td></tr><tr><td>Max Drawdown</td><td class="metric-value">${maxDrawdown.toFixed(1)}%</td></tr><tr><td>Win Rate</td><td class="metric-value">${winRate.toFixed(1)}%</td></tr></table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analyst_overview_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Analyst Overview</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#F8FAFC;}h1{color:#1E293B;border-bottom:3px solid #E10600;padding-bottom:10px;}h2{color:#475569;margin-top:25px;}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:25px 0;}.metric-box{background:#FFFFFF;border:1px solid #E2E8F0;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);}.metric-label{font-size:13px;color:#64748B;margin-bottom:8px;}.metric-value{font-size:28px;font-weight:bold;color:#E10600;}@media print{button{display:none;}}</style></head><body><h1>📊 Analyst Overview</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><div class="metrics"><div class="metric-box"><div class="metric-label">Sharpe Ratio</div><div class="metric-value">${sharpeRatio.toFixed(2)}</div></div><div class="metric-box"><div class="metric-label">30d Volatility</div><div class="metric-value">${volatility.toFixed(1)}%</div></div><div class="metric-box"><div class="metric-label">Max Drawdown</div><div class="metric-value">${maxDrawdown.toFixed(1)}%</div></div><div class="metric-box"><div class="metric-label">Win Rate</div><div class="metric-value">${winRate.toFixed(1)}%</div></div></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Analytics Overview</h2>
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
        <MetricCard
          label="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          change="0.14"
          changeDir="up"
          icon="📐"
          accent
        />
        <MetricCard
          label="30d Volatility"
          value={`${volatility.toFixed(1)}%`}
          change="1.2%"
          changeDir="down"
          icon="🌊"
        />
        <MetricCard label="Max Drawdown" value={`${maxDrawdown.toFixed(1)}%`} icon="📉" />
        <MetricCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          change="3.1%"
          changeDir="up"
          icon="🎯"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
            Market Volatility (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volData}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: C.textMuted }}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 9, fill: C.textMuted }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`${v.toFixed(1)}%`, "Vol"]}
              />
              <Line type="monotone" dataKey="vol" stroke={C.red} strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: C.red }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Risk Heatmap</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {heatData.map((d, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  background: `rgba(225,6,0,${d.val * 0.9 + 0.05})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 600,
                  color: d.val > 0.5 ? C.white : C.textMuted,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title={`Risk: ${(d.val * 100).toFixed(0)}%`}
              >
                {(d.val * 100).toFixed(0)}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>Low Risk</span>
            <div
              style={{
                width: 80,
                height: 6,
                borderRadius: 3,
                background: `linear-gradient(to right, rgba(225,6,0,0.1), ${C.red})`,
              }}
            />
            <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>High Risk</span>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Baseline Strategy Comparison (Sharpe Ratio)
        </h3>
        {[
          ["RL Agent (PPO_v3)", sharpeRatio, true],
          ["RL Agent (SAC_v2)", 1.68, true],
          ["Δ-Γ-V Hedge", 1.21, false],
          ["Delta-Gamma", 1.08, false],
          ["Delta Only", 0.84, false],
          ["Min-Variance", 0.79, false],
        ].map(([l, v, rl]) => (
          <div key={l} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: rl ? C.text : C.textSub,
                  fontWeight: rl ? 700 : 500,
                }}
              >
                {l}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: rl ? C.red : C.textMuted,
                }}
              >
                {v}
              </span>
            </div>
            <div
              style={{
                background: C.lightGray,
                borderRadius: 4,
                height: 7,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(v / 2) * 100}%`,
                  height: "100%",
                  background: rl ? C.red : C.midGray,
                  borderRadius: 4,
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
