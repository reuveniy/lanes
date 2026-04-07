import { CellType, ROWS, COLS } from "../types/game";

export function getCell(grid: number[][], r: number, c: number): number {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
  return grid[r][c];
}

const ORTHO: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, 1],
  [0, -1],
];

export function getOrthogonalValues(
  grid: number[][],
  r: number,
  c: number
): number[] {
  return ORTHO.map(([dr, dc]) => getCell(grid, r + dr, c + dc));
}

export function getAdjacentCompanies(
  grid: number[][],
  r: number,
  c: number
): Set<number> {
  const companies = new Set<number>();
  for (const [dr, dc] of ORTHO) {
    const v = getCell(grid, r + dr, c + dc);
    if (v >= 5) {
      companies.add(v - 5);
    }
  }
  return companies;
}

export function countAdjacentOfType(
  grid: number[][],
  r: number,
  c: number,
  ...types: number[]
): number {
  let count = 0;
  for (const [dr, dc] of ORTHO) {
    if (types.includes(getCell(grid, r + dr, c + dc))) count++;
  }
  return count;
}

export function hasAdjacentOfType(
  grid: number[][],
  r: number,
  c: number,
  ...types: number[]
): boolean {
  return countAdjacentOfType(grid, r, c, ...types) > 0;
}

export function isStarLike(v: number): boolean {
  return v === CellType.Star || v === CellType.GoldStar;
}

export function allOrthogonalAreStars(
  grid: number[][],
  r: number,
  c: number
): boolean {
  return getOrthogonalValues(grid, r, c).every(isStarLike);
}

export function forms2x2StarBlock(
  grid: number[][],
  r: number,
  c: number
): boolean {
  const offsets: [number, number][] = [
    [0, 0],
    [0, -1],
    [-1, 0],
    [-1, -1],
  ];
  for (const [dr, dc] of offsets) {
    const tr = r + dr;
    const tc = c + dc;
    const positions: [number, number][] = [
      [tr, tc],
      [tr, tc + 1],
      [tr + 1, tc],
      [tr + 1, tc + 1],
    ];
    if (
      positions.every(
        ([pr, pc]) =>
          (pr === r && pc === c) || isStarLike(getCell(grid, pr, pc))
      )
    ) {
      return true;
    }
  }
  return false;
}
