import { useState } from "react";
import { C } from "../../constants/colors";
import { Button } from "../common/Button";

export const CreateAlertModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    message: "",
    severity: "MEDIUM",
    alertType: "PRICE",
    threshold: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.message) {
      alert("Please enter an alert message");
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
            Create New Alert
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
            Alert Message *
          </label>
          <input
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Enter alert description..."
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
            Alert Type
          </label>
          <select
            value={formData.alertType}
            onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
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
            <option value="PRICE">Price Alert</option>
            <option value="VOLATILITY">Volatility Alert</option>
            <option value="DELTA">Delta Alert</option>
            <option value="GAMMA">Gamma Alert</option>
            <option value="POSITION">Position Alert</option>
            <option value="RISK">Risk Alert</option>
            <option value="CUSTOM">Custom Alert</option>
          </select>
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
            Severity
          </label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
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
            <option value="LOW">Low - Informational</option>
            <option value="MEDIUM">Medium - Warning</option>
            <option value="HIGH">High - Critical</option>
          </select>
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
            Threshold (Optional)
          </label>
          <input
            value={formData.threshold}
            onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
            placeholder="e.g., 100, 15%, etc."
            type="text"
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
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Alert"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
