import {
  CellType,
  ROWS,
  COLS,
  MAX_COMPANIES,
  COMPANY_NAMES,
  type GameState,
  type Company,
} from "../types/game";
import { getCell } from "./neighbors";

const ORTHO: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, 1],
  [0, -1],
];

export function findFirstAvailableSlot(companies: Company[]): number | null {
  for (let i = 0; i < MAX_COMPANIES; i++) {
    if (companies[i].size === 0) return i;
  }
  return null;
}

export function createCompany(
  index: number,
  playerCount: number
): Company {
  return {
    index,
    letter: String.fromCharCode(65 + index),
    name: COMPANY_NAMES[index],
    size: 0,
    stockPrice: 100,
    shares: Array(playerCount).fill(0),
    controllingPlayer: null,
  };
}

export function recalcControllingPlayer(company: Company): number | null {
  let maxShares = 0;
  let controller: number | null = null;
  for (let p = 0; p < company.shares.length; p++) {
    if (company.shares[p] > maxShares) {
      maxShares = company.shares[p];
      controller = p;
    }
  }
  return controller;
}

export function foundCompany(
  state: GameState,
  row: number,
  col: number,
  playerIndex: number
): GameState {
  const slot = findFirstAvailableSlot(state.companies);
  if (slot === null) return state;

  const grid = state.grid.map((r) => [...r]);
  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));
  const players = state.players.map((p) => ({ ...p }));

  const companyValue = 5 + slot;
  grid[row][col] = companyValue;

  const company = companies[slot];
  company.size = 1;
  company.stockPrice = 100;
  company.shares[playerIndex] = 5; // 5 free shares to founder
  company.controllingPlayer = playerIndex;

  // Apply adjacent bonuses
  for (const [dr, dc] of ORTHO) {
    const nr = row + dr;
    const nc = col + dc;
    const v = getCell(grid, nr, nc);
    if (v === CellType.GoldStar) {
      company.stockPrice += 1000;
    } else if (v === CellType.Star) {
      company.stockPrice += 500;
    } else if (v === CellType.Outpost) {
      company.stockPrice += 100;
      company.size++;
      grid[nr][nc] = companyValue;
    }
  }

  // Check stock split
  if (company.stockPrice >= 3000) {
    company.stockPrice = Math.floor(company.stockPrice / 2);
    for (let p = 0; p < company.shares.length; p++) {
      company.shares[p] *= 2;
    }
  }

  const messages = [
    ...state.messages,
    {
      text: `${company.name} founded by ${players[playerIndex].name}! (5 free shares)`,
      type: "positive" as const,
      alarm: 3 as const,
    },
  ];

  return { ...state, grid, companies, players, messages };
}

export function joinCompany(
  state: GameState,
  row: number,
  col: number,
  companyIndex: number
): GameState {
  const grid = state.grid.map((r) => [...r]);
  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));

  const companyValue = 5 + companyIndex;
  grid[row][col] = companyValue;

  const company = companies[companyIndex];
  company.size++;
  company.stockPrice += 100;

  // Adjacent bonuses
  for (const [dr, dc] of ORTHO) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
    const v = grid[nr][nc];
    if (v === CellType.GoldStar) {
      company.stockPrice += 1000;
    } else if (v === CellType.Star) {
      company.stockPrice += 500;
    } else if (v === CellType.Outpost) {
      company.stockPrice += 100;
      company.size++;
      grid[nr][nc] = companyValue;
    }
  }

  // Stock split
  if (company.stockPrice >= 3000) {
    company.stockPrice = Math.floor(company.stockPrice / 2);
    for (let p = 0; p < company.shares.length; p++) {
      company.shares[p] *= 2;
    }
  }

  company.controllingPlayer = recalcControllingPlayer(company);

  return { ...state, grid, companies };
}
