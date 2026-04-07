import React, { useState } from "react";
import type { GameConfig } from "../types/game";
import { playBeep } from "../engine/sound";
import { useMobile } from "../hooks/useMobile";

interface SetupScreenProps {
  onStart: (config: GameConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const isMobile = useMobile();
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"]);
  const [starCount, setStarCount] = useState(150);
  const [totalSteps, setTotalSteps] = useState(180);
  const [doublePayCount, setDoublePayCount] = useState(10);

  const handleStart = () => {
    if (totalSteps < 80 || totalSteps > 360) { playBeep(); return; }
    if (starCount < 100 || starCount > 180) { playBeep(); return; }
    onStart({
      playerCount,
      playerNames: names.slice(0, playerCount),
      starCount,
      totalSteps,
      doublePayCount,
      seed: Date.now(),
      scoreRecorded: false,
    });
  };

  const m = isMobile;

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: m ? 12 : 14,
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: m ? "4px 8px" : "6px 10px",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: m ? 10 : 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: m ? 2 : 4,
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
        justifyContent: m ? "flex-start" : "center",
        padding: m ? "12px 10px" : 32,
      }}
    >
      <div
        style={{
          color: "#fbbf24",
          fontSize: m ? 13 : 20,
          fontWeight: "bold",
          letterSpacing: m ? 2 : 3,
          marginBottom: m ? 6 : 8,
          marginTop: m ? 4 : 0,
        }}
      >
        {m ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
      </div>
      {!m && (
        <div style={{ color: "#6b7280", marginBottom: 32, fontSize: 12 }}>
          An Interstellar Commerce Game
        </div>
      )}

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: m ? 6 : 8,
          padding: m ? 12 : 24,
          width: m ? "100%" : 400,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Player Count */}
        <div style={{ marginBottom: m ? 8 : 16 }}>
          <label style={labelStyle}>Players</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                style={{
                  ...inputStyle,
                  width: "auto",
                  flex: 1,
                  cursor: "pointer",
                  background: playerCount === n ? "#374151" : "#1f2937",
                  border: playerCount === n ? "1px solid #fbbf24" : "1px solid #374151",
                  color: playerCount === n ? "#fbbf24" : "#9ca3af",
                  padding: m ? "4px 0" : "6px 10px",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player Names — inline on mobile */}
        {m ? (
          <div style={{ display: "grid", gridTemplateColumns: playerCount > 2 ? "1fr 1fr" : "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {Array.from({ length: playerCount }, (_, i) => (
              <div key={i}>
                <label style={labelStyle}>P{i + 1}</label>
                <input
                  style={inputStyle}
                  value={names[i]}
                  onChange={(e) => {
                    const newNames = [...names];
                    newNames[i] = e.target.value;
                    setNames(newNames);
                  }}
                  maxLength={8}
                />
              </div>
            ))}
          </div>
        ) : (
          Array.from({ length: playerCount }, (_, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Player {i + 1}</label>
              <input
                style={inputStyle}
                value={names[i]}
                onChange={(e) => {
                  const newNames = [...names];
                  newNames[i] = e.target.value;
                  setNames(newNames);
                }}
                maxLength={8}
              />
            </div>
          ))
        )}

        {/* Stars + Steps + Double Pay */}
        {m ? (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="setup-stars-m" style={labelStyle}>Stars ({starCount})</label>
                <input id="setup-stars-m" type="range" min={100} max={180} value={starCount}
                  onChange={(e) => setStarCount(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="setup-steps-m" style={labelStyle}>Steps ({totalSteps})</label>
                <input id="setup-steps-m" type="range" min={80} max={360} step={10} value={totalSteps}
                  onChange={(e) => setTotalSteps(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label htmlFor="setup-dp-m" style={labelStyle}>Double Pay ({doublePayCount})</label>
              <input id="setup-dp-m" type="range" min={2} max={16} value={doublePayCount}
                onChange={(e) => setDoublePayCount(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="setup-stars" style={labelStyle}>Stars ({starCount})</label>
              <input id="setup-stars" type="range" min={100} max={180} value={starCount}
                onChange={(e) => setStarCount(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="setup-steps" style={labelStyle}>Game Steps ({totalSteps})</label>
              <input id="setup-steps" type="range" min={80} max={360} step={10} value={totalSteps}
                onChange={(e) => setTotalSteps(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="setup-dp" style={labelStyle}>Double Pay Locations ({doublePayCount})</label>
              <input id="setup-dp" type="range" min={2} max={16} value={doublePayCount}
                onChange={(e) => setDoublePayCount(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </>
        )}

        <button
          onClick={handleStart}
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: m ? 14 : 16,
            fontWeight: "bold",
            background: "#fbbf24",
            color: "#0a0a1a",
            border: "none",
            borderRadius: 4,
            padding: m ? "8px 0" : "10px 0",
            width: "100%",
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          START GAME
        </button>
      </div>
    </div>
  );
};
