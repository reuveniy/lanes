import {
  CellType,
  ROWS,
  COLS,
  PLAYER_COLORS,
  COMPANY_NAMES,
  type GameState,
  type Player,
  type Company,
  type MoveOption,
  type HiddenFeatures,
} from "../types/game";

const STUB_HIDDEN: HiddenFeatures = { traps: [], freezeTraps: [], doublePays: [] };

function stateDefaults(): Pick<
  GameState,
  | "hiddenFeatures"
  | "goldStarCount"
  | "frozen"
  | "trapped"
  | "tradingState"
  | "rngSeed"
  | "winner"
  | "config"
  | "turnOrder"
> {
  return {
    hiddenFeatures: STUB_HIDDEN,
    goldStarCount: 6,
    frozen: false,
    trapped: false,
    tradingState: null,
    rngSeed: 0,
    winner: null,
    config: null,
    turnOrder: [0, 1, 2, 3],
  };
}

function makeEmptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => CellType.Empty)
  );
}

function seedRng(seed: number) {
  // Simple seeded RNG for reproducible fixtures
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getCell(grid: number[][], r: number, c: number): number {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
  return grid[r][c];
}

function allOrthogonalAreStars(grid: number[][], r: number, c: number): boolean {
  const neighbors = [
    getCell(grid, r - 1, c),
    getCell(grid, r + 1, c),
    getCell(grid, r, c - 1),
    getCell(grid, r, c + 1),
  ];
  return neighbors.every((v) => v === CellType.Star || v === CellType.GoldStar);
}

function forms2x2StarBlock(grid: number[][], r: number, c: number): boolean {
  // Check all four 2x2 blocks that include (r, c)
  const offsets = [
    [0, 0],
    [0, -1],
    [-1, 0],
    [-1, -1],
  ];
  for (const [dr, dc] of offsets) {
    const tr = r + dr;
    const tc = c + dc;
    const cells = [
      getCell(grid, tr, tc),
      getCell(grid, tr, tc + 1),
      getCell(grid, tr + 1, tc),
      getCell(grid, tr + 1, tc + 1),
    ];
    // All four would be stars (treating the candidate cell as a star)
    if (
      cells.every(
        (v, i) =>
          (tr + Math.floor(i / 2) === r && tc + (i % 2) === c) ||
          v === CellType.Star ||
          v === CellType.GoldStar
      )
    ) {
      return true;
    }
  }
  return false;
}

function countStarNeighbors(grid: number[][], r: number, c: number): number {
  let count = 0;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const v = getCell(grid, r + dr, c + dc);
    if (v === CellType.Star || v === CellType.GoldStar) count++;
  }
  return count;
}

function hasAdjacentGoldStar(grid: number[][], r: number, c: number): boolean {
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    if (getCell(grid, r + dr, c + dc) === CellType.GoldStar) return true;
  }
  return false;
}

function placeFeaturesOnGrid(
  grid: number[][],
  rng: () => number,
  playerCount: number,
  starCount = 105
) {
  // Place stars with clustering constraints (02-map-and-setup.md)
  let placed = 0;
  let attempts = 0;
  while (placed < starCount && attempts < starCount * 20) {
    attempts++;
    const r = Math.floor(rng() * ROWS);
    const c = Math.floor(rng() * COLS);
    if (grid[r][c] !== CellType.Empty) continue;
    // Constraint: cannot place if all 4 orthogonal neighbors are already stars
    if (allOrthogonalAreStars(grid, r, c)) continue;
    // Constraint: no 2x2 block of stars
    if (forms2x2StarBlock(grid, r, c)) continue;
    grid[r][c] = CellType.Star;
    placed++;
  }

  // Place gold stars: count = INT(players * (1.5 + RND)) + 3
  const goldCount = Math.floor(playerCount * (1.5 + rng())) + 3;
  placed = 0;
  attempts = 0;
  while (placed < goldCount && attempts < goldCount * 40) {
    attempts++;
    const r = Math.floor(rng() * ROWS);
    const c = Math.floor(rng() * COLS);
    // Not on grid edges
    if (r <= 0 || c <= 1 || r >= ROWS - 1 || c >= COLS - 2) continue;
    if (grid[r][c] !== CellType.Empty) continue;
    // Cannot be adjacent to another gold star
    if (hasAdjacentGoldStar(grid, r, c)) continue;
    // Cannot have 3+ star neighbors
    if (countStarNeighbors(grid, r, c) >= 3) continue;
    grid[r][c] = CellType.GoldStar;
    placed++;
  }

  // No outposts at map init — they form during gameplay
}

