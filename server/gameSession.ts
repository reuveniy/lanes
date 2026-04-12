import type { GameState, Company, GameLogEntry, GameLog } from "../src/types/game";
import type { GameAction } from "../src/state/actions";
import { gameReducer } from "../src/state/reducer";
import { EMPTY_STATE } from "../src/state/initialState";
import type { Room } from "./rooms";
import { send, broadcast } from "./rooms";
import type { RoomInfo } from "./protocol";

export class GameSession {
  state: GameState;
  room: Room;
  /** Map votes: playerId -> true (accept) | false (reject) | null (not voted) */
  mapVotes: Map<number, boolean | null> = new Map();
  /** End game votes: playerId -> true (accept) | null (not voted) */
  endGameVotes: Map<number, boolean | null> = new Map();
  endGameVotingActive = false;
  endGameInitiator: string | null = null;
  stepsVotes: Map<number, boolean | null> = new Map();
  stepsVotingActive = false;
  stepsNewValue = 0;
  stepsInitiator: string | null = null;
  actionLog: GameLogEntry[] = [];

  constructor(room: Room, initialState?: GameState) {
    this.room = room;
    this.state = initialState ?? EMPTY_STATE;
  }

  start(starCount: number, totalSteps: number, doublePayCount = 10): void {
    const playerNames = this.room.players.map((p) => p.name);
    const action: GameAction = {
      type: "INIT_GAME",
      config: {
        playerCount: playerNames.length,
        playerNames,
        starCount,
        totalSteps,
        doublePayCount,
        seed: Date.now(),
        scoreRecorded: false,
      },
    };
    this.state = gameReducer(this.state, action);
    this.logAction(action);
    // Stay in mapSelect — players vote to accept/reject
    this.resetMapVotes();
    this.broadcastState();
    this.broadcastMapVotes();
  }

  handleMapVote(playerId: number, accept: boolean): void {
    if (this.state.phase !== "mapSelect") return;
    this.mapVotes.set(playerId, accept);
    this.broadcastMapVotes();

    if (!accept) {
      // One rejection → regenerate map, reset all votes
      this.regenerateMap();
      return;
    }

    // Check if all players accepted
    const allVoted = this.room.players.every(
      (p) => this.mapVotes.get(p.playerId) === true
    );
    if (allVoted) {
      const acceptAction = { type: "ACCEPT_MAP" as const };
      this.state = gameReducer(this.state, acceptAction);
      this.logAction(acceptAction);
      this.broadcastState();
    }
  }

  private regenerateMap(): void {
    if (!this.state.config) return;
    const newConfig = { ...this.state.config, seed: Date.now() };
    this.state = gameReducer(this.state, { type: "INIT_GAME", config: newConfig });
    // Stay in mapSelect
    this.resetMapVotes();
    this.broadcastState();
    this.broadcastMapVotes();
  }

  private resetMapVotes(): void {
    this.mapVotes.clear();
    for (const p of this.room.players) {
      this.mapVotes.set(p.playerId, null);
    }
  }

  private broadcastMapVotes(): void {
    const votes: Record<number, boolean | null> = {};
    for (const [id, v] of this.mapVotes) {
      votes[id] = v;
    }
    broadcast(this.room, { type: "MAP_VOTES", votes });
  }

