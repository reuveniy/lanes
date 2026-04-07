import React from "react";
import type { GameState } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface GameOverScreenProps {
  state: GameState;
  onPlayAgain: () => void;
  onExit?: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  state,
  onPlayAgain,
  onExit,
}) => {
  const m = useMobile();
  const sortedPlayers = [...state.players].sort(
    (a, b) => b.netWorth - a.netWorth
  );

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        background: "#0a0a1a",
        color: "#e5e7eb",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: m ? "flex-start" : "center",
        padding: m ? 12 : 32,
      }}
    >
      <div
        style={{
          color: "#fbbf24",
          fontSize: m ? 16 : 20,
          fontWeight: "bold",
          letterSpacing: m ? 2 : 3,
          marginBottom: m ? 12 : 24,
          marginTop: m ? 8 : 0,
        }}
      >
        G A M E &nbsp; O V E R
      </div>

      {state.winner !== null && (
        <div
          style={{
            fontSize: m ? 14 : 18,
            fontWeight: "bold",
            color: state.players[state.winner].color,
            marginBottom: m ? 12 : 24,
            animation: "blink 1s infinite",
          }}
        >
          {state.players[state.winner].name} Wins!
        </div>
      )}

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: m ? 12 : 24,
          width: "100%",
          maxWidth: 500,
          boxSizing: "border-box",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: m ? 10 : 13 }}>
          <thead>
            <tr style={{ color: "#9ca3af", borderBottom: "1px solid #374151" }}>
              <th style={{ textAlign: "left", padding: m ? "4px" : "6px 8px" }}>Rank</th>
              <th style={{ textAlign: "left", padding: m ? "4px" : "6px 8px" }}>Player</th>
              {!m && <th style={{ textAlign: "right", padding: "6px 8px" }}>Stock</th>}
              <th style={{ textAlign: "right", padding: m ? "4px" : "6px 8px" }}>Cash</th>
              <th style={{ textAlign: "right", padding: m ? "4px" : "6px 8px" }}>Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, rank) => {
              const stockValue = player.netWorth - player.cash;
              const isWinner = state.winner === player.index;
              return (
                <tr
                  key={player.index}
                  style={{
                    borderBottom: "1px solid #1f2937",
                    fontWeight: isWinner ? "bold" : "normal",
                    color: isWinner ? player.color : "#e5e7eb",
                  }}
                >
                  <td style={{ padding: m ? "4px" : "8px" }}>{rank + 1}</td>
                  <td style={{ padding: m ? "4px" : "8px", color: player.color }}>
                    {player.name}
                  </td>
                  {!m && (
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      ${stockValue.toLocaleString()}
                    </td>
                  )}
                  <td style={{ textAlign: "right", padding: m ? "4px" : "8px" }}>
                    ${player.cash.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: m ? "4px" : "8px",
                      color: "#fbbf24",
                    }}
                  >
                    ${player.netWorth.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ textAlign: "center", marginTop: 8, color: "#6b7280", fontSize: m ? 9 : 12 }}>
          Steps: {state.currentStep} / {state.totalSteps}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: m ? 14 : 16,
          fontWeight: "bold",
          background: "#fbbf24",
          color: "#0a0a1a",
          border: "none",
          borderRadius: 4,
          padding: m ? "8px 24px" : "10px 32px",
          cursor: "pointer",
          letterSpacing: 2,
          marginTop: m ? 16 : 24,
        }}
      >
        PLAY AGAIN
      </button>

      {onExit && (
        <button
          onClick={onExit}
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: m ? 12 : 14,
            background: "transparent",
            color: "#6b7280",
            border: "1px solid #374151",
            borderRadius: 4,
            padding: m ? "6px 20px" : "8px 28px",
            cursor: "pointer",
            letterSpacing: 1,
            marginTop: 8,
          }}
        >
          EXIT
        </button>
      )}

      <style>{`@keyframes blink { 50% { opacity: 0.5; } }`}</style>
    </div>
  );
};