function placeCompanyTerritory(
  grid: number[][],
  companyIndex: number,
  startRow: number,
  startCol: number,
  size: number,
  rng: () => number
) {
  const value = companyIndex + 5;
  const placed: [number, number][] = [];
  grid[startRow][startCol] = value;
  placed.push([startRow, startCol]);

  for (let i = 1; i < size; i++) {
    const base = placed[Math.floor(rng() * placed.length)];
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = base[0] + dr;
      const nc = base[1] + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] <= CellType.Outpost) {
        grid[nr][nc] = value;
        placed.push([nr, nc]);
        break;
      }
    }
  }
}

function makePlayers(count: number): Player[] {
  const names = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"];
  return names.slice(0, count).map((name, i) => ({
    index: i,
    name,
    cash: 6000 + Math.floor(Math.random() * 10000),
    color: PLAYER_COLORS[i],
    netWorth: 6000 + Math.floor(Math.random() * 30000),
    doublePays: Math.floor(Math.random() * 3),
  }));
}

function makeCompany(
  index: number,
  size: number,
  stockPrice: number,
  controllingPlayer: number | null
): Company {
  return {
    index,
    letter: String.fromCharCode(65 + index),
    name: COMPANY_NAMES[index],
    size,
    stockPrice,
    shares: [0, 0, 0, 0],
    controllingPlayer,
  };
}

function makeMoveOptions(grid: number[][], rng: () => number): MoveOption[] {
  const options: MoveOption[] = [];
  let attempts = 0;
  while (options.length < 5 && attempts < 200) {
    const r = Math.floor(rng() * ROWS);
    const c = Math.floor(rng() * COLS);
    if (
      grid[r][c] === CellType.Empty &&
      !options.some((o) => o.row === r && o.col === c)
    ) {
      options.push({ row: r, col: c, label: String(options.length + 1) });
    }
    attempts++;
  }
  return options;
}

// ============ EXPORTED FIXTURES ============

export function createEarlyGameState(): GameState {
  const rng = seedRng(42);
  const grid = makeEmptyGrid();
  const players = makePlayers(3);
  placeFeaturesOnGrid(grid, rng, players.length);

  // Two small companies
  placeCompanyTerritory(grid, 0, 3, 5, 4, rng); // A
  placeCompanyTerritory(grid, 1, 8, 15, 3, rng); // B

  players[0].cash = 5200;
  players[0].netWorth = 7800;
  players[1].cash = 6800;
  players[1].netWorth = 8200;
  players[2].cash = 6000;
  players[2].netWorth = 6500;

  const companies = Array.from({ length: 26 }, (_, i) => {
    if (i === 0) return makeCompany(0, 4, 500, 0);
    if (i === 1) return makeCompany(1, 3, 400, 1);
    return makeCompany(i, 0, 100, null);
  });

  return {
    ...stateDefaults(),
    grid,
    players,
    companies,
    currentPlayer: 0,
    currentStep: 8,
    totalSteps: 180,
    moveOptions: makeMoveOptions(grid, rng),
    bankBonus: 1340,
    messages: [
      { text: "Alice's turn - select a move", type: "info" },
    ],
    phase: "move",
    turnOrder: [0, 1, 2],
  };
}

