import React, { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { type GameState } from "../types/game";
import type { GameAction } from "../state/actions";
import { gameReducer } from "../state/reducer";
import { EMPTY_STATE } from "../state/initialState";
import { pickBestMove, pickBestBuy } from "../engine/ai";
import { getAlarmDuration } from "../engine/sound";
import { useMobile } from "../hooks/useMobile";
import { GameView } from "./GameView";
import { ExitButton } from "./ExitButton";

interface DemoModeProps {
  onExit: () => void;
}

export const DemoMode: React.FC<DemoModeProps> = ({ onExit }) => {
  const m = useMobile();
  const [state, dispatch] = useReducer(gameReducer, EMPTY_STATE);
  const [speed, setSpeed] = useState(100); // ms per action
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  // Init game on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    dispatch({
      type: "INIT_GAME",
      config: {
        playerCount: 4,
        playerNames: ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"],
        starCount: 150,
        totalSteps: 180,
        doublePayCount: 10,
        seed: Date.now(),
        scoreRecorded: false,
      },
    });
  }, []);

  const doNextAction = useCallback(
    (s: GameState) => {
      if (s.phase === "gameOver") return;

      let action: GameAction | null = null;

      if (s.phase === "mapSelect") {
        action = { type: "ACCEPT_MAP" };
      } else if (s.phase === "move") {
        const moveIdx = pickBestMove(s);
        action = { type: "SELECT_MOVE", moveIndex: moveIdx };
      } else if (s.phase === "specialEvents") {
        action = { type: "ACKNOWLEDGE_EVENT" };
      } else if (s.phase === "trading" && s.tradingState) {
        const buy = pickBestBuy(s);
        if (buy) {
          action = {
            type: "BUY_SHARES",
            companyIndex: buy.companyIndex,
            amount: buy.amount,
          };
        } else {
          action = { type: "SKIP_COMPANY" };
        }
      }

      if (action) dispatch(action);
    },
    []
  );

  // Auto-play loop
  useEffect(() => {
    if (paused || state.phase === "setup" || state.phase === "gameOver") {
      return;
    }

    // Check if current messages have an alarm — wait for it to finish
    let delay = speed;
    const alarm = state.messages.find((m) => m.alarm);
    if (alarm?.alarm) {
      delay = Math.max(delay, getAlarmDuration(alarm.alarm) + 300);
    }

    timerRef.current = setTimeout(() => {
      doNextAction(state);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, paused, speed, doNextAction]);

  const btnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: m ? 10 : 12,
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: m ? "3px 6px" : "4px 12px",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Demo controls overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(15, 15, 35, 0.95)",
          borderBottom: "1px solid #374151",
          padding: m ? "4px 8px" : "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: m ? 6 : 12,
          flexWrap: m ? "wrap" : "nowrap",
          fontFamily: "'Courier New', monospace",
          fontSize: m ? 10 : 12,
        }}
      >
        <span style={{ color: "#f59e0b", fontWeight: "bold", letterSpacing: 1 }}>
          {m ? "DEMO" : "DEMO MODE"}
        </span>

        <button
          onClick={() => setPaused(!paused)}
          style={{ ...btnStyle, color: paused ? "#22c55e" : "#f59e0b" }}
        >
          {paused ? "Play" : "Pause"}
        </button>

        {paused && (
          <button
            onClick={() => doNextAction(state)}
            style={btnStyle}
          >
            Step
          </button>
        )}

        <label htmlFor="demo-speed" style={{ color: "#6b7280", display: m ? "none" : "inline" }}>Speed:</label>
        <input
          id="demo-speed"
          type="range"
          min={100}
          max={5000}
          step={100}
          value={5100 - speed}
          onChange={(e) => setSpeed(5100 - Number(e.target.value))}
          style={{ width: m ? 60 : 100 }}
        />
        {!m && (
          <span style={{ color: "#9ca3af", minWidth: 45 }}>
            {speed}ms
          </span>
        )}

        <div style={{ flex: 1 }} />

        <ExitButton onClick={onExit} />
      </div>

      {/* Game view with top padding for controls */}
      <div style={{ paddingTop: 40 }}>
        <GameView state={state} dispatch={dispatch} />
      </div>
    </div>
  );
};
