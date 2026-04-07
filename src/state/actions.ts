import type { GameConfig } from "../types/game";

export type GameAction =
  | { type: "INIT_GAME"; config: GameConfig }
  | { type: "ACCEPT_MAP" }
  | { type: "REGENERATE_MAP" }
  | { type: "SELECT_MOVE"; moveIndex: number }
  | { type: "BUY_SHARES"; companyIndex: number; amount: number }
  | { type: "SELL_SHARES"; companyIndex: number; amount: number }
  | { type: "SKIP_COMPANY" }
  | { type: "JUMP_TO_COMPANY"; companyIndex: number }
  | { type: "ALL_IN" }
  | { type: "END_TRADING" }
  | { type: "ACKNOWLEDGE_EVENT" }
  | { type: "CHANGE_STEPS"; newSteps: number }
  | { type: "END_GAME_EARLY" };
