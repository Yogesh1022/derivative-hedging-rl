import { useState, useEffect } from "react";

export const AnimCounter = ({ end, prefix = "", suffix = "" }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let s = 0;
    const t = setInterval(() => {
      s += end / 60;
      if (s >= end) {
        setVal(end);
        clearInterval(t);
      } else {
        setVal(Math.floor(s));
      }
    }, 16);
    return () => clearInterval(t);
  }, [end]);
  return (
    <span>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
};
