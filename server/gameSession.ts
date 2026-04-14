import type { GameState, Company, GameLogEntry, GameLog } from "../src/types/game";
import type { GameAction } from "../src/state/actions";
import { gameReducer } from "../src/state/reducer";
import { EMPTY_STATE } from "../src/state/initialState";
import { pickTimeoutMove, pickTimeoutBuy } from "../src/engine/ai";
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
  pauseVotes: Map<number, boolean | null> = new Map();
  pauseVotingActive = false;
  pauseInitiator: string | null = null;
  paused = false;
  actionLog: GameLogEntry[] = [];
  private moveTimer: ReturnType<typeof setTimeout> | null = null;
  private moveDeadline = 0;
  /** Callback for when auto-move triggers game-ending state */
  onAutoMoveComplete?: () => void;

  constructor(room: Room, initialState?: GameState) {
    this.room = room;
    this.state = initialState ?? EMPTY_STATE;
  }

  /** Check if a player is retired */
  private isRetired(playerId: number): boolean {
    return this.room.players.find((p) => p.playerId === playerId)?.retired === true;
  }

  /** Auto-accept any pending votes for all retired players, returns true if any vote completed */
  autoVoteForRetired(): boolean {
    let changed = false;

    // Map votes
    if (this.state.phase === "mapSelect") {
      for (const p of this.room.players) {
        if (p.retired && this.mapVotes.get(p.playerId) === null) {
          this.mapVotes.set(p.playerId, true);
          changed = true;
        }
      }
      if (changed) {
        this.broadcastMapVotes();
        const allVoted = this.room.players.every((p) => this.mapVotes.get(p.playerId) === true);
        if (allVoted) {
          const acceptAction = { type: "ACCEPT_MAP" as const };
          this.state = gameReducer(this.state, acceptAction);
          this.logAction(acceptAction);
          this.broadcastState();
          if (this.state.phase === "move") this.startMoveTimerIfNeeded();
        }
      }
    }

    // End game votes
    if (this.endGameVotingActive) {
      for (const p of this.room.players) {
        if (p.retired && this.endGameVotes.get(p.playerId) === null) {
          this.endGameVotes.set(p.playerId, true);
          changed = true;
        }
      }
      if (changed) {
        this.broadcastEndGameVotes();
        const allAccepted = this.room.players.every((p) => this.endGameVotes.get(p.playerId) === true);
        if (allAccepted) {
          this.endGameVotingActive = false;
          this.endGameInitiator = null;
          this.endGameVotes.clear();
          this.state = gameReducer(this.state, { type: "END_GAME_EARLY" });
          this.broadcastState();
          this.broadcastEndGameVotes();
          return true; // game ended
        }
      }
    }

    // Steps votes
    if (this.stepsVotingActive) {
      for (const p of this.room.players) {
        if (p.retired && this.stepsVotes.get(p.playerId) === null) {
          this.stepsVotes.set(p.playerId, true);
          changed = true;
        }
      }
      if (changed) {
        this.broadcastStepsVotes();
        const allAccepted = this.room.players.every((p) => this.stepsVotes.get(p.playerId) === true);
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

    // Pause votes
    if (this.pauseVotingActive) {
      for (const p of this.room.players) {
        if (p.retired && this.pauseVotes.get(p.playerId) === null) {
          this.pauseVotes.set(p.playerId, true);
          changed = true;
        }
      }
      if (changed) {
        this.broadcastPauseVotes();
        const allAccepted = this.room.players.every((p) => this.pauseVotes.get(p.playerId) === true);
        if (allAccepted) {
          this.paused = true;
          this.pauseVotingActive = false;
          this.pauseInitiator = null;
          this.pauseVotes.clear();
          this.clearMoveTimer();
          broadcast(this.room, { type: "PAUSE_CANCELLED" });
        }
      }
    }

    return changed;
  }

  /** If current player is retired, auto-play their turn */
  autoPlayIfRetired(): void {
    if (this.state.phase !== "move") return;
    if (!this.isRetired(this.state.currentPlayer)) return;
    this.clearMoveTimer();
    // Small delay so clients see the turn transition
    setTimeout(() => this.executeAutoMove(), 500);
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
        moveTimeout: this.room.moveTimeout || 0,
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
      // Start move timer or auto-play for the first turn
      if (this.state.phase === "move") {
        if (this.isRetired(this.state.currentPlayer)) {
          this.autoPlayIfRetired();
        } else {
          this.startMoveTimerIfNeeded();
        }
      }
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

  handlePauseVote(playerId: number, accept: boolean): void {
    if (this.state.phase === "gameOver" || this.state.phase === "setup" || this.state.phase === "mapSelect") return;
    if (this.paused) return; // already paused

    if (!accept) {
      this.pauseVotingActive = false;
      this.pauseInitiator = null;
      this.pauseVotes.clear();
      broadcast(this.room, { type: "PAUSE_CANCELLED" });
      return;
    }

    if (!this.pauseVotingActive) {
      this.pauseVotingActive = true;
      const initiator = this.room.players.find((p) => p.playerId === playerId);
      this.pauseInitiator = initiator?.name ?? null;
      for (const p of this.room.players) {
        this.pauseVotes.set(p.playerId, p.retired ? true : null);
      }
    }

    this.pauseVotes.set(playerId, true);
    this.broadcastPauseVotes();

    const allAccepted = this.room.players.every(
      (p) => this.pauseVotes.get(p.playerId) === true
    );
    if (allAccepted) {
      this.paused = true;
      this.pauseVotingActive = false;
      this.pauseInitiator = null;
      this.pauseVotes.clear();
      // Clear the move timer — timeout disabled while paused
      this.clearMoveTimer();
      broadcast(this.room, { type: "PAUSE_CANCELLED" }); // clear vote UI
    }
  }

  private broadcastPauseVotes(): void {
    if (!this.pauseVotingActive || !this.pauseInitiator) return;
    const votes: Record<number, boolean | null> = {};
    for (const [id, v] of this.pauseVotes) {
      votes[id] = v;
    }
    broadcast(this.room, {
      type: "PAUSE_VOTES",
      votes,
      initiator: this.pauseInitiator,
    });
  }

  handleAction(playerId: number, action: GameAction): boolean {
    if (action.type === "INIT_GAME") return false;
    if (this.state.phase === "gameOver") return false;
    if (this.state.phase === "mapSelect") return false; // use handleMapVote
    if (playerId !== this.state.currentPlayer) return false;

    const prevPhase = this.state.phase;
    const newState = gameReducer(this.state, action);
    if (newState === this.state) return false;

    this.state = newState;
    this.logAction(action);
    this.room.lastActivity = Date.now();

    // Clear timer when player makes their move
    if (action.type === "SELECT_MOVE") {
      this.clearMoveTimer();
      // Unpause after the current turn's move is made
      if (this.paused) this.paused = false;
    }

    this.broadcastState();

    // Start timer or auto-play for the next player if we transitioned to a new move phase
    if (this.state.phase === "move" && (prevPhase !== "move" || this.state.currentPlayer !== playerId)) {
      if (this.isRetired(this.state.currentPlayer)) {
        this.autoPlayIfRetired();
      } else {
        this.startMoveTimerIfNeeded();
      }
    }

    return true;
  }

  private logAction(action: GameAction): void {
    this.actionLog.push({
      step: this.state.currentStep,
      action: JSON.stringify(action),
      timestamp: Date.now(),
    });
  }

  /** Stable log ID for in-progress saves (overwritten each turn) */
  private get logId(): string {
    return "inprogress-" + this.room.code;
  }

  getGameLog(final = false): GameLog | null {
    if (!this.state.config) return null;
    return {
      id: final ? this.room.code + "-" + Date.now() : this.logId,
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

  /** Start move timer if timeout is configured and we're in the move phase */
  startMoveTimerIfNeeded(): void {
    this.clearMoveTimer();
    const timeout = this.room.moveTimeout;
    if (!timeout || timeout <= 0) return;
    if (this.state.phase !== "move") return;
    if (this.paused) return; // timeout disabled while paused

    this.moveDeadline = Date.now() + timeout * 1000;

    // Notify all clients about the timer
    broadcast(this.room, {
      type: "MOVE_TIMER",
      deadline: this.moveDeadline,
      playerId: this.state.currentPlayer,
    });

    this.moveTimer = setTimeout(() => {
      this.moveTimer = null;
      this.executeAutoMove();
    }, timeout * 1000);
  }

  clearMoveTimer(): void {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      this.moveTimer = null;
    }
    this.moveDeadline = 0;
  }

  getMoveDeadline(): number {
    return this.moveDeadline;
  }

  /** Execute auto-move when timeout expires */
  private executeAutoMove(): void {
    if (this.state.phase !== "move") return;

    const playerName = this.state.players[this.state.currentPlayer]?.name ?? "Player";

    // Pick best move using timeout logic
    const moveIndex = pickTimeoutMove(this.state);

    // Add timeout message
    this.state = {
      ...this.state,
      messages: [
        ...this.state.messages,
        { text: `${playerName} ran out of time - auto-selecting move`, type: "alert" as const },
      ],
    };

    // Execute the move
    const moveAction: GameAction = { type: "SELECT_MOVE", moveIndex };
    let newState = gameReducer(this.state, moveAction);
    this.logAction(moveAction);

    // If move resulted in a special event announcement, auto-acknowledge it
    while (newState.phase === "specialEvents") {
      const ackAction: GameAction = { type: "ACKNOWLEDGE_EVENT" };
      const next = gameReducer(newState, ackAction);
      this.logAction(ackAction);
      if (next === newState) break; // safety: avoid infinite loop
      newState = next;
    }

    // If we're now in trading phase, auto-trade: buy max in best company, then end
    if (newState.phase === "trading") {
      const buys = pickTimeoutBuy(newState);
      for (const buy of buys) {
        const buyAction: GameAction = { type: "BUY_SHARES", companyIndex: buy.companyIndex, amount: buy.amount };
        const afterBuy = gameReducer(newState, buyAction);
        this.logAction(buyAction);
        if (afterBuy !== newState) newState = afterBuy;
      }
      // End trading
      const endAction: GameAction = { type: "END_TRADING" };
      const afterEnd = gameReducer(newState, endAction);
      this.logAction(endAction);
      if (afterEnd !== newState) newState = afterEnd;
    }

    this.state = newState;
    this.room.lastActivity = Date.now();
    this.broadcastState();

    // Notify server handler for post-processing (leaderboard, persist, game log)
    if (this.onAutoMoveComplete) {
      this.onAutoMoveComplete();
    }

    // Start timer or auto-play for the next player
    if (this.state.phase === "move") {
      if (this.isRetired(this.state.currentPlayer)) {
        this.autoPlayIfRetired();
      } else {
        this.startMoveTimerIfNeeded();
      }
    }
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
