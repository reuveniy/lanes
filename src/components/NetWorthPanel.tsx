import React from "react";
import type { Player } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface NetWorthPanelProps {
  players: Player[];
  currentPlayer: number;
}

export const NetWorthPanel: React.FC<NetWorthPanelProps> = ({
  players,
  currentPlayer,
}) => {
  const m = useMobile();
  const maxWorth = Math.max(...players.map((p) => p.netWorth), 1);

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: m ? 10 : 13,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: m ? 8 : 12,
      }}
    >
      <div
        style={{
          color: "#9ca3af",
          fontSize: m ? 9 : 11,
          marginBottom: m ? 4 : 8,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Net Worth
      </div>
      {players.map((player) => (
        <div key={player.index} style={{ marginBottom: m ? 6 : 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                color: player.color,
                fontWeight: player.index === currentPlayer ? "bold" : "normal",
              }}
            >
              {player.index === currentPlayer ? "\u25b6 " : "  "}
              {player.name}
            </span>
            <span style={{ color: "#d1d5db" }}>
              ${player.netWorth.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              height: m ? 4 : 6,
              background: "#1f2937",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(player.netWorth / maxWorth) * 100}%`,
                background: player.color,
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
