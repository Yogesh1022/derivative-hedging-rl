import { C } from "../../constants/colors";

export const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: { bg: C.lightGray, color: C.textSub },
    red: { bg: "#FFF0F0", color: C.red },
    green: { bg: "#F0FDF4", color: "#16A34A" },
    yellow: { bg: "#FFFBEB", color: "#D97706" },
    blue: { bg: "#EFF6FF", color: "#2563EB" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
};
