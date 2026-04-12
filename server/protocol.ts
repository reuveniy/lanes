import type { GameAction } from "../src/state/actions";
import type { GameState } from "../src/types/game";

// Client -> Server
export type ClientMessage =
  | { type: "AUTH"; idToken: string }
  | { type: "CREATE_ROOM"; maxPlayers: number; starCount: number; totalSteps: number; doublePayCount: number; fogOfWar: boolean }
  | { type: "JOIN_ROOM"; roomCode: string }
  | { type: "OBSERVE_ROOM"; roomCode: string }
  | { type: "LIST_ROOMS" }
  | { type: "GET_LEADERBOARD" }
  | { type: "LIST_GAME_LOGS" }
  | { type: "GET_GAME_LOG"; id: string }
  | { type: "SAVE_GAME_LOG"; log: import("../src/types/game").GameLog }
  | { type: "START_GAME" }
  | { type: "START_NOW" }
  | { type: "MAP_VOTE"; accept: boolean }
  | { type: "END_GAME_VOTE"; accept: boolean }
  | { type: "STEPS_VOTE"; newSteps: number | null; accept?: boolean }
  | { type: "GAME_ACTION"; action: GameAction }
  | { type: "ADMIN_CLEAR_LEADERBOARD" }
  | { type: "ADMIN_REMOVE_LEADERBOARD_USER"; email: string }
  | { type: "ADMIN_DELETE_ROOM"; roomCode: string };

export interface LeaderboardEntryInfo {
  email: string;
  name: string;
  picture: string;
  wins: number;
  games: number;
}

export interface RoomInfo {
  code: string;
  players: string[];
  maxPlayers: number;
  started: boolean;
  currentStep: number;
  totalSteps: number;
  phase: string;
}

// Server -> Client
export type ServerMessage =
  | { type: "AUTH_OK"; name: string; email: string; picture: string; clientId: string; isAdmin: boolean }
  | { type: "AUTH_REQUIRED"; clientId: string }
  | { type: "ROOM_CREATED"; roomCode: string; playerId: number; players: string[]; maxPlayers: number }
  | {
      type: "ROOM_JOINED";
      roomCode: string;
      playerId: number;
      players: string[];
    }
  | { type: "ROOM_LIST"; rooms: RoomInfo[] }
  | { type: "PLAYER_JOINED"; playerName: string; players: string[] }
  | { type: "PLAYER_LEFT"; playerName: string; players: string[] }
  | { type: "STATE_UPDATE"; state: GameState }
  | { type: "OBSERVING"; roomCode: string; players: string[] }
  | { type: "MAP_VOTES"; votes: Record<number, boolean | null> }
  | { type: "END_GAME_VOTES"; votes: Record<number, boolean | null>; initiator: string | null }
  | { type: "STEPS_VOTES"; newSteps: number; initiator: string; votes: Record<number, boolean | null> }
  | { type: "STEPS_VOTE_CANCELLED" }
  | { type: "GAME_LOGS"; logs: import("./gameLogs").GameLogSummary[] }
  | { type: "GAME_LOG_DATA"; log: import("../src/types/game").GameLog }
  | { type: "LEADERBOARD"; entries: LeaderboardEntryInfo[] }
  | { type: "ERROR"; message: string };
