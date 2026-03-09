import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { authService } from "./src/services/authService";
import { portfolioService } from "./src/services/portfolioService";
import { positionService } from "./src/services/positionService";
import { tradeService } from "./src/services/tradeService";
import { alertService } from "./src/services/alertService";
import { analyticsService } from "./src/services/analyticsService";
import { userService } from "./src/services/userService";
import { mlService } from "./src/services/mlService";
import { RealtimeProvider } from "./src/contexts/RealtimeContext";
import { StatusBar } from "./src/components/StatusIndicators";
import { NewPositionModal } from "./src/components/modals";
import { MarketTrends } from "./src/dashboards/analyst/MarketTrends";
import { RiskHeatmapPage } from "./src/dashboards/analyst/RiskHeatmapPage";
import { PerformancePage } from "./src/dashboards/analyst/PerformancePage";
import { ReportsPage } from "./src/dashboards/analyst/ReportsPage";
import { ExposureTablePage } from "./src/dashboards/risk-manager/ExposureTablePage";
import { VarAnalysisPage } from "./src/dashboards/risk-manager/VarAnalysisPage";
import { AlertsPage } from "./src/dashboards/risk-manager/AlertsPage";
import { RiskLimitsPage } from "./src/dashboards/risk-manager/RiskLimitsPage";

/* ═══════════════════════════════════════════════════════════════
   ENHANCED DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const C = {
  // Primary Colors - Enhanced with gradients
  red: "#E10600", 
  redDark: "#B80500", 
  redLight: "#FF2B26", 
  redGhost: "#FFF0F0",
  redGradient: "linear-gradient(135deg, #E10600 0%, #FF2B26 100%)",
  redGradientSubtle: "linear-gradient(135deg, #FFF0F0 0%, #FFE5E5 100%)",
  
  // Neutrals - Enhanced palette
  white: "#FFFFFF", 
  offWhite: "#FAFAFA", 
  lightGray: "#F5F5F7", 
  midGray: "#E8E8ED",
  darkGray: "#4B5563",
  border: "#E2E2E7", 
  borderLight: "#F0F0F5",
  
  // Text Colors - Better hierarchy
  text: "#111827", 
  textSub: "#6B7280", 
  textMuted: "#9CA3AF",
  
  // Semantic Colors - More vibrant
  success: "#10B981", 
  successBg: "#ECFDF5",
  successDark: "#059669",
  warning: "#F59E0B", 
  warningBg: "#FFFBEB",
  warningDark: "#D97706",
  info: "#3B82F6", 
  infoBg: "#EFF6FF",
  infoDark: "#2563EB",
  
  // Gradients - Modern touches
  gradientBg: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)",
  gradientCard: "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)",
  
  // Shadows - Layered depth
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
  shadowLg: "0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
  shadowRed: "0 4px 24px rgba(225,6,0,0.25), 0 2px 8px rgba(225,6,0,0.15)",
  shadowSuccess: "0 4px 20px rgba(16,185,129,0.25)",
  shadowInner: "inset 0 2px 4px rgba(0,0,0,0.06)",
  
  // Glass Effects - Modern glassmorphism
  glass: "rgba(255, 255, 255, 0.7)",
  glassBlur: "blur(12px)",
  glassBorder: "rgba(255, 255, 255, 0.18)",
};

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════ */
// Static data for charts (will be replaced with real data later)
const pnlData = Array.from({length:30},(_,i)=>({ day:`${i+1}`, pnl: 45000+Math.sin(i*0.4)*12000+Math.random()*5000, baseline:45000 }));
const volData = Array.from({length:24},(_,i)=>({ hour:`${i}:00`, vol:15+Math.sin(i*0.5)*8+Math.random()*4 }));
const riskData = [{ name:"Equity",value:42,color:"#E10600" },{ name:"FX",value:23,color:"#FF6B6B" },{ name:"Rates",value:18,color:"#FFA8A8" },{ name:"Credit",value:17,color:"#FFD0D0" }];
const heatData = Array.from({length:35},(_,i)=>({ val: Math.random() }));
const varData = Array.from({length:12},(_,i)=>({ m:["J","F","M","A","M","J","J","A","S","O","N","D"][i], var95:-20000-Math.random()*15000, var99:-30000-Math.random()*20000 }));
const users = [
  { id:1, name:"Sarah Chen", email:"s.chen@firm.com", role:"Risk Manager", status:"active", joined:"Jan 12, 2025" },
  { id:2, name:"Marcus Webb", email:"m.webb@firm.com", role:"Trader", status:"active", joined:"Feb 3, 2025" },
  { id:3, name:"Priya Nair", email:"p.nair@firm.com", role:"Analyst", status:"inactive", joined:"Mar 7, 2025" },
  { id:4, name:"James Okafor", email:"j.okafor@firm.com", role:"Trader", status:"active", joined:"Apr 15, 2025" },
  { id:5, name:"Luna Fischer", email:"l.fischer@firm.com", role:"Analyst", status:"active", joined:"May 2, 2025" },
];
const chatSuggestions = ["Explain my risk score","How to reduce VaR exposure?","What is current portfolio delta?","Show key risk metrics"];

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════════════════ */
const Badge = ({ children, variant="default", icon, size="md", outline=false, pulse=false, onDismiss }) => {
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);
  
  const styles = {
    default: { bg: C.lightGray, color: C.textSub, border: C.border },
    red: { bg: "#FFF0F0", color: C.red, border: "#FFC9C9" },
    green: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
    yellow: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    blue: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    gradient: { bg: C.redGradient, color: C.white, border: C.red },
  };
  const s = styles[variant] || styles.default;
  const sizeMap = { sm: { fontSize: 10, padding: "2px 8px" }, md: { fontSize: 11, padding: "3px 10px" }, lg: { fontSize: 12, padding: "4px 12px" } };
  const sz = sizeMap[size] || sizeMap.md;
  
  if (removed) return null;
  
  return (
    <span style={{ 
      background: outline ? "transparent" : s.bg, 
      color: s.color, 
      fontSize: sz.fontSize, 
      fontWeight: 600, 
      padding: sz.padding, 
      borderRadius: 20, 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 4,
      border: outline ? `1.5px solid ${s.border}` : "none",
      animation: pulse ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : mounted ? "fadeIn 0.2s ease-out" : "none",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "scale(1)" : "scale(0.9)",
      transition: "all 0.15s ease"
    }}>
      {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
      {children}
      {onDismiss && (
        <button onClick={() => { setRemoved(true); onDismiss(); }} 
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, marginLeft: 2, fontSize: sz.fontSize, opacity: 0.6, lineHeight: 1 }}
          aria-label="Dismiss">
          ×
        </button>
      )}
    </span>
  );
};

const Card = ({ children, style={}, hover=true, glow=false, gradient=false }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>hover&&setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ 
        background: gradient ? C.gradientCard : C.white, 
        borderRadius: 16, 
        border: `1px solid ${hov && glow ? `${C.red}44` : C.border}`, 
        padding: 24,
        boxShadow: hov ? (glow ? C.shadowRed : C.shadowMd) : C.shadow, 
        transform: hov ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
        position: "relative",
        overflow: "hidden",
        ...style 
      }}>
      {gradient && hov && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.redGradient }} />
      )}
      {children}
    </div>
  );
};

const Btn = ({ children, variant="primary", onClick, style={}, disabled=false, size="md", icon, loading=false }) => {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  const pad = size === "sm" ? "8px 16px" : size === "lg" ? "14px 32px" : "11px 24px";
  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  const vars = {
    primary: { bg: hov ? C.redGradient : C.red, color: C.white, border: "none", shadow: hov ? C.shadowRed : C.shadow },
    outline: { bg: hov ? C.redGhost : "transparent", color: C.red, border: `2px solid ${C.red}`, shadow: hov ? C.shadow : "none" },
    ghost: { bg: hov ? C.lightGray : "transparent", color: C.textSub, border: `1px solid ${hov ? C.border : 'transparent'}`, shadow: "none" },
    danger: { bg: hov ? C.redDark : C.redGhost, color: hov ? C.white : C.red, border: `2px solid ${C.red}44`, shadow: hov ? C.shadowRed : "none" },
    success: { bg: hov ? C.successDark : C.success, color: C.white, border: "none", shadow: hov ? C.shadowSuccess : C.shadow },
  };
  const v = vars[variant] || vars.primary;
  const isDisabled = disabled || loading;
  
  return (
    <button onClick={onClick} disabled={isDisabled}
      onMouseEnter={()=>!isDisabled&&setHov(true)} onMouseLeave={()=>{setHov(false);setPress(false);}}
      onMouseDown={()=>!isDisabled&&setPress(true)} onMouseUp={()=>setPress(false)}
      style={{ 
        background: v.bg, 
        color: v.color, 
        border: v.border, 
        boxShadow: v.shadow, 
        padding: pad,
        fontSize: fs, 
        fontWeight: 600, 
        borderRadius: 12, 
        cursor: isDisabled ? "not-allowed" : "pointer",
        transform: press ? "scale(0.95)" : (hov ? "scale(1.02)" : "scale(1)"), 
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
        fontFamily: "inherit",
        letterSpacing: 0.3, 
        opacity: isDisabled ? 0.6 : 1, 
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        position: "relative",
        ...style 
      }}>
      {loading && <Spinner size={fs} color={v.color} />}
      {!loading && icon && <span style={{ fontSize: fs + 2 }}>{icon}</span>}
      <span style={{ opacity: loading ? 0 : 1, transition: "opacity 0.15s" }}>{children}</span>
    </button>
  );
};

const Input = ({ label, type="text", placeholder, value, onChange, error, icon }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, letterSpacing: 0.2 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.textMuted }}>{icon}</span>}
        <input 
          type={type} 
          placeholder={placeholder} 
          value={value} 
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ 
            width: "100%", 
            padding: icon ? "12px 14px 12px 44px" : "12px 14px", 
            borderRadius: 10, 
            border: `2px solid ${error ? C.red : (focused ? C.red : C.border)}`,
            fontSize: 14, 
            color: C.text, 
            background: focused ? C.white : C.offWhite, 
            outline: "none", 
            boxSizing: "border-box",
            fontFamily: "inherit", 
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: focused ? C.shadow : "none"
          }}
        />
      </div>
      {error && <p style={{ color: C.red, fontSize: 12, marginTop: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>⚠️ {error}</p>}
    </div>
  );
};

const Select = ({ label, value, onChange, options, icon, error }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: focused ? C.red : C.textMuted, transition: "color 0.2s" }}>{icon}</span>}
        <select value={value} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ 
            width: "100%", 
            padding: icon ? "11px 40px 11px 44px" : "11px 40px 11px 14px", 
            borderRadius: 10, 
            border: `1.5px solid ${error ? C.red : focused ? C.red : C.border}`,
            fontSize: 14, 
            color: C.text, 
            background: focused ? C.white : C.offWhite, 
            outline: "none", 
            fontFamily: "inherit",
            cursor: "pointer", 
            appearance: "none", 
            boxSizing: "border-box",
            transition: "all 0.2s ease",
            boxShadow: focused ? "0 0 0 3px rgba(225,6,0,0.08)" : "none"
          }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: "absolute", right: 14, top: "50%", transform: `translateY(-50%) rotate(${focused ? 180 : 0}deg)`, fontSize: 12, color: C.textMuted, pointerEvents: "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span>{error}</div>}
    </div>
  );
};