  handleEndGameVote(playerId: number, accept: boolean): boolean {
    if (this.state.phase === "gameOver" || this.state.phase === "setup" || this.state.phase === "mapSelect") return false;
    if (this.state.currentStep < 40) return false;

    if (!accept) {
      // One rejection cancels the vote
      this.endGameVotingActive = false;
      this.endGameInitiator = null;
      this.endGameVotes.clear();
      this.broadcastEndGameVotes();
      return false;
    }

    if (!this.endGameVotingActive) {
      // First vote starts the process
      this.endGameVotingActive = true;
      const initiatorPlayer = this.room.players.find((p) => p.playerId === playerId);
      this.endGameInitiator = initiatorPlayer?.name ?? null;
      for (const p of this.room.players) {
        this.endGameVotes.set(p.playerId, null);
      }
    }

    this.endGameVotes.set(playerId, true);
    this.broadcastEndGameVotes();

    // Check if all accepted
    const allAccepted = this.room.players.every(
      (p) => this.endGameVotes.get(p.playerId) === true
    );
    if (allAccepted) {
      this.endGameVotingActive = false;
      this.endGameInitiator = null;
      this.endGameVotes.clear();
      this.state = gameReducer(this.state, { type: "END_GAME_EARLY" });
      this.broadcastState();
      this.broadcastEndGameVotes();
      return true;
    }
    return false;
  }

  private broadcastEndGameVotes(): void {
    const votes: Record<number, boolean | null> = {};
    if (this.endGameVotingActive) {
      for (const [id, v] of this.endGameVotes) {
        votes[id] = v;
      }
    }
    broadcast(this.room, { type: "END_GAME_VOTES", votes, initiator: this.endGameInitiator });
  }

  handleStepsVote(playerId: number, newSteps: number | null, accept?: boolean): void {
    if (this.state.phase === "gameOver" || this.state.phase === "setup" || this.state.phase === "mapSelect") return;

    // Initiating a new vote
    if (newSteps !== null && !this.stepsVotingActive) {
      this.stepsVotingActive = true;
      this.stepsNewValue = newSteps;
      const initiator = this.room.players.find((p) => p.playerId === playerId);
      this.stepsInitiator = initiator?.name ?? null;
      for (const p of this.room.players) {
        this.stepsVotes.set(p.playerId, null);
      }
      this.stepsVotes.set(playerId, true);
      this.broadcastStepsVotes();
      return;
    }

    // Voting on existing proposal
    if (this.stepsVotingActive && accept !== undefined) {
      if (!accept) {
        // Reject — cancel
        this.stepsVotingActive = false;
        this.stepsInitiator = null;
        this.stepsVotes.clear();
        broadcast(this.room, { type: "STEPS_VOTE_CANCELLED" });
        return;
      }

      this.stepsVotes.set(playerId, true);
      this.broadcastStepsVotes();

      const allAccepted = this.room.players.every(
        (p) => this.stepsVotes.get(p.playerId) === true
      );
      if (allAccepted) {
        const stepsAction = { type: "CHANGE_STEPS" as const, newSteps: this.stepsNewValue };
        this.state = gameReducer(this.state, stepsAction);
        this.logAction(stepsAction);
        this.stepsVotingActive = false;
        this.stepsInitiator = null;
        this.stepsVotes.clear();
        this.broadcastState();
        broadcast(this.room, { type: "STEPS_VOTE_CANCELLED" });
      }
    }
  }

  private broadcastStepsVotes(): void {
    if (!this.stepsVotingActive || !this.stepsInitiator) return;
    const votes: Record<number, boolean | null> = {};
    for (const [id, v] of this.stepsVotes) {
      votes[id] = v;
    }
    broadcast(this.room, {
      type: "STEPS_VOTES",
      newSteps: this.stepsNewValue,
      initiator: this.stepsInitiator,
      votes,
    });
  }

  handleAction(playerId: number, action: GameAction): boolean {
    if (action.type === "INIT_GAME") return false;
    if (this.state.phase === "gameOver") return false;
    if (this.state.phase === "mapSelect") return false; // use handleMapVote
    if (playerId !== this.state.currentPlayer) return false;

    const newState = gameReducer(this.state, action);
    if (newState === this.state) return false;

    this.state = newState;
    this.logAction(action);
    this.room.lastActivity = Date.now();
    this.broadcastState();
    return true;
  }

  private logAction(action: GameAction): void {
    this.actionLog.push({
      step: this.state.currentStep,
      action: JSON.stringify(action),
      timestamp: Date.now(),
    });
  }

