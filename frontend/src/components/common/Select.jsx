import { C } from "../../constants/colors";

export const Select = ({ label, value, onChange, options, children }) => (
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
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: `1.5px solid ${C.border}`,
        fontSize: 14,
        color: C.text,
        background: C.white,
        outline: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        appearance: "none",
        boxSizing: "border-box",
      }}
    >
      {options ? options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      )) : children}
    </select>
  </div>
);
