import { createCanvas } from "canvas";
import type { GameState } from "../src/types/game";
import { CellType, ROWS, COLS, PLAYER_COLORS } from "../src/types/game";

const SCALE = 2;
const CELL = 18;
const FONT = "'DejaVu Sans Mono', monospace";

const COLORS = {
  bg: "#0a0a1a",
  panelBg: "#111827",
  border: "#374151",
  dimBorder: "#1f2937",
  text: "#e5e7eb",
  dim: "#9ca3af",
  dimmer: "#6b7280",
  gold: "#fbbf24",
  green: "#22c55e",
  red: "#ef4444",
  cyan: "#06b6d4",
  purple: "#a78bfa",
  empty: "#4b5563",
  outpost: "#9ca3af",
  star: "#c0c0c0",
  goldStar: "#f59e0b",
  moveOption: "#facc15",
};

function getCompanyColors(state: GameState): (string | null)[] {
  return state.companies.map((c) =>
    c.controllingPlayer !== null
      ? PLAYER_COLORS[c.controllingPlayer]
      : c.size > 0
        ? "#6b7280"
        : null
  );
}

function drawRoundedRect(
  ctx: any,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawMap(ctx: any, state: GameState, x0: number, y0: number): { w: number; h: number } {
  const companyColors = getCompanyColors(state);
  const w = COLS * CELL;
  const h = ROWS * CELL;

  drawRoundedRect(ctx, x0 - 4, y0 - 4, w + 8, h + 8, 4, COLORS.panelBg, COLORS.border);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = x0 + c * CELL + CELL / 2;
      const cy = y0 + r * CELL + CELL / 2;
      const val = state.grid[r]?.[c] ?? CellType.Empty;

      // Check if this is a move option
      const moveOpt = state.moveOptions.find((m) => m.row === r && m.col === c);
      if (moveOpt) {
        ctx.fillStyle = COLORS.moveOption;
        ctx.font = `bold 11px ${FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(moveOpt.label, cx, cy);
        continue;
      }

      ctx.font = `10px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (val === CellType.Empty) {
        ctx.fillStyle = COLORS.empty;
        ctx.fillText("·", cx, cy);
      } else if (val === CellType.Outpost) {
        ctx.fillStyle = COLORS.outpost;
        ctx.fillText("+", cx, cy);
      } else if (val === CellType.Star) {
        ctx.fillStyle = COLORS.star;
        ctx.fillText("★", cx, cy);
      } else if (val === CellType.GoldStar) {
        ctx.fillStyle = COLORS.goldStar;
        ctx.fillText("★", cx, cy);
      } else if (val >= 5) {
        const ci = val - 5;
        const color = companyColors[ci] || COLORS.dimmer;
        const letter = String.fromCharCode(65 + ci);
        ctx.fillStyle = color;
        ctx.font = `bold 10px ${FONT}`;
        ctx.fillText(letter, cx, cy);
      }
    }
  }

  return { w: w + 8, h: h + 8 };
}

function drawStepCounter(ctx: any, state: GameState, x0: number, y0: number, panelW: number): number {
  const h = 40;
  drawRoundedRect(ctx, x0, y0, panelW, h, 4, COLORS.panelBg, COLORS.border);

  ctx.textBaseline = "middle";
  const cy = y0 + h / 2;

  ctx.fillStyle = COLORS.dimmer;
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("STEP", x0 + 8, cy);

  ctx.fillStyle = COLORS.gold;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = "center";
  const stepText = `${String(state.currentStep).padStart(3, "0")}/${state.totalSteps}`;
  ctx.fillText(stepText, x0 + panelW / 2 + 15, cy);

  // Progress bar
  const barX = x0 + 8;
  const barY = y0 + h - 6;
  const barW = panelW - 16;
  const pct = Math.min(1, state.currentStep / state.totalSteps);
  const barColor = pct < 0.5 ? COLORS.green : pct < 0.8 ? COLORS.gold : COLORS.red;

  ctx.fillStyle = COLORS.dimBorder;
  ctx.fillRect(barX, barY, barW, 3);
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * pct, 3);

  return h;
}

