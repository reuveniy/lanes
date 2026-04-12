import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { GameLog, GameState } from "../types/game";
import type { GameAction } from "../state/actions";
import { gameReducer } from "../state/reducer";
import { EMPTY_STATE } from "../state/initialState";
import { useMobile } from "../hooks/useMobile";
import { GameMap } from "./GameMap";
import { NetWorthPanel } from "./NetWorthPanel";
import { CashDisplay } from "./CashDisplay";
import { StepCounter } from "./StepCounter";
import { MessageArea } from "./MessageArea";
import { HoldingsPanel } from "./HoldingsPanel";
import { ExitButton } from "./ExitButton";
import { PLAYER_COLORS } from "../types/game";

interface ReplayViewProps {
  log: GameLog;
  onExit: () => void;
}

export const ReplayView: React.FC<ReplayViewProps> = ({ log, onExit }) => {
  const isMobile = useMobile();

  // Pre-compute all states by replaying every action
  const states = useMemo(() => {
    const result: GameState[] = [];
    let state = EMPTY_STATE;
    for (const entry of log.actions) {
      const action: GameAction = JSON.parse(entry.action);
      state = gameReducer(state, action);
      result.push(state);
    }
    return result;
  }, [log]);

  const maxStep = states.length - 1;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = states[currentIdx] ?? EMPTY_STATE;

  // Auto-play
  useEffect(() => {
    if (!playing || currentIdx >= maxStep) return;
    timerRef.current = setTimeout(() => {
      setCurrentIdx((i) => Math.min(i + 1, maxStep));
    }, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentIdx, maxStep, speed]);

  // Pause at end
  useEffect(() => {
    if (currentIdx >= maxStep) setPlaying(false);
  }, [currentIdx, maxStep]);

  const companyColors = state.companies.map((c) =>
    c.controllingPlayer !== null
      ? PLAYER_COLORS[c.controllingPlayer]
      : c.size > 0 ? "#6b7280" : null
  );

  const currentPlayer = state.players[state.currentPlayer];

  const btnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: isMobile ? 10 : 12,
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: isMobile ? "3px 8px" : "4px 12px",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        background: "#0a0a1a",
        color: "#e5e7eb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Replay controls bar */}
      <div
        style={{
          background: "rgba(15, 15, 35, 0.95)",
          borderBottom: "1px solid #374151",
          padding: isMobile ? "4px 8px" : "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 12,
          flexWrap: "wrap",
          fontSize: isMobile ? 10 : 12,
        }}
      >
        <span style={{ color: "#06b6d4", fontWeight: "bold", letterSpacing: 1 }}>
          {isMobile ? "REPLAY" : "GAME REPLAY"}
        </span>

        <button
          onClick={() => setPlaying(!playing)}
          style={{ ...btnStyle, color: playing ? "#f59e0b" : "#22c55e" }}
        >
          {playing ? "Pause" : "Play"}
        </button>

        <button
          onClick={() => { setCurrentIdx(0); setPlaying(false); }}
          style={btnStyle}
        >
          Reset
        </button>

        {!isMobile && <span style={{ color: "#6b7280" }}>Speed:</span>}
        <input
          type="range"
          min={100}
          max={3000}
          step={100}
          value={3100 - speed}
          onChange={(e) => setSpeed(3100 - Number(e.target.value))}
          style={{ width: isMobile ? 50 : 80 }}
        />

        {/* Step slider */}
        <input
          type="range"
          min={0}
          max={maxStep}
          value={currentIdx}
          onChange={(e) => { setCurrentIdx(Number(e.target.value)); setPlaying(false); }}
          style={{ flex: 1, minWidth: 60 }}
        />
        <span style={{ color: "#9ca3af", minWidth: 50, fontSize: isMobile ? 9 : 11 }}>
          {currentIdx + 1}/{maxStep + 1}
        </span>

        <span style={{ color: "#6b7280", fontSize: isMobile ? 9 : 10 }}>
          Winner: <span style={{ color: "#fbbf24" }}>{log.winnerName}</span>
        </span>

        <ExitButton onClick={onExit} />
      </div>

      {/* Game board */}
      {state.players.length > 0 && currentPlayer && (
        <div style={{ padding: isMobile ? 6 : 16 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 4 : 8 }}>
            <span style={{
              color: "#fbbf24",
              fontSize: isMobile ? 11 : 16,
              fontWeight: "bold",
              letterSpacing: isMobile ? 1 : 2,
            }}>
              {isMobile ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
            </span>
          </div>

          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
              <GameMap grid={state.grid} moveOptions={[]} companyColors={companyColors} />
              <MessageArea messages={state.messages} />
              <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
              <CashDisplay player={currentPlayer} bankBonus={state.bankBonus} />
              <HoldingsPanel state={state} showFullName />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: "0 0 auto" }}>
                <GameMap grid={state.grid} moveOptions={[]} companyColors={companyColors} />
                <div style={{ marginTop: 8 }}>
                  <MessageArea messages={state.messages} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 240 }}>
                <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
                <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
                <CashDisplay player={currentPlayer} bankBonus={state.bankBonus} />
              </div>
              <div style={{ minWidth: 220 }}>
                <HoldingsPanel state={state} showFullName />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