export function createMidGameState(): GameState {
  const rng = seedRng(99);
  const grid = makeEmptyGrid();
  const players = makePlayers(4);
  placeFeaturesOnGrid(grid, rng, players.length);

  // Several companies of varying sizes
  placeCompanyTerritory(grid, 0, 2, 3, 12, rng); // A - large
  placeCompanyTerritory(grid, 2, 5, 20, 8, rng); // C
  placeCompanyTerritory(grid, 4, 10, 10, 6, rng); // E
  placeCompanyTerritory(grid, 6, 7, 6, 10, rng); // G
  placeCompanyTerritory(grid, 11, 1, 22, 5, rng); // L

  players[0].cash = 12400;
  players[0].netWorth = 28500;
  players[1].cash = 8900;
  players[1].netWorth = 22100;
  players[2].cash = 15600;
  players[2].netWorth = 31200;
  players[3].cash = 6200;
  players[3].netWorth = 14800;

  const companies = Array.from({ length: 26 }, (_, i) => {
    if (i === 0) return makeCompany(0, 12, 1800, 0);
    if (i === 2) return makeCompany(2, 8, 1200, 2);
    if (i === 4) return makeCompany(4, 6, 900, 1);
    if (i === 6) return makeCompany(6, 10, 1500, 0);
    if (i === 11) return makeCompany(11, 5, 700, 3);
    return makeCompany(i, 0, 100, null);
  });

  return {
    ...stateDefaults(),
    grid,
    players,
    companies,
    currentPlayer: 2,
    currentStep: 55,
    totalSteps: 180,
    moveOptions: makeMoveOptions(grid, rng),
    bankBonus: 4250,
    messages: [
      { text: "Capella Freight: Sales increase by 25% !!!", type: "positive" },
      { text: "Stock price: $1200 -> $1440", type: "info" },
      { text: "Carol's turn - select a move", type: "info" },
    ],
    phase: "move",
  };
}

export function createLateGameState(): GameState {
  const rng = seedRng(777);
  const grid = makeEmptyGrid();
  const players = makePlayers(4);
  placeFeaturesOnGrid(grid, rng, players.length);

  // Many large companies
  placeCompanyTerritory(grid, 0, 1, 1, 18, rng);
  placeCompanyTerritory(grid, 2, 6, 18, 15, rng);
  placeCompanyTerritory(grid, 4, 10, 3, 12, rng);
  placeCompanyTerritory(grid, 6, 3, 14, 14, rng);
  placeCompanyTerritory(grid, 9, 8, 24, 9, rng);
  placeCompanyTerritory(grid, 12, 12, 12, 7, rng);
  placeCompanyTerritory(grid, 18, 0, 24, 6, rng);

  players[0].cash = 45200;
  players[0].netWorth = 98500;
  players[1].cash = 32100;
  players[1].netWorth = 87200;
  players[2].cash = 52800;
  players[2].netWorth = 112400;
  players[3].cash = 18900;
  players[3].netWorth = 55300;

  const companies = Array.from({ length: 26 }, (_, i) => {
    if (i === 0) return makeCompany(0, 18, 2800, 2);
    if (i === 2) return makeCompany(2, 15, 2400, 0);
    if (i === 4) return makeCompany(4, 12, 1800, 1);
    if (i === 6) return makeCompany(6, 14, 2200, 2);
    if (i === 9) return makeCompany(9, 9, 1400, 3);
    if (i === 12) return makeCompany(12, 7, 1100, 0);
    if (i === 18) return makeCompany(18, 6, 900, 1);
    return makeCompany(i, 0, 100, null);
  });

  return {
    ...stateDefaults(),
    grid,
    players,
    companies,
    currentPlayer: 1,
    currentStep: 108,
    totalSteps: 180,
    moveOptions: makeMoveOptions(grid, rng),
    bankBonus: 12800,
    messages: [
      {
        text: "Klington attack on the Space-Fleet !!!",
        type: "critical",
      },
      {
        text: "Altair Starways stock: $2800 -> $2520",
        type: "alert",
      },
      { text: "Bob's turn - select a move", type: "info" },
    ],
    phase: "move",
  };
}

export function createTradingPhaseState(): GameState {
  const state = createMidGameState();
  state.phase = "trading";
  state.messages = [
    { text: "Altair Starways - $1800/share", type: "info" },
    { text: "You hold 12 shares. Max buy: 6", type: "info" },
    { text: "Enter amount, [N]s to sell, [-] skip, [.X] jump", type: "info" },
  ];
  state.moveOptions = [];
  return state;
}

export function createMergerEventState(): GameState {
  const state = createMidGameState();
  state.phase = "specialEvents";
  state.messages = [
    { text: "SPECIAL ANNOUNCEMENT", type: "alert" },
    { text: "Capella Freight merges into Altair Starways!", type: "critical" },
    { text: "Alice: 8 shares -> 4 shares + $960 bonus", type: "positive" },
    { text: "Bob: 3 shares -> 2 shares + $360 bonus", type: "positive" },
  ];
  state.moveOptions = [];
  return state;
}
