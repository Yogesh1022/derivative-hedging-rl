import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, MetricCard } from "../../components/common";
import { heatData } from "../../constants/mockData";

// Extended heatmap data for sector correlation
const sectorCorrelation = [
  ["Tech", "Energy", "Finance", "Health", "Consumer", "Utilities", "Industrial"],
  [1.0, 0.23, 0.45, 0.12, 0.34, -0.08, 0.28],
  [0.23, 1.0, 0.18, -0.12, 0.09, 0.42, 0.31],
  [0.45, 0.18, 1.0, 0.21, 0.38, 0.05, 0.44],
  [0.12, -0.12, 0.21, 1.0, 0.15, 0.18, 0.09],
  [0.34, 0.09, 0.38, 0.15, 1.0, 0.11, 0.29],
  [-0.08, 0.42, 0.05, 0.18, 0.11, 1.0, 0.14],
  [0.28, 0.31, 0.44, 0.09, 0.29, 0.14, 1.0],
];

const riskFactors = [
  { name: "Delta Risk", value: 0.85, level: "High" },
  { name: "Gamma Risk", value: 0.62, level: "Medium" },
  { name: "Vega Risk", value: 0.78, level: "High" },
  { name: "Theta Decay", value: 0.34, level: "Low" },
  { name: "Correlation Risk", value: 0.91, level: "Critical" },
  { name: "Liquidity Risk", value: 0.28, level: "Low" },
];

