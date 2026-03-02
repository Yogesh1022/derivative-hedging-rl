import { C } from "../../constants/colors";

export const Input = ({ label, type = "text", placeholder, value, onChange, error }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: `1.5px solid ${error ? C.red : C.border}`,
        fontSize: 14,
        color: C.text,
        background: C.white,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.red)}
      onBlur={(e) => (e.target.style.borderColor = error ? C.red : C.border)}
    />
    {error && (
      <p style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{error}</p>
    )}
  </div>
);
