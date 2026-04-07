import { CellType, ROWS, COLS, type GameState, type MoveOption } from "../types/game";
import type { Rng } from "./rng";
import { getAdjacentCompanies, hasAdjacentOfType } from "./neighbors";
import { findFirstAvailableSlot } from "./companies";

/**
 * Generate 5 random move options matching original BASIC logic (lines 3300-4350):
 *
 * 1. Cell must be empty (value=1)
 * 2. No duplicate positions
 * 3. If a free company slot exists → accept any empty cell
 * 4. If ALL 26 companies are formed (no free slot):
 *    a. If any neighbor is a company (>4) → accept (can join)
 *    b. If any neighbor is outpost/star/gold (2-4) → reroll (would try to found, can't)
 *    c. Otherwise (all neighbors empty/OOB) → accept (becomes outpost)
 */
export function generateMoveOptions(
  state: GameState,
  rng: Rng
): MoveOption[] {
  const options: MoveOption[] = [];
  let attempts = 0;

  const hasFreeSlot = findFirstAvailableSlot(state.companies) !== null;

  while (options.length < 5 && attempts < 500) {
    attempts++;
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);

    if (state.grid[r][c] !== CellType.Empty) continue;
    if (options.some((o) => o.row === r && o.col === c)) continue;

    // If free company slot exists, accept any empty cell
    if (hasFreeSlot) {
      options.push({ row: r, col: c, label: String(options.length + 1) });
      continue;
    }

    // All companies formed — match original lines 3850-3956
    // If adjacent to any company → accept (can join)
    if (getAdjacentCompanies(state.grid, r, c).size > 0) {
      options.push({ row: r, col: c, label: String(options.length + 1) });
      continue;
    }

    // If adjacent to star/gold/outpost but no company → reroll
    if (
      hasAdjacentOfType(
        state.grid, r, c,
        CellType.Star, CellType.GoldStar, CellType.Outpost
      )
    ) {
      continue;
    }

    // Isolated empty cell → accept (becomes outpost)
    options.push({ row: r, col: c, label: String(options.length + 1) });
  }

  return options;
}
