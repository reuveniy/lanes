import { ROWS, COLS, type GameState, type GameMessage } from "../types/game";
import { getAdjacentCompanies } from "./neighbors";
import { recalcControllingPlayer } from "./companies";

export function detectMergers(
  grid: number[][],
  row: number,
  col: number
): [number, number][] {
  const adjacent = getAdjacentCompanies(grid, row, col);
  const active = [...adjacent];
  if (active.length < 2) return [];

  const pairs: [number, number][] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      pairs.push([active[i], active[j]]);
    }
  }
  return pairs;
}

function pad(s: string, w: number, align: "l" | "r" = "l"): string {
  if (s.length >= w) return s.slice(0, w);
  return align === "r" ? s.padStart(w) : s.padEnd(w);
}

export function resolveMerger(
  state: GameState,
  companyA: number,
  companyB: number
): GameState {
  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));
  const players = state.players.map((p) => ({ ...p }));
  const grid = state.grid.map((r) => [...r]);
  const messages: GameMessage[] = [...state.messages];

  let survivorIdx = companyA;
  let absorbedIdx = companyB;
  if (companies[companyB].size > companies[companyA].size) {
    survivorIdx = companyB;
    absorbedIdx = companyA;
  }

  const survivor = companies[survivorIdx];
  const absorbed = companies[absorbedIdx];
  const survivorPriceBefore = survivor.stockPrice;
  const absorbedPrice = absorbed.stockPrice;

  messages.push({
    text: `${absorbed.name} ($${absorbedPrice}) merges into ${survivor.name} ($${survivorPriceBefore})`,
    type: "critical",
    alarm: 2,
  });

  // Calculate total shares of absorbed company
  const totalAbsorbedShares = absorbed.shares.reduce((a, b) => a + b, 0);

  // Build per-player results before modifying state
  const playerResults: {
    name: string;
    oldAbsorbed: number;
    newSurvivor: number;
    bonus: number;
    totalAfter: number;
  }[] = [];

  for (let p = 0; p < players.length; p++) {
    const oldAbsorbed = absorbed.shares[p];
    const newShares = Math.floor(0.5 * oldAbsorbed + 0.5);
    const bonus =
      totalAbsorbedShares > 0
        ? Math.floor(10 * (oldAbsorbed / totalAbsorbedShares) * absorbed.stockPrice)
        : 0;

    // Apply
    survivor.shares[p] += newShares;
    players[p].cash += bonus;

    const totalAfter = survivor.shares[p];

    playerResults.push({
      name: players[p].name,
      oldAbsorbed,
      newSurvivor: newShares,
      bonus,
      totalAfter,
    });
  }

  // Recolor territory
  const absorbedValue = absorbedIdx + 5;
  const survivorValue = survivorIdx + 5;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === absorbedValue) {
        grid[r][c] = survivorValue;
      }
    }
  }

  // Survivor gains absorbed company's cells and value
  survivor.size += absorbed.size;
  survivor.stockPrice += absorbed.stockPrice;

  // Reset absorbed company
  absorbed.size = 0;
  absorbed.stockPrice = 100;
  absorbed.shares = absorbed.shares.map(() => 0);
  absorbed.controllingPlayer = null;

  // Post-merger stock split
  let splitMsg = false;
  if (survivor.stockPrice >= 3000) {
    survivor.stockPrice = Math.floor(survivor.stockPrice / 2);
    for (let p = 0; p < survivor.shares.length; p++) {
      survivor.shares[p] *= 2;
    }
    splitMsg = true;
  }

  survivor.controllingPlayer = recalcControllingPlayer(survivor);

  // Format merger table as monospace text messages
  const abL = absorbed.letter;
  const svL = survivor.letter;
  const W = { name: 9, col: 7 }; // column widths

  messages.push({
    text: `${pad(abL, W.name)}${pad("Old", W.col, "r")}${pad("New", W.col, "r")}${pad("Total", W.col, "r")}${pad("Bonus", W.col, "r")}`,
    type: "alert",
  });

  for (const pr of playerResults) {
    const hasShares = pr.oldAbsorbed > 0;
    messages.push({
      text: `${pad(pr.name, W.name)}${pad(String(pr.oldAbsorbed), W.col, "r")}${pad(String(pr.newSurvivor), W.col, "r")}${pad(String(pr.totalAfter), W.col, "r")}${pad("$" + pr.bonus, W.col, "r")}`,
      type: hasShares ? "positive" : "info",
    });
  }

  messages.push({
    text: `${survivor.name} new price: $${survivor.stockPrice}`,
    type: "info",
  });

  if (splitMsg) {
    messages.push({
      text: `${survivor.name} stock split! Price halved, shares doubled.`,
      type: "alert",
    });
  }

  return { ...state, grid, companies, players, messages };
}
