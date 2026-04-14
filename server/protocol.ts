import type { GameAction } from "../src/state/actions";
import type { GameState } from "../src/types/game";

// Client -> Server
export type ClientMessage =
  | { type: "AUTH"; idToken: string }
  | { type: "CREATE_ROOM"; maxPlayers: number; starCount: number; totalSteps: number; doublePayCount: number; fogOfWar: boolean; moveTimeout: number; zoomLink?: string }
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
  | { type: "ADMIN_DELETE_ROOM"; roomCode: string }
  | { type: "ADMIN_DELETE_GAME_LOG"; id: string }
  | { type: "ADMIN_END_GAME"; roomCode: string }
  | { type: "SEND_LEADERBOARD_WHATSAPP" }
  | { type: "SEND_GAME_RESULTS_WHATSAPP"; state?: import("../src/types/game").GameState }
  | { type: "SEND_BOARD_WHATSAPP"; state?: import("../src/types/game").GameState }
  | { type: "RETIRE" }
  | { type: "PAUSE_VOTE"; accept: boolean };

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
  playerEmails: string[];
  maxPlayers: number;
  started: boolean;
  currentStep: number;
  totalSteps: number;
  phase: string;
  zoomLink?: string;
}

// Server -> Client
export type ServerMessage =
  | { type: "AUTH_OK"; name: string; email: string; picture: string; clientId: string; isAdmin: boolean }
  | { type: "AUTH_REQUIRED"; clientId: string }
  | { type: "ROOM_CREATED"; roomCode: string; playerId: number; players: string[]; maxPlayers: number; zoomLink?: string }
  | {
      type: "ROOM_JOINED";
      roomCode: string;
      playerId: number;
      players: string[];
      zoomLink?: string;
      rejoinState?: {
        endGameVotes?: Record<number, boolean | null>;
        endGameInitiator?: string | null;
        stepsVote?: { newSteps: number; initiator: string; votes: Record<number, boolean | null> };
        mapVotes?: Record<number, boolean | null>;
        pauseVotes?: Record<number, boolean | null>;
        pauseInitiator?: string | null;
      };
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
  | { type: "MOVE_TIMER"; deadline: number; playerId: number }
  | { type: "PAUSE_VOTES"; votes: Record<number, boolean | null>; initiator: string | null }
  | { type: "PAUSE_CANCELLED" }
  | { type: "RETIRED_PLAYERS"; playerIds: number[] }
  | { type: "ERROR"; message: string };
