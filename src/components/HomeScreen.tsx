import React, { useState } from "react";
import type { RoomInfo, LeaderboardEntryInfo } from "../../server/protocol";
import type { GameLogSummary } from "../../server/gameLogs";
import { RoomList } from "./RoomList";
import { Leaderboard } from "./Leaderboard";
import { GoogleLogin } from "./GoogleLogin";
import { PlayedGames } from "./PlayedGames";
import { useMobile } from "../hooks/useMobile";

interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

interface HomeScreenProps {
  connected: boolean;
  authenticated: boolean;
  user: UserInfo | null;
  googleClientId: string;
  error: string | null;
  roomList: RoomInfo[];
  leaderboard: LeaderboardEntryInfo[];
  onPlayLocal: () => void;
  onWatchDemo: () => void;
  onHelp: () => void;
  onCreateRoom: (maxPlayers: number, starCount: number, totalSteps: number, doublePayCount: number, fogOfWar: boolean) => void;
  onJoinRoom: (code: string) => void;
  onObserveRoom: (code: string) => void;
  onAuthenticate: (idToken: string) => void;
  onRefreshRooms: () => void;
  isAdmin?: boolean;
  onClearLeaderboard?: () => void;
  onRemoveLeaderboardUser?: (email: string) => void;
  onDeleteRoom?: (roomCode: string) => void;
  gameLogs: GameLogSummary[];
  onRefreshLogs: () => void;
  onReplay: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  connected,
  authenticated,
  user,
  googleClientId,
  error,
  roomList,
  leaderboard,
  onPlayLocal,
  onWatchDemo,
  onHelp,
  onCreateRoom,
  onJoinRoom,
  onObserveRoom,
  onAuthenticate,
  onRefreshRooms,
  isAdmin,
  onClearLeaderboard,
  onRemoveLeaderboardUser,
  onDeleteRoom,
  gameLogs,
  onRefreshLogs,
  onReplay,
}) => {
  const isMobile = useMobile();
  const [showCreate, setShowCreate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [starCount, setStarCount] = useState(150);
  const [totalSteps, setTotalSteps] = useState(180);
  const [doublePayCount, setDoublePayCount] = useState(10);
  const [fogOfWar, setFogOfWar] = useState(false);

  const btnStyle = (
    bg: string,
    fg: string,
    border?: string
  ): React.CSSProperties => ({
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    fontWeight: "bold",
    background: bg,
    color: fg,
    border: border || "none",
    borderRadius: 4,
    padding: "10px 0",
    cursor: "pointer",
    letterSpacing: 2,
    width: "100%",
  });

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        background: "#0a0a1a",
        color: "#e5e7eb",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            color: "#fbbf24",
            fontSize: isMobile ? 14 : 18,
            fontWeight: "bold",
            letterSpacing: isMobile ? 1 : 3,
            marginBottom: 4,
          }}
        >
          {isMobile ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
        </div>
        {!isMobile && (
          <div style={{ color: "#6b7280", fontSize: 11 }}>
            An Interstellar Commerce Game
          </div>
        )}
      </div>

      {/* 3-column (desktop) / single-column (mobile) layout */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 16,
          justifyContent: "center",
          alignItems: isMobile ? "stretch" : "flex-start",
          maxWidth: isMobile ? 400 : 900,
          margin: "0 auto",
        }}
      >
        {/* Left: Active Rooms + Past Games */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <RoomList
            rooms={roomList}
            connected={connected}
            authenticated={authenticated}
            userEmail={user?.email ?? null}
            onRefresh={onRefreshRooms}
            onJoin={onJoinRoom}
            onObserve={onObserveRoom}
            isAdmin={isAdmin}
            onDeleteRoom={onDeleteRoom}
          />
          <PlayedGames
            logs={gameLogs}
            onReplay={onReplay}
            onRefresh={onRefreshLogs}
          />
        </div>

        {/* Center: Actions */}
        <div
          style={{
            flex: "0 0 260px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button onClick={onPlayLocal} style={btnStyle("#fbbf24", "#0a0a1a")}>
            PLAY LOCAL
          </button>

          <button
            onClick={onWatchDemo}
            style={btnStyle("#1f2937", "#f59e0b", "1px solid #f59e0b")}
          >
            WATCH DEMO
          </button>

          <button
            onClick={onHelp}
            style={btnStyle("#1f2937", "#9ca3af", "1px solid #374151")}
          >
            HOW TO PLAY
          </button>

          {connected && !authenticated && (
            <div
              style={{
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: 4,
                padding: 16,
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 10 }}>
                Sign in to play online
              </div>
              <GoogleLogin clientId={googleClientId} onToken={onAuthenticate} />
            </div>
          )}

          {connected && authenticated && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 0",
                }}
              >
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={`${user.name}'s avatar`}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                  />
                )}
                <span style={{ color: "#9ca3af", fontSize: 11 }}>
                  {user?.name}
                </span>
              </div>
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  style={btnStyle("#374151", "#e5e7eb", "1px solid #4b5563")}
                >
                  CREATE ONLINE GAME
                </button>
              ) : (
                <div
                  style={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 6,
                    padding: 12,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ color: "#fbbf24", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Game Settings
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2 }}>Players ({maxPlayers})</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          onClick={() => setMaxPlayers(n)}
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: 11,
                            flex: 1,
                            padding: "3px 0",
                            background: maxPlayers === n ? "#374151" : "#1f2937",
                            color: maxPlayers === n ? "#fbbf24" : "#6b7280",
                            border: maxPlayers === n ? "1px solid #fbbf24" : "1px solid #374151",
                            borderRadius: 3,
                            cursor: "pointer",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <label htmlFor="home-stars" style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2, display: "block" }}>Stars ({starCount})</label>
                    <input id="home-stars" type="range" min={100} max={180} value={starCount}
                      onChange={(e) => setStarCount(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <label htmlFor="home-steps" style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2, display: "block" }}>Steps ({totalSteps})</label>
                    <input id="home-steps" type="range" min={80} max={360} step={10} value={totalSteps}
                      onChange={(e) => setTotalSteps(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <label htmlFor="home-dp" style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2, display: "block" }}>Double Pay ({doublePayCount})</label>
                    <input id="home-dp" type="range" min={2} max={16} value={doublePayCount}
                      onChange={(e) => setDoublePayCount(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div
                    role="switch"
                    aria-checked={fogOfWar}
                    aria-label="Toggle Fog of War"
                    tabIndex={0}
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => setFogOfWar(!fogOfWar)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFogOfWar(!fogOfWar); } }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 16,
                        borderRadius: 8,
                        background: fogOfWar ? "#fbbf24" : "#374151",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          background: "#e5e7eb",
                          position: "absolute",
                          top: 2,
                          left: fogOfWar ? 18 : 2,
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                    <span style={{ color: fogOfWar ? "#fbbf24" : "#6b7280", fontSize: 10 }}>
                      Fog of War {fogOfWar ? "ON" : "OFF"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        onCreateRoom(maxPlayers, starCount, totalSteps, doublePayCount, fogOfWar);
                        setShowCreate(false);
                      }}
                      style={{ ...btnStyle("#fbbf24", "#0a0a1a"), fontSize: 12, padding: "8px 0" }}
                    >
                      CREATE ({maxPlayers}P)
                    </button>
                    <button
                      onClick={() => setShowCreate(false)}
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: 11,
                        background: "transparent",
                        color: "#6b7280",
                        border: "1px solid #374151",
                        borderRadius: 4,
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div style={{ color: "#ef4444", fontSize: 11, textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Leaderboard
            entries={leaderboard}
            isAdmin={isAdmin}
            onClearLeaderboard={onClearLeaderboard}
            onRemoveUser={onRemoveLeaderboardUser}
          />
        </div>
      </div>
    </div>
  );
};
