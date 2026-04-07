import {
  CellType,
  ROWS,
  COLS,
  type HiddenFeatures,
  type Position,
} from "../types/game";
import type { Rng } from "./rng";
import {
  allOrthogonalAreStars,
  forms2x2StarBlock,
  countAdjacentOfType,
  hasAdjacentOfType,
  getCell,
} from "./neighbors";

function placeStars(grid: number[][], starCount: number, rng: Rng): void {
  let placed = 0;
  let attempts = 0;
  while (placed < starCount && attempts < starCount * 20) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    if (grid[r][c] !== CellType.Empty) continue;
    if (allOrthogonalAreStars(grid, r, c)) continue;
    if (forms2x2StarBlock(grid, r, c)) continue;
    grid[r][c] = CellType.Star;
    placed++;
  }
}

function placeGoldStars(
  grid: number[][],
  playerCount: number,
  rng: Rng
): number {
  const goldCount = Math.floor(playerCount * (1.5 + rng.next())) + 3;
  let placed = 0;
  let attempts = 0;
  while (placed < goldCount && attempts < goldCount * 40) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    if (r <= 0 || c <= 1 || r >= ROWS - 1 || c >= COLS - 2) continue;
    if (grid[r][c] !== CellType.Empty) continue;
    if (hasAdjacentOfType(grid, r, c, CellType.GoldStar)) continue;
    if (countAdjacentOfType(grid, r, c, CellType.Star, CellType.GoldStar) >= 3)
      continue;
    grid[r][c] = CellType.GoldStar;
    placed++;
  }
  return placed;
}


function placeTrapLocations(
  grid: number[][],
  goldCount: number,
  rng: Rng
): Position[] {
  const count = goldCount * 3;
  const traps: Position[] = [];
  let attempts = 0;
  while (traps.length < count && attempts < count * 40) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    const v = grid[r][c];
    if (v !== CellType.Empty && v !== CellType.Outpost) continue;
    if (
      countAdjacentOfType(grid, r, c, CellType.Star, CellType.GoldStar) < 2
    )
      continue;
    if (traps.some((t) => t.row === r && t.col === c)) continue;
    traps.push({ row: r, col: c });
  }
  return traps;
}

function placeFreezeTrapLocations(
  grid: number[][],
  goldCount: number,
  rng: Rng
): Position[] {
  const count = goldCount * 3;
  const freezeTraps: Position[] = [];
  let attempts = 0;
  while (freezeTraps.length < count && attempts < count * 40) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    const v = grid[r][c];
    if (v === CellType.Star || v === CellType.GoldStar) continue;
    if (freezeTraps.some((t) => t.row === r && t.col === c)) continue;
    freezeTraps.push({ row: r, col: c });
  }
  return freezeTraps;
}

function placeDoublePayLocations(grid: number[][], count: number, rng: Rng): Position[] {
  const doublePays: Position[] = [];
  let attempts = 0;
  while (doublePays.length < count && attempts < count * 20) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    const v = grid[r][c];
    if (v === CellType.Star || v === CellType.GoldStar) continue;
    if (doublePays.some((t) => t.row === r && t.col === c)) continue;
    doublePays.push({ row: r, col: c });
  }
  return doublePays;
}

export interface MapGenResult {
  grid: number[][];
  hiddenFeatures: HiddenFeatures;
  goldStarCount: number;
}

export function generateMap(
  playerCount: number,
  starCount: number,
  doublePayCount: number,
  rng: Rng
): MapGenResult {
  const grid: number[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => CellType.Empty)
  );

  placeStars(grid, starCount, rng);
  const goldStarCount = placeGoldStars(grid, playerCount, rng);
  // No outposts at map init — they form during gameplay when players
  // place on empty cells with no adjacent stars/companies

  const traps = placeTrapLocations(grid, goldStarCount, rng);
  const freezeTraps = placeFreezeTrapLocations(grid, goldStarCount, rng);
  const doublePays = placeDoublePayLocations(grid, doublePayCount, rng);

  return {
    grid,
    hiddenFeatures: { traps, freezeTraps, doublePays },
    goldStarCount,
  };
}
