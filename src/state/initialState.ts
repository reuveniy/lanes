import {
  PLAYER_COLORS,
  type GameState,
  type GameConfig,
  type Player,
} from "../types/game";
import { createRng } from "../engine/rng";
import { generateMap } from "../engine/mapGenerator";
import { createCompany } from "../engine/companies";

export function createInitialState(config: GameConfig): GameState {
  const rng = createRng(config.seed);
  const { grid, hiddenFeatures, goldStarCount } = generateMap(
    config.playerCount,
    config.starCount,
    config.doublePayCount || 10,
    rng
  );

  const players: Player[] = config.playerNames
    .slice(0, config.playerCount)
    .map((name, i) => ({
      index: i,
      name,
      cash: 6000,
      color: PLAYER_COLORS[i],
      netWorth: 6000,
      doublePays: 0,
      bonusCount: 0,
      totalBonusReceived: 0,
      freezeCount: 0,
      trapCount: 0,
      halfTrapCount: 0,
      totalTrapLost: 0,
      specialHelpCount: 0,
    }));

  const companies = Array.from({ length: 26 }, (_, i) =>
    createCompany(i, config.playerCount)
  );

  // Random first player
  const firstPlayer = rng.nextInt(0, config.playerCount - 1);

  // Generate turn order starting from first player
  const turnOrder: number[] = [];
  for (let i = 0; i < config.playerCount; i++) {
    turnOrder.push((firstPlayer + i) % config.playerCount);
  }

  return {
    grid,
    players,
    companies,
    currentPlayer: firstPlayer,
    currentStep: 1,
    totalSteps: config.totalSteps,
    moveOptions: [],
    bankBonus: 1000,
    messages: [],
    phase: "preMove",
    hiddenFeatures,
    goldStarCount,
    frozen: false,
    trapped: false,
    tradingState: null,
    rngSeed: rng.state(),
    winner: null,
    config,
    turnOrder,
  };
}

export const EMPTY_STATE: GameState = {
  grid: [],
  players: [],
  companies: [],
  currentPlayer: 0,
  currentStep: 0,
  totalSteps: 0,
  moveOptions: [],
  bankBonus: 0,
  messages: [],
  phase: "setup",
  hiddenFeatures: { traps: [], freezeTraps: [], doublePays: [] },
  goldStarCount: 0,
  frozen: false,
  trapped: false,
  tradingState: null,
  rngSeed: 0,
  winner: null,
  config: null,
  turnOrder: [],
};
