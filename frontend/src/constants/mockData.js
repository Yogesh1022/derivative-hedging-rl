// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
// Static data for charts (will be replaced with real data later)
export const pnlData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  pnl: 45000 + Math.sin(i * 0.4) * 12000 + Math.random() * 5000,
  baseline: 45000,
}));

export const volData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  vol: 15 + Math.sin(i * 0.5) * 8 + Math.random() * 4,
}));

export const riskData = [
  { name: "Equity", value: 42, color: "#E10600" },
  { name: "FX", value: 23, color: "#FF6B6B" },
  { name: "Rates", value: 18, color: "#FFA8A8" },
  { name: "Credit", value: 17, color: "#FFD0D0" },
];

export const heatData = Array.from({ length: 35 }, (_, i) => ({
  val: Math.random(),
}));

export const varData = Array.from({ length: 12 }, (_, i) => ({
  m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
  var95: -20000 - Math.random() * 15000,
  var99: -30000 - Math.random() * 20000,
}));

export const users = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "s.chen@firm.com",
    role: "Risk Manager",
    status: "active",
    joined: "Jan 12, 2025",
  },
  {
    id: 2,
    name: "Marcus Webb",
    email: "m.webb@firm.com",
    role: "Trader",
    status: "active",
    joined: "Feb 3, 2025",
  },
  {
    id: 3,
    name: "Priya Nair",
    email: "p.nair@firm.com",
    role: "Analyst",
    status: "inactive",
    joined: "Mar 7, 2025",
  },
  {
    id: 4,
    name: "James Okafor",
    email: "j.okafor@firm.com",
    role: "Trader",
    status: "active",
    joined: "Apr 15, 2025",
  },
  {
    id: 5,
    name: "Luna Fischer",
    email: "l.fischer@firm.com",
    role: "Analyst",
    status: "active",
    joined: "May 2, 2025",
  },
];

export const chatSuggestions = [
  "Explain my risk score",
  "How to reduce VaR exposure?",
  "What is current portfolio delta?",
  "Show key risk metrics",
];
