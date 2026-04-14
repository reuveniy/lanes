import { useState, useEffect, useRef, useCallback } from "react";
import type { GameState } from "../types/game";
import type { GameAction } from "../state/actions";
import { EMPTY_STATE } from "../state/initialState";
import type { ServerMessage, RoomInfo, LeaderboardEntryInfo } from "../../server/protocol";
import type { GameLog } from "../types/game";
import type { GameLogSummary } from "../../server/gameLogs";

export interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

export interface MultiplayerState {
  state: GameState;
  dispatch: (action: GameAction) => void;
  connected: boolean;
  authenticated: boolean;
  user: UserInfo | null;
  googleClientId: string;
  roomCode: string | null;
  playerId: number | null;
  players: string[];
  maxPlayers: number;
  error: string | null;
  observing: boolean;
  roomList: RoomInfo[];
  leaderboard: LeaderboardEntryInfo[];
  mapVotes: Record<number, boolean | null>;
  endGameVotes: Record<number, boolean | null>;
  endGameInitiator: string | null;
  stepsVote: { newSteps: number; initiator: string; votes: Record<number, boolean | null> } | null;
  gameLogs: GameLogSummary[];
  gameLogData: GameLog | null;
  listGameLogs: () => void;
  getGameLog: (id: string) => void;
  saveGameLog: (log: GameLog) => void;
  deleteGameLog: (id: string) => void;
  moveTimer: { deadline: number; playerId: number } | null;
  zoomLink: string | null;
  pauseVotes: Record<number, boolean | null>;
  pauseInitiator: string | null;
  paused: boolean;
  retiredPlayers: Set<number>;
  isAdmin: boolean;
  authenticate: (idToken: string) => void;
  clearLeaderboard: () => void;
  removeLeaderboardUser: (email: string) => void;
  deleteRoom: (roomCode: string) => void;
  endGame: (roomCode: string) => void;
  sendLeaderboardWhatsApp: () => void;
  sendGameResultsWhatsApp: (state?: import("../types/game").GameState) => void;
  sendBoardWhatsApp: (state?: import("../types/game").GameState) => void;
  retire: () => void;
  votePause: (accept: boolean) => void;
  updateTimeout: (timeout: number) => void;
  createRoom: (maxPlayers: number, starCount: number, totalSteps: number, doublePayCount: number, fogOfWar: boolean, moveTimeout: number, zoomLink?: string) => void;
  joinRoom: (roomCode: string) => void;
  observeRoom: (roomCode: string) => void;
  startNow: () => void;
  voteMap: (accept: boolean) => void;
  voteEndGame: (accept: boolean) => void;
  voteSteps: (newSteps: number | null, accept?: boolean) => void;
  listRooms: () => void;
  startGame: () => void;
}

