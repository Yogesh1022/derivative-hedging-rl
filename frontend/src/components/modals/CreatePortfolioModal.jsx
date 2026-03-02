import { useState } from "react";
import { C } from "../../constants/colors";
import { Button } from "../common/Button";

export const CreatePortfolioModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    strategy: "DELTA_NEUTRAL",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("Please enter a portfolio name");
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
          width: 480,
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
            Create New Portfolio
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
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: C.textSub,
              marginBottom: 6,
            }}
          >
            Portfolio Name *
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Hedging Portfolio"
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
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: C.textSub,
              marginBottom: 6,
            }}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: C.textSub,
              marginBottom: 6,
            }}
          >
            Strategy
          </label>
          <select
            value={formData.strategy}
            onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
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
            <option value="DELTA_NEUTRAL">Delta Neutral</option>
            <option value="GAMMA_SCALPING">Gamma Scalping</option>
            <option value="VEGA_HEDGING">Vega Hedging</option>
            <option value="THETA_DECAY">Theta Decay</option>
            <option value="CUSTOM">Custom Strategy</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Portfolio"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
