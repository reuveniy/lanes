import { createCanvas } from "canvas";
import type { LeaderboardEntryInfo } from "./protocol";

/**
 * Render leaderboard as a PNG image matching the in-game dark theme.
 * Rendered at 2x resolution for crisp text on high-DPI / WhatsApp.
 * Returns a Buffer of PNG data.
 */
export function renderLeaderboardImage(entries: LeaderboardEntryInfo[]): Buffer {
  const scale = 2;
  const padding = 24;
  const rowHeight = 36;
  const headerHeight = 44;
  const titleHeight = 48;
  const fontSize = 18;
  const headerFontSize = 14;
  const titleFontSize = 22;
  const font = "'DejaVu Sans Mono', monospace";

  // Column positions
  const colRank = padding;
  const colName = padding + 40;
  const width = 520;
  const colPct = width - padding;
  const colGames = colPct - 60;
  const colWins = colGames - 50;

  const height = titleHeight + headerHeight + entries.length * rowHeight + padding;

  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  // Scale everything by 2x for high-res output
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = `bold ${titleFontSize}px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText("STAR LANES LEADERBOARD", padding, titleHeight / 2 + 2);

  // Separator line under title
  ctx.strokeStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(padding, titleHeight);
  ctx.lineTo(width - padding, titleHeight);
  ctx.stroke();

  // Header row
  const headerY = titleHeight + headerHeight / 2;
  ctx.fillStyle = "#6b7280";
  ctx.font = `${headerFontSize}px ${font}`;
  ctx.textAlign = "left";
  ctx.fillText("#", colRank, headerY);
  ctx.fillText("Player", colName, headerY);
  ctx.textAlign = "right";
  ctx.fillText("W", colWins, headerY);
  ctx.fillText("G", colGames, headerY);
  ctx.fillText("%", colPct, headerY);

  // Separator line under header
  ctx.strokeStyle = "#1f2937";
  ctx.beginPath();
  ctx.moveTo(padding, titleHeight + headerHeight);
  ctx.lineTo(width - padding, titleHeight + headerHeight);
  ctx.stroke();

  // Data rows
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const y = titleHeight + headerHeight + i * rowHeight + rowHeight / 2;
    const isLeader = i === 0 && e.wins > 0;
    const winPct = e.games > 0 ? Math.round((e.wins / e.games) * 100) : 0;

    // Row separator
    if (i > 0) {
      ctx.strokeStyle = "#1f2937";
      ctx.beginPath();
      ctx.moveTo(padding, titleHeight + headerHeight + i * rowHeight);
      ctx.lineTo(width - padding, titleHeight + headerHeight + i * rowHeight);
      ctx.stroke();
    }

    // Rank
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillText(`${i + 1}`, colRank, y);

    // Name
    ctx.fillStyle = isLeader ? "#fbbf24" : "#e5e7eb";
    ctx.font = `${isLeader ? "bold " : ""}${fontSize}px ${font}`;
    ctx.fillText(e.name, colName, y);

    // Wins
    ctx.textAlign = "right";
    ctx.fillStyle = e.wins > 0 ? "#22c55e" : "#6b7280";
    ctx.font = `${e.wins > 0 ? "bold " : ""}${fontSize}px ${font}`;
    ctx.fillText(`${e.wins}`, colWins, y);

    // Games
    ctx.fillStyle = "#9ca3af";
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillText(`${e.games}`, colGames, y);

    // Percentage
    ctx.fillText(e.games > 0 ? `${winPct}%` : "-", colPct, y);
  }

  return canvas.toBuffer("image/png");
}
