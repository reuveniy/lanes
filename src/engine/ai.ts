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
 * Pick move for timeout auto-play:
 * 1. Expand a company where current player is top holder with most stock value
 * 2. Neutral move (create company or outpost)
 * 3. Expand a company where the top holder has the least net worth
 * Returns 1-based index.
 */
export function pickTimeoutMove(state: GameState): number {
  if (state.moveOptions.length === 0) return 1;
  const p = state.currentPlayer;

  // Category 1: Expand company where player is top holder and has most stock value
  let bestOwnIdx = -1;
  let bestOwnValue = -1;
  // Category 2: Neutral moves — prefer forming companies with highest star value
  let bestNeutralIdx = -1;
  let bestNeutralValue = -1;
  const hasFreeSlot = findFirstAvailableSlot(state.companies) !== null;
  // Category 3: Expand company where top holder has least net worth
  let leastRivalIdx = -1;
  let leastRivalNetWorth = Infinity;

  for (let i = 0; i < state.moveOptions.length; i++) {
    const opt = state.moveOptions[i];
    const adjCompanies = getAdjacentCompanies(state.grid, opt.row, opt.col);

    if (adjCompanies.size === 0) {
      // Neutral: outpost or new company — score by adjacent stars/gold
      const adjStars = countAdjacentOfType(state.grid, opt.row, opt.col, CellType.Star);
      const adjGold = countAdjacentOfType(state.grid, opt.row, opt.col, CellType.GoldStar);
      const adjOutposts = countAdjacentOfType(state.grid, opt.row, opt.col, CellType.Outpost);
      // Value mirrors the stock price bonus: gold=+1000, star=+500, outpost=+100
      const formValue = hasFreeSlot && (adjStars > 0 || adjGold > 0 || adjOutposts > 0)
        ? adjGold * 1000 + adjStars * 500 + adjOutposts * 100
        : 0; // pure outpost with no adjacency
      if (formValue > bestNeutralValue) {
        bestNeutralValue = formValue;
        bestNeutralIdx = i;
      } else if (bestNeutralIdx === -1) {
        bestNeutralIdx = i; // fallback: any neutral move
      }
      continue;
    }

    // Check if this is a merger (adjacent to 2+ different companies)
    const isMerger = adjCompanies.size >= 2;

    if (isMerger) {
      // Only pick a merger if player controls the biggest company in the merge
      let biggestSize = 0;
      let biggestControlledByPlayer = false;
      for (const ci of adjCompanies) {
        const company = state.companies[ci];
        if (company.size === 0) continue;
        if (company.size > biggestSize) {
          biggestSize = company.size;
          biggestControlledByPlayer = company.controllingPlayer === p;
        }
      }
      if (biggestControlledByPlayer) {
        // Player controls the survivor — good merger
        let mergerValue = 0;
        for (const ci of adjCompanies) {
          mergerValue += state.companies[ci].shares[p] * state.companies[ci].stockPrice;
        }
        if (mergerValue > bestOwnValue) {
          bestOwnValue = mergerValue;
          bestOwnIdx = i;
        }
      }
      // Skip mergers where player doesn't control biggest — too risky
      continue;
    }

    // Single company expansion
    for (const ci of adjCompanies) {
      const company = state.companies[ci];
      if (company.size === 0) continue;
      const playerShares = company.shares[p];
      const playerStockValue = playerShares * company.stockPrice;
      const isTopHolder = company.controllingPlayer === p;

      if (isTopHolder && playerStockValue > bestOwnValue) {
        bestOwnValue = playerStockValue;
        bestOwnIdx = i;
      }

      // Track rival with least net worth who controls this company
      if (!isTopHolder && company.controllingPlayer !== null) {
        const rivalNetWorth = state.players[company.controllingPlayer]?.netWorth ?? Infinity;
        if (rivalNetWorth < leastRivalNetWorth) {
          leastRivalNetWorth = rivalNetWorth;
          leastRivalIdx = i;
        }
      }
    }
  }

  if (bestOwnIdx !== -1) return bestOwnIdx + 1;
  if (bestNeutralIdx !== -1) return bestNeutralIdx + 1;
  if (leastRivalIdx !== -1) return leastRivalIdx + 1;
  return 1; // fallback to first option
}

/**
 * Pick timeout auto-trade buys:
 * - Half cash → company where player has the most shares
 * - Other half → largest company the player owns stock in
 * If both pick the same company, all cash goes there.
 * Returns array of { companyIndex, amount } buys.
 */
export function pickTimeoutBuy(state: GameState): { companyIndex: number; amount: number }[] {
  const p = state.currentPlayer;
  const player = state.players[p];
  if (player.cash < 100) return [];

  // Find company where player has the most shares
  let mostSharesIdx = -1;
  let mostShares = 0;
  // Find largest company the player owns stock in
  let largestOwnedIdx = -1;
  let largestSize = -1;

  for (const company of state.companies) {
    if (company.size === 0 || company.stockPrice <= 0) continue;
    if (company.shares[p] <= 0) continue;

    if (company.shares[p] > mostShares) {
      mostShares = company.shares[p];
      mostSharesIdx = company.index;
    }
    if (company.size > largestSize) {
      largestSize = company.size;
      largestOwnedIdx = company.index;
    }
  }

  // Fallback: if player owns no stock, buy largest affordable company
  if (mostSharesIdx === -1) {
    for (const company of state.companies) {
      if (company.size === 0 || company.stockPrice <= 0) continue;
      if (company.stockPrice > player.cash) continue;
      if (company.size > largestSize) {
        largestSize = company.size;
        largestOwnedIdx = company.index;
      }
    }
    if (largestOwnedIdx === -1) return [];
    const c = state.companies[largestOwnedIdx];
    const amt = Math.floor(player.cash / c.stockPrice);
    return amt > 0 ? [{ companyIndex: largestOwnedIdx, amount: amt }] : [];
  }

  const buys: { companyIndex: number; amount: number }[] = [];
  const halfCash = Math.floor(player.cash / 2);

  if (mostSharesIdx === largestOwnedIdx || largestOwnedIdx === -1) {
    // Same company or only one found — spend all cash
    const c = state.companies[mostSharesIdx];
    if (c.stockPrice <= player.cash) {
      const amt = Math.floor(player.cash / c.stockPrice);
      if (amt > 0) buys.push({ companyIndex: mostSharesIdx, amount: amt });
    }
  } else {
    // Split: first half to most-shares company, second half to largest owned
    const c1 = state.companies[mostSharesIdx];
    if (c1.stockPrice <= halfCash) {
      const amt1 = Math.floor(halfCash / c1.stockPrice);
      if (amt1 > 0) buys.push({ companyIndex: mostSharesIdx, amount: amt1 });
    }
    const remainingCash = player.cash - (buys.length > 0 ? buys[0].amount * c1.stockPrice : 0);
    const c2 = state.companies[largestOwnedIdx];
    if (c2.stockPrice <= remainingCash) {
      const amt2 = Math.floor(remainingCash / c2.stockPrice);
      if (amt2 > 0) buys.push({ companyIndex: largestOwnedIdx, amount: amt2 });
    }
  }

  return buys;
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
