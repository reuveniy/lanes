import { CellType, type GameState } from "../types/game";
import { getAdjacentCompanies, hasAdjacentOfType } from "./neighbors";
import { findFirstAvailableSlot, foundCompany, joinCompany } from "./companies";
import { detectMergers, resolveMerger } from "./mergers";

export function resolvePlacement(
  state: GameState,
  row: number,
  col: number,
  playerIndex: number
): GameState {
  const adjCompanies = getAdjacentCompanies(state.grid, row, col);

  // Case B: Adjacent to existing companies
  if (adjCompanies.size > 0) {
    const companyList = [...adjCompanies];

    // Check for merger (2+ different companies)
    if (companyList.length >= 2) {
      // First join the cell to the largest company
      let largestIdx = companyList[0];
      for (const idx of companyList) {
        if (state.companies[idx].size > state.companies[largestIdx].size) {
          largestIdx = idx;
        }
      }
      let newState = joinCompany(state, row, col, largestIdx);

      // Resolve mergers - largest absorbs smaller
      const mergerPairs = detectMergers(newState.grid, row, col);
      for (const [a, b] of mergerPairs) {
        const survivor =
          newState.companies[a].size >= newState.companies[b].size ? a : b;
        const absorbed = survivor === a ? b : a;
        if (newState.companies[absorbed].size > 0) {
          newState = resolveMerger(newState, survivor, absorbed);
        }
      }

      return newState;
    }

    // Single adjacent company - just join it
    return joinCompany(state, row, col, companyList[0]);
  }

  // Case C: Adjacent to stars/outposts, no companies, free slot exists
  const hasStarOrOutpost = hasAdjacentOfType(
    state.grid,
    row,
    col,
    CellType.Star,
    CellType.GoldStar,
    CellType.Outpost
  );

  if (hasStarOrOutpost && findFirstAvailableSlot(state.companies) !== null) {
    return foundCompany(state, row, col, playerIndex);
  }

  // Case A: No interesting neighbors - place outpost
  const grid = state.grid.map((r) => [...r]);
  grid[row][col] = CellType.Outpost;
  return { ...state, grid };
}
