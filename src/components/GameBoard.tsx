import React from "react";
import type { GameState } from "../types/game";
import { PLAYER_COLORS } from "../types/game";
import { GameMap } from "./GameMap";
import { NetWorthPanel } from "./NetWorthPanel";
import { CashDisplay } from "./CashDisplay";
import { StepCounter } from "./StepCounter";
import { MessageArea } from "./MessageArea";
import { MoveSelector } from "./MoveSelector";
import { HoldingsPanel } from "./HoldingsPanel";
import { useMobile } from "../hooks/useMobile";

interface GameBoardProps {
  gameState: GameState;
  selectedMove?: number | null;
  onMoveSelect?: (index: number) => void;
  onCellClick?: (row: number, col: number) => void;
}

/** Presentational component for Storybook — shows the game board with no reducer. */
export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedMove,
  onMoveSelect,
  onCellClick,
}) => {
  const isMobile = useMobile();
  const currentPlayerData = gameState.players[gameState.currentPlayer];
  const companyColors = gameState.companies.map((c) =>
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
        padding: isMobile ? 6 : 16,
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: isMobile ? 6 : 12,
          color: "#fbbf24",
          fontSize: isMobile ? 12 : 16,
          fontWeight: "bold",
          letterSpacing: isMobile ? 2 : 2,
        }}
      >
        {isMobile ? "L A N E S" : "T H E \u00a0 S T A R \u00a0 L A N E S \u00a0 G A M E"}
      </div>

      {isMobile ? (
        <div>
          <GameMap
            grid={gameState.grid}
            moveOptions={gameState.moveOptions}
            companyColors={companyColors}
            onCellClick={onCellClick}
            selectedMove={selectedMove}
          />
          <div style={{ marginTop: 6 }}>
            <MoveSelector
              moveOptions={gameState.moveOptions}
              onSelect={onMoveSelect}
              phase={
                gameState.phase === "move"
                  ? "move"
                  : gameState.phase === "trading"
                    ? "trading"
                    : "event"
              }
            />
          </div>
          <div style={{ marginTop: 6 }}>
            <MessageArea messages={gameState.messages} />
          </div>
          <div style={{ marginTop: 6 }}>
            <StepCounter currentStep={gameState.currentStep} totalSteps={gameState.totalSteps} />
          </div>
          <div style={{ marginTop: 6 }}>
            <NetWorthPanel players={gameState.players} currentPlayer={gameState.currentPlayer} />
          </div>
          <div style={{ marginTop: 6 }}>
            <CashDisplay player={currentPlayerData} bankBonus={gameState.bankBonus} />
          </div>
          <div style={{ marginTop: 6 }}>
            <HoldingsPanel state={gameState} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: "0 0 auto" }}>
            <GameMap
              grid={gameState.grid}
              moveOptions={gameState.moveOptions}
              companyColors={companyColors}
              onCellClick={onCellClick}
              selectedMove={selectedMove}
            />
            <div style={{ marginTop: 8 }}>
              <MoveSelector
                moveOptions={gameState.moveOptions}
                onSelect={onMoveSelect}
                phase={
                  gameState.phase === "move"
                    ? "move"
                    : gameState.phase === "trading"
                      ? "trading"
                      : "event"
                }
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <MessageArea messages={gameState.messages} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 240 }}>
            <StepCounter currentStep={gameState.currentStep} totalSteps={gameState.totalSteps} />
            <NetWorthPanel players={gameState.players} currentPlayer={gameState.currentPlayer} />
            <CashDisplay player={currentPlayerData} bankBonus={gameState.bankBonus} />
          </div>

          <div style={{ minWidth: 220 }}>
            <HoldingsPanel state={gameState} />
          </div>
        </div>
      )}
    </div>
  );
};
