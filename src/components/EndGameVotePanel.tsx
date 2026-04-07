import React from "react";
import type { Player } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface EndGameVotePanelProps {
  players: Player[];
  votes: Record<number, boolean | null>;
  initiator: string;
  myPlayerId: number | null;
  onAccept: () => void;
  onReject: () => void;
}

export const EndGameVotePanel: React.FC<EndGameVotePanelProps> = ({
  players,
  votes,
  initiator,
  myPlayerId,
  onAccept,
  onReject,
}) => {
  const m = useMobile();
  const myVote = myPlayerId !== null ? votes[myPlayerId] : undefined;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onReject();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReject]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="End game vote"
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
          minWidth: m ? 260 : 320,
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#f59e0b", fontSize: m ? 13 : 16, fontWeight: "bold", marginBottom: 12 }}>
          End Game?
        </div>
        <div style={{ color: "#d1d5db", fontSize: m ? 11 : 13, marginBottom: 16 }}>
          <span style={{ color: "#fbbf24" }}>{initiator}</span> wants to end the game.
          <br />All players must agree.
        </div>

        {/* Vote status per player */}
        <div style={{ marginBottom: 16 }}>
          {players.map((p, i) => {
            const vote = votes[i];
            const isInitiator = p.name === initiator;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 12px",
                  fontSize: m ? 11 : 13,
                  color: p.color,
                  background: isInitiator ? "rgba(245, 158, 11, 0.1)" : "transparent",
                  borderRadius: 4,
                }}
              >
                <span>
                  {isInitiator && <span style={{ color: "#f59e0b", marginRight: 4 }}>★</span>}
                  {p.name}
                </span>
                <span style={{ color: vote === true ? "#22c55e" : "#6b7280", fontWeight: vote === true ? "bold" : "normal" }}>
                  {vote === true ? "✓ Agreed" : "Voting..."}
                </span>
              </div>
            );
          })}
        </div>

        {/* Buttons — only if this player hasn't voted yet */}
        {myVote === true ? (
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Waiting for other players...</div>
        ) : (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={onReject}
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
              Continue Playing
            </button>
            <button
              onClick={onAccept}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: m ? 12 : 14,
                fontWeight: "bold",
                background: "#fbbf24",
                color: "#0a0a1a",
                border: "none",
                borderRadius: 4,
                padding: "8px 24px",
                cursor: "pointer",
              }}
            >
              End Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
