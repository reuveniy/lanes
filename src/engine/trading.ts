import type { GameState, GameMessage, Company, Player } from "../types/game";
import { recalcControllingPlayer } from "./companies";

export function getMaxBuyable(player: Player, company: Company): number {
  if (company.stockPrice <= 0) return 0;
  return Math.floor(player.cash / company.stockPrice);
}

export function canAffordAnyShare(
  player: Player,
  companies: Company[]
): boolean {
  return companies.some(
    (c) => c.size > 0 && c.stockPrice <= player.cash
  );
}

export function buyShares(
  state: GameState,
  companyIndex: number,
  amount: number,
  playerIndex: number
): GameState {
  const company = state.companies[companyIndex];
  const cost = amount * company.stockPrice;
  if (cost > state.players[playerIndex].cash || amount <= 0) return state;

  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));
  const players = state.players.map((p) => ({ ...p }));

  companies[companyIndex].shares[playerIndex] += amount;
  players[playerIndex].cash -= cost;
  companies[companyIndex].controllingPlayer = recalcControllingPlayer(
    companies[companyIndex]
  );

  const messages: GameMessage[] = [
    ...state.messages,
    {
      text: `${players[playerIndex].name} buys ${amount} shares of ${company.name} for $${cost}`,
      type: "info",
    },
  ];

  return { ...state, companies, players, messages };
}

/** Max sell value remaining this turn (30% of net worth - already sold) */
export function getMaxSellValue(state: GameState, playerIndex: number): number {
  const netWorth = state.players[playerIndex].netWorth;
  const maxSell = Math.floor(netWorth * 0.3);
  const sold = state.tradingState?.soldThisTurn ?? 0;
  return Math.max(0, maxSell - sold);
}

/** Max shares of a company sellable this turn given sell limit */
export function getMaxSellableShares(
  state: GameState,
  companyIndex: number,
  playerIndex: number
): number {
  const company = state.companies[companyIndex];
  const held = company.shares[playerIndex];
  const remaining = getMaxSellValue(state, playerIndex);
  const shareValue = Math.floor(company.stockPrice * 0.95);
  if (shareValue <= 0) return held;
  return Math.min(held, Math.floor(remaining / shareValue));
}

export function sellShares(
  state: GameState,
  companyIndex: number,
  amount: number,
  playerIndex: number
): GameState {
  const company = state.companies[companyIndex];
  if (amount <= 0 || amount > company.shares[playerIndex]) return state;

  // Enforce sell limit
  const maxSellable = getMaxSellableShares(state, companyIndex, playerIndex);
  const actualAmount = Math.min(amount, maxSellable);
  if (actualAmount <= 0) return state;

  const revenue = Math.floor(actualAmount * company.stockPrice * 0.95);

  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));
  const players = state.players.map((p) => ({ ...p }));

  companies[companyIndex].shares[playerIndex] -= actualAmount;
  players[playerIndex].cash += revenue;
  companies[companyIndex].controllingPlayer = recalcControllingPlayer(
    companies[companyIndex]
  );

  // Track sell total for sell limit
  const tradingState = state.tradingState
    ? { ...state.tradingState, soldThisTurn: state.tradingState.soldThisTurn + revenue }
    : null;

  const messages: GameMessage[] = [
    ...state.messages,
    {
      text: `${players[playerIndex].name} sells ${actualAmount} shares of ${company.name} for $${revenue} (5% commission)`,
      type: "info",
    },
  ];

  return { ...state, companies, players, messages, tradingState };
}

export function getNextTradableCompany(
  state: GameState,
  startIndex: number,
  playerIndex: number
): number | null {
  for (let i = startIndex; i < state.companies.length; i++) {
    const c = state.companies[i];
    if (c.size > 0) {
      // Offer if player can buy or already holds shares
      if (
        c.stockPrice <= state.players[playerIndex].cash ||
        c.shares[playerIndex] > 0
      ) {
        return i;
      }
    }
  }
  return null;
}

export function shouldRepeatTradingLoop(player: Player): boolean {
  return player.cash > 2500;
}
