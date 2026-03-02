import { useState } from "react";
import { C } from "../../constants/colors";
import { Button } from "../common/Button";

export const CreateTradeModal = ({ onClose, onCreate, portfolios }) => {
  const [formData, setFormData] = useState({
    portfolioId: "",
    symbol: "",
    side: "BUY",
    quantity: "",
    price: "",
    commission: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.portfolioId || !formData.symbol || !formData.quantity || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    const tradeData = {
      portfolioId: formData.portfolioId,
      symbol: formData.symbol.toUpperCase(),
      side: formData.side,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      ...(formData.commission && { commission: parseFloat(formData.commission) }),
    };

    setLoading(true);
    try {
      await onCreate(tradeData);
    } finally {
      setLoading(false);
    }
  };

  const totalValue =
    formData.quantity && formData.price
      ? (parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)
      : "0.00";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 32,
          width: 520,
          boxShadow: C.shadowMd,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.text,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            Execute New Trade
          </h2>
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
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Portfolio *
            </label>
            <select
              value={formData.portfolioId}
              onChange={(e) => setFormData({ ...formData, portfolioId: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select portfolio...</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${(p.totalValue || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Symbol *
            </label>
            <input
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="AAPL"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                textTransform: "uppercase",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Side *
            </label>
            <select
              value={formData.side}
              onChange={(e) => setFormData({ ...formData, side: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="100"
              min="1"
              step="1"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily:" inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Price *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="150.00"
              min="0.01"
              step="0.01"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.textSub,
                marginBottom: 6,
              }}
            >
              Commission (Optional)
            </label>
            <input
              type="number"
              value={formData.commission}
              onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: C.offWhite,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Total Value:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>${totalValue}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Action:</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: formData.side === "BUY" ? C.success : C.red,
              }}
            >
              {formData.side === "BUY" ? "🟢 BUY" : "🔴 SELL"} {formData.quantity || 0}{" "}
              {formData.symbol || "shares"} @ ${formData.price || "0.00"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Executing..." : "Execute Trade"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
