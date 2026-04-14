export enum CellType {
  Empty = 1,
  Outpost = 2,
  Star = 3,
  GoldStar = 4,
  // 5-30 = Company territory (companyIndex + 4)
}

export interface Company {
  index: number; // 0-25 (A-Z)
  letter: string;
  name: string;
  size: number; // Q(I) - number of cells
  stockPrice: number; // S1(I)
  shares: number[]; // per player
  controllingPlayer: number | null; // player with most shares
}

export interface Player {
  index: number; // 0-based
  name: string;
  cash: number;
  color: string;
  netWorth: number;
  doublePays: number;
  bonusCount: number;
  totalBonusReceived: number;
  freezeCount: number;
  trapCount: number;
  halfTrapCount: number;
  totalTrapLost: number;
  specialHelpCount: number;
}

export interface MoveOption {
  row: number;
  col: number;
  label: string; // "1"-"5"
}

export interface GameMessage {
  text: string;
  type: "info" | "alert" | "positive" | "critical";
  alarm?: 1 | 2 | 3; // 1=siren, 2=short alarm, 3=bell
}

export interface GameLogEntry {
  step: number;
  action: string; // serialized GameAction
  timestamp: number;
}

export interface GameLog {
  id: string;
  config: GameConfig;
  playerNames: string[];
  playerColors: string[];
  winner: number | null;
  winnerName: string;
  totalSteps: number;
  endedAt: number;
  actions: GameLogEntry[];
}

export interface Position {
  row: number;
  col: number;
}

export interface HiddenFeatures {
  traps: Position[];
  freezeTraps: Position[];
  doublePays: Position[];
}

export interface TradingState {
  companyIndex: number; // current company being offered
  loopCount: number; // how many times through the full list
  soldThisTurn: number; // total value sold this turn (for sell limit)
}

export interface GameConfig {
  playerCount: number;
  playerNames: string[];
  starCount: number;
  totalSteps: number;
  doublePayCount: number;
  seed: number;
  scoreRecorded: boolean;
  moveTimeout?: number; // seconds, 0 = no timeout
  fixedTurnOrder?: number[]; // if set, use this turn order instead of random
  fixedFirstPlayer?: number; // if set, use this as first player
}

export type GamePhase =
  | "setup"
  | "mapSelect"
  | "preMove"
  | "move"
  | "placement"
  | "income"
  | "specialEvents"
  | "trading"
  | "gameOver";

export interface GameState {
  grid: number[][]; // 19x28
  players: Player[];
  companies: Company[];
  currentPlayer: number;
  currentStep: number;
  totalSteps: number;
  moveOptions: MoveOption[];
  bankBonus: number;
  messages: GameMessage[];
  phase: GamePhase;
  hiddenFeatures: HiddenFeatures;
  goldStarCount: number;
  frozen: boolean;
  trapped: boolean;
  tradingState: TradingState | null;
  rngSeed: number;
  winner: number | null;
  config: GameConfig | null;
  turnOrder: number[]; // player indices in play order
}

export const ROWS = 19;
export const COLS = 28;
export const MAX_COMPANIES = 26;

export const PLAYER_COLORS = ["#22c55e", "#ef4444", "#d946ef", "#06b6d4", "#3b82f6", "#a16207"];

export const COMPANY_NAMES: string[] = [
  "Altair Starways",
  "Betelgeuse Ltd.",
  "Capella Freight",
  "Denebola Shippers",
  "Eridani Expediters",
  "Fearary Airways",
  "General Motors",
  "Holy Land Starway",
  "I.B.M.",
  "Japanese Cargo",
  "Kantakey Freight",
  "Lockhid Space Co.",
  "Mecdonal-Douglas",
  "Nec Air-Cargo Co.",
  "Olimpic Cargo",
  "Pompa-Starways",
  "Queen Space Co.",
  "Remigton Airways",
  "Sky-Explorer",
  "T.W.A. Air-Lines",
  "Uoeing Oil Ltd.",
  "Vncover Airways",
  "Wolf Sky-Ridder",
  "X Ray Ltd.",
  "Yotomoto Crgo",
  "Zapping Megic Co.",
];