export const RiskHeatmapPage = () => {
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const csv = [
      ['Risk Heatmap Analysis Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Risk Factors'],
      ['Factor', 'Value', 'Level'],
      ...riskFactors.map(f => [f.name, f.value, f.level]),
      [''],
      ['Sector Correlation Matrix'],
      ['Sector', ...sectorCorrelation[0]],
      ...sectorCorrelation[0].map((sector, idx) => [sector, ...sectorCorrelation[idx + 1]])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_heatmap_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const table = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:center;}th{background-color:#E10600;color:white;}.critical{background-color:#FEE;}. high{background-color:#FFE;}.medium{background-color:#EFF;}.low{background-color:#EFE;}</style></head><body><h1>Risk Heatmap Analysis</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><h2>Risk Factors</h2><table><tr><th>Factor</th><th>Value</th><th>Level</th></tr>${riskFactors.map(f => `<tr class="${f.level.toLowerCase()}"><td>${f.name}</td><td>${f.value.toFixed(2)}</td><td><strong>${f.level}</strong></td></tr>`).join('')}</table><h2>Sector Correlation Matrix</h2><table><tr><th>Sector</th>${sectorCorrelation[0].map(s => `<th>${s}</th>`).join('')}</tr>${sectorCorrelation[0].map((sector, idx) => `<tr><th>${sector}</th>${sectorCorrelation[idx + 1].map(v => `<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_heatmap_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Risk Heatmap</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#F8FAFC;}h1{color:#1E293B;border-bottom:3px solid #E10600;padding-bottom:10px;}h2{color:#475569;margin-top:25px;}table{width:100%;border-collapse:collapse;margin:15px 0;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.08);}th,td{border:1px solid #E2E8F0;padding:10px;text-align:center;font-size:11px;}th{background-color:#E10600;color:white;font-weight:600;}tr:nth-child(even){background-color:#F8FAFC;}.risk-box{display:inline-block;padding:4px 12px;border-radius:6px;font-weight:bold;font-size:10px;}.critical{background:#FEE;color:#E10600;}.high{background:#FEF3C7;color:#D97706;}.medium{background:#DBEAFE;color:#2563EB;}.low{background:#DCFCE7;color:#16A34A;}@media print{button{display:none;}}</style></head><body><h1>🔥 Risk Heatmap Analysis</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><h2>Risk Factors</h2><table><tr><th>Factor</th><th>Value</th><th>Level</th></tr>${riskFactors.map(f => `<tr><td>${f.name}</td><td>${f.value.toFixed(2)}</td><td><span class="risk-box ${f.level.toLowerCase()}">${f.level}</span></td></tr>`).join('')}</table><h2>Sector Correlation Matrix</h2><table><tr><th>Sector</th>${sectorCorrelation[0].map(s => `<th>${s}</th>`).join('')}</tr>${sectorCorrelation[0].map((sector, idx) => `<tr><th>${sector}</th>${sectorCorrelation[idx + 1].map(v => `<td style="background:${v > 0 ? `rgba(34,197,94,${Math.abs(v) * 0.3})` : `rgba(225,6,0,${Math.abs(v) * 0.3})`};font-weight:${Math.abs(v) > 0.5 ? 'bold' : 'normal'}">${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Risk Heatmap Analysis</h2>
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
          label="Overall Risk"
          value="High"
          change="12%"
          changeDir="up"
          icon="🔥"
          accent
        />
        <MetricCard
          label="Concentration"
          value="0.68"
          change="0.04"
          changeDir="up"
          icon="📍"
        />
        <MetricCard label="Max Drawdown Risk" value="8.2%" icon="📉" />
        <MetricCard label="Tail Risk" value="2.4σ" change="0.3σ" changeDir="down" icon="📊" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
            Portfolio Risk Heatmap
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {heatData.map((d, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: `rgba(225,6,0,${d.val * 0.9 + 0.05})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: d.val > 0.5 ? "rgba(255,255,255,0.9)" : C.textMuted,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title={`Risk Level: ${(d.val * 100).toFixed(0)}%`}
              >
                {(d.val * 100).toFixed(0)}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Low Risk</span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                margin: "0 12px",
                background: `linear-gradient(to right, ${C.success}44, #D9770644, ${C.red})`,
              }}
            />
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>High Risk</span>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Risk Factors</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {riskFactors.map((factor) => (
              <div key={factor.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, color: C.text }}>{factor.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        factor.level === "Critical"
                          ? C.red
                          : factor.level === "High"
                          ? "#D97706"
                          : factor.level === "Medium"
                          ? C.info
                          : C.success,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background:
                        factor.level === "Critical"
                          ? C.redGhost
                          : factor.level === "High"
                          ? C.warningBg
                          : factor.level === "Medium"
                          ? C.infoBg
                          : C.successBg,
                    }}
                  >
                    {factor.level}
                  </span>
                </div>
                <div style={{ background: C.lightGray, borderRadius: 4, height: 8 }}>
                  <div
                    style={{
                      width: `${factor.value * 100}%`,
                      height: "100%",
                      background:
                        factor.value > 0.8
                          ? C.red
                          : factor.value > 0.6
                          ? "#D97706"
                          : factor.value > 0.4
                          ? C.info
                          : C.success,
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
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Sector Correlation Matrix
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: 8, textAlign: "left", color: C.textMuted, fontWeight: 600, borderBottom: `2px solid ${C.border}` }}>
                  Sector
                </th>
                {sectorCorrelation[0].map((sector) => (
                  <th
                    key={sector}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 10,
                      borderBottom: `2px solid ${C.border}`,
                    }}
                  >
                    {sector}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorCorrelation[0].map((rowSector, rowIndex) => (
                <tr key={rowSector}>
                  <td
                    style={{
                      padding: 8,
                      fontWeight: 600,
                      color: C.text,
                      fontSize: 11,
                      background: C.offWhite,
                    }}
                  >
                    {rowSector}
                  </td>
                  {sectorCorrelation[rowIndex + 1].map((corr, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        padding: 8,
                        textAlign: "center",
                        background:
                          corr > 0
                            ? `rgba(34, 197, 94, ${Math.abs(corr) * 0.3})`
                            : `rgba(225, 6, 0, ${Math.abs(corr) * 0.3})`,
                        fontWeight: 700,
                        color: Math.abs(corr) > 0.5 ? C.white : C.text,
                        borderRadius: 4,
                        border: `1px solid ${C.borderLight}`,
                      }}
                    >
                      {corr.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, textAlign: "center", fontWeight: 600 }}>
          Green = Positive Correlation | Red = Negative Correlation
        </div>
      </Card>
    </div>
  );
};
