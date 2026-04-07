import React from "react";
import type { MoveOption } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface MoveSelectorProps {
  moveOptions: MoveOption[];
  onSelect?: (index: number) => void;
  phase: "move" | "trading" | "event";
}

export const MoveSelector: React.FC<MoveSelectorProps> = ({
  moveOptions,
  onSelect,
  phase,
}) => {
  const m = useMobile();

  if (phase !== "move") {
    return (
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: m ? 10 : 13,
          color: "#6b7280",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 4,
          padding: m ? "4px 8px" : "8px 12px",
          textAlign: "center",
        }}
      >
        {phase === "trading" ? "Trading phase..." : "Event resolving..."}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: m ? 10 : 13,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: m ? "4px 8px" : "8px 12px",
      }}
    >
      <div
        style={{
          color: "#9ca3af",
          fontSize: m ? 9 : 11,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: m ? 4 : 6,
        }}
      >
        Select Move
      </div>
      <div style={{ display: "flex", gap: m ? 4 : 8, flexWrap: "wrap" }}>
        {moveOptions.map((opt, i) => (
          <button
            key={i}
            aria-label={`Move option ${opt.label}`}
            onClick={() => onSelect?.(i + 1)}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: m ? 10 : 13,
              background: "#1f2937",
              color: "#facc15",
              border: "1px solid #374151",
              borderRadius: 4,
              padding: m ? "4px 8px" : "6px 12px",
              cursor: "pointer",
              flex: m ? 1 : undefined,
              minWidth: m ? 0 : 50,
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: m ? 13 : 16 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
