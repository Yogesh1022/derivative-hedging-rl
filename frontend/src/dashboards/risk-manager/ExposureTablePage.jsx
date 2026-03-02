import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, Badge } from "../../components/common";

const exposureData = [
  { asset: "SPY", type: "ETF", delta: 12500, gamma: 850, vega: 6200, theta: -450, exposure: 1250000, limit: 2000000, status: "ok" },
  { asset: "AAPL", type: "Equity", delta: 8900, gamma: 1200, vega: 4500, theta: -320, exposure: 890000, limit: 1000000, status: "warning" },
  { asset: "TSLA", type: "Equity", delta: 15200, gamma: 2100, vega: 8900, theta: -680, exposure: 1520000, limit: 1500000, status: "danger" },
  { asset: "QQQ", type: "ETF", delta: 9800, gamma: 720, vega: 5100, theta: -380, exposure: 980000, limit: 1800000, status: "ok" },
  { asset: "MSFT", type: "Equity", delta: 7600, gamma: 980, vega: 3800, theta: -290, exposure: 760000, limit: 1200000, status: "ok" },
  { asset: "GLD", type: "Commodity", delta: 4200, gamma: 350, vega: 2100, theta: -180, exposure: 420000, limit: 800000, status: "ok" },
  { asset: "TLT", type: "Bond", delta: 3100, gamma: 220, vega: 1500, theta: -120, exposure: 310000, limit: 600000, status: "ok" },
];

const sectorExposure = [
  { sector: "Technology", exposure: 2890000, limit: 5000000, utilization: 58, delta: 28400 },
  { sector: "Financials", exposure: 1230000, limit: 3000000, utilization: 41, delta: 11200 },
  { sector: "Healthcare", exposure: 980000, limit: 2000000, utilization: 49, delta: 8900 },
  { sector: "Energy", exposure: 620000, limit: 1500000, utilization: 41, delta: 5800 },
  { sector: "Consumer", exposure: 1450000, limit: 3500000, utilization: 41, delta: 13100 },
];

