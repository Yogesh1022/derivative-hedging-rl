import { useState } from "react";
import { C } from "../../constants/colors";

export const Button = ({
  children,
  variant = "primary",
  onClick,
  style = {},
  disabled = false,
  size = "md",
}) => {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  const pad = size === "sm" ? "7px 16px" : size === "lg" ? "14px 32px" : "10px 22px";
  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  const vars = {
    primary: {
      bg: hov ? C.redDark : C.red,
      color: C.white,
      border: "none",
      shadow: hov ? C.shadowRed : "none",
    },
    outline: {
      bg: "transparent",
      color: C.red,
      border: `1.5px solid ${C.red}`,
      shadow: "none",
    },
    ghost: {
      bg: hov ? C.lightGray : "transparent",
      color: C.textSub,
      border: `1px solid ${C.border}`,
      shadow: "none",
    },
    danger: {
      bg: hov ? "#B80500" : "#FFF0F0",
      color: hov ? C.white : C.red,
      border: `1px solid ${C.red}44`,
      shadow: "none",
    },
  };
  const v = vars[variant] || vars.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => {
        setHov(false);
        setPress(false);
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border,
        boxShadow: v.shadow,
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: press ? "scale(0.97)" : "scale(1)",
        transition: "all 0.15s",
        fontFamily: "inherit",
        letterSpacing: 0.2,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
};
