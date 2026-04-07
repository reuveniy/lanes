import {
  CellType,
  type GameState,
  type MoveOption,
} from "../types/game";
import { getAdjacentCompanies, countAdjacentOfType } from "./neighbors";
import { findFirstAvailableSlot } from "./companies";

/**
 * Score a move option for the current player.
 * Higher score = better move.
 */
function scoreMoveOption(state: GameState, opt: MoveOption): number {
  const { row, col } = opt;
  let score = 0;

  const adjCompanies = getAdjacentCompanies(state.grid, row, col);
  const adjStars = countAdjacentOfType(state.grid, row, col, CellType.Star);
  const adjGold = countAdjacentOfType(state.grid, row, col, CellType.GoldStar);
  const adjOutposts = countAdjacentOfType(state.grid, row, col, CellType.Outpost);
  const hasFreeSlot = findFirstAvailableSlot(state.companies) !== null;
  const p = state.currentPlayer;

  if (adjCompanies.size >= 2) {
    // Merger potential — very valuable
    // Prefer merging companies we own stock in
    let mergerValue = 500;
    for (const ci of adjCompanies) {
      const company = state.companies[ci];
      mergerValue += company.stockPrice;
      if (company.shares[p] > 0) mergerValue += company.shares[p] * 10;
    }
    score += mergerValue;
  } else if (adjCompanies.size === 1) {
    // Join existing company — grows it
    const ci = [...adjCompanies][0];
    const company = state.companies[ci];
    score += 100; // base value of growing
    score += adjStars * 500 + adjGold * 1000 + adjOutposts * 100;
    // More valuable if we own shares
    if (company.shares[p] > 0) {
      score += company.shares[p] * 5;
    }
    // More valuable if we're the controlling player
    if (company.controllingPlayer === p) {
      score += 200;
    }
  } else if (hasFreeSlot && (adjStars > 0 || adjGold > 0 || adjOutposts > 0)) {
    // Found new company — get 5 free shares
    score += 300;
    score += adjStars * 500 + adjGold * 1000 + adjOutposts * 100;
  } else {
    // Just an outpost — low value
    score += 10;
    // Slight preference for being near stars (future company potential)
    score += adjStars * 20 + adjGold * 40;
  }

  return score;
}

/** Pick the best move option index (1-based) */
export function pickBestMove(state: GameState): number {
  if (state.moveOptions.length === 0) return 1;

  let bestIdx = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < state.moveOptions.length; i++) {
    const score = scoreMoveOption(state, state.moveOptions[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx + 1; // 1-based
}

/**
 * Pick the best company to buy stock in.
 * Returns company index or -1 if none worth buying.
 */
export function pickBestBuy(state: GameState): { companyIndex: number; amount: number } | null {
  const p = state.currentPlayer;
  const player = state.players[p];
  if (player.cash < 100) return null;

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (const company of state.companies) {
    if (company.size === 0) continue;
    if (company.stockPrice <= 0) continue;
    if (company.stockPrice > player.cash) continue;

    let score = 0;

    // Prefer companies we already control (strengthen position)
    if (company.controllingPlayer === p) score += 300;
    else if (company.shares[p] > 0) score += 100;

    // Prefer larger companies (more stable, harder to absorb)
    score += company.size * 20;

    // Prefer cheaper stocks (more shares per dollar)
    score += 1000 / company.stockPrice;

    // Prefer companies with higher growth potential (more territory)
    score += company.stockPrice * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = company.index;
    }
  }

  if (bestIdx === -1) return null;

  const company = state.companies[bestIdx];
  const maxBuy = Math.floor(player.cash / company.stockPrice);

  // Don't spend everything — keep some cash for opportunities
  // Buy up to 60% of affordable shares, minimum 1
  const amount = Math.max(1, Math.floor(maxBuy * 0.6));

  return { companyIndex: bestIdx, amount };
}
