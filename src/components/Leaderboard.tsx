import React from "react";
import type { LeaderboardEntryInfo } from "../../server/protocol";
import { useMobile } from "../hooks/useMobile";

interface LeaderboardProps {
  entries: LeaderboardEntryInfo[];
  isAdmin?: boolean;
  onClearLeaderboard?: () => void;
  onRemoveUser?: (email: string) => void;
  onSendWhatsApp?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  isAdmin,
  onClearLeaderboard,
  onRemoveUser,
  onSendWhatsApp,
}) => {
  const isMobile = useMobile();
  const adminBtnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: 9,
    background: "#1f2937",
    color: "#ef4444",
    border: "1px solid #374151",
    borderRadius: 3,
    padding: "1px 5px",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: isMobile ? 10 : 11,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: isMobile ? 8 : 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: "#fbbf24",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontWeight: "bold",
          }}
        >
          Leaderboard
        </span>
        <span style={{ display: "flex", gap: 4 }}>
          {onSendWhatsApp && entries.length > 0 && (
            <button
              onClick={() => {
                console.log("WhatsApp button clicked — sending leaderboard");
                onSendWhatsApp();
              }}
              style={{ ...adminBtnStyle, color: "#22c55e", border: "1px solid #22c55e" }}
              title="Send leaderboard to WhatsApp group"
            >
              WhatsApp
            </button>
          )}
          {isAdmin && onClearLeaderboard && (
            <button
              onClick={onClearLeaderboard}
              style={adminBtnStyle}
            >
              Clear All
            </button>
          )}
        </span>
      </div>

      {entries.length === 0 ? (
        <div style={{ color: "#4b5563", fontSize: 11 }}>
          Sign in to appear on the leaderboard
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
              <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: "normal" }}>#</th>
              <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: "normal" }}>Player</th>
              <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>W</th>
              <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>G</th>
              <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>%</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const winPct =
                entry.games > 0
                  ? Math.round((entry.wins / entry.games) * 100)
                  : 0;
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #1f2937",
                    color: i === 0 && entry.wins > 0 ? "#fbbf24" : "#e5e7eb",
                  }}
                >
                  <td style={{ padding: "2px 4px", color: "#6b7280" }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {entry.picture && (
                        <img
                          src={entry.picture}
                          alt={`${entry.name}'s avatar`}
                          style={{ width: 14, height: 14, borderRadius: 7 }}
                        />
                      )}
                      {entry.name}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "2px 4px",
                      color: entry.wins > 0 ? "#22c55e" : "#6b7280",
                      fontWeight: entry.wins > 0 ? "bold" : "normal",
                    }}
                  >
                    {entry.wins}
                  </td>
                  <td style={{ textAlign: "right", padding: "2px 4px", color: "#9ca3af" }}>
                    {entry.games}
                  </td>
                  <td style={{ textAlign: "right", padding: "2px 4px", color: "#9ca3af" }}>
                    {entry.games > 0 ? `${winPct}%` : "-"}
                  </td>
                  {isAdmin && onRemoveUser && (
                    <td style={{ padding: "2px 4px" }}>
                      <button
                        onClick={() => onRemoveUser(entry.email)}
                        style={adminBtnStyle}
                        title="Remove user"
                      >
                        X
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

    </div>
  );
};
