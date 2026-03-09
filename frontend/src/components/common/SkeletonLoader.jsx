import { C } from "../../constants/colors";

export const SkeletonLoader = ({ width = "100%", height = 20, borderRadius = 4 }) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: `linear-gradient(90deg, ${C.border} 25%, ${C.bgLight} 50%, ${C.border} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }}
  />
);

export const SkeletonCard = () => (
  <div
    style={{
      background: C.white,
      borderRadius: 12,
      padding: 20,
      border: `1px solid ${C.border}`,
    }}
  >
    <SkeletonLoader width="60%" height={16} style={{ marginBottom: 12 }} />
    <SkeletonLoader width="40%" height={24} style={{ marginBottom: 20 }} />
    <SkeletonLoader width="100%" height={12} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="80%" height={12} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <SkeletonLoader key={i} width="25%" height={14} />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} style={{ display: "flex", gap: 12 }}>
        {[...Array(4)].map((_, j) => (
          <SkeletonLoader key={j} width="25%" height={40} />
        ))}
      </div>
    ))}
  </div>
);

// Add shimmer animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}
