import { useState, useEffect } from "react";
import { C } from "../../constants/colors";

let toastId = 0;
let showToastFn = null;

export const useToast = () => {
  return {
    success: (message) => showToastFn?.({ type: "success", message }),
    error: (message) => showToastFn?.({ type: "error", message }),
    warning: (message) => showToastFn?.({ type: "warning", message }),
    info: (message) => showToastFn?.({ type: "info", message }),
  };
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFn = ({ type, message }) => {
      const id = toastId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    return () => {
      showToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {toasts.map((toast) => {
        const colors = {
          success: { bg: C.successLight, border: C.success, icon: "✅" },
          error: { bg: C.redLight, border: C.red, icon: "❌" },
          warning: { bg: C.warningLight, border: C.warning, icon: "⚠️" },
          info: { bg: C.lightAccent, border: C.accent, icon: "ℹ️" },
        };

        const { bg, border, icon } = colors[toast.type] || colors.info;

        return (
          <div
            key={toast.id}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: "12px 16px",
              minWidth: 300,
              maxWidth: 400,
              boxShadow: C.shadowMd,
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: C.textMuted,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Add animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}
