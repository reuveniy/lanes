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
  isAdmin: boolean;
  authenticate: (idToken: string) => void;
  clearLeaderboard: () => void;
  removeLeaderboardUser: (email: string) => void;
  deleteRoom: (roomCode: string) => void;
  createRoom: (maxPlayers: number, starCount: number, totalSteps: number, doublePayCount: number, fogOfWar: boolean) => void;
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

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      retryDelayRef.current = 1000;

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
    };

    ws.onclose = () => {
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
          setError(null);
          break;
        case "ROOM_JOINED":
          setRoomCode(msg.roomCode);
          setPlayerId(msg.playerId);
          setPlayers(msg.players);
          setObserving(false);
          setError(null);
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
          break;
        case "ERROR":
          setError(msg.message);
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
    return () => {
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
    (maxPlayers: number, starCount: number, totalSteps: number, doublePayCount: number, fogOfWar: boolean) => {
      sendMsg({ type: "CREATE_ROOM", maxPlayers, starCount, totalSteps, doublePayCount, fogOfWar });
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
    createRoom,
    joinRoom,
    observeRoom,
    listRooms: listRoomsCmd,
    startGame,
  };
}
