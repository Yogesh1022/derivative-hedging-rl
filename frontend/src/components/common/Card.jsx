import { useState } from "react";
import { C } from "../../constants/colors";

export const Card = ({ children, style = {}, hover = true }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        padding: 24,
        boxShadow: hov ? C.shadowMd : C.shadow,
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
