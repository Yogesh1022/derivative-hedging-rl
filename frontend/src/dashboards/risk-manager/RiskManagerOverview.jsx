import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { C } from "../../constants/colors";
import { varData } from "../../constants/mockData";
import { MetricCard, Card, Badge, Button } from "../common";
import { analyticsService } from "../../services/analyticsService";

// Mock alerts data
const mockAlerts = [
  {
    id: 1,
    type: "error",
    msg: "Delta exposure exceeds maximum threshold by 4.2%",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "warning",
    msg: "VaR budget utilization at 87% - consider reducing positions",
    time: "15 minutes ago",
  },
  {
    id: 3,
    type: "success",
    msg: "Gamma exposure rebalanced successfully",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "info",
    msg: "Daily risk report generated and available for review",
    time: "2 hours ago",
  },
];

export const RiskManagerOverview = () => {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getRiskMetrics();
        setRiskMetrics(data);
      } catch (error) {
        console.error("Failed to fetch risk metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRiskData();
  }, []);

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
        Loading risk metrics...
      </div>
    );

  const var95 = riskMetrics?.var95 || 42100;
  const totalExposure = riskMetrics?.totalExposure || 4820000;
  const limitUtilization = riskMetrics?.limitUtilization || 78;
  const riskScore = riskMetrics?.riskScore || 74;

  const limitData = [
    ["Position Size", 78, "warning"],
    ["Delta Exposure", 99, "danger"],
    ["VaR Budget", 54, "ok"],
    ["Gamma Limit", 62, "ok"],
    ["Vega Exposure", 87, "warning"],
  ];

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Metric', 'Value'],
      ['95% VaR', var95],
      ['Total Exposure', totalExposure],
      ['Limit Utilization', `${limitUtilization}%`],
      ['Risk Score', riskScore],
      [''],
      ['Limit Category', 'Utilization %', 'Status'],
      ...limitData.map(([l, v, s]) => [l, `${v}%`, s]),
      [''],
      ['Alert Type', 'Message', 'Time'],
      ...mockAlerts.map(a => [a.type, a.msg, a.time])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_overview_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#4CAF50;color:white;}.section-header{background-color:#2196F3;color:white;font-weight:bold;}</style></head><body><h2>Risk Manager Overview</h2><table><tr class="section-header"><td colspan="2">Key Metrics</td></tr><tr><th>Metric</th><th>Value</th></tr><tr><td>95% VaR</td><td>$${(var95/1000).toFixed(1)}K</td></tr><tr><td>Total Exposure</td><td>$${(totalExposure/1000000).toFixed(2)}M</td></tr><tr><td>Limit Utilization</td><td>${limitUtilization}%</td></tr><tr><td>Risk Score</td><td>${riskScore}/100</td></tr></table><table><tr class="section-header"><td colspan="3">Limit Utilization</td></tr><tr><th>Category</th><th>Utilization</th><th>Status</th></tr>${limitData.map(([l,v,s]) => `<tr><td>${l}</td><td>${v}%</td><td>${s.toUpperCase()}</td></tr>`).join('')}</table><table><tr class="section-header"><td colspan="3">Active Alerts</td></tr><tr><th>Type</th><th>Message</th><th>Time</th></tr>${mockAlerts.map(a => `<tr><td>${a.type}</td><td>${a.msg}</td><td>${a.time}</td></tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_overview_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Risk Manager Overview</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;}h2{color:#555;margin-top:25px;border-bottom:1px solid #ddd;padding-bottom:5px;}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:20px 0;}.metric-box{border:1px solid #ddd;padding:15px;border-radius:8px;background:#f9f9f9;}.metric-label{font-size:12px;color:#666;margin-bottom:5px;}.metric-value{font-size:20px;font-weight:bold;color:#333;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px;}th{background-color:#4CAF50;color:white;}tr:nth-child(even){background-color:#f9f9f9;}@media print{button{display:none;}}</style></head><body><h1>Risk Manager Overview</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><div class="metrics"><div class="metric-box"><div class="metric-label">95% VaR</div><div class="metric-value">$${(var95/1000).toFixed(1)}K</div></div><div class="metric-box"><div class="metric-label">Total Exposure</div><div class="metric-value">$${(totalExposure/1000000).toFixed(2)}M</div></div><div class="metric-box"><div class="metric-label">Limit Utilization</div><div class="metric-value">${limitUtilization}%</div></div><div class="metric-box"><div class="metric-label">Risk Score</div><div class="metric-value">${riskScore}/100</div></div></div><h2>Limit Utilization</h2><table><tr><th>Category</th><th>Utilization</th><th>Status</th></tr>${limitData.map(([l,v,s]) => `<tr><td>${l}</td><td>${v}%</td><td>${s.toUpperCase()}</td></tr>`).join('')}</table><h2>Active Alerts</h2><table><tr><th>Type</th><th>Message</th><th>Time</th></tr>${mockAlerts.map(a => `<tr><td>${a.type.toUpperCase()}</td><td>${a.msg}</td><td>${a.time}</td></tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Overview</h2>
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

      <div
        style={{
          background: C.red,
          borderRadius: 14,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>
            Delta Exposure Limit Breach Detected
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
            Portfolio delta exceeds 15% threshold — immediate action recommended
          </div>
        </div>
        <Button
          style={{
            marginLeft: "auto",
            background: C.white,
            border: "1.5px solid rgba(255,255,255,0.6)",
            color: C.white,
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          size="sm"
        >
          Review Now
        </Button>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <MetricCard
          label="95% VaR"
          value={`$${(var95 / 1000).toFixed(1)}K`}
          change="8.2%"
          changeDir="up"
          icon="📊"
          accent
        />
        <MetricCard
          label="Total Exposure"
          value={`$${(totalExposure / 1000000).toFixed(2)}M`}
          change="$120K"
          changeDir="up"
          icon="💼"
        />
        <MetricCard
          label="Limit Utilization"
          value={`${limitUtilization}%`}
          change="5%"
          changeDir="up"
          icon="🔒"
        />
        <MetricCard label="Risk Score" value={`${riskScore}/100`} icon="🛡" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
            VaR Analysis (12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={varData}>
              <XAxis dataKey="m" tick={{ fontSize: 9, fill: C.textMuted }} />
              <YAxis
                tick={{ fontSize: 9, fill: C.textMuted }}
                tickFormatter={(v) => `$${Math.abs(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Math.abs(v).toLocaleString()}`, ""]}
              />
              <Bar dataKey="var95" fill={C.red} radius={[6, 6, 0, 0]} name="95% VaR" />
              <Bar dataKey="var99" fill={C.redLight} opacity={0.6} radius={[6, 6, 0, 0]} name="99% VaR" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
            Limit Utilization
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {limitData.map(([l, v, s]) => (
              <div key={l}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.textSub }}>{l}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{v}%</span>
                    <Badge
                      variant={s === "danger" ? "red" : s === "warning" ? "yellow" : "green"}
                    >
                      {s === "ok" ? "OK" : s.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div style={{ background: C.lightGray, borderRadius: 4, height: 7 }}>
                  <div
                    style={{
                      width: `${v}%`,
                      height: "100%",
                      background:
                        s === "danger" ? C.red : s === "warning" ? "#D97706" : C.success,
                      borderRadius: 4,
                      transition: "width 0.5s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Active Alerts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mockAlerts.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: 14,
                borderRadius: 10,
                background:
                  a.type === "error"
                    ? "#FFF0F0"
                    : a.type === "warning"
                    ? C.warningBg
                    : a.type === "success"
                    ? C.successBg
                    : C.infoBg,
              }}
            >
              <span style={{ fontSize: 16 }}>
                {a.type === "error"
                  ? "🔴"
                  : a.type === "warning"
                  ? "🟡"
                  : a.type === "success"
                  ? "✅"
                  : "ℹ️"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                  {a.msg}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{a.time}</div>
              </div>
              <Button variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Format Modal */}
      {showExportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: C.shadowMd }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export Risk Overview</h3>
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
