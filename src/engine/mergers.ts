import { ROWS, COLS, type GameState, type GameMessage } from "../types/game";
import { getAdjacentCompanies } from "./neighbors";
import { recalcControllingPlayer } from "./companies";

export function detectMergers(
  grid: number[][],
  row: number,
  col: number
): [number, number][] {
  const adjacent = getAdjacentCompanies(grid, row, col);
  const active = [...adjacent].filter((i) => true); // all are active if on grid
  if (active.length < 2) return [];

  // Sort by size descending — largest survives
  const pairs: [number, number][] = [];
  const sorted = [...active];
  // We'll resolve them in the reducer where we have company data
  // For now return all unique pairs
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
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

  // Determine survivor (larger) and absorbed (smaller)
  let survivorIdx = companyA;
  let absorbedIdx = companyB;
  if (companies[companyB].size > companies[companyA].size) {
    survivorIdx = companyB;
    absorbedIdx = companyA;
  }

  const survivor = companies[survivorIdx];
  const absorbed = companies[absorbedIdx];

  messages.push({
    text: `${absorbed.name} merges into ${survivor.name}!`,
    type: "critical",
    alarm: 2,
  });

  // Calculate total shares of absorbed company
  const totalAbsorbedShares = absorbed.shares.reduce((a, b) => a + b, 0);

  // Compensate shareholders
  for (let p = 0; p < players.length; p++) {
    const oldShares = absorbed.shares[p];
    if (oldShares === 0) continue;

    // Convert shares: 0.5 ratio with rounding
    const newShares = Math.floor(0.5 * oldShares + 0.5);
    survivor.shares[p] += newShares;

    // Cash bonus
    const bonus =
      totalAbsorbedShares > 0
        ? Math.floor(
            10 * (oldShares / totalAbsorbedShares) * absorbed.stockPrice
          )
        : 0;
    players[p].cash += bonus;

    messages.push({
      text: `${players[p].name}: ${oldShares} -> ${newShares} shares + $${bonus} bonus`,
      type: "positive",
    });
  }

  // Recolor all absorbed territory
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
  if (survivor.stockPrice >= 3000) {
    survivor.stockPrice = Math.floor(survivor.stockPrice / 2);
    for (let p = 0; p < survivor.shares.length; p++) {
      survivor.shares[p] *= 2;
    }
    messages.push({
      text: `${survivor.name} stock split! Price halved, shares doubled.`,
      type: "alert",
    });
  }

  survivor.controllingPlayer = recalcControllingPlayer(survivor);

  return { ...state, grid, companies, players, messages };
}
