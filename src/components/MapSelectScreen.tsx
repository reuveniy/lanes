import React from "react";
import type { GameState } from "../types/game";
import { PLAYER_COLORS } from "../types/game";
import { GameMap } from "./GameMap";
import { NetWorthPanel } from "./NetWorthPanel";
import { CashDisplay } from "./CashDisplay";
import { StepCounter } from "./StepCounter";
import { HoldingsPanel } from "./HoldingsPanel";
import { useMobile, useTablet, useLandscape } from "../hooks/useMobile";
import { ExitButton } from "./ExitButton";

interface MapSelectScreenProps {
  state: GameState;
  onAccept: () => void;
  onRegenerate: () => void;
  /** Multiplayer: per-player votes. Null = not voted yet. */
  mapVotes?: Record<number, boolean | null>;
  /** Local player id (for showing own vote status) */
  playerId?: number | null;
  onExit?: () => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  state,
  onAccept,
  onRegenerate,
  mapVotes,
  playerId,
  onExit,
}) => {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isLandscape = useLandscape();

  const companyColors = state.companies.map((c) =>
    c.controllingPlayer !== null
      ? PLAYER_COLORS[c.controllingPlayer]
      : c.size > 0
        ? "#6b7280"
        : null
  );

  const currentPlayerData = state.players[state.currentPlayer];
  const isMultiplayer = !!mapVotes;
  const myVote = isMultiplayer && playerId !== null && playerId !== undefined
    ? mapVotes[playerId] : undefined;
  const hasVoted = myVote === true;

  const btnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontWeight: "bold",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    letterSpacing: 1,
    fontSize: isMobile ? 11 : 13,
    padding: isMobile ? "6px 14px" : "8px 24px",
    flex: 1,
  };

  const controlsBlock = (
    <div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: isMobile ? 10 : 13,
          color: "#9ca3af",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 4,
          padding: isMobile ? "6px 8px" : "10px 12px",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {isMultiplayer ? "All players must accept the map" : "Choose your star map"}
      </div>

      {/* Multiplayer: show per-player vote status */}
      {isMultiplayer && (
        <div style={{ marginBottom: 8 }}>
          {state.players.map((p, i) => {
            const vote = mapVotes![i];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 4px",
                  fontSize: isMobile ? 10 : 12,
                  color: p.color,
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: vote === true ? "#22c55e" : vote === false ? "#ef4444" : "#6b7280" }}>
                  {vote === true ? "Accepted" : vote === false ? "Rejected" : "Voting..."}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {isMultiplayer ? (
          <>
            <button
              onClick={onRegenerate}
              disabled={hasVoted}
              style={{
                ...btnStyle,
                background: hasVoted ? "#1f2937" : "#374151",
                color: hasVoted ? "#4b5563" : "#e5e7eb",
                opacity: hasVoted ? 0.5 : 1,
              }}
            >
              REJECT
            </button>
            <button
              onClick={onAccept}
              disabled={hasVoted}
              style={{
                ...btnStyle,
                background: hasVoted ? "#92711a" : "#fbbf24",
                color: "#0a0a1a",
                opacity: hasVoted ? 0.5 : 1,
              }}
            >
              {hasVoted ? "WAITING..." : "ACCEPT"}
            </button>
          </>
        ) : (
          <>
            <button onClick={onRegenerate} style={{ ...btnStyle, background: "#374151", color: "#e5e7eb" }}>
              NEW MAP
            </button>
            <button onClick={onAccept} style={{ ...btnStyle, background: "#fbbf24", color: "#0a0a1a" }}>
              ACCEPT
            </button>
          </>
        )}
      </div>
      <div style={{ color: "#4b5563", fontSize: isMobile ? 9 : 11, marginTop: 6, textAlign: "center" }}>
        Stars: {state.grid.flat().filter((c) => c === 3).length} |
        Gold: {state.grid.flat().filter((c) => c === 4).length}
      </div>
    </div>
  );

  const mapBlock = (
    <div>
      <GameMap grid={state.grid} moveOptions={[]} companyColors={companyColors} />
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
    <HoldingsPanel state={state} showFullName />
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
      {/* Header */}
      <div
        style={{
          marginBottom: isLandscape ? 2 : isMobile ? 6 : 12,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "0 0 auto" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <span
            style={{
              color: "#fbbf24",
              fontSize: isLandscape ? 10 : isMobile ? 11 : 16,
              fontWeight: "bold",
              letterSpacing: isLandscape ? 1 : isMobile ? 1 : 2,
            }}
          >
            {isMobile || isLandscape ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
          </span>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          {onExit && <ExitButton onClick={onExit} />}
        </div>
      </div>

      {/* Layout matches gameplay */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <StepCounter currentStep={state.currentStep} totalSteps={state.totalSteps} />
          {mapBlock}
          {controlsBlock}
          <NetWorthPanel players={state.players} currentPlayer={state.currentPlayer} />
          <CashDisplay player={currentPlayerData} bankBonus={state.bankBonus} />
        </div>
      ) : isTablet || isLandscape ? (
        <div style={{ display: "flex", gap: isLandscape ? 8 : 12 }}>
          <div style={{ flex: "0 0 auto" }}>
            {mapBlock}
            <div style={{ marginTop: 8 }}>{controlsBlock}</div>
          </div>
          <div style={{ minWidth: isLandscape ? 180 : 220, display: "flex", flexDirection: "column", gap: isLandscape ? 4 : 8 }}>
            {statusBlock}
            {holdingsBlock}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: "0 0 auto" }}>
            {mapBlock}
            <div style={{ marginTop: 8 }}>{controlsBlock}</div>
          </div>
          <div style={{ minWidth: 240 }}>{statusBlock}</div>
          <div style={{ minWidth: 220 }}>{holdingsBlock}</div>
        </div>
      )}
    </div>
  );
};
