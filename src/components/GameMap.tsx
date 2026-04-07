import React, { useState, useEffect } from "react";
import {
  CellType,
  ROWS,
  COLS,
  PLAYER_COLORS,
  type MoveOption,
} from "../types/game";
import { useMobile, useLandscape } from "../hooks/useMobile";

interface GameMapProps {
  grid: number[][];
  moveOptions: MoveOption[];
  companyColors: (string | null)[];
  onCellClick?: (row: number, col: number) => void;
  selectedMove?: number | null;
}

function getCellDisplay(
  value: number,
  row: number,
  col: number,
  moveOptions: MoveOption[],
  companyColors: (string | null)[]
): { char: string; color: string; isMoveOption: boolean } {
  const moveOpt = moveOptions.find((m) => m.row === row && m.col === col);
  if (moveOpt) {
    return { char: moveOpt.label, color: "#facc15", isMoveOption: true };
  }

  switch (value) {
    case CellType.Empty:
      return { char: "\u00b7", color: "#4b5563", isMoveOption: false };
    case CellType.Outpost:
      return { char: "+", color: "#9ca3af", isMoveOption: false };
    case CellType.Star:
      return { char: "\u2605", color: "#c0c0c0", isMoveOption: false };
    case CellType.GoldStar:
      return { char: "\u2605", color: "#f59e0b", isMoveOption: false };
    default: {
      // Company territory: value 5-30 maps to company index 0-25
      const companyIndex = value - 5;
      const letter = String.fromCharCode(65 + companyIndex);
      const color = companyColors[companyIndex] || "#6b7280";
      return { char: letter, color, isMoveOption: false };
    }
  }
}

export const GameMap: React.FC<GameMapProps> = ({
  grid,
  moveOptions,
  companyColors,
  onCellClick,
  selectedMove,
}) => {
  const isMobile = useMobile();
  const isLandscape = useLandscape();
  const compact = isMobile || isLandscape;

  const [screenSize, setScreenSize] = useState(
    typeof window !== "undefined"
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 400, h: 800 }
  );
  useEffect(() => {
    const handler = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  let cellW = 20;
  if (compact) {
    // Fit by width (full screen for portrait, half for landscape)
    const availW = isLandscape ? Math.floor(screenSize.w * 0.55) : screenSize.w - 20;
    const cellByW = Math.floor(availW / COLS);
    // Fit by height in landscape (leave room for header ~30px)
    const availH = isLandscape ? screenSize.h - 40 : 9999;
    const cellByH = Math.floor(availH / (ROWS * 1.3));
    cellW = Math.min(cellByW, cellByH);
  }
  const fontSize = compact ? Math.max(Math.floor(cellW * 0.75), 7) : 14;
  const pad = compact ? "2px 2px" : "8px 12px";

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize,
        lineHeight: compact ? 1.2 : 1.3,
        background: "#0f0f23",
        border: "1px solid #333",
        padding: pad,
        borderRadius: 4,
        display: compact ? "block" : "inline-block",
        userSelect: "none",
      }}
    >
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} style={{ display: "flex", whiteSpace: "pre" }}>
          {Array.from({ length: COLS }, (_, col) => {
            const value = grid[row]?.[col] ?? CellType.Empty;
            const { char, color, isMoveOption } = getCellDisplay(
              value,
              row,
              col,
              moveOptions,
              companyColors
            );
            const isSelected =
              selectedMove !== null &&
              selectedMove !== undefined &&
              moveOptions[selectedMove - 1]?.row === row &&
              moveOptions[selectedMove - 1]?.col === col;

            return (
              <span
                key={col}
                role={isMoveOption ? "button" : undefined}
                tabIndex={isMoveOption ? 0 : undefined}
                aria-label={isMoveOption ? `Move option ${char} at row ${row + 1}, column ${col + 1}` : undefined}
                onClick={() => onCellClick?.(row, col)}
                onKeyDown={isMoveOption ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onCellClick?.(row, col); } } : undefined}
                style={{
                  width: cellW,
                  textAlign: "center",
                  color,
                  cursor: isMoveOption ? "pointer" : "default",
                  fontWeight: isMoveOption ? "bold" : "normal",
                  background: isSelected
                    ? "rgba(250, 204, 21, 0.2)"
                    : "transparent",
                  borderRadius: isSelected ? 2 : 0,
                  textShadow: compact
                    ? "none"
                    : value === CellType.GoldStar
                      ? "0 0 6px #f59e0b"
                      : value === CellType.Star
                        ? "0 0 4px #c0c0c0"
                        : "none",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