const MetricCard = ({ label, value, change, changeDir="up", icon, accent=false, loading=false }) => {
  const [hov, setHov] = useState(false);
  
  if (loading) {
    return (
      <Card style={{ flex: 1, minWidth: 160, padding: 20 }} hover={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.lightGray, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <div style={{ width: 48, height: 20, borderRadius: 8, background: C.lightGray, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
        </div>
        <div style={{ width: "80%", height: 32, borderRadius: 8, background: C.lightGray, marginBottom: 8, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
        <div style={{ width: "60%", height: 16, borderRadius: 6, background: C.lightGray, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
      </Card>
    );
  }
  
  return (
    <Card 
      style={{ flex: 1, minWidth: 160, padding: 20, cursor: "pointer" }} 
      hover={true}
      glow={accent}
      gradient={hov}
    >
      <div 
        onMouseEnter={() => setHov(true)} 
        onMouseLeave={() => setHov(false)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: accent ? C.redGradientSubtle : C.lightGray,
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: 20,
            transform: hov ? "rotate(5deg) scale(1.1)" : "rotate(0deg) scale(1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            {icon}
          </div>
          {change && (
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: changeDir === "up" ? C.success : C.red,
              background: changeDir === "up" ? C.successBg : C.redGhost, 
              padding: "4px 10px", 
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              boxShadow: hov ? (changeDir === "up" ? C.shadowSuccess : C.shadowRed) : "none",
              transition: "box-shadow 0.2s"
            }}>
              <span style={{ fontSize: 8 }}>{changeDir === "up" ? "▲" : "▼"}</span> {change}
            </span>
          )}
        </div>
        <div style={{ 
          fontSize: 28, 
          fontWeight: 800, 
          color: accent ? C.red : C.text, 
          letterSpacing: -1.2, 
          marginBottom: 6,
          transition: "transform 0.2s",
          transform: hov ? "translateX(4px)" : "translateX(0)"
        }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      </div>
    </Card>
  );
};

const AnimCounter = ({ end, prefix="", suffix="" }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let s = 0; const t = setInterval(() => { s += end/60; if(s >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [end]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
};

// Loading Skeleton Component
const Skeleton = ({ width = "100%", height = 20, borderRadius = 8, style = {} }) => (
  <div style={{ 
    width, 
    height, 
    borderRadius, 
    background: "linear-gradient(90deg, #F5F5F7 25%, #E8E8ED 50%, #F5F5F7 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 2s infinite",
    ...style 
  }} />
);

// Spinner Component
const Spinner = ({ size = 24, color = C.red }) => (
  <div style={{
    width: size,
    height: size,
    border: `3px solid ${C.lightGray}`,
    borderTop: `3px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }} />
);

// Pulse Animation Component
const PulseIndicator = ({ color = C.success, size = 12 }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div style={{ 
      position: "absolute", 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: color,
      animation: "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }} />
    <div style={{ 
      position: "absolute", 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: color,
      opacity: 0.5,
      animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }} />
  </div>
);

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(0.95); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2); opacity: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(100%); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideOutDown {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(100%); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
═══════════════════════════════════════════════════════════════ */
const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, 300);
  };

  if (!visible) return null;

  const styles = {
    success: { bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", border: "#10B981", icon: "✓", iconBg: "#10B981" },
    error: { bg: "linear-gradient(135deg, #FFF0F0 0%, #FFE5E5 100%)", border: C.red, icon: "✕", iconBg: C.red },
    warning: { bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)", border: "#F59E0B", icon: "⚠", iconBg: "#F59E0B" },
    info: { bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "#3B82F6", icon: "ℹ", iconBg: "#3B82F6" },
  };
  const s = styles[type] || styles.info;

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      minWidth: 320,
      maxWidth: 400,
      boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      animation: exiting ? "slideOutDown 0.3s ease-out" : "slideInUp 0.3s ease-out",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: s.iconBg,
        color: C.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 700,
        flexShrink: 0
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{message}</div>
      <button
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          color: C.textMuted,
          cursor: "pointer",
          fontSize: 18,
          padding: 4,
          lineHeight: 1,
          opacity: 0.6,
          transition: "opacity 0.15s"
        }}
        onMouseEnter={e => e.target.style.opacity = 1}
        onMouseLeave={e => e.target.style.opacity = 0.6}
      >
        ×
      </button>
    </div>
  );
};

// Toast Container for managing multiple toasts
const ToastContainer = ({ toasts, removeToast }) => (
  <div style={{
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    pointerEvents: "none"
  }}>
    {toasts.map(toast => (
      <div key={toast.id} style={{ pointerEvents: "auto" }}>
        <Toast {...toast} onClose={() => removeToast(toast.id)} />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE COMPONENT
═══════════════════════════════════════════════════════════════ */
const EmptyState = ({ icon = "📭", title, description, action, actionLabel }) => (
  <div style={{
    textAlign: "center",
    padding: "60px 20px",
    animation: "fadeIn 0.4s ease-out"
  }}>
    <div style={{
      fontSize: 64,
      marginBottom: 16,
      opacity: 0.5,
      animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }}>
      {icon}
    </div>
    <h3 style={{
      fontSize: 18,
      fontWeight: 700,
      color: C.text,
      marginBottom: 8,
      letterSpacing: -0.3
    }}>
      {title}
    </h3>
    {description && (
      <p style={{
        fontSize: 13,
        color: C.textMuted,
        marginBottom: 24,
        maxWidth: 400,
        margin: "0 auto 24px"
      }}>
        {description}
      </p>
    )}
    {action && actionLabel && (
      <Btn variant="primary" onClick={action}>
        {actionLabel}
      </Btn>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ENHANCED TABLE COMPONENT
═══════════════════════════════════════════════════════════════ */
const Table = ({ columns, data, loading, onRowClick, onRowContextMenu, stickyHeader = false, striped = false }) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (columnKey) => {
    if (!columnKey) return;
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const modifier = sortDirection === "asc" ? 1 : -1;
        if (typeof aVal === "number") return (aVal - bVal) * modifier;
        return String(aVal).localeCompare(String(bVal)) * modifier;
      })
    : data;

  const handleContextMenu = (e, row) => {
    if (onRowContextMenu) {
      e.preventDefault();
      onRowContextMenu(e, row);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", padding: "8px 12px" }}>
          {columns.map((col, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton width="60%" height={16} />
            </div>
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ borderBottom: `1px solid ${C.borderLight}`, display: "flex", padding: "11px 12px" }}>
            {columns.map((col, j) => (
              <div key={j} style={{ flex: 1 }}>
                <Skeleton width="80%" height={14} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No Data Available"
        description="There are no records to display at this time."
      />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead style={{ position: stickyHeader ? "sticky" : "static", top: 0, background: C.white, zIndex: 10 }}>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {columns.map((col, i) => (
              <th
                key={i}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: "10px 12px",
                  textAlign: col.align || "left",
                  color: C.textMuted,
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  cursor: col.sortable ? "pointer" : "default",
                  userSelect: "none",
                  transition: "color 0.15s"
                }}
                onMouseEnter={e => col.sortable && (e.target.style.color = C.red)}
                onMouseLeave={e => col.sortable && (e.target.style.color = C.textMuted)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: col.align === "right" ? "flex-end" : "flex-start" }}>
                  {col.label}
                  {col.sortable && (
                    <span style={{ fontSize: 10, opacity: sortColumn === col.key ? 1 : 0.3 }}>
                      {sortColumn === col.key && sortDirection === "desc" ? "▼" : "▲"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              onContextMenu={(e) => handleContextMenu(e, row)}
              style={{
                borderBottom: `1px solid ${C.borderLight}`,
                background: striped && i % 2 === 1 ? C.offWhite : "transparent",
                cursor: onRowClick || onRowContextMenu ? "pointer" : "default",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.lightGray;
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = striped && i % 2 === 1 ? C.offWhite : "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {columns.map((col, j) => (
                <td
                  key={j}
                  style={{
                    padding: "11px 12px",
                    textAlign: col.align || "left",
                    color: col.color ? col.color(row) : C.text,
                    fontWeight: col.bold ? 600 : 400,
                    fontFamily: col.mono ? "monospace" : "inherit"
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TOOLTIP WRAPPER COMPONENT
═══════════════════════════════════════════════════════════════ */
const TooltipWrapper = ({ children, content, position = "top" }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setShow(true);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {show && content && (
        <div style={{
          position: "fixed",
          left: coords.x,
          top: position === "top" ? coords.y - 8 : coords.y + 32,
          transform: position === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          background: "rgba(0, 0, 0, 0.9)",
          color: C.white,
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: "nowrap",
          zIndex: 10000,
          pointerEvents: "none",
          animation: "fadeIn 0.15s ease-out",
          backdropFilter: "blur(8px)"
        }}>
          {content}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CHART TOOLTIP
═══════════════════════════════════════════════════════════════ */
const CustomChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.98)",
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      backdropFilter: "blur(12px)",
      animation: "scaleIn 0.15s ease-out"
    }}>
      {label && (
        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
          <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
            {entry.name}: <strong>{formatter ? formatter(entry.value) : entry.value}</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL SEARCH COMPONENT (Cmd+K / Ctrl+K)
═══════════════════════════════════════════════════════════════ */
const GlobalSearch = ({ isOpen, onClose, onNavigate, role }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Search items based on role
  const searchableItems = {
    trader: [
      { id: "overview", icon: "📊", label: "Overview", category: "Navigation" },
      { id: "portfolios", icon: "💼", label: "Portfolios", category: "Navigation" },
      { id: "positions", icon: "📋", label: "Positions", category: "Navigation" },
      { id: "trades", icon: "🔄", label: "Trade History", category: "Navigation" },
      { id: "ai", icon: "🤖", label: "AI Advisor", category: "Navigation" },
      { id: "create-portfolio", icon: "➕", label: "Create Portfolio", category: "Action" },
      { id: "settings", icon: "⚙️", label: "Settings", category: "Action" },
      { id: "logout", icon: "🚪", label: "Logout", category: "Action" },
    ],
    analyst: [
      { id: "overview", icon: "📊", label: "Overview", category: "Navigation" },
      { id: "trends", icon: "📉", label: "Market Trends", category: "Navigation" },
      { id: "heatmap", icon: "🌡", label: "Risk Heatmap", category: "Navigation" },
      { id: "performance", icon: "🏆", label: "Performance", category: "Navigation" },
      { id: "reports", icon: "📋", label: "Reports", category: "Navigation" },
    ],
    risk_manager: [
      { id: "overview", icon: "📊", label: "Overview", category: "Navigation" },
      { id: "exposure", icon: "⚠️", label: "Exposure Table", category: "Navigation" },
      { id: "var", icon: "📉", label: "VaR Analysis", category: "Navigation" },
      { id: "alerts", icon: "🔔", label: "Alerts", category: "Navigation" },
      { id: "limits", icon: "🔒", label: "Risk Limits", category: "Navigation" },
    ],
  };

  const items = searchableItems[role] || searchableItems.trader;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(items);
      setSelectedIndex(0);
      return;
    }

    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, role]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (item) => {
    if (item.category === "Navigation") {
      onNavigate(item.id);
    } else if (item.id === "logout") {
      authService.logout();
      onNavigate("landing");
    }
    onClose();
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: "90vw",
          background: C.white,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          animation: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Search Input */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, color: C.textMuted }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or jump to..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 16,
                fontFamily: "inherit",
                color: C.text,
                background: "transparent"
              }}
            />
            <kbd style={{
              padding: "4px 8px",
              background: C.lightGray,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: C.textMuted
            }}>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: C.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13 }}>No results found</div>
            </div>
          ) : (
            results.map((item, i) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: i === selectedIndex ? C.redGhost : "transparent",
                  borderLeft: i === selectedIndex ? `3px solid ${C.red}` : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{item.category}</div>
                </div>
                {i === selectedIndex && (
                  <kbd style={{
                    padding: "4px 8px",
                    background: C.lightGray,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted
                  }}>↵</kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          gap: 16,
          fontSize: 11,
          color: C.textMuted
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd style={{ padding: "2px 6px", background: C.lightGray, borderRadius: 4 }}>↑</kbd>
            <kbd style={{ padding: "2px 6px", background: C.lightGray, borderRadius: 4 }}>↓</kbd>
            <span>to navigate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd style={{ padding: "2px 6px", background: C.lightGray, borderRadius: 4 }}>↵</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS OVERLAY (? key)
═══════════════════════════════════════════════════════════════ */
const KeyboardShortcutsOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: "Navigation", items: [
      { keys: ["Ctrl/Cmd", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["ESC"], description: "Close dialogs" },
    ]},
    { category: "General", items: [
      { keys: ["Ctrl/Cmd", "S"], description: "Save (when applicable)" },
      { keys: ["Ctrl/Cmd", "N"], description: "New item" },
      { keys: ["Ctrl/Cmd", "F"], description: "Find on page" },
    ]},
    { category: "Tables", items: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Enter"], description: "Select row" },
      { keys: ["Tab"], description: "Move to next cell" },
    ]},
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 700,
          maxWidth: "90vw",
          maxHeight: "80vh",
          background: C.white,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "auto",
          animation: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>
              ⌨️ Keyboard Shortcuts
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
              Boost your productivity with these shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textMuted,
              cursor: "pointer",
              fontSize: 16,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => {
              e.target.style.background = C.lightGray;
              e.target.style.color = C.text;
            }}
            onMouseLeave={e => {
              e.target.style.background = "transparent";
              e.target.style.color = C.textMuted;
            }}
          >✕</button>
        </div>

        {/* Shortcuts */}
        <div style={{ padding: "24px 32px" }}>
          {shortcuts.map((section, i) => (
            <div key={i} style={{ marginBottom: i < shortcuts.length - 1 ? 32 : 0 }}>
              <h3 style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textMuted,
                letterSpacing: 1,
                marginBottom: 12,
                textTransform: "uppercase"
              }}>
                {section.category}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 16px",
                      background: C.offWhite,
                      borderRadius: 8,
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                    onMouseLeave={e => e.currentTarget.style.background = C.offWhite}
                  >
                    <span style={{ fontSize: 13, color: C.text }}>{item.description}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {item.keys.map((key, k) => (
                        <kbd
                          key={k}
                          style={{
                            padding: "6px 10px",
                            background: C.white,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.text,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                          }}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CONTEXT MENU COMPONENT
═══════════════════════════════════════════════════════════════ */
const ContextMenu = ({ isOpen, position, items, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !items || items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)",
        minWidth: 200,
        zIndex: 10000,
        padding: "6px 0",
        animation: "scaleIn 0.15s ease-out",
        backdropFilter: "blur(12px)"
      }}
    >
      {items.map((item, i) => (
        item.divider ? (
          <div
            key={i}
            style={{
              height: 1,
              background: C.border,
              margin: "6px 0"
            }}
          />
        ) : (
          <button
            key={i}
            onClick={() => {
              if (item.onClick) item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            style={{
              width: "100%",
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: item.disabled ? "not-allowed" : "pointer",
              opacity: item.disabled ? 0.5 : 1,
              transition: "all 0.15s ease",
              fontSize: 13,
              color: item.danger ? C.red : C.text,
              fontFamily: "inherit"
            }}
            onMouseEnter={e => {
              if (!item.disabled) {
                e.currentTarget.style.background = item.danger ? "#FFF0F0" : C.offWhite;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
            {item.shortcut && (
              <kbd style={{
                padding: "2px 6px",
                background: C.lightGray,
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                color: C.textMuted
              }}>
                {item.shortcut}
              </kbd>
            )}
          </button>
        )
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
const LandingPage = ({ onNavigate }) => {
  const [scrollY, setScrollY] = useState(0);
  const [nodes] = useState(() => Array.from({length:18},(_,i)=>({ id:i, x:5+Math.random()*90, y:5+Math.random()*90, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12 })));
  const nodesRef = useRef(nodes.map(n=>({...n})));
  const canvasRef = useRef(null);
  const rafRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const animate = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      const ns = nodesRef.current;
      ns.forEach(n => { n.x += n.vx; n.y += n.vy; if(n.x<0||n.x>100)n.vx*=-1; if(n.y<0||n.y>100)n.vy*=-1; });
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ns.forEach((a,i) => ns.slice(i+1).forEach(b => {
        const dx=(a.x-b.x)*canvas.width/100, dy=(a.y-b.y)*canvas.height/100, d=Math.sqrt(dx*dx+dy*dy);
        if(d<180){ ctx.beginPath(); ctx.moveTo(a.x*canvas.width/100,a.y*canvas.height/100);
          ctx.lineTo(b.x*canvas.width/100,b.y*canvas.height/100);
          ctx.strokeStyle=`rgba(225,6,0,${0.08*(1-d/180)})`; ctx.lineWidth=1; ctx.stroke(); }
      }));
      ns.forEach(n => { ctx.beginPath(); ctx.arc(n.x*canvas.width/100,n.y*canvas.height/100,3,0,Math.PI*2);
        ctx.fillStyle="rgba(225,6,0,0.25)"; ctx.fill(); });
      rafRef.current = requestAnimationFrame(animate);
    };
    animate(); return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const features = [
    { icon:"🛡", title:"Risk Analysis", desc:"Real-time VaR, Greeks, and exposure monitoring across all asset classes." },
    { icon:"📊", title:"Live Analytics", desc:"Sub-second data feeds with advanced charting and pattern recognition." },
    { icon:"💼", title:"Portfolio Monitor", desc:"Unified view across equities, FX, rates, and derivatives." },
    { icon:"🤖", title:"AI Insights", desc:"RL-powered hedging recommendations and anomaly detection." },
  ];

  const steps = [
    { n:"01", title:"Connect & Configure", desc:"Link your trading accounts and set custom risk thresholds." },
    { n:"02", title:"Monitor in Real-Time", desc:"Dashboard updates instantly as markets move." },
    { n:"03", title:"Act on AI Insights", desc:"Execute AI-recommended hedges directly from the platform." },
  ];

  const testimonials = [
    { name:"Alex Morgan", role:"Head of Risk, Meridian Capital", quote:"Cut our hedging costs by 34% in the first quarter. The AI recommendations are remarkably accurate." },
    { name:"Sakura Tanaka", role:"Quant Analyst, Apex Fund", quote:"Best-in-class analytics dashboard. The IV surface and Greeks monitoring saved us during the March volatility spike." },
    { name:"David Osei", role:"Portfolio Manager, BlueSky AM", quote:"The compliance and audit trail features made our regulator review seamless. Highly recommend." },
  ];

  const plans = [
    { name:"Starter", price:"$299", period:"/mo", features:["1 user","Portfolio monitoring","Basic risk analytics","Email alerts","5 years backtest"], cta:"Start Free Trial", highlight:false },
    { name:"Pro", price:"$999", period:"/mo", features:["10 users","All Starter features","AI hedge recommendations","Live WebSocket feeds","API access","Priority support"], cta:"Get Started", highlight:true },
    { name:"Enterprise", price:"Custom", period:"", features:["Unlimited users","Full platform access","Custom RL models","Dedicated infrastructure","SLA 99.9%","White-label"], cta:"Contact Sales", highlight:false },
  ];

  return (
    <div style={{ background: C.white, fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif", color: C.text }}>
      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, background:C.red, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:800, fontSize:16 }}>Δ</div>
            <span style={{ fontWeight:800, fontSize:18, color:C.text, letterSpacing:-0.5 }}>HedgeAI</span>
          </div>
          <div style={{ display:"flex", gap:32 }}>
            {["Features","How It Works","Pricing"].map(l=><a key={l} href="#" style={{ color:C.textSub, textDecoration:"none", fontSize:14, fontWeight:500, transition:"color 0.15s" }}
              onMouseEnter={e=>e.target.style.color=C.red} onMouseLeave={e=>e.target.style.color=C.textSub}>{l}</a>)}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="ghost" onClick={()=>onNavigate("signin")} size="sm">Log in</Btn>
            <Btn variant="primary" onClick={()=>onNavigate("signup")} size="sm">Get Started</Btn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", paddingTop:100, position:"relative", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"20%", right:"5%", width:360, height:360, background:`radial-gradient(circle, ${C.red}08, transparent 70%)`, borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ textAlign:"center", maxWidth:760, padding:"0 32px", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.redGhost, border:`1px solid ${C.red}33`, borderRadius:20, padding:"6px 16px", marginBottom:28 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:C.red, display:"inline-block" }} />
            <span style={{ fontSize:12, fontWeight:600, color:C.red, letterSpacing:0.5 }}>NOW IN PRODUCTION — PHASE 2 COMPLETE</span>
          </div>
          <h1 style={{ fontSize:"clamp(36px,5vw,68px)", fontWeight:900, lineHeight:1.08, letterSpacing:-2, marginBottom:20, color:C.text }}>
            AI-Powered Trading<br/><span style={{ color:C.red }}>Risk Intelligence</span>
          </h1>
          <p style={{ fontSize:18, color:C.textSub, lineHeight:1.7, marginBottom:40, maxWidth:540, margin:"0 auto 40px" }}>
            Reinforcement learning-driven hedging that cuts costs by 30–40%. Real-time risk analytics for institutional traders.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <Btn variant="primary" size="lg" onClick={()=>onNavigate("signup")}>🚀 Get Started Free</Btn>
            <Btn variant="outline" size="lg" onClick={()=>onNavigate("signin")}>Log In →</Btn>
          </div>
          <div style={{ marginTop:48, display:"flex", justifyContent:"center", gap:40, flexWrap:"wrap" }}>
            {[["$4.8B+","Assets Monitored"],["68%","Win Rate (RL Agent)"],["34%","Avg Cost Savings"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:800, color:C.red, letterSpacing:-1 }}>{v}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"100px 32px", background:C.offWhite }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <p style={{ color:C.red, fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>CAPABILITIES</p>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1 }}>Everything you need to manage risk</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:24 }}>
            {features.map(f=>(
              <Card key={f.title} style={{ textAlign:"center", padding:32 }}>
                <div style={{ fontSize:36, marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:C.textSub, lineHeight:1.7, margin:0 }}>{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"100px 32px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <p style={{ color:C.red, fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>PROCESS</p>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1 }}>Up and running in minutes</h2>
          </div>
          <div style={{ display:"flex", gap:0, position:"relative" }}>
            <div style={{ position:"absolute", top:24, left:"10%", right:"10%", height:2, background:`linear-gradient(to right, ${C.red}, ${C.red}44)`, zIndex:0 }} />
            {steps.map((s,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:C.red, color:C.white, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, margin:"0 auto 20px", boxShadow:C.shadowRed }}>{s.n}</div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:13, color:C.textSub, lineHeight:1.7, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:"100px 32px", background:C.offWhite }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <p style={{ color:C.red, fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>TESTIMONIALS</p>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1 }}>Trusted by leading firms</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:24 }}>
            {testimonials.map(t=>(
              <Card key={t.name} style={{ padding:32 }}>
                <div style={{ fontSize:24, color:C.red, marginBottom:16 }}>❝</div>
                <p style={{ fontSize:14, color:C.textSub, lineHeight:1.8, marginBottom:20, fontStyle:"italic" }}>{t.quote}</p>
                <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:C.red, color:C.white, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:15 }}>{t.name[0]}</div>
                  <div><div style={{ fontWeight:700, fontSize:13 }}>{t.name}</div><div style={{ fontSize:11, color:C.textMuted }}>{t.role}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:"100px 32px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <p style={{ color:C.red, fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>PRICING</p>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1 }}>Simple, transparent pricing</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:24, alignItems:"start" }}>
            {plans.map(p=>(
              <div key={p.name} style={{ background:p.highlight ? C.red : C.white, borderRadius:20,
                border:`1px solid ${p.highlight ? C.red : C.border}`, padding:32,
                boxShadow:p.highlight ? C.shadowRed : C.shadow, transform:p.highlight?"scale(1.03)":"scale(1)" }}>
                {p.highlight && <div style={{ color:"rgba(255,255,255,0.8)", fontSize:11, fontWeight:700, letterSpacing:1.5, marginBottom:12 }}>MOST POPULAR</div>}
                <div style={{ fontSize:22, fontWeight:800, color:p.highlight?C.white:C.text, marginBottom:6 }}>{p.name}</div>
                <div style={{ marginBottom:24 }}>
                  <span style={{ fontSize:38, fontWeight:900, color:p.highlight?C.white:C.red, letterSpacing:-2 }}>{p.price}</span>
                  <span style={{ color:p.highlight?"rgba(255,255,255,0.7)":C.textMuted, fontSize:13 }}>{p.period}</span>
                </div>
                <ul style={{ listStyle:"none", padding:0, margin:"0 0 28px", display:"flex", flexDirection:"column", gap:10 }}>
                  {p.features.map(f=>(
                    <li key={f} style={{ fontSize:13, color:p.highlight?"rgba(255,255,255,0.9)":C.textSub, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:p.highlight?"rgba(255,255,255,0.7)":C.red, fontWeight:700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={()=>onNavigate("signup")} style={{ width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${p.highlight?"rgba(255,255,255,0.5)":C.red}`,
                  background:p.highlight?"rgba(255,255,255,0.15)":C.red, color:p.highlight?C.white:C.white,
                  fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section style={{ padding:"80px 32px", background:C.red, textAlign:"center" }}>
        <h2 style={{ fontSize:36, fontWeight:800, color:C.white, letterSpacing:-1, marginBottom:16 }}>Ready to trade smarter?</h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:16, marginBottom:32 }}>Join 200+ firms managing risk with AI.</p>
        <Btn size="lg" style={{ background:C.white, color:C.red, border:"none" }} onClick={()=>onNavigate("signup")}>Start Free Trial</Btn>
      </section>
      <footer style={{ background:"#0D0D0D", padding:"32px", textAlign:"center" }}>
        <div style={{ color:"#666", fontSize:12 }}>© 2026 HedgeAI · All rights reserved · <a href="#" style={{ color:C.red, textDecoration:"none" }}>Privacy</a> · <a href="#" style={{ color:C.red, textDecoration:"none" }}>Terms</a></div>
      </footer>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGES
═══════════════════════════════════════════════════════════════ */
const AuthLayout = ({ children, title, subtitle, onNavigate, altText, altLink, altAction }) => (
  <div style={{ minHeight:"100vh", background:C.offWhite, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
    <div style={{ width:"100%", maxWidth:480 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:24, cursor:"pointer" }} onClick={()=>onNavigate("landing")}>
          <div style={{ width:42, height:42, background:C.red, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:900, fontSize:20 }}>Δ</div>
          <span style={{ fontWeight:900, fontSize:22, color:C.text, letterSpacing:-0.5 }}>HedgeAI</span>
        </div>
        <h1 style={{ fontSize:30, fontWeight:800, letterSpacing:-1, color:C.text, marginBottom:8 }}>{title}</h1>
        <p style={{ color:C.textSub, fontSize:15 }}>{subtitle}</p>
      </div>
      <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, padding:40, boxShadow:C.shadowMd }}>
        {children}
      </div>
      <p style={{ textAlign:"center", marginTop:20, color:C.textSub, fontSize:14 }}>
        {altText} <span onClick={()=>onNavigate(altAction)} style={{ color:C.red, fontWeight:700, cursor:"pointer" }}>{altLink}</span>
      </p>
    </div>
  </div>
);

const SignUpPage = ({ onNavigate }) => {
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"", role:"trader" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if(!form.name.trim()) e.name = "Name is required";
    if(!/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if(form.password.length < 8) e.password = "Password must be 8+ characters";
    if(form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const submit = async () => {
    const e = validate(); setErrors(e);
    if(Object.keys(e).length > 0) return;
    setLoading(true);
    
    try {
      // Call real backend API
      const response = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role.toUpperCase() // Convert to TRADER, ANALYST, etc.
      });
      
      console.log('✅ Registration successful:', response);
      // Navigate to dashboard after successful registration
      setTimeout(() => {
        setLoading(false);
        onNavigate(`dashboard_${form.role}`);
      }, 500);
    } catch (error) {
      setLoading(false);
      console.error('❌ Registration failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      setErrors({ general: errorMessage });
      alert(`Registration failed: ${errorMessage}`);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start managing risk intelligently today."
      onNavigate={onNavigate} altText="Already have an account?" altLink="Sign in →" altAction="signin">
      <Input label="Full Name" placeholder="Jane Smith" value={form.name} error={errors.name}
        onChange={e=>setForm({...form,name:e.target.value})} />
      <Input label="Work Email" type="email" placeholder="jane@company.com" value={form.email} error={errors.email}
        onChange={e=>setForm({...form,email:e.target.value})} />
      <Select label="Your Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
        options={[{value:"trader",label:"Trader"},{value:"analyst",label:"Analyst"},{value:"risk_manager",label:"Risk Manager"},{value:"admin",label:"Admin"}]} />
      <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} error={errors.password}
        onChange={e=>setForm({...form,password:e.target.value})} />
      <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm} error={errors.confirm}
        onChange={e=>setForm({...form,confirm:e.target.value})} />
      {errors.general && (
        <div style={{ padding:12, background:"#FFF0F0", color:C.red, borderRadius:8, fontSize:13, marginBottom:8, border:`1px solid ${C.red}44` }}>
          {errors.general}
        </div>
      )}
      <Btn variant="primary" style={{ width:"100%", marginTop:8 }} onClick={submit} disabled={loading}>
        {loading ? "Creating account..." : "Create Account →"}
      </Btn>
      <div style={{ marginTop:20, padding:14, background:C.lightGray, borderRadius:10, fontSize:12, color:C.textSub, textAlign:"center" }}>
        Quick demo: Choose a role and click Create Account
      </div>
    </AuthLayout>
  );
};

const SignInPage = ({ onNavigate }) => {
  const [form, setForm] = useState({ email:"", password:"", role:"trader" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Call real backend API
      const response = await authService.login(form.email, form.password);
      
      console.log('✅ Login successful:', response);
      // Navigate to dashboard for the user's actual role
      setTimeout(() => {
        setLoading(false);
        const userRole = response.user.role.toLowerCase();
        onNavigate(`dashboard_${userRole}`);
      }, 500);
    } catch (err) {
      setLoading(false);
      console.error('❌ Login failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      alert(`Login failed: ${errorMessage}`);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your HedgeAI dashboard."
      onNavigate={onNavigate} altText="No account yet?" altLink="Sign up →" altAction="signup">
      <Input label="Email" type="email" placeholder="jane@company.com" value={form.email}
        onChange={e=>setForm({...form,email:e.target.value})} />
      <Input label="Password" type="password" placeholder="Your password" value={form.password}
        onChange={e=>setForm({...form,password:e.target.value})} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, marginTop:-8 }}>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.textSub, cursor:"pointer" }}>
          <input type="checkbox" /> Remember me
        </label>
        <span onClick={()=>onNavigate("forgot_password")} style={{ color:C.red, fontSize:13, fontWeight:600, cursor:"pointer" }}>Forgot password?</span>
      </div>
      {error && (
        <div style={{ padding:12, background:"#FFF0F0", color:C.red, borderRadius:8, fontSize:13, marginBottom:16, border:`1px solid ${C.red}44` }}>
          {error}
        </div>
      )}
      <Btn variant="primary" style={{ width:"100%" }} onClick={submit} disabled={loading}>
        {loading ? "Signing in..." : "Sign In →"}
      </Btn>
    </AuthLayout>
  );
};

const ForgotPasswordPage = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      console.log('✅ Password reset email sent');
    } catch (err) {
      setLoading(false);
      console.error('❌ Forgot password failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send reset email';
      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset instructions have been sent."
        onNavigate={onNavigate} altText="Back to" altLink="Sign in →" altAction="signin">
        <div style={{ padding:20, background:C.lightGray, borderRadius:10, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
          <p style={{ fontSize:14, color:C.text, marginBottom:8 }}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <p style={{ fontSize:12, color:C.textMuted }}>
            Please check your inbox and follow the link to reset your password.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email to receive reset instructions."
      onNavigate={onNavigate} altText="Remember your password?" altLink="Sign in →" altAction="signin">
      <Input label="Email" type="email" placeholder="jane@company.com" value={email}
        onChange={e=>setEmail(e.target.value)} />
      {error && (
        <div style={{ padding:12, background:"#FFF0F0", color:C.red, borderRadius:8, fontSize:13, marginBottom:16, border:`1px solid ${C.red}44` }}>
          {error}
        </div>
      )}
      <Btn variant="primary" style={{ width:"100%" }} onClick={submit} disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link →"}
      </Btn>
    </AuthLayout>
  );
};

const ResetPasswordPage = ({ onNavigate, token }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      console.log('✅ Password reset successful');
      
      // Redirect to login after 2 seconds
      setTimeout(() => onNavigate("signin"), 2000);
    } catch (err) {
      setLoading(false);
      console.error('❌ Password reset failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to reset password';
      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password reset!" subtitle="Your password has been successfully reset."
        onNavigate={onNavigate} altText="" altLink="" altAction="">
        <div style={{ padding:20, background:C.lightGray, borderRadius:10, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <p style={{ fontSize:14, color:C.text, marginBottom:8 }}>
            Your password has been successfully reset.
          </p>
          <p style={{ fontSize:12, color:C.textMuted }}>
            Redirecting to login...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below."
      onNavigate={onNavigate} altText="Back to" altLink="Sign in →" altAction="signin">
      <Input label="New Password" type="password" placeholder="At least 8 characters" value={password}
        onChange={e=>setPassword(e.target.value)} />
      <Input label="Confirm Password" type="password" placeholder="Re-enter password" value={confirmPassword}
        onChange={e=>setConfirmPassword(e.target.value)} />
      {error && (
        <div style={{ padding:12, background:"#FFF0F0", color:C.red, borderRadius:8, fontSize:13, marginBottom:16, border:`1px solid ${C.red}44` }}>
          {error}
        </div>
      )}
      <Btn variant="primary" style={{ width:"100%" }} onClick={submit} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password →"}
      </Btn>
    </AuthLayout>
  );
};

const ChangePasswordSection = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      await authService.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      console.log('✅ Password changed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setLoading(false);
      console.error('❌ Change password failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to change password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:C.white, borderRadius:14, border:"1px solid #E2E8F0", padding:32, maxWidth:600, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
      <h3 style={{ color:"#1E293B", fontWeight:700, fontSize:16, marginBottom:24 }}>Change Password</h3>
      
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6, letterSpacing:0.3 }}>Current Password</label>
        <input 
          type="password" 
          value={form.currentPassword}
          onChange={e=>setForm({...form, currentPassword: e.target.value})}
          style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} 
        />
      </div>
      
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6, letterSpacing:0.3 }}>New Password</label>
        <input 
          type="password" 
          value={form.newPassword}
          onChange={e=>setForm({...form, newPassword: e.target.value})}
          placeholder="At least 8 characters"
          style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} 
        />
      </div>
      
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6, letterSpacing:0.3 }}>Confirm New Password</label>
        <input 
          type="password" 
          value={form.confirmPassword}
          onChange={e=>setForm({...form, confirmPassword: e.target.value})}
          placeholder="Re-enter new password"
          style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} 
        />
      </div>
      
      {error && (
        <div style={{ padding:12, background:"#FEE2E2", color:"#991B1B", borderRadius:8, fontSize:13, marginBottom:16, border:"1px solid #FCA5A5" }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding:12, background:"#D1FAE5", color:"#065F46", borderRadius:8, fontSize:13, marginBottom:16, border:"1px solid #6EE7B7" }}>
          ✅ Password changed successfully!
        </div>
      )}
      
      <Btn variant="primary" onClick={submit} disabled={loading}>
        {loading ? "Changing..." : "Change Password"}
      </Btn>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD SHELL
═══════════════════════════════════════════════════════════════ */
const Sidebar = ({ role, activePage, setActivePage, collapsed, setCollapsed }) => {
  const navItems = {
    trader: [
      { id:"overview", icon:"📊", label:"Overview" },
      { id:"portfolios", icon:"💼", label:"Portfolios" },
      { id:"positions", icon:"📋", label:"Positions" },
      { id:"trades", icon:"🔄", label:"Trade History" },
      { id:"ai", icon:"🤖", label:"AI Advisor" },
    ],
    analyst: [
      { id:"overview", icon:"📊", label:"Overview" },
      { id:"trends", icon:"📉", label:"Market Trends" },
      { id:"heatmap", icon:"🌡", label:"Risk Heatmap" },
      { id:"performance", icon:"🏆", label:"Performance" },
      { id:"reports", icon:"📋", label:"Reports" },
    ],
    risk_manager: [
      { id:"overview", icon:"📊", label:"Overview" },
      { id:"exposure", icon:"⚠️", label:"Exposure Table" },
      { id:"var", icon:"📉", label:"VaR Analysis" },
      { id:"alerts", icon:"🔔", label:"Alerts" },
      { id:"limits", icon:"🔒", label:"Risk Limits" },
    ],
  };
  const items = navItems[role] || navItems.trader;
  const roleLabel = { trader:"Trader", analyst:"Analyst", risk_manager:"Risk Manager" }[role] || role;

  return (
    <div style={{ width: collapsed ? 64 : 240, background:C.white, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0,
      transition:"width 0.25s ease", overflow:"hidden", flexShrink:0 }}>
      {/* Logo */}
      <div style={{ padding:"20px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, minHeight:68 }}>
        <div style={{ width:36, height:36, background:C.red, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:900, fontSize:16, flexShrink:0 }}>Δ</div>
        {!collapsed && <span style={{ fontWeight:800, fontSize:17, color:C.text, letterSpacing:-0.5, whiteSpace:"nowrap" }}>HedgeAI</span>}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ background:C.redGhost, borderRadius:8, padding:"6px 10px", textAlign:"center" }}>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, letterSpacing:1, marginBottom:2 }}>LOGGED IN AS</div>
            <div style={{ fontSize:12, color:C.red, fontWeight:700 }}>{roleLabel}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
        {items.map(item => {
          const active = activePage === item.id;
          const navButton = (
            <button key={item.id} onClick={()=>setActivePage(item.id)} style={{
              display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "flex-start", gap:12, padding:"11px 12px", borderRadius:10,
              border:"none", cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              background: active ? C.redGhost : "transparent",
              borderLeft: active ? `3px solid ${C.red}` : "3px solid transparent",
              position: "relative"
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.background = C.offWhite;
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
            onFocus={e => e.currentTarget.style.outline = `2px solid ${C.red}`}
            onBlur={e => e.currentTarget.style.outline = "none"}
            >
              <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize:13, fontWeight:600, color:active?C.red:C.textSub, whiteSpace:"nowrap" }}>{item.label}</span>}
            </button>
          );
          
          return collapsed ? (
            <TooltipWrapper key={item.id} content={item.label} position="right">
              {navButton}
            </TooltipWrapper>
          ) : navButton;
        })}
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding:"12px 8px", borderTop:`1px solid ${C.border}` }}>
        <TooltipWrapper content={collapsed ? "Expand sidebar" : "Collapse sidebar"} position="right">
          <button onClick={()=>setCollapsed(!collapsed)} style={{
            width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${C.border}`,
            background:C.lightGray, cursor:"pointer", fontSize:12, color:C.textSub, fontFamily:"inherit", fontWeight:600,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.border}
          onMouseLeave={e => e.currentTarget.style.background = C.lightGray}
          onFocus={e => e.currentTarget.style.outline = `2px solid ${C.red}`}
          onBlur={e => e.currentTarget.style.outline = "none"}
          >{collapsed ? "→" : "← Collapse"}</button>
        </TooltipWrapper>
      </div>
    </div>
  );
};

const TopBar = ({ role, onLogout, onNavigate }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const roleLabel = { trader:"Trader", analyst:"Analyst", risk_manager:"Risk Manager", admin:"Admin" }[role] || role;
  
  // Get current user from storage
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.name || "User";
  const userEmail = currentUser?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alertsData = await alertService.getAllAlerts({ limit: 10 });
        setAlerts(alertsData || []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setAlerts([]);
      }
    };

    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const notifCount = unreadAlerts.length;

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '🔴';
      case 'WARNING': return '🟡';
      case 'INFO': return '🔵';
      default: return '🟢';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? {...a, isRead: true} : a));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleCreateAlert = async (alertData) => {
    try {
      const newAlert = await alertService.createAlert(alertData);
      setAlerts(prev => [newAlert, ...prev]);
      setShowCreateAlert(false);
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ height:64, background:C.white, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", padding:"0 24px", gap:16, position:"sticky", top:0, zIndex:50, flexShrink:0 }}>
      {/* Market tickers */}
      <div style={{ display:"flex", gap:20, flex:1 }}>
        {[["SPY","485.20","+0.87%",true],["VIX","14.32","-2.10%",false],["QQQ","412.48","+1.12%",true]].map(([t,p,c,up])=>(
          <div key={t} style={{ display:"flex", gap:6, alignItems:"baseline" }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted }}>{t}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{p}</span>
            <span style={{ fontSize:11, fontWeight:600, color:up?C.success:C.red }}>{c}</span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* Status Indicators */}
        <StatusBar />
        
        {/* Notifications */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowNotif(!showNotif)} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${C.border}`, background:C.lightGray, cursor:"pointer", fontSize:16, position:"relative" }}>
            🔔
            {notifCount > 0 && <span style={{ position:"absolute", top:4, right:4, width:16, height:16, background:C.red, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:C.white, fontWeight:700 }}>{notifCount}</span>}
          </button>
          {showNotif && (
            <div style={{ position:"absolute", right:0, top:46, width:320, background:C.white, border:`1px solid ${C.border}`, borderRadius:14, boxShadow:C.shadowMd, zIndex:200, overflow:"hidden" }}>
              <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:13 }}>Notifications</span>
                <button onClick={()=>{setShowNotif(false);setShowCreateAlert(true);}} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.red}`, background:"transparent", color:C.red, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>+ New Alert</button>
              </div>
              {alerts.length === 0 ? (
                <div style={{ padding:20, textAlign:"center", fontSize:12, color:C.textMuted }}>
                  No notifications
                </div>
              ) : (
                alerts.slice(0,5).map(a=>(
                  <div 
                    key={a.id} 
                    onClick={() => handleMarkAsRead(a.id)}
                    style={{ 
                      padding:"12px 16px", 
                      borderBottom:`1px solid ${C.borderLight}`, 
                      display:"flex", 
                      gap:10,
                      cursor:"pointer",
                      background: a.isRead ? "transparent" : C.offWhite
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.lightGray}
                    onMouseLeave={e=>e.currentTarget.style.background=a.isRead?"transparent":C.offWhite}
                  >
                    <span style={{ fontSize:14 }}>{getSeverityIcon(a.severity)}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:C.text, marginBottom:2 }}>{a.message}</div>
                      <div style={{ fontSize:10, color:C.textMuted }}>{getTimeAgo(a.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowProfile(!showProfile)} style={{
            display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:10,
            border:`1px solid ${C.border}`, background:C.lightGray, cursor:"pointer",
          }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:C.red, color:C.white, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>{userInitial}</div>
            <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{userName}</span>
            <span style={{ fontSize:10, color:C.textMuted }}>▾</span>
          </button>
          {showProfile && (
            <div style={{ position:"absolute", right:0, top:46, width:200, background:C.white, border:`1px solid ${C.border}`, borderRadius:14, boxShadow:C.shadowMd, zIndex:200, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{userName}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{userEmail}</div>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{roleLabel}</div>
              </div>
              <button onClick={onLogout} style={{ width:"100%", padding:"10px 16px", textAlign:"left", border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:C.red, fontFamily:"inherit" }}>Sign Out</button>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && <CreateAlertModal onClose={()=>setShowCreateAlert(false)} onCreate={handleCreateAlert} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD CONTENT PANELS
═══════════════════════════════════════════════════════════════ */
const TraderOverview = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [portfoliosData, positionsData, tradesData, statsData] = await Promise.all([
          portfolioService.getAllPortfolios(),
          positionService.getAllPositions(),
          tradeService.getAllTrades({ limit: 10 }),
          analyticsService.getDashboardStats(),
        ]);
        
        setPortfolios(portfoliosData || []);
        setPositions(positionsData || []);
        setTrades(tradesData || []);
        setDashboardStats(statsData || null);
        
        // Select first portfolio by default
        if (portfoliosData && portfoliosData.length > 0) {
          setSelectedPortfolio(portfoliosData[0].id);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch portfolio performance when portfolio or period changes
  useEffect(() => {
    const fetchPerformance = async () => {
      if (!selectedPortfolio) return;
      try {
        const data = await analyticsService.getPortfolioPerformance(selectedPortfolio, selectedPeriod);
        setPerformanceData(data);
      } catch (err) {
        console.error('Error fetching performance data:', err);
      }
    };
    fetchPerformance();
  }, [selectedPortfolio, selectedPeriod]);

  const handleCreatePortfolio = async (portfolioData) => {
    try {
      await portfolioService.createPortfolio(portfolioData);
      // Refresh portfolios
      const portfoliosData = await portfolioService.getAllPortfolios();
      setPortfolios(portfoliosData || []);
      setShowCreatePortfolio(false);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      alert('Failed to create portfolio: ' + (err.response?.data?.message || err.message));
    }
  };

  // Use analytics stats if available, otherwise calculate from real data
  const totalPortfolioValue = parseFloat(dashboardStats?.totalValue) || portfolios.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);
  const totalPnL = parseFloat(dashboardStats?.totalPnL) || portfolios.reduce((sum, p) => sum + (parseFloat(p.pnl) || 0), 0);
  const avgRiskScore = parseInt(dashboardStats?.avgRiskScore) || (portfolios.length > 0 
    ? Math.round(portfolios.reduce((sum, p) => sum + (parseInt(p.riskScore) || 0), 0) / portfolios.length)
    : 0);
  const openPositionsCount = dashboardStats?.openPositions || positions.filter(p => !p.isClosed).length;
  const totalTrades = dashboardStats?.totalTrades || trades.length;

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:400 }}>
        <div style={{ fontSize:14, color:C.textMuted }}>Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:400 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:14, color:C.red, marginBottom:8 }}>Failed to load dashboard</div>
          <div style={{ fontSize:12, color:C.textMuted }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <MetricCard 
          label="Portfolio Value" 
          value={<AnimCounter end={totalPortfolioValue} prefix="$" />} 
          change="2.4%" 
          changeDir="up" 
          icon="💰" 
          accent 
        />
        <MetricCard 
          label="Today's P&L" 
          value={totalPnL >= 0 ? <AnimCounter end={totalPnL} prefix="+$" /> : <AnimCounter end={Math.abs(totalPnL)} prefix="-$" />}
          change="1.2%" 
          changeDir={totalPnL >= 0 ? "up" : "down"} 
          icon="📈" 
        />
        <MetricCard 
          label="Risk Score" 
          value={`${avgRiskScore}/100`} 
          change="3pts" 
          changeDir="down" 
          icon="🛡" 
        />
        <MetricCard 
          label="Open Positions" 
          value={String(openPositionsCount)} 
          icon="🔄" 
        />
      </div>

      {/* Portfolio Selection */}
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, letterSpacing:0.5 }}>SELECT PORTFOLIO</label>
          <select value={selectedPortfolio || ''} onChange={e=>setSelectedPortfolio(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.text, fontSize:13, fontFamily:"inherit", cursor:"pointer" }}>
            <option value="">All Portfolios</option>
            {portfolios.map(p=>(
              <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.totalValue || 0).toLocaleString()})</option>
            ))}
          </select>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end" }}>
          <Btn variant="primary" size="sm" onClick={()=>setShowCreatePortfolio(true)}>+ Create Portfolio</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>Portfolio P&L — {selectedPeriod}</h3>
            <div style={{ display:"flex", gap:6 }}>
              {["1D","7D","30D","3M"].map(t=>(
                <button key={t} onClick={()=>setSelectedPeriod(t)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:t===selectedPeriod?C.red:"transparent", color:t===selectedPeriod?C.white:C.textSub, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceData?.chartData || pnlData}>
              <defs><linearGradient id="pnlGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.15}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="day" tick={{fontSize:9,fill:C.textMuted}} interval={4}/>
              <YAxis tick={{fontSize:9,fill:C.textMuted}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CustomChartTooltip formatter={v => `$${v.toLocaleString()}`} />} />
              <Area type="monotone" dataKey="pnl" stroke={C.red} strokeWidth={2} fill="url(#pnlGrd)"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Risk Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {riskData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {riskData.map(d=>(
              <div key={d.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:d.color }}/>
                  <span style={{ fontSize:12, color:C.textSub }}>{d.name}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>Recent Trades</h3>
          <Btn variant="ghost" size="sm">View All</Btn>
        </div>
        {trades.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:C.textMuted, fontSize:13 }}>
            No trades yet. Create your first trade to get started.
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["ID","Symbol","Side","Qty","Price","P&L","Status"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.textMuted, fontWeight:600, fontSize:11, letterSpacing:0.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {trades.slice(0, 5).map(t=>(
                <tr key={t.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:11, color:C.textSub }}>{t.id.substring(0,8)}</td>
                  <td style={{ padding:"11px 12px", fontWeight:700 }}>{t.symbol}</td>
                  <td style={{ padding:"11px 12px" }}><Badge variant={t.side==="BUY"?"green":"red"}>{t.side}</Badge></td>
                  <td style={{ padding:"11px 12px", color:C.textSub }}>{t.quantity}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>${parseFloat(t.price || 0).toFixed(2)}</td>
                  <td style={{ padding:"11px 12px", fontWeight:700, color:parseFloat(t.pnl || 0) >= 0?C.success:C.red }}>
                    {parseFloat(t.pnl || 0) >= 0 ? '+' : ''}${parseFloat(t.pnl || 0).toFixed(2)}
                  </td>
                  <td style={{ padding:"11px 12px" }}>
                    <Badge variant={t.status==="EXECUTED"?"green":t.status==="PENDING"?"blue":t.status==="CANCELLED"?"default":"red"}>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && <CreatePortfolioModal onClose={()=>setShowCreatePortfolio(false)} onCreate={handleCreatePortfolio} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CREATE PORTFOLIO MODAL
═══════════════════════════════════════════════════════════════ */
const CreatePortfolioModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({ name: '', description: '', strategy: 'DELTA_NEUTRAL' });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Please enter a portfolio name');
      return;
    }
    setLoading(true);
    try {
      await onCreate(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div 
      style={{ 
        position:"fixed", 
        inset:0, 
        background:"rgba(0,0,0,0.5)", 
        backdropFilter: "blur(4px)",
        display:"flex", 
        alignItems:"center", 
        justifyContent:"center", 
        zIndex:1000,
        animation: mounted ? "fadeIn 0.2s ease-out" : "none",
        opacity: mounted ? 1 : 0
      }} 
      onClick={handleClose}
    >
      <div 
        onClick={e=>e.stopPropagation()} 
        style={{ 
          background:C.white, 
          borderRadius:16, 
          padding:32, 
          width:480, 
          maxWidth: "90vw",
          boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
          animation: mounted ? "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          transform: mounted ? "scale(1)" : "scale(0.9)"
        }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:-0.5, margin:0 }}>Create New Portfolio</h2>
          <button 
            onClick={handleClose} 
            style={{ 
              width:32, 
              height:32, 
              borderRadius:8, 
              border:`1px solid ${C.border}`, 
              background:"transparent", 
              color:C.textMuted, 
              cursor:"pointer", 
              fontSize:16,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => {
              e.target.style.background = C.lightGray;
              e.target.style.color = C.text;
            }}
            onMouseLeave={e => {
              e.target.style.background = "transparent";
              e.target.style.color = C.textMuted;
            }}
          >✕</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Portfolio Name *</label>
          <input 
            value={formData.name} 
            onChange={e=>setFormData({...formData,name:e.target.value})} 
            placeholder="My Hedging Portfolio" 
            autoFocus
            style={{ 
              width:"100%", 
              padding:"10px 14px", 
              borderRadius:8, 
              border:`1px solid ${C.border}`, 
              fontSize:13, 
              fontFamily:"inherit", 
              outline:"none", 
              boxSizing:"border-box",
              transition: "all 0.2s ease"
            }}
            onFocus={e => {
              e.target.style.borderColor = C.red;
              e.target.style.boxShadow = "0 0 0 3px rgba(225,6,0,0.08)";
            }}
            onBlur={e => {
              e.target.style.borderColor = C.border;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Description</label>
          <textarea 
            value={formData.description} 
            onChange={e=>setFormData({...formData,description:e.target.value})} 
            placeholder="Optional description" 
            rows={3} 
            style={{ 
              width:"100%", 
              padding:"10px 14px", 
              borderRadius:8, 
              border:`1px solid ${C.border}`, 
              fontSize:13, 
              fontFamily:"inherit", 
              outline:"none", 
              resize:"vertical", 
              boxSizing:"border-box",
              transition: "all 0.2s ease"
            }}
            onFocus={e => {
              e.target.style.borderColor = C.red;
              e.target.style.boxShadow = "0 0 0 3px rgba(225,6,0,0.08)";
            }}
            onBlur={e => {
              e.target.style.borderColor = C.border;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Strategy</label>
          <select 
            value={formData.strategy} 
            onChange={e=>setFormData({...formData,strategy:e.target.value})} 
            style={{ 
              width:"100%", 
              padding:"10px 14px", 
              borderRadius:8, 
              border:`1px solid ${C.border}`, 
              fontSize:13, 
              fontFamily:"inherit", 
              cursor:"pointer", 
              boxSizing:"border-box",
              transition: "all 0.2s ease"
            }}
            onFocus={e => {
              e.target.style.borderColor = C.red;
              e.target.style.boxShadow = "0 0 0 3px rgba(225,6,0,0.08)";
            }}
            onBlur={e => {
              e.target.style.borderColor = C.border;
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="DELTA_NEUTRAL">Delta Neutral</option>
            <option value="GAMMA_SCALPING">Gamma Scalping</option>
            <option value="VEGA_HEDGING">Vega Hedging</option>
            <option value="THETA_DECAY">Theta Decay</option>
            <option value="CUSTOM">Custom Strategy</option>
          </select>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="primary" style={{ flex:1 }} onClick={handleSubmit} loading={loading}>
            Create Portfolio
          </Btn>
          <Btn variant="ghost" onClick={handleClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CREATE ALERT MODAL
═══════════════════════════════════════════════════════════════ */
const CreateAlertModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({ 
    message: '', 
    severity: 'MEDIUM',
    alertType: 'PRICE',
    threshold: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.message) {
      alert('Please enter an alert message');
      return;
    }
    setLoading(true);
    try {
      await onCreate(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:16, padding:32, width:480, boxShadow:C.shadowMd }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:-0.5, margin:0 }}>Create New Alert</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Alert Message *</label>
          <input value={formData.message} onChange={e=>setFormData({...formData,message:e.target.value})} placeholder="Enter alert description..." style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Alert Type</label>
          <select value={formData.alertType} onChange={e=>setFormData({...formData,alertType:e.target.value})} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
            <option value="PRICE">Price Alert</option>
            <option value="VOLATILITY">Volatility Alert</option>
            <option value="DELTA">Delta Alert</option>
            <option value="GAMMA">Gamma Alert</option>
            <option value="POSITION">Position Alert</option>
            <option value="RISK">Risk Alert</option>
            <option value="CUSTOM">Custom Alert</option>
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Severity</label>
          <select value={formData.severity} onChange={e=>setFormData({...formData,severity:e.target.value})} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
            <option value="LOW">Low - Informational</option>
            <option value="MEDIUM">Medium - Warning</option>
            <option value="HIGH">High - Critical</option>
          </select>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Threshold (Optional)</label>
          <input value={formData.threshold} onChange={e=>setFormData({...formData,threshold:e.target.value})} placeholder="e.g., 100, 15%, etc." type="text" style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="primary" style={{ flex:1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Alert'}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CREATE TRADE MODAL
═══════════════════════════════════════════════════════════════ */
const CreateTradeModal = ({ onClose, onCreate, portfolios }) => {
  const [formData, setFormData] = useState({ 
    portfolioId: '', 
    symbol: '',
    side: 'BUY',
    quantity: '',
    price: '',
    commission: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.portfolioId || !formData.symbol || !formData.quantity || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }
    
    const tradeData = {
      portfolioId: formData.portfolioId,
      symbol: formData.symbol.toUpperCase(),
      side: formData.side,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      ...(formData.commission && { commission: parseFloat(formData.commission) })
    };
    
    setLoading(true);
    try {
      await onCreate(tradeData);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = formData.quantity && formData.price 
    ? (parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)
    : '0.00';

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:16, padding:32, width:520, boxShadow:C.shadowMd }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:-0.5, margin:0 }}>Execute New Trade</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Portfolio *</label>
            <select value={formData.portfolioId} onChange={e=>setFormData({...formData,portfolioId:e.target.value})} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
              <option value="">Select portfolio...</option>
              {portfolios.map(p=>(
                <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.totalValue || 0).toLocaleString()})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Symbol *</label>
            <input value={formData.symbol} onChange={e=>setFormData({...formData,symbol:e.target.value})} placeholder="AAPL" style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", textTransform:"uppercase", boxSizing:"border-box" }} />
          </div>
          
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Side *</label>
            <select value={formData.side} onChange={e=>setFormData({...formData,side:e.target.value})} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Quantity *</label>
            <input type="number" value={formData.quantity} onChange={e=>setFormData({...formData,quantity:e.target.value})} placeholder="100" min="1" step="1" style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
          
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Price *</label>
            <input type="number" value={formData.price} onChange={e=>setFormData({...formData,price:e.target.value})} placeholder="150.00" min="0.01" step="0.01" style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
          
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Commission (Optional)</label>
            <input type="number" value={formData.commission} onChange={e=>setFormData({...formData,commission:e.target.value})} placeholder="0.00" min="0" step="0.01" style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>
        
        <div style={{ background:C.offWhite, borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.textMuted }}>Total Value:</span>
            <span style={{ fontSize:14, fontWeight:700, color:C.text }}>${totalValue}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:C.textMuted }}>Action:</span>
            <span style={{ fontSize:13, fontWeight:700, color:formData.side === 'BUY' ? C.success : C.red }}>
              {formData.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'} {formData.quantity || 0} {formData.symbol || 'shares'} @ ${formData.price || '0.00'}
            </span>
          </div>
        </div>
        
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="primary" style={{ flex:1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Executing...' : 'Execute Trade'}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

const AnalystOverview = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getPerformanceMetrics('30D');
        setPerformanceMetrics(data);
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>Loading analytics...</div>;

  const sharpeRatio = Number(performanceMetrics?.sharpeRatio) || 1.72;
  const volatility = Number(performanceMetrics?.volatility) || 18.4;
  const maxDrawdown = Number(performanceMetrics?.maxDrawdown) || -7.4;
  const winRate = Number(performanceMetrics?.winRate) || 68.2;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <MetricCard label="Sharpe Ratio" value={sharpeRatio.toFixed(2)} change="0.14" changeDir="up" icon="📐" accent />
        <MetricCard label="30d Volatility" value={`${volatility.toFixed(1)}%`} change="1.2%" changeDir="down" icon="🌊" />
        <MetricCard label="Max Drawdown" value={`${maxDrawdown.toFixed(1)}%`} icon="📉" />
        <MetricCard label="Win Rate" value={`${winRate.toFixed(1)}%`} change="3.1%" changeDir="up" icon="🎯" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Market Volatility (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volData}>
              <XAxis dataKey="hour" tick={{fontSize:9,fill:C.textMuted}} interval={5}/>
              <YAxis tick={{fontSize:9,fill:C.textMuted}} tickFormatter={v=>`${v}%`}/>
              <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[`${v.toFixed(1)}%`,"Vol"]}/>
              <Line type="monotone" dataKey="vol" stroke={C.red} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Risk Heatmap</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:3 }}>
            {heatData.map((d,i)=>(
              <div key={i} style={{ aspectRatio:"1", borderRadius:4, background:`rgba(225,6,0,${d.val*0.9+0.05})`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"rgba(255,255,255,0.6)" }}>
                {(d.val*100).toFixed(0)}
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, color:C.textMuted }}>Low Risk</span>
            <div style={{ width:80, height:6, borderRadius:3, background:`linear-gradient(to right, rgba(225,6,0,0.1), ${C.red})` }}/>
            <span style={{ fontSize:10, color:C.textMuted }}>High Risk</span>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Baseline Strategy Comparison (Sharpe Ratio)</h3>
        {[["RL Agent (PPO_v3)",sharpeRatio,true],["RL Agent (SAC_v2)",1.68,true],["Δ-Γ-V Hedge",1.21,false],["Delta-Gamma",1.08,false],["Delta Only",0.84,false],["Min-Variance",0.79,false]].map(([l,v,rl])=>(
          <div key={l} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:12, color:rl?C.text:C.textSub, fontWeight:rl?700:500 }}>{l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:rl?C.red:C.textMuted }}>{v}</span>
            </div>
            <div style={{ background:C.lightGray, borderRadius:4, height:7, overflow:"hidden" }}>
              <div style={{ width:`${(v/2)*100}%`, height:"100%", background:rl?C.red:C.midGray, borderRadius:4, transition:"width 0.5s" }}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

const RiskManagerOverview = ({ onNavigate }) => {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getRiskMetrics();
        setRiskMetrics(data);
        
        // Fetch alerts
        try {
          const alertsData = await alertService.getAllAlerts();
          setAlerts(alertsData || []);
        } catch (alertError) {
          console.error('Failed to fetch alerts:', alertError);
          // Use mock alerts if fetch fails
          setAlerts([
            { id: 1, type: "error", msg: "Delta exposure exceeds threshold by 15%", time: "5 min ago" },
            { id: 2, type: "warning", msg: "High gamma concentration in AAPL", time: "12 min ago" },
            { id: 3, type: "warning", msg: "VaR utilization at 87%", time: "1 hour ago" },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch risk metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRiskData();
  }, []);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>Loading risk metrics...</div>;

  const var95 = riskMetrics?.var95 || 42100;
  const totalExposure = riskMetrics?.totalExposure || 4820000;
  const limitUtilization = riskMetrics?.limitUtilization || 78;
  const riskScore = riskMetrics?.riskScore || 74;

  const handleDismissAlert = async (alertId) => {
    try {
      await alertService.dismissAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      // Just remove from UI even if API fails
      setAlerts(alerts.filter(a => a.id !== alertId));
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ background:C.red, borderRadius:14, padding:"14px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <span style={{ fontSize:20 }}>⚠️</span>
        <div>
          <div style={{ color:C.white, fontWeight:700, fontSize:14 }}>Delta Exposure Limit Breach Detected</div>
          <div style={{ color:"rgba(255,255,255,0.75)", fontSize:12 }}>Portfolio delta exceeds 15% threshold — immediate action recommended</div>
        </div>
        <Btn onClick={() => onNavigate && onNavigate('limits')} style={{ marginLeft:"auto", background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.4)", color:C.white }} size="sm">Review Now</Btn>
      </div>

      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <MetricCard label="95% VaR" value={`$${(var95/1000).toFixed(1)}K`} change="8.2%" changeDir="up" icon="📊" accent />
        <MetricCard label="Total Exposure" value={`$${(totalExposure/1000000).toFixed(2)}M`} change="$120K" changeDir="up" icon="💼" />
        <MetricCard label="Limit Utilization" value={`${limitUtilization}%`} change="5%" changeDir="up" icon="🔒" />
        <MetricCard label="Risk Score" value={`${riskScore}/100`} icon="🛡" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:20 }}>
        <Card>
          <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>VaR Analysis (12 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={varData}>
              <XAxis dataKey="m" tick={{fontSize:9,fill:C.textMuted}}/>
              <YAxis tick={{fontSize:9,fill:C.textMuted}} tickFormatter={v=>`$${Math.abs(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[`$${Math.abs(v).toLocaleString()}`,""]}/>
              <Bar dataKey="var95" fill={`${C.red}CC`} radius={[4,4,0,0]} name="95% VaR"/>
              <Bar dataKey="var99" fill={`${C.red}55`} radius={[4,4,0,0]} name="99% VaR"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Limit Utilization</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["Position Size",78,"warning"],["Delta Exposure",99,"danger"],["VaR Budget",54,"ok"],["Gamma Limit",62,"ok"],["Vega Exposure",87,"warning"]].map(([l,v,s])=>(
              <div key={l}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:C.textSub }}>{l}</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{v}%</span>
                    <Badge variant={s==="danger"?"red":s==="warning"?"yellow":"green"}>{s==="ok"?"OK":s.toUpperCase()}</Badge>
                  </div>
                </div>
                <div style={{ background:C.lightGray, borderRadius:4, height:7 }}>
                  <div style={{ width:`${v}%`, height:"100%", background:s==="danger"?C.red:s==="warning"?"#D97706":C.success, borderRadius:4, transition:"width 0.5s" }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Active Alerts</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alerts.map(a=>(
            <div key={a.id} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:14, borderRadius:10, background:a.type==="error"?"#FFF0F0":a.type==="warning"?C.warningBg:a.type==="success"?C.successBg:C.infoBg }}>
              <span style={{ fontSize:16 }}>{a.type==="error"?"🔴":a.type==="warning"?"🟡":a.type==="success"?"✅":"ℹ️"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{a.msg}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{a.time}</div>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => handleDismissAlert(a.id)}>Dismiss</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIOS PAGE
═══════════════════════════════════════════════════════════════ */
const PortfoliosPage = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getAllPortfolios();
      setPortfolios(data || []);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (portfolioData) => {
    try {
      await portfolioService.createPortfolio(portfolioData);
      await fetchPortfolios();
      setShowCreatePortfolio(false);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      alert('Failed to create portfolio: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;
    try {
      await portfolioService.deletePortfolio(portfolioId);
      await fetchPortfolios();
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      alert('Failed to delete portfolio: ' + (err.response?.data?.message || err.message));
    }
  };

  const totalValue = portfolios.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);
  const totalPnL = portfolios.reduce((sum, p) => sum + (parseFloat(p.pnl) || 0), 0);
  const avgRiskScore = portfolios.length > 0 
    ? portfolios.reduce((sum, p) => sum + (parseInt(p.riskScore) || 0), 0) / portfolios.length
    : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL PORTFOLIOS</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>{portfolios.length}</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL VALUE</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>${totalValue.toLocaleString()}</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL P&L</div>
          <div style={{ fontSize:28, fontWeight:800, color:totalPnL >= 0 ? C.success : C.red }}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>AVG RISK SCORE</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>{avgRiskScore.toFixed(0)}/100</div>
        </Card>
      </div>

      {/* Portfolios Grid */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ fontSize:18, fontWeight:800, margin:0 }}>Your Portfolios</h3>
        <Btn variant="primary" size="sm" onClick={()=>setShowCreatePortfolio(true)}>+ Create Portfolio</Btn>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:"center", color:C.textMuted }}>Loading portfolios...</div>
      ) : portfolios.length === 0 ? (
        <Card style={{ padding:60, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>💼</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No Portfolios Yet</div>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>Create your first portfolio to start tracking your derivatives positions</div>
          <Btn variant="primary" onClick={()=>setShowCreatePortfolio(true)}>+ Create Portfolio</Btn>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:16 }}>
          {portfolios.map(portfolio => (
            <Card key={portfolio.id} style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start" }}>
                <div>
                  <h4 style={{ fontSize:16, fontWeight:800, color:C.text, margin:"0 0 4px" }}>{portfolio.name}</h4>
                  <div style={{ fontSize:11, color:C.textMuted }}>{portfolio.strategy || 'Custom Strategy'}</div>
                </div>
                <Badge variant={portfolio.riskScore > 70 ? "red" : portfolio.riskScore > 40 ? "yellow" : "green"}>
                  Risk: {portfolio.riskScore || 0}
                </Badge>
              </div>
              
              {portfolio.description && (
                <div style={{ fontSize:12, color:C.textSub, lineHeight:1.5 }}>{portfolio.description}</div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>VALUE</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.text }}>${parseFloat(portfolio.totalValue || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>P&L</div>
                  <div style={{ fontSize:18, fontWeight:800, color:parseFloat(portfolio.pnl || 0) >= 0 ? C.success : C.red }}>
                    {parseFloat(portfolio.pnl || 0) >= 0 ? '+' : ''}${parseFloat(portfolio.pnl || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize:11, color:C.textMuted }}>
                Created {portfolio.createdAt ? new Date(portfolio.createdAt).toLocaleDateString() : 'N/A'}
              </div>

              <div style={{ display:"flex", gap:8, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                <Btn variant="ghost" size="sm" style={{ flex:1 }}>View Details</Btn>
                <button onClick={()=>handleDeletePortfolio(portfolio.id)} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.red}44`, background:"transparent", color:C.red, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && <CreatePortfolioModal onClose={()=>setShowCreatePortfolio(false)} onCreate={handleCreatePortfolio} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   POSITIONS PAGE
═══════════════════════════════════════════════════════════════ */
const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewPosition, setShowNewPosition] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [positionsData, portfoliosData] = await Promise.all([
          positionService.getAllPositions(),
          portfolioService.getAllPortfolios(),
        ]);
        setPositions(positionsData || []);
        setPortfolios(portfoliosData || []);
      } catch (err) {
        console.error('Error fetching positions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleCreatePosition = async (positionData) => {
    try {
      await positionService.createPosition(positionData);
      // Reload positions
      const positionsData = await positionService.getAllPositions();
      setPositions(positionsData || []);
      setShowNewPosition(false);
    } catch (err) {
      console.error("Failed to create position:", err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const filteredPositions = selectedPortfolio 
    ? positions.filter(p => p.portfolioId === selectedPortfolio)
    : positions;

  const openPositions = filteredPositions.filter(p => !p.isClosed);
  const closedPositions = filteredPositions.filter(p => p.isClosed);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Filters */}
      <Card>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, letterSpacing:0.5 }}>FILTER BY PORTFOLIO</label>
            <select value={selectedPortfolio} onChange={e=>setSelectedPortfolio(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, fontSize:13, fontFamily:"inherit", cursor:"pointer" }}>
              <option value="">All Portfolios</option>
              {portfolios.map(p=>(
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <Btn variant="primary" size="sm" onClick={() => {setShowNewPosition(true)}}>+ New Position</Btn>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>OPEN POSITIONS</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>{openPositions.length}</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL DELTA</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>
            {openPositions.reduce((sum, p) => sum + (parseFloat(p.delta) || 0), 0).toFixed(2)}
          </div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL GAMMA</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>
            {openPositions.reduce((sum, p) => sum + (parseFloat(p.gamma) || 0), 0).toFixed(3)}
          </div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL VEGA</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>
            {openPositions.reduce((sum, p) => sum + (parseFloat(p.vega) || 0), 0).toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 16px" }}>Open Positions</h3>
        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>Loading positions...</div>
        ) : openPositions.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>No open positions</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Symbol","Type","Quantity","Entry Price","Current Price","P&L","Delta","Gamma","Vega","Theta","Actions"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.textMuted, fontWeight:600, fontSize:11, letterSpacing:0.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {openPositions.map(pos=>(
                <tr key={pos.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"11px 12px", fontWeight:700 }}>{pos.symbol}</td>
                  <td style={{ padding:"11px 12px" }}><Badge variant={pos.type==="CALL"?"green":"red"}>{pos.type}</Badge></td>
                  <td style={{ padding:"11px 12px" }}>{pos.quantity}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>${parseFloat(pos.entryPrice || 0).toFixed(2)}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>${parseFloat(pos.currentPrice || 0).toFixed(2)}</td>
                  <td style={{ padding:"11px 12px", fontWeight:700, color:parseFloat(pos.pnl || 0) >= 0?C.success:C.red }}>
                    {parseFloat(pos.pnl || 0) >= 0 ? '+' : ''}${parseFloat(pos.pnl || 0).toFixed(2)}
                  </td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.textSub }}>{parseFloat(pos.delta || 0).toFixed(3)}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.textSub }}>{parseFloat(pos.gamma || 0).toFixed(4)}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.textSub }}>{parseFloat(pos.vega || 0).toFixed(3)}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.textSub }}>{parseFloat(pos.theta || 0).toFixed(3)}</td>
                  <td style={{ padding:"11px 12px" }}>
                    <Btn variant="ghost" size="sm">Close</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      
      {/* New Position Modal */}
      {showNewPosition && (
        <NewPositionModal 
          onClose={() => setShowNewPosition(false)} 
          onCreate={handleCreatePosition}
          portfolios={portfolios}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TRADE HISTORY PAGE
═══════════════════════════════════════════════════════════════ */
const TradeHistoryPage = () => {
  const [trades, setTrades] = useState([]);
  const [filters, setFilters] = useState({ symbol: '', side: '', status: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const params = {
          limit: 100,
          ...(filters.symbol && { symbol: filters.symbol }),
          ...(filters.side && { side: filters.side }),
          ...(filters.status && { status: filters.status }),
        };
        const tradesData = await tradeService.getAllTrades(params);
        setTrades(tradesData || []);
      } catch (err) {
        console.error('Error fetching trades:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [filters]);

  const filteredTrades = trades.filter(t => {
    if (filters.dateFrom && new Date(t.executedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(t.executedAt) > new Date(filters.dateTo)) return false;
    return true;
  });

  const paginatedTrades = filteredTrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  const totalPnL = filteredTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
  const winningTrades = filteredTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length;
  const losingTrades = filteredTrades.filter(t => (parseFloat(t.pnl) || 0) < 0).length;
  const winRate = filteredTrades.length > 0 ? ((winningTrades / filteredTrades.length) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL TRADES</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>{filteredTrades.length}</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>TOTAL P&L</div>
          <div style={{ fontSize:28, fontWeight:800, color:totalPnL >= 0 ? C.success : C.red }}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>WIN RATE</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.text }}>{winRate}%</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>WIN/LOSS</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{winningTrades}/{losingTrades}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6 }}>SYMBOL</label>
            <input value={filters.symbol} onChange={e=>setFilters({...filters,symbol:e.target.value})} placeholder="AAPL" style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6 }}>SIDE</label>
            <select value={filters.side} onChange={e=>setFilters({...filters,side:e.target.value})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
              <option value="">All</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6 }}>STATUS</label>
            <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }}>
              <option value="">All</option>
              <option value="EXECUTED">Executed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6 }}>FROM DATE</label>
            <input type="date" value={filters.dateFrom} onChange={e=>setFilters({...filters,dateFrom:e.target.value})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6 }}>TO DATE</label>
            <input type="date" value={filters.dateTo} onChange={e=>setFilters({...filters,dateTo:e.target.value})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>
        <div style={{ marginTop:12, display:"flex", gap:8 }}>
          <Btn variant="ghost" size="sm" onClick={()=>setFilters({ symbol: '', side: '', status: '', dateFrom: '', dateTo: '' })}>Clear Filters</Btn>
          <Btn variant="ghost" size="sm">📥 Export CSV</Btn>
        </div>
      </Card>

      {/* Trades Table */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>Trade History</h3>
          <div style={{ fontSize:12, color:C.textMuted }}>
            Showing {paginatedTrades.length} of {filteredTrades.length} trades
          </div>
        </div>
        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>Loading trades...</div>
        ) : paginatedTrades.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>No trades found</div>
        ) : (
          <>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Date","Symbol","Side","Quantity","Price","Total","P&L","Status"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.textMuted, fontWeight:600, fontSize:11, letterSpacing:0.5 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {paginatedTrades.map(t=>(
                  <tr key={t.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 12px", fontSize:12, color:C.textSub }}>
                      {t.executedAt ? new Date(t.executedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding:"11px 12px", fontWeight:700 }}>{t.symbol}</td>
                    <td style={{ padding:"11px 12px" }}><Badge variant={t.side==="BUY"?"green":"red"}>{t.side}</Badge></td>
                    <td style={{ padding:"11px 12px" }}>{t.quantity}</td>
                    <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>${parseFloat(t.price || 0).toFixed(2)}</td>
                    <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>${(parseFloat(t.price || 0) * t.quantity).toFixed(2)}</td>
                    <td style={{ padding:"11px 12px", fontWeight:700, color:parseFloat(t.pnl || 0) >= 0?C.success:C.red }}>
                      {parseFloat(t.pnl || 0) >= 0 ? '+' : ''}${parseFloat(t.pnl || 0).toFixed(2)}
                    </td>
                    <td style={{ padding:"11px 12px" }}>
                      <Badge variant={t.status==="EXECUTED"?"green":t.status==="PENDING"?"blue":"default"}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div style={{ marginTop:16, display:"flex", justifyContent:"center", gap:8 }}>
              <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:C.white, color:C.text, fontSize:12, cursor:currentPage===1?"not-allowed":"pointer", fontFamily:"inherit" }}>Previous</button>
              <span style={{ padding:"6px 12px", fontSize:12, color:C.textSub }}>Page {currentPage} of {totalPages}</span>
              <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:C.white, color:C.text, fontSize:12, cursor:currentPage===totalPages?"not-allowed":"pointer", fontFamily:"inherit" }}>Next</button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD WRAPPER
═══════════════════════════════════════════════════════════════ */
const Dashboard = ({ role, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [showCreateTrade, setShowCreateTrade] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  
  const handleExportData = () => {
    // Simple export logic
    const data = {
      timestamp: new Date().toISOString(),
      role: role,
      page: activePage,
      exportedBy: authService.getCurrentUser()?.email || 'Unknown'
    };
    
    const csvData = `Export Report\nTimestamp,${data.timestamp}\nRole,${data.role}\nPage,${data.page}\nExported By,${data.exportedBy}\n`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${role}_${activePage}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch portfolios for trade modal
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioService.getAllPortfolios();
        setPortfolios(data || []);
      } catch (err) {
        console.error('Error fetching portfolios:', err);
      }
    };
    fetchPortfolios();
  }, []);

  const handleCreateTrade = async (tradeData) => {
    try {
      await tradeService.createTrade(tradeData);
      setShowCreateTrade(false);
      alert('Trade executed successfully!');
      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error creating trade:', err);
      alert('Failed to execute trade: ' + (err.response?.data?.message || err.message));
    }
  };

  const contentMap = {
    trader: { 
      overview: <TraderOverview />, 
      portfolios: <PortfoliosPage />, 
      positions: <PositionsPage />, 
      trades: <TradeHistoryPage />, 
      ai: <TraderOverview /> 
    },
    analyst: { 
      overview: <AnalystOverview />, 
      trends: <MarketTrends />, 
      heatmap: <RiskHeatmapPage />, 
      performance: <PerformancePage />, 
      reports: <ReportsPage /> 
    },
    risk_manager: { 
      overview: <RiskManagerOverview onNavigate={setActivePage} />, 
      exposure: <ExposureTablePage />, 
      var: <VarAnalysisPage />, 
      alerts: <AlertsPage />, 
      limits: <RiskLimitsPage /> 
    },
  };
  const content = contentMap[role]?.[activePage] || contentMap.trader.overview;
  const pageTitle = activePage.replace("_", " ").replace(/^\w/, c=>c.toUpperCase());
  const roleLabel = { trader:"Trader Dashboard", analyst:"Analyst Dashboard", risk_manager:"Risk Manager Dashboard" }[role] || "Dashboard";

  return (
    <div style={{ display:"flex", height:"100vh", background:C.offWhite, overflow:"hidden" }}>
      <Sidebar role={role} activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar role={role} onLogout={async ()=>{ await authService.logout(); onNavigate("landing"); }} onNavigate={onNavigate} />
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          <div style={{ marginBottom:24 }}>
            <p style={{ color:C.textMuted, fontSize:12, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", margin:"0 0 4px" }}>{roleLabel}</p>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, color:C.text, margin:0 }}>{pageTitle}</h1>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="ghost" size="sm" onClick={handleExportData}>📥 Export</Btn>
                <Btn variant="primary" size="sm" onClick={()=>setShowCreateTrade(true)}>+ New Trade</Btn>
              </div>
            </div>
          </div>
          {content}
        </div>
      </div>
      
      {/* Create Trade Modal */}
      {showCreateTrade && <CreateTradeModal onClose={()=>setShowCreateTrade(false)} onCreate={handleCreateTrade} portfolios={portfolios} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const AdminDashboard = ({ onNavigate }) => {
  const [activePage, setActivePage] = useState("users");
  const [searchQ, setSearchQ] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [newUser, setNewUser] = useState({ name:"", email:"", password:"", role:"TRADER" });
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Get current user from storage
  const currentUser = authService.getCurrentUser();
  const userInitial = currentUser?.name.charAt(0).toUpperCase() || "A";

  // Fetch users
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [roleFilter, statusFilter, searchQ]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(searchQ && { search: searchQ }),
      };
      const data = await userService.getAllUsers(params);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await userService.createUser(newUser);
      setShowAddUser(false);
      setNewUser({ name:"", email:"", password:"", role:"TRADER" });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEditUser = async () => {
    try {
      await userService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      });
      setShowEditUser(false);
      setEditingUser(null);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(userId);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user: " + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (user) => {
    setEditingUser({...user});
    setShowEditUser(true);
  };

  const filtered = users;

  const adminNav = [
    { id:"users", icon:"👥", label:"User Management" },
    { id:"analytics", icon:"📊", label:"Platform Analytics" },
    { id:"logs", icon:"📋", label:"System Logs" },
    { id:"settings", icon:"⚙️", label:"Risk Settings" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:"#F8FAFC", overflow:"hidden" }}>
      {/* Admin Sidebar - Light Theme */}
      <div style={{ width:240, background:"linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)", display:"flex", flexDirection:"column", flexShrink:0, boxShadow:"4px 0 24px rgba(0,0,0,0.08)" }}>
        <div style={{ padding:"20px 20px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:C.red, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:900, fontSize:16 }}>⚡</div>
          <div>
            <div style={{ color:"#1E293B", fontWeight:800, fontSize:15 }}>HedgeAI</div>
            <div style={{ color:"#64748B", fontSize:10, fontWeight:600, letterSpacing:1 }}>ADMIN CONSOLE</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          {adminNav.map(item=>{
            const active = activePage === item.id;
            return (
              <button key={item.id} onClick={()=>setActivePage(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", borderRadius:10, border:"none", cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.2s", background:active?"rgba(225,6,0,0.1)":"transparent", borderLeft:active?`3px solid ${C.red}`:"3px solid transparent", boxShadow:active?"0 2px 8px rgba(225,6,0,0.15)":"none" }}
                onMouseEnter={(e)=>{ if(!active) e.currentTarget.style.background="#F1F5F9"; }}
                onMouseLeave={(e)=>{ if(!active) e.currentTarget.style.background="transparent"; }}
              >
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:active?C.red:"#475569" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding:12, borderTop:"1px solid #E2E8F0" }}>
          <button onClick={async ()=>{ await authService.logout(); onNavigate("landing"); }} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #E2E8F0", background:"transparent", cursor:"pointer", fontSize:12, color:"#64748B", fontFamily:"inherit", fontWeight:600, transition:"all 0.2s" }}
            onMouseEnter={(e)=>{ e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.color="#1E293B"; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}
          >← Sign Out</button>
        </div>
      </div>

      {/* Admin Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Admin Top Bar */}
        <div style={{ height:64, background:C.white, borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", padding:"0 24px", gap:16 }}>
          <div style={{ flex:1, display:"flex", gap:20 }}>
            {[["5","Active Users","📈"],["99.94%","Uptime","✅"],["148K","API Calls Today","🔗"]].map(([v,l,i])=>(
              <div key={l} style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span>{i}</span>
                <span style={{ color:"#1E293B", fontWeight:700, fontSize:13 }}>{v}</span>
                <span style={{ color:"#64748B", fontSize:11 }}>{l}</span>
              </div>
            ))}
          </div>
          <Badge variant="green">● System Healthy</Badge>
          <div style={{ width:32, height:32, borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:700, fontSize:13 }}>{userInitial}</div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24, background:"#F8FAFC" }}>
          <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#1E293B", letterSpacing:-0.5, margin:0 }}>
              {adminNav.find(n=>n.id===activePage)?.label}
            </h1>
            {activePage === "users" && <Btn variant="primary" size="sm" onClick={()=>setShowAddUser(true)}>+ Add User</Btn>}
          </div>

          {activePage === "users" && (
            <div>
              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
                {loading ? (
                  <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"#64748B" }}>Loading...</div>
                ) : userStats ? (
                  [
                    ["Total Users", userStats.totalUsers || users.length, "👥", "#3B82F6"],
                    ["Active", userStats.activeUsers || users.filter(u=>u.status==="ACTIVE").length, "✅", "#10B981"],
                    ["Traders", userStats.traderCount || users.filter(u=>u.role==="TRADER").length, "📈", "#F59E0B"],
                    ["Analysts", userStats.analystCount || users.filter(u=>u.role==="ANALYST").length, "📊", "#8B5CF6"]
                  ].map(([l,v,i,c])=>(
                    <div key={l} style={{ background:"#1E293B", borderRadius:12, padding:20, border:"1px solid #334155", transition:"all 0.2s", cursor:"pointer" }}
                      onMouseEnter={(e)=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.4)"; e.currentTarget.style.borderColor=c; }}
                      onMouseLeave={(e)=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#334155"; }}
                    >
                      <div style={{ fontSize:24, marginBottom:8 }}>{i}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.white, marginBottom:4 }}>{v}</div>
                      <div style={{ fontSize:11, color:"#64748B", fontWeight:600, letterSpacing:0.3 }}>{l}</div>
                    </div>
                  ))
                ) : (
                  [["Total Users",users.length,"👥","#3B82F6"],["Active",users.filter(u=>u.status==="ACTIVE").length,"✅","#10B981"],["Traders",users.filter(u=>u.role==="TRADER").length,"📈","#F59E0B"],["Analysts",users.filter(u=>u.role==="ANALYST").length,"📊","#8B5CF6"]].map(([l,v,i,c])=>(
                    <div key={l} style={{ background:"#1E293B", borderRadius:12, padding:20, border:"1px solid #334155", transition:"all 0.2s", cursor:"pointer" }}
                      onMouseEnter={(e)=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.4)"; e.currentTarget.style.borderColor=c; }}
                      onMouseLeave={(e)=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#334155"; }}
                    >
                      <div style={{ fontSize:24, marginBottom:8 }}>{i}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.white, marginBottom:4 }}>{v}</div>
                      <div style={{ fontSize:11, color:"#64748B", fontWeight:600, letterSpacing:0.3 }}>{l}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Search + Table */}
              <div style={{ background:C.white, borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #E2E8F0", display:"flex", gap:12, alignItems:"center" }}>
                  <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search users..." style={{ flex:1, padding:"9px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", transition:"border 0.2s" }}
                    onFocus={(e)=>e.currentTarget.style.borderColor=C.red}
                    onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
                  />
                  <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ padding:"9px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#475569", fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none", transition:"all 0.2s" }}
                    onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                    onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
                  >
                    <option value="">All Roles</option>
                    <option value="TRADER">Trader</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="RISK_MANAGER">Risk Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:"9px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#475569", fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none", transition:"all 0.2s" }}
                    onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                    onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ borderBottom:"1px solid #E2E8F0" }}>
                    {["User","Role","Status","Joined","Actions"].map(h=><th key={h} style={{ padding:"12px 20px", textAlign:"left", color:"#64748B", fontWeight:600, fontSize:11, letterSpacing:0.5 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" style={{ padding:40, textAlign:"center", color:"#64748B" }}>Loading users...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding:40, textAlign:"center", color:"#64748B" }}>No users found</td></tr>
                    ) : (
                      filtered.map(u=>(
                        <tr key={u.id} style={{ borderBottom:"1px solid #F1F5F9", transition:"all 0.2s" }}
                          onMouseEnter={e=>{ e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.boxShadow="inset 0 0 0 1px rgba(225,6,0,0.05)"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.boxShadow="none"; }}>
                          <td style={{ padding:"14px 20px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:34, height:34, borderRadius:"50%", background:C.red, color:C.white, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{u.name[0]}</div>
                              <div>
                                <div style={{ color:"#1E293B", fontWeight:600, fontSize:13 }}>{u.name}</div>
                                <div style={{ color:"#64748B", fontSize:11 }}>{u.email}</div>
                              </div>
                            </div>
                        </td>
                        <td style={{ padding:"14px 20px" }}>
                          <Badge variant={u.role==="RISK_MANAGER"?"red":u.role==="ANALYST"?"blue":"green"}>
                            {u.role?.replace("_", " ") || u.role}
                          </Badge>
                        </td>
                        <td style={{ padding:"14px 20px" }}>
                          <Badge variant={u.status==="ACTIVE"?"green":u.status==="SUSPENDED"?"red":"default"}>
                            {u.status}
                          </Badge>
                        </td>
                        <td style={{ padding:"14px 20px", color:"#64748B", fontSize:12 }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding:"14px 20px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>openEditModal(u)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #E2E8F0", background:"transparent", color:"#64748B", fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
                              onMouseEnter={(e)=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.color=C.white; e.currentTarget.style.borderColor=C.accent; }}
                              onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; e.currentTarget.style.borderColor="#E2E8F0"; }}
                            >Edit</button>
                            <button onClick={()=>handleDeleteUser(u.id)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${C.red}44`, background:"transparent", color:C.red, fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
                              onMouseEnter={(e)=>{ e.currentTarget.style.background=C.red; e.currentTarget.style.color=C.white; }}
                              onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.red; }}
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
                <div style={{ padding:"12px 20px", borderTop:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"#64748B", fontSize:12 }}>Showing {filtered.length} of {users.length} users</span>
                  <div style={{ display:"flex", gap:6 }}>
                    {[1,2,3].map(p=><button key={p} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:p===1?C.accent:C.white, color:p===1?C.white:"#64748B", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.2s" }}
                      onMouseEnter={(e)=>{ if(p!==1){ e.currentTarget.style.background="rgba(225,6,0,0.1)"; e.currentTarget.style.color="#1E293B"; }}}
                      onMouseLeave={(e)=>{ if(p!==1){ e.currentTarget.style.background=C.white; e.currentTarget.style.color="#64748B"; }}}
                    >{p}</button>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "analytics" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[["API Calls (24h)","148,432","↑12%",C.chartBlue],["Avg Response","42ms","↓5ms",C.chartGreen],["Error Rate","0.02%","↓0.01%",C.chartPurple]].map(([l,v,c,color])=>(
                  <div key={l} style={{ background:C.white, borderRadius:12, padding:24, border:"1px solid #E2E8F0", transition:"all 0.2s", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}
                    onMouseEnter={(e)=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.borderColor=color; }}
                    onMouseLeave={(e)=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor="#E2E8F0"; }}
                  >
                    <div style={{ color:"#64748B", fontSize:11, fontWeight:600, letterSpacing:0.5, marginBottom:12 }}>{l}</div>
                    <div style={{ fontSize:32, fontWeight:800, color:"#1E293B", letterSpacing:-1, marginBottom:4 }}>{v}</div>
                    <div style={{ fontSize:12, color:C.success, fontWeight:600 }}>{c}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:C.white, borderRadius:14, border:"1px solid #E2E8F0", padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                <h3 style={{ color:"#1E293B", fontWeight:700, fontSize:15, marginBottom:16 }}>API Usage Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={pnlData.map(d=>({...d,calls:Math.floor(d.pnl/50)}))}>
                    <defs><linearGradient id="apiGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.chartBlue} stopOpacity={0.5}/><stop offset="95%" stopColor={C.chartBlue} stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="day" tick={{fontSize:9,fill:"#64748B"}} interval={4}/>
                    <YAxis tick={{fontSize:9,fill:"#64748B"}}/>
                    <Tooltip contentStyle={{background:C.white,border:"1px solid #E2E8F0",borderRadius:8,fontSize:12}} />
                    <Area type="monotone" dataKey="calls" stroke={C.chartBlue} strokeWidth={2.5} fill="url(#apiGrd)" activeDot={{r:6,fill:C.chartBlue,stroke:C.white,strokeWidth:2}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activePage === "settings" && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {/* Risk Threshold Configuration */}
              <div style={{ background:C.white, borderRadius:14, border:"1px solid #E2E8F0", padding:32, maxWidth:600, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                <h3 style={{ color:"#1E293B", fontWeight:700, fontSize:16, marginBottom:24 }}>Risk Threshold Configuration</h3>
                {[["Delta Limit (%)","15"],["VaR Budget ($)","50000"],["Max Drawdown (%)","10"],["Gamma Concentration (%)","20"]].map(([l,def])=>(
                  <div key={l} style={{ marginBottom:20 }}>
                    <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6, letterSpacing:0.3 }}>{l}</label>
                    <input defaultValue={def} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                      onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                      onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
                    />
                  </div>
                ))}
                <Btn variant="primary">Save Settings</Btn>
              </div>
              
              {/* Change Password */}
              <ChangePasswordSection />
            </div>
          )}

          {activePage === "logs" && (
            <div style={{ background:C.white, borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0", fontWeight:700, color:"#1E293B", fontSize:13, fontFamily:"monospace" }}>System Logs</div>
              {[
                { time:"09:42:11", level:"ERROR", msg:"Delta limit breach — portfolio delta: 18.2% (limit: 15%)" },
                { time:"09:31:07", level:"INFO", msg:"Auto-hedge executed: BUY 45 SPY @ $485.20" },
                { time:"09:15:00", level:"INFO", msg:"Daily risk report generated successfully" },
                { time:"08:59:32", level:"WARN", msg:"Unusual hedge frequency detected on QQQ position" },
                { time:"08:45:01", level:"INFO", msg:"WebSocket connection established — 3 active clients" },
                { time:"08:00:00", level:"INFO", msg:"System startup complete — all services operational" },
              ].map((l,i)=>(
                <div key={i} style={{ padding:"11px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", gap:16, fontFamily:"monospace", fontSize:12, transition:"all 0.2s" }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.boxShadow="inset 0 0 0 1px rgba(225,6,0,0.05)"; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.boxShadow="none"; }}
                >
                  <span style={{ color:"#64748B" }}>{l.time}</span>
                  <span style={{ color:l.level==="ERROR"?C.red:l.level==="WARN"?"#D97706":"#22C55E", fontWeight:700, width:50 }}>{l.level}</span>
                  <span style={{ color:"#475569" }}>{l.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={()=>setShowAddUser(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:20, padding:32, width:420, border:"1px solid #E2E8F0", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#1E293B", letterSpacing:-0.5, margin:0 }}>Add New User</h2>
              <button onClick={()=>setShowAddUser(false)} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"transparent", color:"#64748B", cursor:"pointer", fontSize:16, transition:"all 0.2s" }}
                onMouseEnter={(e)=>{ e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.color="#1E293B"; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}
              >✕</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Full Name</label>
              <input value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} placeholder="Jane Smith"
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Email</label>
              <input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} placeholder="jane@company.com"
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Password</label>
              <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} placeholder="Minimum 8 characters"
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Role</label>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box", outline:"none", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              >
                <option value="TRADER">Trader</option>
                <option value="ANALYST">Analyst</option>
                <option value="RISK_MANAGER">Risk Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="primary" style={{ flex:1 }} onClick={handleCreateUser}>Create User</Btn>
              <Btn variant="ghost" onClick={()=>setShowAddUser(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={()=>setShowEditUser(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:20, padding:32, width:420, border:"1px solid #E2E8F0", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#1E293B", letterSpacing:-0.5, margin:0 }}>Edit User</h2>
              <button onClick={()=>setShowEditUser(false)} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"transparent", color:"#64748B", cursor:"pointer", fontSize:16, transition:"all 0.2s" }}
                onMouseEnter={(e)=>{ e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.color="#1E293B"; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}
              >✕</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Full Name</label>
              <input value={editingUser.name} onChange={e=>setEditingUser({...editingUser,name:e.target.value})} placeholder="Jane Smith"
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Email</label>
              <input value={editingUser.email} onChange={e=>setEditingUser({...editingUser,email:e.target.value})} placeholder="jane@company.com"
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Role</label>
              <select value={editingUser.role} onChange={e=>setEditingUser({...editingUser,role:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box", outline:"none", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              >
                <option value="TRADER">Trader</option>
                <option value="ANALYST">Analyst</option>
                <option value="RISK_MANAGER">Risk Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:6 }}>Status</label>
              <select value={editingUser.status} onChange={e=>setEditingUser({...editingUser,status:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:C.white, color:"#1E293B", fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box", outline:"none", transition:"border 0.2s" }}
                onFocus={(e)=>e.currentTarget.style.borderColor=C.accent}
                onBlur={(e)=>e.currentTarget.style.borderColor="#E2E8F0"}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="primary" style={{ flex:1 }} onClick={handleEditUser}>Update User</Btn>
              <Btn variant="ghost" onClick={()=>setShowEditUser(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   AI CHATBOT
═══════════════════════════════════════════════════════════════ */
const Chatbot = ({ page="" }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ id:0, role:"ai", text:`Hi! I'm your HedgeAI assistant. I can see you're on the ${page || "dashboard"}. How can I help?` }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  const responses = {
    "risk": "Your current portfolio risk score is 72/100. The main contributor is delta exposure at 99% of limit — consider reducing SPY call positions to bring this under control.",
    "var": "Your 95% VaR is $42,100 and 99% VaR is $68,400 over a 1-day horizon. This is within acceptable bounds but elevated due to current market volatility.",
    "hedg": "Based on current Greeks, I recommend buying 45 SPY shares (confidence: 94%) to neutralize delta exposure. Estimated cost: $82 vs $3,890 without RL optimization.",
    "sharp": "Current Sharpe ratio is 1.72 (30-day rolling). The RL agent outperforms all baseline strategies: Delta (0.84), Delta-Gamma (1.08), Delta-Gamma-Vega (1.21).",
    "default": "I understand your question. Based on current portfolio data, I recommend reviewing your risk limits dashboard and considering a rebalance to reduce delta exposure.",
  };

  const send = () => {
    if(!input.trim()) return;
    const userMsg = { id:Date.now(), role:"user", text:input };
    setMessages(m=>[...m, userMsg]);
    setInput(""); setTyping(true);
    setTimeout(() => {
      const key = Object.keys(responses).find(k => input.toLowerCase().includes(k)) || "default";
      setMessages(m=>[...m, { id:Date.now()+1, role:"ai", text:responses[key] }]);
      setTyping(false);
    }, 1200);
  };

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, typing]);

  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:1000 }}>
      {/* Chat Window */}
      {open && (
        <div style={{ position:"absolute", bottom:70, right:0, width:340, background:C.white,
          borderRadius:20, border:`1px solid ${C.border}`, boxShadow:C.shadowMd, overflow:"hidden",
          animation:"slideUp 0.2s ease" }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {/* Header */}
          <div style={{ background:C.red, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div>
                <div style={{ color:C.white, fontWeight:700, fontSize:13 }}>HedgeAI Assistant</div>
                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10 }}>● Online</div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{ width:26, height:26, borderRadius:6, border:"1px solid rgba(255,255,255,0.3)", background:"transparent", color:C.white, cursor:"pointer", fontSize:14 }}>✕</button>
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", flexWrap:"wrap", gap:6 }}>
              {chatSuggestions.map(s=>(
                <button key={s} onClick={()=>{ setInput(s); }} style={{ padding:"5px 10px", borderRadius:16, border:`1px solid ${C.border}`, background:C.lightGray, fontSize:11, color:C.textSub, cursor:"pointer", fontFamily:"inherit" }}>{s}</button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ height:260, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map(m=>(
              <div key={m.id} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"82%", padding:"10px 13px", borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  background:m.role==="user"?C.red:C.lightGray, color:m.role==="user"?C.white:C.text, fontSize:13, lineHeight:1.6 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:C.lightGray }}>
                  <span style={{ display:"inline-flex", gap:3, alignItems:"center" }}>
                    {[0,1,2].map(i=><span key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.textMuted, animation:`bounce 0.8s ${i*0.15}s infinite alternate`, display:"inline-block" }} />)}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <style>{`@keyframes bounce{to{transform:translateY(-4px)}}`}</style>

          {/* Input */}
          <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask me anything..." style={{ flex:1, padding:"9px 12px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none" }} />
            <button onClick={send} style={{ width:36, height:36, borderRadius:10, background:C.red, border:"none", color:C.white, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>↑</button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={()=>setOpen(!open)} style={{
        width:56, height:56, borderRadius:"50%", background:C.red, border:"none", cursor:"pointer",
        boxShadow:C.shadowRed, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
        transition:"transform 0.2s, box-shadow 0.2s", transform:open?"rotate(180deg)":"rotate(0)",
      }}>
        {open ? "↓" : "🤖"}
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APP ROUTER
═══════════════════════════════════════════════════════════════ */
export default function App() {
  // Initialize page from URL hash or default to landing
  const getInitialPage = () => {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash) {
      // Check if user is authenticated
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        if (user?.role) {
          const roleMap = {
            'TRADER': 'trader',
            'ANALYST': 'analyst',
            'RISK_MANAGER': 'risk_manager',
            'ADMIN': 'admin'
          };
          return `dashboard_${roleMap[user.role] || 'trader'}`;
        }
      }
      return "landing";
    }
    return hash;
  };

  const [page, setPage] = useState(getInitialPage);

  // Navigate function that updates both state and browser history
  const navigate = useCallback((p) => {
    // Check authentication for dashboard pages
    const isDashboard = p.startsWith("dashboard_");
    if (isDashboard && !authService.isAuthenticated()) {
      // Redirect to signin if trying to access dashboard without authentication
      setPage("signin");
      window.history.pushState({ page: "signin" }, "", "#signin");
      return;
    }
    
    setPage(p);
    // Update browser URL without triggering a page reload
    window.history.pushState({ page: p }, "", `#${p}`);
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const newPage = window.location.hash.slice(1) || "landing";
      
      // Check authentication when navigating back to dashboard
      const isDashboard = newPage.startsWith("dashboard_");
      if (isDashboard && !authService.isAuthenticated()) {
        // If not authenticated, redirect to landing
        setPage("landing");
        window.history.replaceState({ page: "landing" }, "", "#landing");
        return;
      }
      
      setPage(newPage);
    };

    // Listen for browser back/forward
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state if none exists
    if (!window.history.state) {
      window.history.replaceState({ page }, "", `#${page}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [page]);

  // State for Phase 4 Advanced Components
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, items: [] });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K: Global search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      // ? or Shift + /: Keyboard shortcuts overlay
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      
      // ESC: Close all overlays
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsOpen(false);
        setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, items: [] });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent context menu on right click (we'll handle it programmatically)
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Only prevent default if we're on a dashboard page
      if (page.startsWith('dashboard_')) {
        // Let browser handle context menu on inputs and textareas
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        // Default context menu items could be added here in the future
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [page]);

  const getDashRole = () => {
    if(page.startsWith("dashboard_")) return page.replace("dashboard_","");
    return null;
  };
  const dashRole = getDashRole();

  // Check if we're on reset password page (would have token in URL in production)
  const isResetPassword = page.startsWith("reset_password");
  const resetToken = isResetPassword ? page.split("_")[2] : null;

  const showChatbot = page !== "landing" && page !== "signin" && page !== "signup" && page !== "forgot_password" && !isResetPassword;

  // Page transition wrapper
  const PageTransition = ({ children }) => (
    <div 
      key={page}
      style={{ 
        animation: "fadeIn 0.3s ease-out",
        minHeight: "100vh"
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans', 'Sora', system-ui, sans-serif", minHeight:"100vh" }}>
      {/* Add global focus styles */}
      <style>{`
        *:focus-visible {
          outline: 2px solid ${C.red};
          outline-offset: 2px;
          border-radius: 4px;
        }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid ${C.red};
          outline-offset: 2px;
        }
      `}</style>
      
      {page === "landing" && <PageTransition><LandingPage onNavigate={navigate} /></PageTransition>}
      {page === "signup" && <PageTransition><SignUpPage onNavigate={navigate} /></PageTransition>}
      {page === "signin" && <PageTransition><SignInPage onNavigate={navigate} /></PageTransition>}
      {page === "forgot_password" && <PageTransition><ForgotPasswordPage onNavigate={navigate} /></PageTransition>}
      {isResetPassword && <PageTransition><ResetPasswordPage onNavigate={navigate} token={resetToken || "demo-token"} /></PageTransition>}
      
      {/* Wrap authenticated dashboard pages with RealtimeProvider */}
      {dashRole && dashRole !== "admin" && (
        <PageTransition>
          <RealtimeProvider>
            <Dashboard role={dashRole} onNavigate={navigate} />
          </RealtimeProvider>
        </PageTransition>
      )}
      
      {(page === "dashboard_admin" || dashRole === "admin") && (
        <PageTransition>
          <RealtimeProvider>
            <AdminDashboard onNavigate={navigate} />
          </RealtimeProvider>
        </PageTransition>
      )}

      {showChatbot && <Chatbot page={page} />}

      {/* Phase 4 Advanced Components */}
      <GlobalSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onNavigate={navigate}
        role={dashRole || 'trader'}
      />
      <KeyboardShortcutsOverlay 
        isOpen={shortcutsOpen} 
        onClose={() => setShortcutsOpen(false)} 
      />
      <ContextMenu 
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={contextMenu.items}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, items: [] })}
      />
    </div>
  );
}
