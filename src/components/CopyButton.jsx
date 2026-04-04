import { useState, useRef } from "react";

export function CopyButton({ onClick, className = "", children = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  const handleClick = async (e) => {
    try {
      // call provided onClick (expected to perform the actual copy)
      await onClick?.(e);
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      // If copy failed, don't show copied state
      console.error(err);
    }
  };

  return (
    <button
      className={`action-button copy-button ${className}`}
      onClick={handleClick}
      type="button"
    >
      {copied ? "Copied!" : children}
    </button>
  );
}

export default CopyButton;
