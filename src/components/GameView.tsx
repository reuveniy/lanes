import React, { useReducer, useState, useEffect, useCallback, useRef } from "react";
import { PLAYER_COLORS, type GameConfig, type GameState, type GameLogEntry, type GameLog } from "../types/game";
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
import { RetireModal } from "./RetireModal";

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
  stepsVote?: { newSteps: number; initiator: string; votes: Record<number, boolean | null> } | null;
  onStepsVote?: (newSteps: number | null, accept?: boolean) => void;
  moveTimer?: { deadline: number; playerId: number } | null;
  onShareWhatsApp?: (state: GameState) => void;
  onShareBoardWhatsApp?: (state: GameState) => void;
  onRetire?: () => void;
  zoomLink?: string | null;
  pauseVotes?: Record<number, boolean | null>;
  pauseInitiator?: string | null;
  paused?: boolean;
  onPauseVote?: (accept: boolean) => void;
  retiredPlayers?: Set<number>;
  onUpdateTimeout?: (timeout: number) => void;
  onExit?: () => void;
  onSaveGameLog?: (log: GameLog) => void;
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
  stepsVote,
  onStepsVote,
  moveTimer,
  onShareWhatsApp,
  onShareBoardWhatsApp,
  onRetire,
  zoomLink,
  pauseVotes,
  pauseInitiator,
  paused: isPaused,
  onPauseVote,
  retiredPlayers,
  onUpdateTimeout,
  onExit,
  onSaveGameLog,
}) => {
  const [localState, localDispatch] = useReducer(gameReducer, EMPTY_STATE);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [messageLog, setMessageLog] = useState<import("../types/game").GameMessage[]>([]);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isLandscape = useLandscape();
  const [mobileTab, setMobileTab] = useState<"map" | "status" | "holdings">("map");
  const [soundOn, setSoundOn] = useState(!isMuted());
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [timeoutInput, setTimeoutInput] = useState(60);
  const [newStepsInput, setNewStepsInput] = useState("");

  const localLogRef = useRef<GameLogEntry[]>([]);
  const localLogSavedRef = useRef(false);

  const localDispatchWithLog = useCallback((action: GameAction) => {
    localLogRef.current.push({
      step: localState.currentStep,
      action: JSON.stringify(action),
      timestamp: Date.now(),
    });
    localDispatch(action);
  }, [localState.currentStep]);

  const state = externalState ?? localState;
  const dispatch = externalDispatch ?? localDispatchWithLog;
  const isMultiplayer = externalState !== undefined;
  const isMyTurn = !isMultiplayer || playerId === state.currentPlayer;

  // Save local game log when game ends
  useEffect(() => {
    if (!isMultiplayer && state.phase === "gameOver" && !localLogSavedRef.current && state.config && onSaveGameLog) {
      localLogSavedRef.current = true;
      const log: GameLog = {
        id: "local-" + Date.now(),
        config: state.config,
        playerNames: state.players.map((p) => p.name),
        playerColors: state.players.map((p) => p.color),
        winner: state.winner,
        winnerName: state.winner !== null ? state.players[state.winner]?.name ?? "" : "",
        totalSteps: state.currentStep,
        endedAt: Date.now(),
        actions: localLogRef.current,
      };
      onSaveGameLog(log);
    }
    if (state.phase === "setup") {
      localLogSavedRef.current = false;
      localLogRef.current = [];
    }
  }, [state.phase, isMultiplayer, state.config, state.winner, onSaveGameLog]);

  // Accumulate messages across turns
  const seenRef = useRef(0);
  useEffect(() => {
    const msgs = state.messages;
    if (msgs.length === 0) {
      seenRef.current = 0;
      return;
    }

    // Only process genuinely new messages (array grew)
    if (msgs.length <= seenRef.current) return;

    const newMsgs = msgs.slice(seenRef.current);
    setMessageLog((prev) => [...prev, ...newMsgs]);

    // Play only the first alarm from the new batch
    for (const msg of newMsgs) {
      if (msg.alarm) { playAlarm(msg.alarm); break; }
    }

    seenRef.current = msgs.length;
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
        onPlayAgain={!isMultiplayer ? () => {
          if (state.config) dispatch({ type: "INIT_GAME", config: state.config });
        } : undefined}
        onShareWhatsApp={onShareWhatsApp ? () => onShareWhatsApp(state) : undefined}
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
        {/* Left: sound toggle + WhatsApp share */}
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
          {onShareBoardWhatsApp && (
            <button
              onClick={() => onShareBoardWhatsApp(state)}
              title="Share board on WhatsApp"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
            >
              <svg width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} viewBox="0 0 24 24" fill="#22c55e">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          )}
          {zoomLink && (
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Join Zoom session"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <svg width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} viewBox="0 0 24 24" fill="#2d8cff">
                <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3l4 3V6l-4 3V5a2 2 0 0 0-2-2H4zm0 2h10v10H4V5z"/>
              </svg>
            </a>
          )}
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

        {/* Right: steps + end game + exit + room code */}
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

          {isMultiplayer && onPauseVote && (
            <button
              onClick={() => onPauseVote(true)}
              disabled={!!isPaused}
              title={isPaused ? "Game is paused" : "Propose pausing the timer"}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: isMobile ? 8 : 10,
                background: isPaused ? "#1e3a5f" : "#1f2937",
                color: isPaused ? "#60a5fa" : "#6b7280",
                border: isPaused ? "1px solid #60a5fa" : "1px solid #374151",
                borderRadius: 3,
                padding: isMobile ? "2px 4px" : "2px 6px",
                cursor: isPaused ? "default" : "pointer",
              }}
            >
              {isPaused ? "Paused" : "Pause"}
            </button>
          )}

          {isMultiplayer && onRetire && (
            <button
              onClick={() => setShowRetireModal(true)}
              title="Retire — AI will play for you"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: isMobile ? 8 : 10,
                background: "#1f2937",
                color: "#f59e0b",
                border: "1px solid #374151",
                borderRadius: 3,
                padding: isMobile ? "2px 4px" : "2px 6px",
                cursor: "pointer",
              }}
            >
              Retire
            </button>
          )}

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
            <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} onClick={() => { setShowStepsDialog(true); setNewStepsInput(String(state.totalSteps)); }} />
            <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} retiredPlayers={retiredPlayers} timerDeadline={moveTimer && moveTimer.playerId === state.currentPlayer && state.phase === "move" ? moveTimer.deadline : null} myPlayerId={playerId} onTimerDoubleClick={onUpdateTimeout ? () => { setTimeoutInput(state.config?.moveTimeout ?? 60); setShowTimeoutDialog(true); } : undefined} />
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
              <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} onClick={() => { setShowStepsDialog(true); setNewStepsInput(String(state.totalSteps)); }} />
              {mapBlock}
              {controlsBlock}
              <MessageArea messages={messageLog} />
              <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} retiredPlayers={retiredPlayers} timerDeadline={moveTimer && moveTimer.playerId === state.currentPlayer && state.phase === "move" ? moveTimer.deadline : null} myPlayerId={playerId} onTimerDoubleClick={onUpdateTimeout ? () => { setTimeoutInput(state.config?.moveTimeout ?? 60); setShowTimeoutDialog(true); } : undefined} />
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
                <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} onClick={() => { setShowStepsDialog(true); setNewStepsInput(String(state.totalSteps)); }} />
                <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} retiredPlayers={retiredPlayers} timerDeadline={moveTimer && moveTimer.playerId === state.currentPlayer && state.phase === "move" ? moveTimer.deadline : null} myPlayerId={playerId} onTimerDoubleClick={onUpdateTimeout ? () => { setTimeoutInput(state.config?.moveTimeout ?? 60); setShowTimeoutDialog(true); } : undefined} />
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

      {/* Retire modal */}
      {showRetireModal && onRetire && (
        <RetireModal
          playerName={state.players[playerId ?? 0]?.name ?? "Player"}
          playerColor={state.players[playerId ?? 0]?.color ?? "#e5e7eb"}
          onConfirm={() => { setShowRetireModal(false); onRetire(); }}
          onCancel={() => setShowRetireModal(false)}
        />
      )}

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

      {/* Pause vote popup overlay */}
      {isMultiplayer && pauseInitiator && pauseVotes && Object.keys(pauseVotes).length > 0 && onPauseVote && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ fontFamily: "'Courier New', monospace", background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: isMobile ? 16 : 24, minWidth: isMobile ? 260 : 320, maxWidth: "90vw", textAlign: "center" }}>
            <div style={{ color: "#60a5fa", fontSize: isMobile ? 13 : 16, fontWeight: "bold", marginBottom: 12 }}>Pause Game?</div>
            <div style={{ color: "#d1d5db", fontSize: isMobile ? 11 : 13, marginBottom: 16 }}>
              <span style={{ color: "#fbbf24" }}>{pauseInitiator}</span> wants to pause the timer.<br />All players must agree.
            </div>
            <div style={{ marginBottom: 16 }}>
              {state.players.map((p, i) => {
                const vote = pauseVotes[i];
                const isInit = p.name === pauseInitiator;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px", fontSize: isMobile ? 11 : 13, color: p.color, background: isInit ? "rgba(96, 165, 250, 0.1)" : "transparent", borderRadius: 4 }}>
                    <span>{isInit && <span style={{ color: "#60a5fa", marginRight: 4 }}>||</span>}{p.name}</span>
                    <span style={{ color: vote === true ? "#22c55e" : "#6b7280", fontWeight: vote === true ? "bold" : "normal" }}>{vote === true ? "✓ Agreed" : "Voting..."}</span>
                  </div>
                );
              })}
            </div>
            {pauseVotes[playerId ?? -1] === true ? (
              <div style={{ color: "#9ca3af", fontSize: 12 }}>Waiting for other players...</div>
            ) : (
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => onPauseVote(false)} style={{ fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold", background: "#374151", color: "#e5e7eb", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}>Continue</button>
                <button onClick={() => onPauseVote(true)} style={{ fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold", background: "#60a5fa", color: "#0a0a1a", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}>Pause</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Timeout dialog */}
      {showTimeoutDialog && onUpdateTimeout && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ fontFamily: "'Courier New', monospace", background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: isMobile ? 16 : 24, minWidth: isMobile ? 260 : 320, textAlign: "center" }}>
            <div style={{ color: "#60a5fa", fontSize: isMobile ? 13 : 16, fontWeight: "bold", marginBottom: 12 }}>
              Move Timeout
            </div>
            <div style={{ color: "#d1d5db", fontSize: isMobile ? 11 : 13, marginBottom: 16 }}>
              {timeoutInput === 0 ? "OFF" : `${timeoutInput} seconds`}
            </div>
            <input
              type="range" min={0} max={300} step={5} value={timeoutInput}
              onChange={(e) => setTimeoutInput(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowTimeoutDialog(false)}
                style={{ fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold", background: "#374151", color: "#e5e7eb", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onUpdateTimeout(timeoutInput); setShowTimeoutDialog(false); }}
                style={{ fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold", background: "#60a5fa", color: "#0a0a1a", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Steps dialog */}
      {showStepsDialog && (() => {
        const playerCount = state.players.length || 1;
        // Min: at least 80 (game setup min) or current step, whichever is higher
        // Rounded up to nearest multiple of playerCount
        const rawMin = Math.max(80, state.currentStep);
        const minSteps = Math.ceil(rawMin / playerCount) * playerCount;
        const maxSteps = 360;
        // Snap value to nearest multiple of playerCount
        const snapValue = (v: number) => Math.round(v / playerCount) * playerCount;
        const displayValue = snapValue(parseInt(newStepsInput) || minSteps);

        return (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            }}
            onClick={() => setShowStepsDialog(false)}
          >
            <div
              onClick={(ev) => ev.stopPropagation()}
              style={{
                fontFamily: "'Courier New', monospace", background: "#111827",
                border: "1px solid #374151", borderRadius: 8,
                padding: isMobile ? 16 : 24, minWidth: isMobile ? 240 : 300, textAlign: "center",
              }}
            >
              <div style={{ color: "#fbbf24", fontSize: isMobile ? 13 : 16, fontWeight: "bold", marginBottom: 12 }}>
                Change Game Steps
              </div>
              <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 4 }}>
                Current: {state.currentStep} / {state.totalSteps} ({playerCount} players)
              </div>
              <div style={{ color: "#fbbf24", fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
                {displayValue}
              </div>
              <div style={{ color: "#4b5563", fontSize: 9, marginBottom: 8 }}>
                Must divide by {playerCount} for fair turns
              </div>
              <input
                type="range"
                min={minSteps}
                max={maxSteps}
                step={playerCount}
                value={displayValue}
                onChange={(ev) => setNewStepsInput(ev.target.value)}
                autoFocus
                onKeyDown={(ev) => {
                  if (ev.key === "Escape") setShowStepsDialog(false);
                }}
                style={{ width: "100%", marginBottom: 12 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563", fontSize: 9, marginBottom: 12 }}>
                <span>{minSteps}</span>
                <span>{maxSteps}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowStepsDialog(false)}
                  style={{
                    flex: 1, fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: "bold",
                    background: "#374151", color: "#e5e7eb", border: "none", borderRadius: 4,
                    padding: "8px 0", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (displayValue >= minSteps && displayValue <= maxSteps) {
                      if (isMultiplayer && onStepsVote) {
                        onStepsVote(displayValue);
                      } else {
                        dispatch({ type: "CHANGE_STEPS", newSteps: displayValue });
                      }
                      setShowStepsDialog(false);
                    }
                  }}
                  style={{
                    flex: 1, fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: "bold",
                    background: "#fbbf24", color: "#0a0a1a", border: "none", borderRadius: 4,
                    padding: "8px 0", cursor: "pointer",
                  }}
                >
                  {isMultiplayer ? "Propose" : "Set"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Steps vote popup (online) */}
      {isMultiplayer && stepsVote && onStepsVote && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace", background: "#111827",
              border: "1px solid #374151", borderRadius: 8,
              padding: isMobile ? 16 : 24, minWidth: isMobile ? 260 : 320, textAlign: "center",
            }}
          >
            <div style={{ color: "#f59e0b", fontSize: isMobile ? 13 : 16, fontWeight: "bold", marginBottom: 12 }}>
              Change Steps?
            </div>
            <div style={{ color: "#d1d5db", fontSize: isMobile ? 11 : 13, marginBottom: 16 }}>
              <span style={{ color: "#fbbf24" }}>{stepsVote.initiator}</span> wants to change steps
              from <strong>{state.totalSteps}</strong> to <strong>{stepsVote.newSteps}</strong>.
              <br />All players must agree.
            </div>
            <div style={{ marginBottom: 16 }}>
              {state.players.map((p, i) => {
                const vote = stepsVote.votes[i];
                const isInit = p.name === stepsVote.initiator;
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "4px 12px",
                    fontSize: isMobile ? 11 : 13, color: p.color,
                    background: isInit ? "rgba(245,158,11,0.1)" : "transparent", borderRadius: 4,
                  }}>
                    <span>{isInit && <span style={{ color: "#f59e0b", marginRight: 4 }}>★</span>}{p.name}</span>
                    <span style={{ color: vote === true ? "#22c55e" : "#6b7280", fontWeight: vote === true ? "bold" : "normal" }}>
                      {vote === true ? "✓ Agreed" : "Voting..."}
                    </span>
                  </div>
                );
              })}
            </div>
            {(() => {
              const myVote = playerId !== null && playerId !== undefined ? stepsVote.votes[playerId] : undefined;
              if (myVote === true) return <div style={{ color: "#9ca3af", fontSize: 12 }}>Waiting for other players...</div>;
              return (
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => onStepsVote(null, false)} style={{
                    fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold",
                    background: "#374151", color: "#e5e7eb", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer",
                  }}>Keep Current</button>
                  <button onClick={() => onStepsVote(null, true)} style={{
                    fontFamily: "'Courier New', monospace", fontSize: isMobile ? 12 : 14, fontWeight: "bold",
                    background: "#fbbf24", color: "#0a0a1a", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer",
                  }}>Accept</button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

/** Countdown timer display for move timeout */
export const MoveTimerDisplay: React.FC<{
  deadline: number;
  isMyTurn: boolean;
  playerName: string;
  playerColor: string;
  onDoubleClick?: () => void;
}> = ({ deadline, isMyTurn, playerName, playerColor, onDoubleClick }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

  useEffect(() => {
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = minutes > 0 ? `${minutes}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  const isUrgent = secondsLeft <= 10;

  return (
    <div
      onDoubleClick={onDoubleClick}
      title={onDoubleClick ? "Double-click to change timeout" : undefined}
      style={{
        textAlign: "center",
        marginBottom: 8,
        padding: "6px 12px",
        background: isUrgent ? "#7f1d1d" : "#1f2937",
        border: `1px solid ${isUrgent ? "#ef4444" : "#374151"}`,
        borderRadius: 4,
        fontSize: 13,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        cursor: onDoubleClick ? "pointer" : undefined,
      }}
    >
      <span style={{ color: playerColor }}>
        {isMyTurn ? "Your turn" : `Waiting for ${playerName}`}
      </span>
      <span
        style={{
          color: isUrgent ? "#ef4444" : "#fbbf24",
          fontWeight: "bold",
          fontVariantNumeric: "tabular-nums",
          animation: isUrgent ? "pulse 1s ease-in-out infinite" : undefined,
        }}
      >
        {timeStr}
      </span>
    </div>
  );
};