  getGameLog(): GameLog | null {
    if (!this.state.config) return null;
    return {
      id: this.room.code + "-" + Date.now(),
      config: this.state.config,
      playerNames: this.room.players.map((p) => p.name),
      playerColors: this.state.players.map((p) => p.color),
      winner: this.state.winner,
      winnerName: this.state.winner !== null ? this.state.players[this.state.winner]?.name ?? "" : "",
      totalSteps: this.state.currentStep,
      endedAt: Date.now(),
      actions: this.actionLog,
    };
  }

  broadcastState(): void {
    for (const p of this.room.players) {
      if (p.ws && p.ws.readyState === 1) {
        const filtered = this.filterStateForPlayer(p.playerId);
        send(p.ws, { type: "STATE_UPDATE", state: filtered });
      }
    }
    const observerState = this.filterStateForObserver();
    for (const ws of Array.from(this.room.observers)) {
      if (ws.readyState === 1) {
        send(ws, { type: "STATE_UPDATE", state: observerState });
      } else {
        this.room.observers.delete(ws);
      }
    }
  }

  getRoomInfo(): Partial<RoomInfo> {
    return {
      currentStep: this.state.currentStep,
      totalSteps: this.state.totalSteps,
      phase: this.state.phase,
    };
  }

  private filterStateForPlayer(playerId: number): GameState {
    const companies: Company[] = this.state.companies.map((c) => ({
      ...c,
      shares: c.shares.map((s, i) => (i === playerId ? s : 0)),
    }));

    // Fog of war: hide trading messages when it's not this player's turn
    let messages = this.state.messages;
    if (this.room.fogOfWar && playerId !== this.state.currentPlayer) {
      messages = messages.filter((m) => {
        const t = m.text.toLowerCase();
        // Filter out buy/sell/trading/hold messages
        return !t.includes(" buys ") &&
               !t.includes(" sells ") &&
               !t.includes("you hold") &&
               !t.includes("max buy") &&
               !t.includes("trading:");
      });
    }

    return {
      ...this.state,
      companies,
      messages,
      hiddenFeatures: { traps: [], freezeTraps: [], doublePays: [] },
    };
  }

  private filterStateForObserver(): GameState {
    const current = this.state.currentPlayer;
    const companies: Company[] = this.state.companies.map((c) => ({
      ...c,
      shares: c.shares.map((s, i) => (i === current ? s : 0)),
    }));

    // Filter trading messages for observers when fog of war is enabled
    let messages = this.state.messages;
    if (this.room.fogOfWar) {
      messages = messages.filter((m) => {
        const t = m.text.toLowerCase();
        return !t.includes(" buys ") &&
               !t.includes(" sells ") &&
               !t.includes("you hold") &&
               !t.includes("max buy") &&
               !t.includes("trading:");
      });
    }

    return {
      ...this.state,
      companies,
      messages,
      hiddenFeatures: { traps: [], freezeTraps: [], doublePays: [] },
    };
  }
}

const sessions = new Map<string, GameSession>();

export function getOrCreateSession(room: Room): GameSession {
  let session = sessions.get(room.code);
  if (!session) {
    session = new GameSession(room);
    sessions.set(room.code, session);
  }
  return session;
}

export function deleteSession(roomCode: string): void {
  sessions.delete(roomCode.toUpperCase());
}

export function getSession(roomCode: string): GameSession | undefined {
  return sessions.get(roomCode.toUpperCase());
}

export function serializeSessions(): Record<string, GameState> {
  const result: Record<string, GameState> = {};
  for (const [code, session] of sessions) {
    result[code] = session.state;
  }
  return result;
}

export function restoreSessions(
  persisted: Record<string, GameState>,
  getRoom: (code: string) => Room | undefined
): void {
  for (const [code, state] of Object.entries(persisted)) {
    const room = getRoom(code);
    if (room) {
      const session = new GameSession(room, state);
      sessions.set(code, session);
    }
  }
}
