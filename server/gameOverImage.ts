import { createCanvas } from "canvas";
import type { GameState } from "../src/types/game";
import { PLAYER_COLORS } from "../src/types/game";

/**
 * Render game over results as a PNG image matching the in-game dark theme.
 * Rendered at 2x resolution for crisp text.
 */
export function renderGameOverImage(state: GameState): Buffer {
  const scale = 2;
  const padding = 24;
  const rowHeight = 36;
  const headerHeight = 44;
  const titleHeight = 48;
  const winnerHeight = 36;
  const footerHeight = 32;
  const fontSize = 18;
  const headerFontSize = 14;
  const titleFontSize = 22;
  const winnerFontSize = 20;
  const font = "'DejaVu Sans Mono', monospace";

  const sortedPlayers = [...state.players].sort((a, b) => b.netWorth - a.netWorth);

  // Column positions — spaced for large numbers like $40,970,141
  const colRank = padding;
  const colName = padding + 40;
  const width = 860;
  const colNetWorth = width - padding;
  const colCash = colNetWorth - 160;
  const colStock = colCash - 160;

  const height = titleHeight + winnerHeight + headerHeight + sortedPlayers.length * rowHeight + footerHeight + padding;

  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, width, height);

  // Inner panel background
  const panelTop = titleHeight + winnerHeight;
  const panelHeight = headerHeight + sortedPlayers.length * rowHeight + footerHeight;
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  const panelX = padding - 8;
  const panelW = width - 2 * (padding - 8);
  ctx.fillRect(panelX, panelTop, panelW, panelHeight);
  ctx.strokeRect(panelX + 0.5, panelTop + 0.5, panelW - 1, panelHeight - 1);

  // Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = `bold ${titleFontSize}px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("G A M E   O V E R", width / 2, titleHeight / 2 + 2);

  // Winner
  if (state.winner !== null) {
    const winner = state.players[state.winner];
    ctx.fillStyle = winner.color;
    ctx.font = `bold ${winnerFontSize}px ${font}`;
    ctx.fillText(`${winner.name} Wins!`, width / 2, titleHeight + winnerHeight / 2);
  }

  // Header row
  const headerY = panelTop + headerHeight / 2;
  ctx.fillStyle = "#9ca3af";
  ctx.font = `${headerFontSize}px ${font}`;
  ctx.textAlign = "left";
  ctx.fillText("Rank", colRank, headerY);
  ctx.fillText("Player", colName, headerY);
  ctx.textAlign = "right";
  ctx.fillText("Stock", colStock, headerY);
  ctx.fillText("Cash", colCash, headerY);
  ctx.fillText("Net Worth", colNetWorth, headerY);

  // Separator
  ctx.strokeStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(padding, panelTop + headerHeight);
  ctx.lineTo(width - padding, panelTop + headerHeight);
  ctx.stroke();

  // Player rows
  for (let i = 0; i < sortedPlayers.length; i++) {
    const p = sortedPlayers[i];
    const y = panelTop + headerHeight + i * rowHeight + rowHeight / 2;
    const isWinner = state.winner === p.index;
    const stockValue = p.netWorth - p.cash;

    if (i > 0) {
      ctx.strokeStyle = "#1f2937";
      ctx.beginPath();
      ctx.moveTo(padding, panelTop + headerHeight + i * rowHeight);
      ctx.lineTo(width - padding, panelTop + headerHeight + i * rowHeight);
      ctx.stroke();
    }

    // Rank
    ctx.textAlign = "left";
    ctx.fillStyle = isWinner ? p.color : "#e5e7eb";
    ctx.font = `${isWinner ? "bold " : ""}${fontSize}px ${font}`;
    ctx.fillText(`${i + 1}`, colRank, y);

    // Name
    ctx.textAlign = "left";
    ctx.fillStyle = p.color;
    ctx.font = `${isWinner ? "bold " : ""}${fontSize}px ${font}`;
    ctx.fillText(p.name, colName, y);

    // Stock
    ctx.textAlign = "right";
    ctx.fillStyle = isWinner ? p.color : "#e5e7eb";
    ctx.fillText(`$${stockValue.toLocaleString()}`, colStock, y);

    // Cash
    ctx.fillText(`$${p.cash.toLocaleString()}`, colCash, y);

    // Net Worth
    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.fillText(`$${p.netWorth.toLocaleString()}`, colNetWorth, y);
  }

  // Footer — steps
  const footerY = panelTop + headerHeight + sortedPlayers.length * rowHeight + footerHeight / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = "#6b7280";
  ctx.font = `${headerFontSize}px ${font}`;
  ctx.fillText(`Steps: ${state.currentStep} / ${state.totalSteps}`, width / 2, footerY);

  return canvas.toBuffer("image/png");
}
