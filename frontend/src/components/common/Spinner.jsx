import { C } from "../../constants/colors";

export const Spinner = ({ size = 40, color = C.accent }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `3px solid ${C.border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }}
  />
);

// Add keyframe animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export const LoadingSpinner = ({ message = "Loading..." }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      gap: 16,
    }}
  >
    <Spinner />
    <div style={{ fontSize: 13, color: C.textMuted }}>{message}</div>
  </div>
);
