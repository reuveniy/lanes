import React from "react";
import { useMobile } from "../hooks/useMobile";

interface RetireModalProps {
  playerName: string;
  playerColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RetireModal: React.FC<RetireModalProps> = ({
  playerName,
  playerColor,
  onConfirm,
  onCancel,
}) => {
  const m = useMobile();

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Retire from game"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: m ? 16 : 24,
          minWidth: m ? 260 : 340,
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#f59e0b", fontSize: m ? 14 : 18, fontWeight: "bold", marginBottom: 12 }}>
          Retire?
        </div>

        <div style={{ color: "#d1d5db", fontSize: m ? 11 : 13, marginBottom: 8 }}>
          <span style={{ color: playerColor, fontWeight: "bold" }}>{playerName}</span>, are you sure you want to retire?
        </div>

        <div style={{ color: "#9ca3af", fontSize: m ? 10 : 12, marginBottom: 20, lineHeight: 1.5 }}>
          An AI will play on your behalf —<br />
          selecting moves and buying stocks automatically.<br />
          All votes will be auto-accepted.
        </div>

        <div style={{ color: "#6b7280", fontSize: m ? 9 : 11, marginBottom: 20 }}>
          You can rejoin anytime to take back control.
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: m ? 12 : 14,
              fontWeight: "bold",
              background: "#374151",
              color: "#e5e7eb",
              border: "none",
              borderRadius: 4,
              padding: "8px 24px",
              cursor: "pointer",
            }}
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: m ? 12 : 14,
              fontWeight: "bold",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "8px 24px",
              cursor: "pointer",
            }}
          >
            Retire
          </button>
        </div>
      </div>
    </div>
  );
};
