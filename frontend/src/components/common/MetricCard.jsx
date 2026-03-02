import { C } from "../../constants/colors";
import { Card } from "./Card";

export const MetricCard = ({
  label,
  value,
  change,
  changeDir = "up",
  icon,
  accent = false,
}) => (
  <Card style={{ flex: 1, minWidth: 160 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: accent ? "#FFF0F0" : C.lightGray,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      {change && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: changeDir === "up" ? C.success : C.red,
            background: changeDir === "up" ? C.successBg : C.redGhost,
            padding: "3px 8px",
            borderRadius: 8,
          }}
        >
          {changeDir === "up" ? "▲" : "▼"} {change}
        </span>
      )}
    </div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 800,
        color: accent ? C.red : C.text,
        letterSpacing: -1,
        marginBottom: 4,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
      {label}
    </div>
  </Card>
);
