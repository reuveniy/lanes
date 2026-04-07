import React, { useState } from "react";
import { useMobile } from "../hooks/useMobile";

interface LobbyScreenProps {
  connected: boolean;
  roomCode: string | null;
  players: string[];
  maxPlayers: number;
  playerId: number | null;
  error: string | null;
  userName: string | null;
  onJoinRoom: (roomCode: string) => void;
  onStartNow?: () => void;
  onPlayLocal: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  connected,
  roomCode,
  players,
  maxPlayers,
  playerId,
  error,
  userName,
  onJoinRoom,
  onStartNow,
  onPlayLocal,
}) => {
  const isMobile = useMobile();
  const [joinCode, setJoinCode] = useState("");

  const isHost = playerId === 0;

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: "6px 10px",
    width: "100%",
    boxSizing: "border-box",
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    fontWeight: "bold",
    background: "#fbbf24",
    color: "#0a0a1a",
    border: "none",
    borderRadius: 4,
    padding: "8px 0",
    width: "100%",
    cursor: "pointer",
    letterSpacing: 1,
  };

  const labelStyle: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    display: "block",
  };

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
        justifyContent: isMobile ? "flex-start" : "center",
        padding: isMobile ? 12 : 32,
      }}
    >
      <div
        style={{
          color: "#fbbf24",
          fontSize: isMobile ? 14 : 20,
          fontWeight: "bold",
          letterSpacing: isMobile ? 2 : 3,
          marginBottom: 8,
        }}
      >
        {isMobile ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
      </div>
      <div style={{ color: "#6b7280", marginBottom: 24, fontSize: 12 }}>
        {connected ? "Connected" : "Connecting..."}
        {!connected && (
          <span style={{ color: "#ef4444" }}> (offline)</span>
        )}
      </div>

      {error && (
        <div
          style={{
            color: "#ef4444",
            background: "#1f2937",
            padding: "8px 16px",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: isMobile ? 12 : 24,
          width: "100%",
          maxWidth: 400,
          boxSizing: "border-box",
        }}
      >
        {!roomCode ? (
          <>
            {userName && (
              <div style={{ marginBottom: 16, color: "#9ca3af", fontSize: 12 }}>
                Signed in as <span style={{ color: "#fbbf24" }}>{userName}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="room-code-input" style={labelStyle}>Room Code</label>
              <input
                id="room-code-input"
                style={{ ...inputStyle, textTransform: "uppercase" }}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="ABCD"
              />
            </div>

            <button
              onClick={() => joinCode.trim() && onJoinRoom(joinCode.trim())}
              disabled={!connected || joinCode.length < 4}
              style={{
                ...btnStyle,
                marginBottom: 16,
                opacity: !connected || joinCode.length < 4 ? 0.5 : 1,
              }}
            >
              JOIN GAME
            </button>

            <button
              onClick={onPlayLocal}
              style={{
                ...btnStyle,
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #374151",
                fontSize: 12,
              }}
            >
              Play Local (single browser)
            </button>
          </>
        ) : (
          <>
            {/* In a room - waiting / config */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 4 }}>
                ROOM CODE
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#fbbf24",
                  letterSpacing: 8,
                }}
              >
                {roomCode}
              </div>
              <div style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>
                Share this code with other players
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Players ({players.length}/{maxPlayers})
              </label>
              {players.map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 8px",
                    color: i === playerId ? "#fbbf24" : "#e5e7eb",
                    fontSize: 13,
                  }}
                >
                  {i === 0 ? "★ " : "  "}
                  {p}
                  {i === playerId ? " (you)" : ""}
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
                padding: 16,
              }}
            >
              {players.length < maxPlayers
                ? `Waiting for ${maxPlayers - players.length} more player${maxPlayers - players.length > 1 ? "s" : ""} to join...`
                : "Starting game..."}
            </div>

            {/* Start Now — host only, needs 2+ players */}
            {onStartNow && playerId === 0 && players.length < maxPlayers && (
              <button
                onClick={onStartNow}
                disabled={players.length < 2}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 14,
                  fontWeight: "bold",
                  background: players.length >= 2 ? "#fbbf24" : "#1f2937",
                  color: players.length >= 2 ? "#0a0a1a" : "#4b5563",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 0",
                  width: "100%",
                  cursor: players.length >= 2 ? "pointer" : "default",
                  letterSpacing: 1,
                  opacity: players.length >= 2 ? 1 : 0.5,
                }}
              >
                START NOW ({players.length} players)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
