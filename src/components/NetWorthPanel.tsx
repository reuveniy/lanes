import React, { useState, useEffect, useRef } from "react";
import type { Player } from "../types/game";
import { useMobile } from "../hooks/useMobile";
import { playBeep, isMuted } from "../engine/sound";

interface NetWorthPanelProps {
  players: Player[];
  currentPlayer: number;
  retiredPlayers?: Set<number>;
  timerDeadline?: number | null;
  myPlayerId?: number | null;
  onTimerDoubleClick?: () => void;
}

export const NetWorthPanel: React.FC<NetWorthPanelProps> = ({
  players,
  currentPlayer,
  retiredPlayers,
  timerDeadline,
  myPlayerId,
  onTimerDoubleClick,
}) => {
  const m = useMobile();
  const maxWorth = Math.max(...players.map((p) => p.netWorth), 1);

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!timerDeadline || timerDeadline <= 0) { setSecondsLeft(0); return; }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timerDeadline]);

  // Beep on last 5 seconds — only for the local player's turn
  const prevSecondsRef = useRef(secondsLeft);
  useEffect(() => {
    if (secondsLeft > 0 && secondsLeft <= 5 && secondsLeft < prevSecondsRef.current && !isMuted() && myPlayerId === currentPlayer) {
      playBeep();
    }
    prevSecondsRef.current = secondsLeft;
  }, [secondsLeft, myPlayerId, currentPlayer]);

  const hasTimer = timerDeadline && timerDeadline > 0 && secondsLeft > 0;
  const timerMinutes = Math.floor(secondsLeft / 60);
  const timerSecs = secondsLeft % 60;
  const timerStr = timerMinutes > 0 ? `${timerMinutes}:${timerSecs.toString().padStart(2, "0")}` : `${secondsLeft}s`;
  const isUrgent = hasTimer && secondsLeft <= 10;

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: m ? 4 : 8,
        }}
      >
        <span style={{ color: "#9ca3af", fontSize: m ? 9 : 11, textTransform: "uppercase", letterSpacing: 1 }}>
          Net Worth
        </span>
        {hasTimer && (
          <span
            onDoubleClick={onTimerDoubleClick}
            title={onTimerDoubleClick ? "Double-click to change timeout" : undefined}
            style={{
              color: isUrgent ? "#ef4444" : "#fbbf24",
              fontWeight: "bold",
              fontVariantNumeric: "tabular-nums",
              fontSize: m ? 10 : 13,
              cursor: onTimerDoubleClick ? "pointer" : undefined,
            }}
          >
            {timerStr}
          </span>
        )}
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
              {player.name}{retiredPlayers?.has(player.index) ? " (R)" : ""}
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
