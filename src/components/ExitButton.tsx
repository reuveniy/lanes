import React from "react";
import { useMobile } from "../hooks/useMobile";

interface ExitButtonProps {
  onClick: () => void;
  label?: string;
}

/** Consistent exit/back button used across all screens */
export const ExitButton: React.FC<ExitButtonProps> = ({ onClick, label }) => {
  const m = useMobile();
  return (
    <button
      onClick={onClick}
      title={label || "Exit"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "'Courier New', monospace",
        fontSize: m ? 10 : 12,
        background: "none",
        color: "#6b7280",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: m ? "3px 8px" : "4px 10px",
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      <svg
        width={m ? 14 : 16}
        height={m ? 14 : 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {label || "Exit"}
    </button>
  );
};
