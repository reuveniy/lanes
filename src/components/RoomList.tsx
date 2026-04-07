import React, { useEffect } from "react";
import type { RoomInfo } from "../../server/protocol";
import { useMobile } from "../hooks/useMobile";

interface RoomListProps {
  rooms: RoomInfo[];
  connected: boolean;
  authenticated: boolean;
  userEmail: string | null;
  isAdmin?: boolean;
  onRefresh: () => void;
  onJoin: (roomCode: string) => void;
  onObserve: (roomCode: string) => void;
  onDeleteRoom?: (roomCode: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  connected,
  authenticated,
  userEmail,
  onRefresh,
  onJoin,
  onObserve,
  isAdmin,
  onDeleteRoom,
}) => {
  const isMobile = useMobile();

  // Auto-refresh when connected
  useEffect(() => {
    if (connected) onRefresh();
  }, [connected, onRefresh]);

  const panelStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    color: "#e5e7eb",
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: 10,
    minWidth: 220,
  };

  if (!connected) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            color: "#6b7280",
            fontSize: 11,
            textAlign: "center",
          }}
        >
          Connecting to server...
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            color: "#fbbf24",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 6,
            fontWeight: "bold",
          }}
        >
          Active Games
        </div>
        <div style={{ color: "#4b5563", fontSize: 11 }}>
          No active games.{" "}
          <span
            role="button"
            tabIndex={0}
            aria-label="Refresh room list"
            onClick={onRefresh}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRefresh(); } }}
            style={{ color: "#fbbf24", cursor: "pointer", textDecoration: "underline" }}
          >
            Refresh
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "#fbbf24", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>
          Active Games
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Refresh room list"
          onClick={onRefresh}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRefresh(); } }}
          style={{ color: "#6b7280", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}
        >
          Refresh
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
            <th style={{ textAlign: "left", padding: "2px 4px" }}>Room</th>
            <th style={{ textAlign: "left", padding: "2px 4px" }}>Players</th>
            {!isMobile && <th style={{ textAlign: "center", padding: "2px 4px" }}>Status</th>}
            <th style={{ textAlign: "right", padding: "2px 4px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const statusText = room.phase === "mapSelect"
              ? "Choosing Map"
              : room.started
                ? `Step ${room.currentStep}/${room.totalSteps}`
                : `Lobby (${room.players.length}/${room.maxPlayers || 6})`;

            return (
              <tr
                key={room.code}
                style={{ borderBottom: "1px solid #1f2937", color: "#e5e7eb" }}
              >
                <td
                  style={{
                    padding: "3px 4px",
                    color: "#fbbf24",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {room.code}
                </td>
                <td style={{ padding: "3px 4px", color: "#9ca3af" }}>
                  {room.players.map((p, j) => (
                    <div key={j}>{p}</div>
                  ))}
                </td>
                {!isMobile && (
                  <td
                    style={{
                      padding: "3px 4px",
                      textAlign: "center",
                      color: room.phase === "mapSelect" ? "#06b6d4" : room.started ? "#34d399" : "#f59e0b",
                    }}
                  >
                    {statusText}
                  </td>
                )}
                <td style={{ padding: "3px 4px", textAlign: "right", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  {authenticated && userEmail && (() => {
                    const isPlayer = false; // emails no longer exposed for privacy
                    const canJoinLobby = !room.started && room.players.length < (room.maxPlayers || 6) && !isPlayer;
                    if (isPlayer) return (
                      <button
                        onClick={() => onJoin(room.code)}
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: 11,
                          background: "#22c55e",
                          color: "#0a0a1a",
                          border: "none",
                          borderRadius: 3,
                          padding: "3px 10px",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Rejoin
                      </button>
                    );
                    if (canJoinLobby) return (
                      <button
                        onClick={() => onJoin(room.code)}
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: 11,
                          background: "#fbbf24",
                          color: "#0a0a1a",
                          border: "none",
                          borderRadius: 3,
                          padding: "3px 10px",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Join
                      </button>
                    );
                    return null;
                  })()}
                  <button
                    onClick={() => onObserve(room.code)}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 11,
                      background: "#374151",
                      color: "#9ca3af",
                      border: "1px solid #4b5563",
                      borderRadius: 3,
                      padding: "3px 10px",
                      cursor: "pointer",
                      }}
                    >
                      Observe
                    </button>
                  {isAdmin && onDeleteRoom && (
                    <button
                      onClick={() => onDeleteRoom(room.code)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        lineHeight: 1,
                      }}
                      title="Delete game"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