export function useMultiplayerGame(enabled: boolean): MultiplayerState {
  const [gameState, setGameState] = useState<GameState>(EMPTY_STATE);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [googleClientId, setGoogleClientId] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [observing, setObserving] = useState(false);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryInfo[]>([]);
  const [mapVotes, setMapVotes] = useState<Record<number, boolean | null>>({});
  const [endGameVotes, setEndGameVotes] = useState<Record<number, boolean | null>>({});
  const [stepsVote, setStepsVote] = useState<{ newSteps: number; initiator: string; votes: Record<number, boolean | null> } | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLogSummary[]>([]);
  const [gameLogData, setGameLogData] = useState<GameLog | null>(null);
  const [endGameInitiator, setEndGameInitiator] = useState<string | null>(null);
  const [moveTimer, setMoveTimer] = useState<{ deadline: number; playerId: number } | null>(null);
  const [zoomLink, setZoomLink] = useState<string | null>(null);
  const [pauseVotes, setPauseVotes] = useState<Record<number, boolean | null>>({});
  const [pauseInitiator, setPauseInitiator] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [retiredPlayers, setRetiredPlayers] = useState<Set<number>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const identityRef = useRef<{ roomCode: string } | null>(null);
  const tokenRef = useRef<string | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(1000);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setError("Failed to connect to server");
      scheduleRetry();
      return;
    }

    wsRef.current = ws;

    let lastMessageAt = Date.now();
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      retryDelayRef.current = 1000;
      lastMessageAt = Date.now();

      // Re-authenticate if we have a token
      if (tokenRef.current) {
        ws.send(JSON.stringify({ type: "AUTH", idToken: tokenRef.current }));
      }

      // Auto-rejoin room
      const identity = identityRef.current;
      if (identity && identity.roomCode) {
        ws.send(JSON.stringify({ type: "JOIN_ROOM", roomCode: identity.roomCode }));
      }

      // Fetch room list and game logs (leaderboard comes after auth)
      ws.send(JSON.stringify({ type: "LIST_ROOMS" }));
      ws.send(JSON.stringify({ type: "LIST_GAME_LOGS" }));

      // Heartbeat: detect stale connections (no message for 30s → force reconnect)
      heartbeatInterval = setInterval(() => {
        if (Date.now() - lastMessageAt > 30000) {
          console.warn("WebSocket stale — no message for 30s, reconnecting");
          ws.close();
        }
      }, 10000);
    };

    ws.onclose = () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setConnected(false);
      setAuthenticated(false);
      setObserving(false);
      wsRef.current = null;
      scheduleRetry();
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onmessage = (event) => {
      lastMessageAt = Date.now();
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case "AUTH_REQUIRED":
          setGoogleClientId(msg.clientId);
          setAuthenticated(false);
          break;
        case "AUTH_OK":
          setAuthenticated(true);
          setUser({ name: msg.name, email: msg.email, picture: msg.picture });
          setGoogleClientId(msg.clientId);
          setIsAdmin(msg.isAdmin === true);
          setError(null);
          // Refresh leaderboard and rooms after login (slight delay to ensure state settled)
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "LIST_ROOMS" }));
            }
          }, 100);
          break;
        case "ROOM_CREATED":
          setRoomCode(msg.roomCode);
          setPlayerId(msg.playerId);
          setPlayers(msg.players);
          setMaxPlayers(msg.maxPlayers);
          setZoomLink(msg.zoomLink || null);
          setError(null);
          break;
        case "ROOM_JOINED":
          setRoomCode(msg.roomCode);
          setPlayerId(msg.playerId);
          setPlayers(msg.players);
          setZoomLink(msg.zoomLink || null);
          setObserving(false);
          setError(null);
          // Restore active vote states on rejoin (bundled atomically)
          if (msg.rejoinState) {
            if (msg.rejoinState.endGameVotes) {
              setEndGameVotes(msg.rejoinState.endGameVotes);
              setEndGameInitiator(msg.rejoinState.endGameInitiator ?? null);
            }
            if (msg.rejoinState.stepsVote) {
              setStepsVote(msg.rejoinState.stepsVote);
            }
            if (msg.rejoinState.mapVotes) {
              setMapVotes(msg.rejoinState.mapVotes);
            }
            if (msg.rejoinState.pauseVotes) {
              setPauseVotes(msg.rejoinState.pauseVotes as Record<number, boolean | null>);
              setPauseInitiator((msg.rejoinState.pauseInitiator as string) ?? null);
            }
          }
          break;
        case "ROOM_LIST":
          setRoomList(msg.rooms);
          break;
        case "MAP_VOTES":
          setMapVotes(msg.votes);
          break;
        case "GAME_LOGS":
          setGameLogs(msg.logs);
          break;
        case "GAME_LOG_DATA":
          setGameLogData(msg.log);
          break;
        case "STEPS_VOTES":
          setStepsVote({ newSteps: msg.newSteps, initiator: msg.initiator, votes: msg.votes });
          break;
        case "STEPS_VOTE_CANCELLED":
          setStepsVote(null);
          break;
        case "MOVE_TIMER":
          // Use remainingMs to compute deadline from client clock (avoids server/client time drift)
          setMoveTimer({ deadline: Date.now() + (msg.remainingMs ?? Math.max(0, msg.deadline - Date.now())), playerId: msg.playerId });
          setPaused(false);
          break;
        case "PAUSE_VOTES":
          setPauseVotes(msg.votes);
          setPauseInitiator(msg.initiator);
          break;
        case "RETIRED_PLAYERS":
          setRetiredPlayers(new Set(msg.playerIds));
          break;
        case "PAUSE_CANCELLED":
          // If votes were active and now cleared, pause was either accepted or rejected
          if (Object.keys(pauseVotes).length > 0) {
            const allAccepted = Object.values(pauseVotes).every((v) => v === true);
            if (allAccepted) setPaused(true);
          }
          setPauseVotes({});
          setPauseInitiator(null);
          break;
        case "END_GAME_VOTES":
          setEndGameVotes(msg.votes);
          setEndGameInitiator(msg.initiator);
          break;
        case "LEADERBOARD":
          setLeaderboard(msg.entries);
          break;
        case "OBSERVING":
          setRoomCode(msg.roomCode);
          setPlayers(msg.players);
          setObserving(true);
          setError(null);
          break;
        case "PLAYER_JOINED":
          setPlayers(msg.players);
          break;
        case "PLAYER_LEFT":
          setPlayers(msg.players);
          break;
        case "STATE_UPDATE":
          setGameState(msg.state);
          // Clear move timer when state changes (server will send new one if needed)
          if (msg.state.phase !== "move") setMoveTimer(null);
          break;
        case "ERROR":
          if (msg.message === "GAME_DELETED") {
            // Reset game state — triggers redirect to home
            setRoomCode(null);
            setPlayerId(null);
            setPlayers([]);
            setObserving(false);
            setGameState(EMPTY_STATE);
            setError("Game was deleted by admin");
            identityRef.current = null;
          } else {
            setError(msg.message);
          }
          break;
      }
    };

    function scheduleRetry() {
      if (!enabled) return;
      const delay = retryDelayRef.current;
      retryDelayRef.current = Math.min(delay * 2, 15000);
      retryRef.current = setTimeout(connect, delay);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();

    // Reconnect when tab becomes visible (catches mobile sleep / laptop lid)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          console.log("Tab visible — reconnecting stale WebSocket");
          connect();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [enabled, connect]);

  const sendMsg = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open, dropping message:", (msg as any).type);
    }
  }, []);

  const authenticate = useCallback(
    (idToken: string) => {
      tokenRef.current = idToken;
      sendMsg({ type: "AUTH", idToken });
    },
    [sendMsg]
  );

  const dispatch = useCallback(
    (action: GameAction) => {
      sendMsg({ type: "GAME_ACTION", action });
    },
    [sendMsg]
  );

  const createRoom = useCallback(
    (maxPlayers: number, starCount: number, totalSteps: number, doublePayCount: number, fogOfWar: boolean, moveTimeout: number, zoomLink?: string) => {
      sendMsg({ type: "CREATE_ROOM", maxPlayers, starCount, totalSteps, doublePayCount, fogOfWar, moveTimeout, zoomLink });
    },
    [sendMsg]
  );

  const joinRoom = useCallback(
    (code: string) => {
      sendMsg({ type: "JOIN_ROOM", roomCode: code });
      identityRef.current = { roomCode: code };
    },
    [sendMsg]
  );

  const startGame = useCallback(
    () => {
      sendMsg({ type: "START_GAME" });
    },
    [sendMsg]
  );

  const observeRoom = useCallback(
    (code: string) => {
      sendMsg({ type: "OBSERVE_ROOM", roomCode: code });
    },
    [sendMsg]
  );

  const listRoomsCmd = useCallback(() => {
    sendMsg({ type: "LIST_ROOMS" });
  }, [sendMsg]);

  const clearLeaderboardCmd = useCallback(() => {
    sendMsg({ type: "ADMIN_CLEAR_LEADERBOARD" });
  }, [sendMsg]);

  const removeLeaderboardUserCmd = useCallback(
    (email: string) => {
      sendMsg({ type: "ADMIN_REMOVE_LEADERBOARD_USER", email });
    },
    [sendMsg]
  );

  useEffect(() => {
    if (roomCode && identityRef.current) {
      identityRef.current.roomCode = roomCode;
    }
  }, [roomCode]);

  return {
    state: gameState,
    dispatch,
    connected,
    authenticated,
    user,
    googleClientId,
    roomCode,
    playerId,
    players,
    maxPlayers,
    error,
    observing,
    roomList,
    leaderboard,
    mapVotes,
    endGameVotes,
    endGameInitiator,
    stepsVote,
    moveTimer,
    zoomLink,
    pauseVotes,
    pauseInitiator,
    paused,
    retiredPlayers,
    gameLogs,
    gameLogData,
    listGameLogs: useCallback(() => sendMsg({ type: "LIST_GAME_LOGS" }), [sendMsg]),
    getGameLog: useCallback((id: string) => { setGameLogData(null); sendMsg({ type: "GET_GAME_LOG", id }); }, [sendMsg]),
    saveGameLog: useCallback((log: GameLog) => sendMsg({ type: "SAVE_GAME_LOG", log }), [sendMsg]),
    deleteGameLog: useCallback((id: string) => sendMsg({ type: "ADMIN_DELETE_GAME_LOG", id }), [sendMsg]),
    isAdmin,
    authenticate,
    clearLeaderboard: clearLeaderboardCmd,
    removeLeaderboardUser: removeLeaderboardUserCmd,
    startNow: useCallback(() => sendMsg({ type: "START_NOW" }), [sendMsg]),
    voteMap: useCallback(
      (accept: boolean) => sendMsg({ type: "MAP_VOTE", accept }),
      [sendMsg]
    ),
    voteEndGame: useCallback(
      (accept: boolean) => sendMsg({ type: "END_GAME_VOTE", accept }),
      [sendMsg]
    ),
    voteSteps: useCallback(
      (newSteps: number | null, accept?: boolean) =>
        sendMsg({ type: "STEPS_VOTE", newSteps, accept }),
      [sendMsg]
    ),
    deleteRoom: useCallback(
      (roomCode: string) => sendMsg({ type: "ADMIN_DELETE_ROOM", roomCode }),
      [sendMsg]
    ),
    endGame: useCallback(
      (roomCode: string) => sendMsg({ type: "ADMIN_END_GAME", roomCode }),
      [sendMsg]
    ),
    sendLeaderboardWhatsApp: useCallback(
      () => sendMsg({ type: "SEND_LEADERBOARD_WHATSAPP" }),
      [sendMsg]
    ),
    sendGameResultsWhatsApp: useCallback(
      (state?: import("../types/game").GameState) =>
        sendMsg({ type: "SEND_GAME_RESULTS_WHATSAPP", ...(state ? { state } : {}) }),
      [sendMsg]
    ),
    sendBoardWhatsApp: useCallback(
      (state?: import("../types/game").GameState) =>
        sendMsg({ type: "SEND_BOARD_WHATSAPP", ...(state ? { state } : {}) }),
      [sendMsg]
    ),
    retire: useCallback(
      () => sendMsg({ type: "RETIRE" }),
      [sendMsg]
    ),
    votePause: useCallback(
      (accept: boolean) => sendMsg({ type: "PAUSE_VOTE", accept }),
      [sendMsg]
    ),
    updateTimeout: useCallback(
      (timeout: number) => sendMsg({ type: "UPDATE_TIMEOUT", timeout }),
      [sendMsg]
    ),
    createRoom,
    joinRoom,
    observeRoom,
    listRooms: listRoomsCmd,
    startGame,
  };
}