function drawNetWorth(ctx: any, state: GameState, x0: number, y0: number, panelW: number): number {
  const rowH = 22;
  const headerH = 20;
  const h = headerH + state.players.length * rowH + 8;
  drawRoundedRect(ctx, x0, y0, panelW, h, 4, COLORS.panelBg, COLORS.border);

  ctx.fillStyle = COLORS.dimmer;
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("NET WORTH", x0 + 8, y0 + headerH / 2 + 2);

  const maxWorth = Math.max(...state.players.map((p) => p.netWorth), 1);

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    const ry = y0 + headerH + i * rowH;
    const isCurrent = i === state.currentPlayer;

    // Name
    ctx.fillStyle = p.color;
    ctx.font = `${isCurrent ? "bold " : ""}11px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(`${isCurrent ? "▶ " : "  "}${p.name}`, x0 + 8, ry + 8);

    // Value
    ctx.fillStyle = COLORS.text;
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(`$${p.netWorth.toLocaleString()}`, x0 + panelW - 8, ry + 8);

    // Bar
    const barW = panelW - 16;
    const barPct = p.netWorth / maxWorth;
    ctx.fillStyle = COLORS.dimBorder;
    ctx.fillRect(x0 + 8, ry + 16, barW, 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(x0 + 8, ry + 16, barW * barPct, 3);
  }

  return h;
}

function drawPlayerStats(ctx: any, state: GameState, x0: number, y0: number, panelW: number): number {
  const p = state.players[state.currentPlayer];
  if (!p) return 0;

  const lines = [
    { label: "Cash", value: `$${p.cash.toLocaleString()}`, color: COLORS.green },
    { label: "Dp", value: `${p.doublePays}`, color: COLORS.text },
    { label: "Bonus", value: `${p.bonusCount}${p.totalBonusReceived > 0 ? ` ($${p.totalBonusReceived.toLocaleString()})` : ""}`, color: COLORS.text },
    { label: "Freeze", value: `${p.freezeCount}`, color: p.freezeCount > 0 ? COLORS.cyan : COLORS.text },
    { label: "Traps", value: `${p.trapCount}${p.halfTrapCount > 0 ? ` (½:${p.halfTrapCount})` : ""}`, color: p.trapCount > 0 ? COLORS.red : COLORS.text },
  ];
  if (p.specialHelpCount > 0) {
    lines.push({ label: "Help", value: `${p.specialHelpCount}`, color: COLORS.purple });
  }
  lines.push({ label: "Bank", value: `$${state.bankBonus.toLocaleString()}`, color: COLORS.gold });

  const lineH = 18;
  const headerH = 24;
  const h = headerH + lines.length * lineH + 8;
  drawRoundedRect(ctx, x0, y0, panelW, h, 4, COLORS.panelBg, COLORS.border);

  // Player name header
  ctx.fillStyle = p.color;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(p.name, x0 + 8, y0 + headerH / 2 + 2);

  for (let i = 0; i < lines.length; i++) {
    const ly = y0 + headerH + i * lineH + lineH / 2;
    ctx.fillStyle = COLORS.dim;
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(lines[i].label, x0 + 8, ly);
    ctx.fillStyle = lines[i].color;
    ctx.textAlign = "right";
    ctx.fillText(lines[i].value, x0 + panelW - 8, ly);
  }

  return h;
}

/**
 * Render a board snapshot: map + step counter + net worth + current player stats.
 * Returns PNG buffer.
 */
export function renderBoardSnapshot(state: GameState): Buffer {
  const padding = 12;
  const gap = 8;
  const panelW = 160;
  const mapW = COLS * CELL + 8;
  const mapH = ROWS * CELL + 8;
  const totalW = padding + mapW + gap + panelW + padding;

  // Pre-calculate right panel height to determine canvas height
  const stepH = 40;
  const netWorthRowH = 22;
  const netWorthH = 20 + state.players.length * netWorthRowH + 8;
  const statsLines = 7 + (state.players[state.currentPlayer]?.specialHelpCount > 0 ? 1 : 0);
  const statsH = 24 + statsLines * 18 + 8;
  const rightH = stepH + gap + netWorthH + gap + statsH;
  const totalH = padding + Math.max(mapH, rightH) + padding;

  const canvas = createCanvas(totalW * SCALE, totalH * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, totalW, totalH);

  // Map
  drawMap(ctx, state, padding + 4, padding + 4);

  // Right panels
  const rx = padding + mapW + gap;
  let ry = padding;

  ry += drawStepCounter(ctx, state, rx, ry, panelW) + gap;
  ry += drawNetWorth(ctx, state, rx, ry, panelW) + gap;
  drawPlayerStats(ctx, state, rx, ry, panelW);

  return canvas.toBuffer("image/png");
}
