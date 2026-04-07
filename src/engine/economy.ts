import { MAX_COMPANIES, type GameState, type GameMessage } from "../types/game";
import type { Rng } from "./rng";
import { recalcControllingPlayer } from "./companies";

export function calculateNetWorth(
  playerIndex: number,
  state: GameState
): number {
  let stockValue = 0;
  for (const company of state.companies) {
    stockValue += company.shares[playerIndex] * company.stockPrice;
  }
  return state.players[playerIndex].cash + stockValue;
}

export function updateAllNetWorths(state: GameState): GameState {
  const players = state.players.map((p, i) => ({
    ...p,
    netWorth: calculateNetWorth(i, state),
  }));
  // Recalculate controlling player for all companies
  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
    controllingPlayer: c.size > 0 ? recalcControllingPlayer(c) : null,
  }));
  return { ...state, players, companies };
}

export function findLeadingPlayer(state: GameState): number {
  let leader = 0;
  let maxWorth = 0;
  for (let i = 0; i < state.players.length; i++) {
    const nw = calculateNetWorth(i, state);
    if (nw > maxWorth) {
      maxWorth = nw;
      leader = i;
    }
  }
  return leader;
}

export function payDividends(state: GameState, playerIndex: number): GameState {
  const players = state.players.map((p) => ({ ...p }));
  let totalDividend = 0;

  for (const company of state.companies) {
    if (company.size === 0) continue;
    const shares = company.shares[playerIndex];
    if (shares > 0) {
      const dividend = Math.floor(0.05 * shares * company.stockPrice);
      players[playerIndex].cash += dividend;
      totalDividend += dividend;
    }
  }

  return { ...state, players };
}

export function growBankBonus(state: GameState): GameState {
  return { ...state, bankBonus: Math.floor(state.bankBonus * 1.05) };
}

export function checkDoublePay(
  state: GameState,
  row: number,
  col: number,
  playerIndex: number
): GameState {
  const isDoublePay = state.hiddenFeatures.doublePays.some(
    (p) => p.row === row && p.col === col
  );
  if (!isDoublePay) return state;

  const leader = findLeadingPlayer(state);
  if (playerIndex === leader) return state;

  const players = state.players.map((p) => ({ ...p }));
  players[playerIndex].cash *= 2;
  players[playerIndex].doublePays++;

  const messages: GameMessage[] = [
    ...state.messages,
    {
      text: `${players[playerIndex].name} hit Double Pay! Cash doubled to $${players[playerIndex].cash}!`,
      type: "positive",
      alarm: 1,
    },
  ];

  return { ...state, players, messages };
}

export function checkTrap(
  state: GameState,
  row: number,
  col: number,
  playerIndex: number,
  rng: Rng
): GameState {
  // Traps only active when company Z (index 25) exists
  if (state.companies[MAX_COMPANIES - 1].size === 0) return state;

  const isTrap = state.hiddenFeatures.traps.some(
    (p) => p.row === row && p.col === col
  );
  if (!isTrap) return state;

  const players = state.players.map((p) => ({ ...p }));
  const messages: GameMessage[] = [...state.messages];
  let lostCash: number;

  if (rng.next() <= 0.65) {
    lostCash = players[playerIndex].cash;
    players[playerIndex].cash = 0;
    messages.push({
      text: `TRAP! ${players[playerIndex].name} lost ALL cash ($${lostCash})!`,
      type: "critical",
      alarm: 1,
    });
  } else {
    lostCash = Math.floor(players[playerIndex].cash / 2);
    players[playerIndex].cash -= lostCash;
    messages.push({
      text: `TRAP! ${players[playerIndex].name} lost half their cash ($${lostCash})!`,
      type: "critical",
      alarm: 1,
    });
  }

  return {
    ...state,
    players,
    messages,
    bankBonus: state.bankBonus + lostCash,
    trapped: true,
  };
}

export function checkBonusPayment(
  state: GameState,
  playerIndex: number,
  rng: Rng
): GameState {
  if (rng.next() > 0.1) return state;

  const bonus = Math.floor(state.bankBonus / 2);
  if (bonus <= 0) return state;

  const players = state.players.map((p) => ({ ...p }));
  players[playerIndex].cash += bonus;

  const messages: GameMessage[] = [
    ...state.messages,
    {
      text: `${players[playerIndex].name} receives bank bonus of $${bonus}!`,
      type: "positive",
      alarm: 1,
    },
  ];

  return {
    ...state,
    players,
    messages,
    bankBonus: state.bankBonus - bonus,
  };
}

/**
 * SpecialHelp (v1.17): if a player's net worth < 45% of leader's
 * after 3×players turns, they get 18% of leader's net worth as bonus.
 */
export function checkSpecialHelp(
  state: GameState,
  playerIndex: number
): GameState {
  const playerCount = state.players.length;
  if (state.currentStep <= playerCount * 3) return state;

  const leader = findLeadingPlayer(state);
  if (playerIndex === leader) return state;

  const leaderWorth = state.players[leader].netWorth;
  const playerWorth = state.players[playerIndex].netWorth;

  if (playerWorth >= leaderWorth * 0.45) return state;

  const bonus = Math.floor(leaderWorth * 0.18);
  if (bonus <= 0) return state;

  const players = state.players.map((p) => ({ ...p }));
  players[playerIndex].cash += bonus;
  players[playerIndex].doublePays++;

  const messages: GameMessage[] = [
    ...state.messages,
    {
      text: `SpecialHelp! ${players[playerIndex].name} receives $${bonus.toLocaleString()} bonus (18% of leader)!`,
      type: "positive",
      alarm: 1,
    },
  ];

  return { ...state, players, messages };
}

export function checkFreezeTrap(
  state: GameState,
  row: number,
  col: number
): boolean {
  return state.hiddenFeatures.freezeTraps.some(
    (p) => p.row === row && p.col === col
  );
}