export const ExposureTablePage = () => {
  const [view, setView] = useState("assets");
  const [sortBy, setSortBy] = useState("exposure");
  const [showExportModal, setShowExportModal] = useState(false);

  const totalExposure = exposureData.reduce((sum, item) => sum + item.exposure, 0);
  const totalLimit = exposureData.reduce((sum, item) => sum + item.limit, 0);
  const utilizationPct = ((totalExposure / totalLimit) * 100).toFixed(1);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportAsCSV = () => {
    const data = view === "assets" ? exposureData : sectorExposure;
    const headers = view === "assets" 
      ? ['Asset', 'Type', 'Delta', 'Gamma', 'Vega', 'Theta', 'Exposure', 'Limit', 'Status']
      : ['Sector', 'Exposure', 'Limit', 'Utilization', 'Delta'];
    const rows = view === "assets"
      ? data.map(d => [d.asset, d.type, d.delta, d.gamma, d.vega, d.theta, d.exposure, d.limit, d.status])
      : data.map(d => [d.sector, d.exposure, d.limit, d.utilization, d.delta]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exposure_${view}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsExcel = () => {
    const data = view === "assets" ? exposureData : sectorExposure;
    const headers = view === "assets"
      ? '<tr><th>Asset</th><th>Type</th><th>Delta</th><th>Gamma</th><th>Vega</th><th>Theta</th><th>Exposure</th><th>Limit</th><th>Status</th></tr>'
      : '<tr><th>Sector</th><th>Exposure</th><th>Limit</th><th>Utilization</th><th>Delta</th></tr>';
    const rows = view === "assets"
      ? data.map(d => `<tr><td>${d.asset}</td><td>${d.type}</td><td>${d.delta}</td><td>${d.gamma}</td><td>${d.vega}</td><td>${d.theta}</td><td>${d.exposure}</td><td>${d.limit}</td><td>${d.status}</td></tr>`).join('')
      : data.map(d => `<tr><td>${d.sector}</td><td>${d.exposure}</td><td>${d.limit}</td><td>${d.utilization}%</td><td>${d.delta}</td></tr>`).join('');
    
    const table = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#4CAF50;color:white;}</style></head><body><table>${headers}${rows}</table></body></html>`;
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exposure_${view}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    const data = view === "assets" ? exposureData : sectorExposure;
    const headers = view === "assets"
      ? '<tr><th>Asset</th><th>Type</th><th>Delta</th><th>Gamma</th><th>Vega</th><th>Theta</th><th>Exposure</th><th>Limit</th><th>Status</th></tr>'
      : '<tr><th>Sector</th><th>Exposure</th><th>Limit</th><th>Utilization</th><th>Delta</th></tr>';
    const rows = view === "assets"
      ? data.map(d => `<tr><td>${d.asset}</td><td>${d.type}</td><td>${d.delta.toLocaleString()}</td><td>${d.gamma.toLocaleString()}</td><td>${d.vega.toLocaleString()}</td><td>${d.theta.toLocaleString()}</td><td>$${(d.exposure/1000).toFixed(0)}K</td><td>$${(d.limit/1000).toFixed(0)}K</td><td>${d.status}</td></tr>`).join('')
      : data.map(d => `<tr><td>${d.sector}</td><td>$${(d.exposure/1000000).toFixed(2)}M</td><td>$${(d.limit/1000000).toFixed(2)}M</td><td>${d.utilization}%</td><td>${d.delta.toLocaleString()}</td></tr>`).join('');
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>Exposure Analysis Report</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px;}th{background-color:#4CAF50;color:white;}tr:nth-child(even){background-color:#f9f9f9;}@media print{button{display:none;}}</style></head><body><h1>Exposure Analysis - ${view === 'assets' ? 'By Asset' : 'By Sector'}</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><table>${headers}${rows}</table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setShowExportModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Exposure Analysis</h2>
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
          <button
            onClick={() => setView("assets")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              background: view === "assets" ? C.accent : C.lightGray,
              color: view === "assets" ? C.white : C.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: view === "assets" ? C.shadowSm : "none",
            }}
            onMouseEnter={(e) => {
              if (view !== "assets") {
                e.currentTarget.style.background = C.border;
              }
            }}
            onMouseLeave={(e) => {
              if (view !== "assets") {
                e.currentTarget.style.background = C.lightGray;
              }
            }}
          >
            By Asset
          </button>
          <button
            onClick={() => setView("sector")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              background: view === "sector" ? C.accent : C.lightGray,
              color: view === "sector" ? C.white : C.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: view === "sector" ? C.shadowSm : "none",
            }}
            onMouseEnter={(e) => {
              if (view !== "sector") {
                e.currentTarget.style.background = C.border;
              }
            }}
            onMouseLeave={(e) => {
              if (view !== "sector") {
                e.currentTarget.style.background = C.lightGray;
              }
            }}
          >
            By Sector
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Total Exposure</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>${(totalExposure / 1000000).toFixed(2)}M</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Total Limit</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>${(totalLimit / 1000000).toFixed(2)}M</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Utilization</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: utilizationPct > 80 ? C.red : utilizationPct > 60 ? "#D97706" : C.success }}>
            {utilizationPct}%
          </div>
        </Card>
      </div>

      {view === "assets" ? (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Asset Exposure Breakdown</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Asset</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Type</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Delta</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Gamma</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Vega</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Theta</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Exposure</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Limit</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: C.textMuted, fontWeight: 600, fontSize: 11 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {exposureData.map((item, idx) => (
                  <tr
                    key={item.asset}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: idx % 2 === 0 ? "transparent" : C.lightGray + "33",
                    }}
                  >
                    <td style={{ padding: "12px 8px", fontWeight: 700 }}>{item.asset}</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", color: C.textMuted, fontSize: 12 }}>{item.type}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace" }}>{item.delta.toLocaleString()}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace" }}>{item.gamma.toLocaleString()}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace" }}>{item.vega.toLocaleString()}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace", color: C.red }}>{item.theta.toLocaleString()}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>${(item.exposure / 1000).toFixed(0)}K</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", color: C.textMuted }}>${(item.limit / 1000).toFixed(0)}K</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <Badge variant={item.status === "danger" ? "red" : item.status === "warning" ? "yellow" : "green"}>
                        {item.status === "ok" ? "OK" : item.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Sector Exposure Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sectorExposure.map((sector) => (
              <div key={sector.sector}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sector.sector}</span>
                    <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>
                      Δ {sector.delta.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      ${(sector.exposure / 1000000).toFixed(2)}M
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      of ${(sector.limit / 1000000).toFixed(2)}M
                    </div>
                  </div>
                </div>
                <div style={{ background: C.lightGray, borderRadius: 6, height: 12, position: "relative" }}>
                  <div
                    style={{
                      width: `${sector.utilization}%`,
                      height: "100%",
                      background:
                        sector.utilization > 80
                          ? C.red
                          : sector.utilization > 60
                          ? "#D97706"
                          : C.success,
                      borderRadius: 6,
                      transition: "width 0.5s",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: sector.utilization > 50 ? C.white : C.text,
                    }}
                  >
                    {sector.utilization}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Format Modal */}
      {showExportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: C.shadowMd }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export Exposure Data</h3>
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
