import React from "react";
import type { GameLogSummary } from "../../server/gameLogs";
import { useMobile } from "../hooks/useMobile";

interface PlayedGamesProps {
  logs: GameLogSummary[];
  onReplay: (id: string) => void;
  onRefresh: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export const PlayedGames: React.FC<PlayedGamesProps> = ({ logs, onReplay, onRefresh, isAdmin, onDelete }) => {
  const m = useMobile();

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#06b6d4", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>
          Past Games
        </span>
        <span onClick={onRefresh} style={{ color: "#6b7280", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>
          Refresh
        </span>
      </div>

      {logs.length === 0 ? (
        <div style={{ color: "#4b5563", fontSize: 11 }}>No completed games yet</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
              <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: "normal" }}>Players</th>
              <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: "normal" }}>Winner</th>
              {!m && <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>Steps</th>}
              <th style={{ textAlign: "right", padding: "2px 4px" }}></th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 10).map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #1f2937" }}>
                <td style={{ padding: "3px 4px", color: "#9ca3af" }}>
                  {log.playerNames.join(", ")}
                </td>
                <td style={{ padding: "3px 4px", color: "#fbbf24" }}>
                  {log.winnerName}
                </td>
                {!m && (
                  <td style={{ padding: "3px 4px", textAlign: "right", color: "#6b7280" }}>
                    {log.totalSteps}
                  </td>
                )}
                <td style={{ padding: "3px 4px", textAlign: "right", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => onReplay(log.id)}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 10,
                      background: "#06b6d4",
                      color: "#0a0a1a",
                      border: "none",
                      borderRadius: 3,
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Replay
                  </button>
                  {isAdmin && onDelete && (
                    <button
                      onClick={() => onDelete(log.id)}
                      title="Delete recording"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        lineHeight: 1,
                      }}
                    >
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
