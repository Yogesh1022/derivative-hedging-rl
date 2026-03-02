import { useState } from "react";
import { C } from "../../constants/colors";
import { Card, Button, Select } from "../../components/common";

const reportHistory = [
  {
    id: 1,
    name: "Monthly Performance Report - Dec 2024",
    type: "Performance",
    date: "2024-12-31",
    size: "2.4 MB",
    status: "Completed",
  },
  {
    id: 2,
    name: "Risk Assessment Q4 2024",
    type: "Risk",
    date: "2024-12-15",
    size: "1.8 MB",
    status: "Completed",
  },
  {
    id: 3,
    name: "Trading Activity Nov 2024",
    type: "Trading",
    date: "2024-11-30",
    size: "3.1 MB",
    status: "Completed",
  },
  {
    id: 4,
    name: "Portfolio Analysis Report",
    type: "Portfolio",
    date: "2024-11-15",
    size: "2.7 MB",
    status: "Completed",
  },
  {
    id: 5,
    name: "Compliance Report Oct 2024",
    type: "Compliance",
    date: "2024-10-31",
    size: "1.2 MB",
    status: "Completed",
  },
];

const scheduledReportsData = [
  { id: 1, name: "Daily P&L Summary", frequency: "Daily", time: "09:00 AM", enabled: true },
  { id: 2, name: "Weekly Risk Digest", frequency: "Weekly", time: "Monday 08:00 AM", enabled: true },
  { id: 3, name: "Monthly Performance", frequency: "Monthly", time: "1st at 10:00 AM", enabled: true },
  { id: 4, name: "Quarterly Review", frequency: "Quarterly", time: "1st at 12:00 PM", enabled: false },
];

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("performance");
  const [dateRange, setDateRange] = useState("1M");
  const [format, setFormat] = useState("pdf");
  const [scheduledReports, setScheduledReports] = useState(scheduledReportsData);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      const reportTypeLabels = {
        performance: "Performance Summary",
        risk: "Risk Assessment",
        trading: "Trading Activity",
        portfolio: "Portfolio Analysis",
        compliance: "Compliance Report",
        custom: "Custom Report"
      };

      const reportContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #F8FAFC; }
            h1 { color: #1E293B; border-bottom: 3px solid #E10600; padding-bottom: 10px; }
            h2 { color: #475569; margin-top: 25px; }
            .header-info { background: #FFFFFF; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 25px 0; }
            .metric-box { background: #FFFFFF; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            .metric-label { font-size: 13px; color: #64748B; margin-bottom: 8px; }
            .metric-value { font-size: 28px; font-weight: bold; color: #E10600; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; }
            th { background-color: #E10600; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #F8FAFC; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E2E8F0; color: #64748B; font-size: 12px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>📊 ${reportTypeLabels[reportType]}</h1>
          <div class="header-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${dateRange}</p>
            <p><strong>Report Type:</strong> ${reportTypeLabels[reportType]}</p>
          </div>
          
          <h2>Summary Metrics</h2>
          <div class="metrics">
            <div class="metric-box">
              <div class="metric-label">Total Return</div>
              <div class="metric-value">27.3%</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Sharpe Ratio</div>
              <div class="metric-value">1.82</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Win Rate</div>
              <div class="metric-value">68.5%</div>
            </div>
          </div>
          
          <h2>Detailed Analysis</h2>
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
            <tr>
              <td>Portfolio Value</td>
              <td>$4,820,000</td>
              <td style="color: #16A34A; font-weight: bold;">Healthy</td>
            </tr>
            <tr>
              <td>Risk Score</td>
              <td>74/100</td>
              <td style="color: #D97706; font-weight: bold;">Moderate</td>
            </tr>
            <tr>
              <td>Total Trades</td>
              <td>342</td>
              <td style="color: #16A34A; font-weight: bold;">Active</td>
            </tr>
            <tr>
              <td>VaR (95%)</td>
              <td>$42,100</td>
              <td style="color: #16A34A; font-weight: bold;">Within Limits</td>
            </tr>
          </table>
          
          <div class="footer">
            <p>This report was generated automatically by the Trading Risk Platform.</p>
            <p>For questions or concerns, contact the risk management team.</p>
          </div>
        </body>
        </html>
      `;

      if (format === 'pdf') {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else if (format === 'excel') {
        const blob = new Blob([reportContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csvContent = `${reportTypeLabels[reportType]}\nGenerated: ${new Date().toLocaleString()}\nPeriod: ${dateRange}\n\nMetric,Value,Status\nPortfolio Value,$4820000,Healthy\nRisk Score,74,Moderate\nTotal Trades,342,Active\nVaR (95%),$42100,Within Limits`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify({
          reportType: reportTypeLabels[reportType],
          generated: new Date().toISOString(),
          period: dateRange,
          metrics: {
            portfolioValue: 4820000,
            riskScore: 74,
            totalTrades: 342,
            var95: 42100
          }
        }, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      setGeneratingReport(false);
    }, 800);
  };

  const handleDownloadReport = (report) => {
    const reportContent = `Report: ${report.name}\nType: ${report.type}\nDate: ${report.date}\nSize: ${report.size}\nStatus: ${report.status}\n\nThis is a previously generated report.`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewReport = (report) => {
    const previewWindow = window.open('', '', 'width=800,height=600');
    previewWindow.document.write(`
      <html>
      <head>
        <title>${report.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #F8FAFC; }
          h1 { color: #1E293B; border-bottom: 3px solid #E10600; padding-bottom: 10px; }
          .info-box { background: #FFFFFF; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #E2E8F0; }
          .info-label { font-weight: 600; color: #64748B; width: 150px; }
          .info-value { color: #1E293B; }
        </style>
      </head>
      <body>
        <h1>📄 ${report.name}</h1>
        <div class="info-box">
          <div class="info-row">
            <div class="info-label">Report Type:</div>
            <div class="info-value">${report.type}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Generated Date:</div>
            <div class="info-value">${report.date}</div>
          </div>
          <div class="info-row">
            <div class="info-label">File Size:</div>
            <div class="info-value">${report.size}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value" style="color: #16A34A; font-weight: bold;">${report.status}</div>
          </div>
        </div>
        <p style="color: #64748B; font-size: 14px;">This is a preview of the report. Use the Download button to get the full report file.</p>
      </body>
      </html>
    `);
    previewWindow.document.close();
  };

  const toggleScheduledReport = (id) => {
    setScheduledReports(prev => 
      prev.map(report => 
        report.id === id ? { ...report, enabled: !report.enabled } : report
      )
    );
  };

  const quickExport = (type) => {
    const exportData = {
      positions: 'Symbol,Quantity,Entry Price,Current Price,P&L\nAAPL,100,$150.00,$185.23,$3523.00\nMSFT,50,$380.00,$412.18,$1609.00',
      trades: 'Date,Symbol,Action,Quantity,Price,Total\n2024-12-15,AAPL,BUY,100,$150.00,$15000.00\n2024-12-16,MSFT,BUY,50,$380.00,$19000.00',
      performance: 'Metric,Value\nTotal Return,27.3%\nSharpe Ratio,1.82\nWin Rate,68.5%\nMax Drawdown,-6.8%',
      alerts: 'Time,Type,Message,Status\n2 min ago,Error,Delta exposure exceeds threshold,Active\n15 min ago,Warning,VaR budget at 87%,Active'
    };

    const csv = exportData[type] || '';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Reports & Export</h2>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Generate New Report</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
              Report Type
            </label>
            <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="performance">Performance Summary</option>
              <option value="risk">Risk Assessment</option>
              <option value="trading">Trading Activity</option>
              <option value="portfolio">Portfolio Analysis</option>
              <option value="compliance">Compliance Report</option>
              <option value="custom">Custom Report</option>
            </Select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
              Date Range
            </label>
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="1D">Last 24 Hours</option>
              <option value="1W">Last Week</option>
              <option value="1M">Last Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last Year</option>
              <option value="YTD">Year to Date</option>
              <option value="custom">Custom Range</option>
            </Select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
              Export Format
            </label>
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
              <option value="json">JSON Data</option>
            </Select>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <Button 
            onClick={handleGenerateReport}
            disabled={generatingReport}
            style={{
              opacity: generatingReport ? 0.6 : 1,
              cursor: generatingReport ? 'not-allowed' : 'pointer'
            }}
          >
            {generatingReport ? '⏳ Generating...' : '📄 Generate Report'}
          </Button>
          <Button
            style={{
              background: C.lightGray,
              color: C.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.lightGray;
            }}
          >
            👁️ Preview
          </Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Report History</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th
                    style={{
                      padding: "10px 8px",
                      textAlign: "left",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    Report Name
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    Size
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      color: C.textMuted,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportHistory.map((report, idx) => (
                  <tr
                    key={report.id}
                    style={{
                      borderBottom: `1px solid ${C.borderLight}`,
                      background: idx % 2 === 0 ? "transparent" : C.offWhite,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.lightGray)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : C.offWhite)}
                  >
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{report.name}</div>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: C.infoBg,
                          color: C.info,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {report.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center", color: C.textMuted }}>
                      {report.date}
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center", color: C.textMuted }}>
                      {report.size}
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          style={{
                            padding: "4px 10px",
                            border: "none",
                            borderRadius: 6,
                            background: C.accent,
                            color: C.white,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.accentHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = C.accent)}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleViewReport(report)}
                          style={{
                            padding: "4px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            background: C.white,
                            color: C.text,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
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
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Scheduled Reports</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scheduledReports.map((scheduled) => (
              <div
                key={scheduled.id}
                style={{
                  padding: 12,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: scheduled.enabled ? C.successBg : C.offWhite,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: C.text }}>
                      {scheduled.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      {scheduled.frequency} • {scheduled.time}
                    </div>
                  </div>
                  <div
                    onClick={() => toggleScheduledReport(scheduled.id)}
                    style={{
                      width: 40,
                      height: 20,
                      borderRadius: 10,
                      background: scheduled.enabled ? C.success : C.textMuted,
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: C.white,
                        position: "absolute",
                        top: 2,
                        left: scheduled.enabled ? 22 : 2,
                        transition: "left 0.2s",
                        boxShadow: C.shadowSm,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            style={{
              marginTop: 12,
              width: "100%",
              background: C.lightGray,
              color: C.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.lightGray;
            }}
          >
            ⚙️ Manage Schedules
          </Button>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Quick Export</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <button
            onClick={() => quickExport('positions')}
            style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.background = C.lightAccent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = C.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Export Positions</div>
          </button>
          <button
            onClick={() => quickExport('trades')}
            style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.background = C.lightAccent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = C.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>💹</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Export Trades</div>
          </button>
          <button
            onClick={() => quickExport('performance')}
            style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.background = C.lightAccent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = C.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Export Performance</div>
          </button>
          <button
            onClick={() => quickExport('alerts')}
            style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.background = C.lightAccent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = C.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Export Alerts</div>
          </button>
        </div>
      </Card>
    </div>
  );
};
