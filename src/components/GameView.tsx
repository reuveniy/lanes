import React, { useReducer, useState, useEffect, useCallback, useRef } from "react";
import { PLAYER_COLORS, type GameConfig, type GameState } from "../types/game";
import type { GameAction } from "../state/actions";
import { gameReducer } from "../state/reducer";
import { EMPTY_STATE } from "../state/initialState";
import { playAlarm, isMuted, setMuted } from "../engine/sound";
import { useMobile, useTablet, useLandscape } from "../hooks/useMobile";
import { GameMap } from "./GameMap";
import { NetWorthPanel } from "./NetWorthPanel";
import { CashDisplay } from "./CashDisplay";
import { StepCounter } from "./StepCounter";
import { MessageArea } from "./MessageArea";
import { MoveSelector } from "./MoveSelector";
import { SetupScreen } from "./SetupScreen";
import { TradingPanel } from "./TradingPanel";
import { HoldingsPanel } from "./HoldingsPanel";
import { GameOverScreen } from "./GameOverScreen";
import { MapSelectScreen } from "./MapSelectScreen";
import { EndGameVotePanel } from "./EndGameVotePanel";
import { ExitButton } from "./ExitButton";

interface GameViewProps {
  state?: GameState;
  dispatch?: (action: GameAction) => void;
  playerId?: number | null;
  roomCode?: string | null;
  connected?: boolean;
  mapVotes?: Record<number, boolean | null>;
  onMapVote?: (accept: boolean) => void;
  endGameVotes?: Record<number, boolean | null>;
  endGameInitiator?: string | null;
  onEndGameVote?: (accept: boolean) => void;
  onExit?: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  state: externalState,
  dispatch: externalDispatch,
  playerId,
  roomCode,
  connected,
  mapVotes: externalMapVotes,
  onMapVote,
  endGameVotes,
  endGameInitiator,
  onEndGameVote,
  onExit,
}) => {
  const [localState, localDispatch] = useReducer(gameReducer, EMPTY_STATE);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [messageLog, setMessageLog] = useState<import("../types/game").GameMessage[]>([]);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isLandscape = useLandscape();
  const [mobileTab, setMobileTab] = useState<"map" | "status" | "holdings">("map");
  const [soundOn, setSoundOn] = useState(!isMuted());

  const state = externalState ?? localState;
  const dispatch = externalDispatch ?? localDispatch;
  const isMultiplayer = externalState !== undefined;
  const isMyTurn = !isMultiplayer || playerId === state.currentPlayer;

  // Accumulate messages across turns
  const seenRef = useRef(0);
  const prevRef = useRef(state.messages);
  useEffect(() => {
    const msgs = state.messages;
    if (msgs === prevRef.current || msgs.length === 0) {
      prevRef.current = msgs;
      return;
    }

    // Determine which messages are new
    const newMsgs = msgs.length > seenRef.current
      ? msgs.slice(seenRef.current)  // array grew — take new tail
      : msgs;                         // array was reset — take all

    setMessageLog((prev) => [...prev, ...newMsgs]);
    for (const msg of newMsgs) {
      if (msg.alarm) { playAlarm(msg.alarm); break; }
    }

    seenRef.current = msgs.length;
    prevRef.current = msgs;
  }, [state.messages]);

  const handleStart = useCallback(
    (config: GameConfig) => {
      dispatch({ type: "INIT_GAME", config });
    },
    [dispatch]
  );

  const handleMoveSelect = useCallback(
    (index: number) => {
      if (!isMyTurn) return;
      setSelectedMove(index);
      setTimeout(() => {
        dispatch({ type: "SELECT_MOVE", moveIndex: index });
        setSelectedMove(null);
      }, 200);
    },
    [dispatch, isMyTurn]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (state.phase === "move" && isMyTurn) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5 && state.moveOptions[num - 1]) {
          handleMoveSelect(num);
        }
      }

      const key = e.key.toLowerCase();
      if (state.phase === "specialEvents" && isMyTurn) {
        if (key === "enter" || key === " ") {
          dispatch({ type: "ACKNOWLEDGE_EVENT" });
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase, state.moveOptions, isMyTurn, handleMoveSelect, dispatch]);

  // Setup screen (local mode only)
  if (!isMultiplayer && state.phase === "setup") {
    return <SetupScreen onStart={handleStart} />;
  }

  // Map selection
  if (state.phase === "mapSelect") {
    return (
      <MapSelectScreen
        state={state}
        onAccept={() => {
          if (isMultiplayer && onMapVote) {
            onMapVote(true);
          } else {
            dispatch({ type: "ACCEPT_MAP" });
          }
        }}
        onRegenerate={() => {
          if (isMultiplayer && onMapVote) {
            onMapVote(false);
          } else {
            dispatch({ type: "REGENERATE_MAP" });
          }
        }}
        mapVotes={isMultiplayer ? externalMapVotes : undefined}
        playerId={playerId}
        onExit={onExit}
      />
    );
  }

  // Game over screen
  if (state.phase === "gameOver") {
    return (
      <GameOverScreen
        state={state}
        onPlayAgain={() => {
          if (state.config) dispatch({ type: "INIT_GAME", config: state.config });
        }}
        onExit={onExit}
      />
    );
  }

  // Waiting for game start in multiplayer
  if (isMultiplayer && state.phase === "setup") {
    return null; // LobbyScreen handles this
  }

  const currentPlayerData = state.players[state.currentPlayer];
  if (!currentPlayerData) return null;

  const companyColors = state.companies.map((c) =>
    c.controllingPlayer !== null
      ? PLAYER_COLORS[c.controllingPlayer]
      : c.size > 0
        ? "#6b7280"
        : null
  );

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        background: "#0a0a1a",
        color: "#e5e7eb",
        padding: isLandscape ? 4 : isMobile ? 6 : 16,
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Header — flex row: left | center | right */}
      <div
        style={{
          marginBottom: isLandscape ? 2 : isMobile ? 6 : 12,
          display: "flex",
          alignItems: "center",
          minHeight: isMobile ? 20 : 24,
        }}
      >
        {/* Left: sound toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
          <button
            onClick={() => { setSoundOn(!soundOn); setMuted(soundOn); }}
            title={soundOn ? "Mute sounds" : "Unmute sounds"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
          >
            <svg width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} viewBox="0 0 24 24" fill="none"
              stroke={soundOn ? "#fbbf24" : "#4b5563"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {soundOn ? (
                <><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>
              ) : (
                <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Center: title */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{
            color: "#fbbf24",
            fontSize: isLandscape ? 10 : isMobile ? 11 : 16,
            fontWeight: "bold",
            letterSpacing: isLandscape ? 1 : isMobile ? 1 : 2,
          }}>
            {isMobile || isLandscape ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
          </span>
        </div>

        {/* Right: end game + exit + room code */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, flex: "0 0 auto" }}>
          {isMultiplayer && onEndGameVote && (() => {
            const canEnd = state.currentStep >= 40;
            return (
              <button
                onClick={() => canEnd && onEndGameVote(true)}
                disabled={!canEnd}
                title={!canEnd ? `Available after 40 turns (now ${state.currentStep})` : "Propose ending the game"}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: isMobile ? 8 : 10,
                  background: canEnd ? "#1f2937" : "#111827",
                  color: !canEnd ? "#374151" : "#6b7280",
                  border: canEnd ? "1px solid #374151" : "1px solid #1f2937",
                  borderRadius: 3,
                  padding: isMobile ? "2px 4px" : "2px 6px",
                  cursor: canEnd ? "pointer" : "default",
                  opacity: !canEnd ? 0.4 : 1,
                }}
              >
                End Game
              </button>
            );
          })()}

          {onExit && <ExitButton onClick={onExit} />}

          {roomCode && (
            <span style={{
              fontSize: isMobile ? 9 : 11,
              border: "1px solid #374151",
              borderRadius: 4,
              padding: "2px 6px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#6b7280",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444", display: "inline-block" }} />
              {roomCode}
              {!isMobile && (
                <span style={{ color: connected ? "#22c55e" : "#ef4444", fontSize: 10 }}>
                  {connected ? "online" : "offline"}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Turn indicator for multiplayer */}
      {isMultiplayer && !isMyTurn && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 8,
            padding: "6px 12px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 4,
            color: state.players[state.currentPlayer]?.color ?? "#9ca3af",
            fontSize: 13,
          }}
        >
          Waiting for {state.players[state.currentPlayer]?.name}...
        </div>
      )}

      {/* Controls (shared between layouts) */}
      {(() => {
        const controlsBlock = (
          <div>
            {isMyTurn ? (
              state.phase === "trading" && state.tradingState ? (
                <TradingPanel
                  state={state}
                  onBuy={(ci, amt) =>
                    dispatch({ type: "BUY_SHARES", companyIndex: ci, amount: amt })
                  }
                  onSell={(ci, amt) =>
                    dispatch({ type: "SELL_SHARES", companyIndex: ci, amount: amt })
                  }
                  onSkip={() => dispatch({ type: "SKIP_COMPANY" })}
                  onJumpToCompany={(ci) =>
                    dispatch({ type: "JUMP_TO_COMPANY", companyIndex: ci })
                  }
                  onEndTrading={() => dispatch({ type: "END_TRADING" })}
                  onAllIn={() => dispatch({ type: "ALL_IN" })}
                />
              ) : state.phase === "specialEvents" ? (
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    background: "#111827",
                    border: "1px solid #f59e0b",
                    borderRadius: 4,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "#f59e0b", fontWeight: "bold", marginBottom: 8 }}>
                    SPECIAL ANNOUNCEMENT
                  </div>
                  <button
                    onClick={() => dispatch({ type: "ACKNOWLEDGE_EVENT" })}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 13,
                      background: "#374151",
                      color: "#e5e7eb",
                      border: "1px solid #4b5563",
                      borderRadius: 4,
                      padding: "6px 16px",
                      cursor: "pointer",
                    }}
                  >
                    Continue (Enter)
                  </button>
                </div>
              ) : (
                <MoveSelector
                  moveOptions={state.moveOptions}
                  onSelect={handleMoveSelect}
                  phase="move"
                />
              )
            ) : null}
          </div>
        );

        const mapBlock = (
          <div>
            <GameMap
              grid={state.grid}
              moveOptions={state.phase === "move" ? state.moveOptions : []}
              companyColors={companyColors}
              onCellClick={(row, col) => {
                if (state.phase !== "move" || !isMyTurn) return;
                const idx = state.moveOptions.findIndex(
                  (o) => o.row === row && o.col === col
                );
                if (idx >= 0) handleMoveSelect(idx + 1);
              }}
              selectedMove={selectedMove}
            />
          </div>
        );

        const statusBlock = (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
            <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
            <CashDisplay player={currentPlayerData} bankBonus={state.bankBonus} />
          </div>
        );

        const holdingsBlock = (
          <HoldingsPanel
            state={state}
            viewPlayerId={isMultiplayer ? playerId ?? undefined : undefined}
            showFullName={!isMultiplayer}
            onCompanyClick={
              state.phase === "trading" && state.tradingState && isMyTurn
                ? (ci) => dispatch({ type: "JUMP_TO_COMPANY", companyIndex: ci })
                : undefined
            }
          />
        );

        const messagesBlock = (
          <div style={{ marginTop: 8 }}>
            <MessageArea messages={messageLog} />
          </div>
        );

        if (isMobile) {
          // Mobile: single column, all panels stacked
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
              {mapBlock}
              {controlsBlock}
              <MessageArea messages={messageLog} />
              <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
              <CashDisplay player={currentPlayerData} bankBonus={state.bankBonus} />
              {holdingsBlock}
            </div>
          );
        }

        // Tablet / Landscape: 2-column layout (holdings under status)
        if (isTablet) {
          const g = isLandscape ? 4 : 8;
          return (
            <div style={{ display: "flex", gap: isLandscape ? 8 : 12 }}>
              <div style={{ flex: "0 0 auto" }}>
                {mapBlock}
                <div style={{ marginTop: g }}>{controlsBlock}</div>
                <div style={{ marginTop: g }}>
                  <MessageArea messages={messageLog} />
                </div>
              </div>
              <div style={{ minWidth: isLandscape ? 180 : 220, display: "flex", flexDirection: "column", gap: g, overflow: "auto" }}>
                <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
                <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
                <CashDisplay player={currentPlayerData} bankBonus={state.bankBonus} />
                {holdingsBlock}
              </div>
            </div>
          );
        }

        // Desktop: 3-column layout
        return (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: "0 0 auto" }}>
              {mapBlock}
              <div style={{ marginTop: 8 }}>{controlsBlock}</div>
              {messagesBlock}
            </div>
            <div style={{ minWidth: 240 }}>{statusBlock}</div>
            <div style={{ minWidth: 220 }}>{holdingsBlock}</div>
          </div>
        );
      })()}

      {/* End Game vote popup overlay */}
      {isMultiplayer && endGameInitiator && endGameVotes && Object.keys(endGameVotes).length > 0 && onEndGameVote && (
        <EndGameVotePanel
          players={state.players}
          votes={endGameVotes}
          initiator={endGameInitiator}
          myPlayerId={playerId ?? null}
          onAccept={() => onEndGameVote(true)}
          onReject={() => onEndGameVote(false)}
        />
      )}
    </div>
  );
};
