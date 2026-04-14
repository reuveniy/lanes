import express from "express";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  deleteRoom,
  broadcast,
  send,
  addObserver,
  removeObserver,
  listRooms,
  serializeRooms,
  restoreRooms,
} from "./rooms";
import {
  getOrCreateSession,
  getSession,
  deleteSession,
  serializeSessions,
  restoreSessions,
} from "./gameSession";
import { loadState, saveState } from "./persist";
import type { GameState } from "../src/types/game";
import { gameReducer } from "../src/state/reducer";
import { saveGameLog, listGameLogs, getGameLog, deleteGameLog } from "./gameLogs";
import { sendWhatsAppImage, isGreenApiConfigured } from "./greenapi";
import { renderLeaderboardImage } from "./leaderboardImage";
import { renderGameOverImage } from "./gameOverImage";
import { renderBoardSnapshot } from "./boardImage";

/** Record game result, broadcast leaderboard to all clients, and send game over + leaderboard to WhatsApp */
function recordAndBroadcastResult(playerEmails: string[], winnerEmail: string, gameState: GameState): void {
  recordGameResult(playerEmails, winnerEmail);
  const entries = getLeaderboard();
  for (const client of wss.clients) {
    send(client as WebSocket, { type: "LEADERBOARD", entries });
  }
  if (isGreenApiConfigured()) {
    // Send game over image
    console.log("WhatsApp: Auto-sending game over results");
    const gameOverPng = renderGameOverImage(gameState);
    const winnerName = gameState.winner !== null ? gameState.players[gameState.winner]?.name : null;
    const caption = winnerName ? `Game Over — ${winnerName} Wins!` : "Game Over";
    sendWhatsAppImage(gameOverPng, caption).catch((err) => {
      console.error("WhatsApp: Auto-send game over failed —", err);
    });
    // Send updated leaderboard image
    if (entries.length > 0) {
      console.log("WhatsApp: Auto-sending leaderboard after game end");
      const leaderboardPng = renderLeaderboardImage(entries);
      sendWhatsAppImage(leaderboardPng, "Star Lanes Leaderboard").catch((err) => {
        console.error("WhatsApp: Auto-send leaderboard failed —", err);
      });
    }
  }
}
import { verifyGoogleToken, getClientId, type GoogleUser } from "./auth";
import {
  loadLeaderboard,
  registerUser,
  recordGameResult,
  getLeaderboard,
  clearLeaderboard,
  removeLeaderboardUser,
} from "./leaderboard";

const ADMIN_EMAIL = "yny.all@gmail.com";
import type { ClientMessage } from "./protocol";

const app = express();

// HTTPS if SSL cert/key files exist (disabled with NO_SSL=1)
const SSL_CERT = process.env.SSL_CERT || "ssl/cert.pem";
const SSL_KEY = process.env.SSL_KEY || "ssl/key.pem";
const useSSL =
  !process.env.NO_SSL &&
  fs.existsSync(SSL_CERT) &&
  fs.existsSync(SSL_KEY);

const SSL_PASSPHRASE = process.env.SSL_PASSPHRASE || "";

let server;
if (useSSL) {
  const opts: { cert: Buffer; key: Buffer; passphrase?: string } = {
    cert: fs.readFileSync(SSL_CERT),
    key: fs.readFileSync(SSL_KEY),
  };
  if (SSL_PASSPHRASE) {
    opts.passphrase = SSL_PASSPHRASE;
  }
  server = createHttpsServer(opts, app);
} else {
  server = createServer(app);
}

const wss = new WebSocketServer({ server, path: "/ws" });

// In dev mode, use Vite's dev middleware; in production, serve static files
const distPath = path.join(__dirname, "../dist");
const isDev = process.env.NODE_ENV !== "production" && !process.env.NO_VITE;

async function setupViteOrStatic() {
  if (isDev) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite dev middleware attached");
    } catch (e) {
      console.log("Vite not available, serving static files from dist/");
      app.use(express.static(distPath));
    }
  } else {
    app.use(express.static(distPath));
    // SPA fallback — serve index.html for non-API routes
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving built client from dist/");
  }
}

setupViteOrStatic();

// Expose client ID for the frontend
app.get("/api/config", (_req, res) => {
  res.json({ googleClientId: getClientId() });
});

// --- Restore persisted state ---
const persisted = loadState();
if (persisted) {
  restoreRooms(persisted.rooms);
  restoreSessions(persisted.sessions, getRoom);
  const roomCount = Object.keys(persisted.rooms).length;
  const sessionCount = Object.keys(persisted.sessions).length;
  // Wire up auto-move callbacks and restart timers for restored sessions
  for (const code of Object.keys(persisted.sessions)) {
    const session = getSession(code);
    if (session) {
      setupAutoMoveCallback(session);
      if (session.state.phase === "move") {
        session.startMoveTimerIfNeeded();
      }
    }
  }
  console.log(`Restored ${roomCount} rooms, ${sessionCount} game sessions`);
}
// Load leaderboard (async — merges local + remote)
loadLeaderboard().catch((e) => console.error("Leaderboard load error:", e));

function persistAll(): void {
  saveState({
    rooms: serializeRooms(),
    sessions: serializeSessions(),
  });
}

/** Wire up auto-move callback so timeout-triggered moves handle leaderboard/persistence */
function setupAutoMoveCallback(session: ReturnType<typeof getSession>): void {
  if (!session) return;
  session.onAutoMoveComplete = () => {
    const room = session.room;
    if (session.state.phase === "gameOver" && session.state.winner !== null) {
      const playerEmails = room.players.map((p) => p.email);
      const winnerEmail = room.players[session.state.winner]?.email;
      if (winnerEmail) {
        recordAndBroadcastResult(playerEmails, winnerEmail, session.state);
      }
      deleteGameLog("inprogress-" + room.code);
      const log = session.getGameLog(true);
      if (log) saveGameLog(log);
    } else {
      const log = session.getGameLog();
      if (log) saveGameLog(log);
    }
    persistAll();
  };
}

// Track authenticated users per WebSocket
const wsAuth = new Map<WebSocket, GoogleUser>();
const wsRoomMap = new Map<WebSocket, string>();

function requireAuth(ws: WebSocket): GoogleUser | null {
  const user = wsAuth.get(ws);
  if (!user) {
    send(ws, { type: "AUTH_REQUIRED", clientId: getClientId() });
    return null;
  }
  return user;
}

// Ping all clients every 20s to keep connections alive and detect dead sockets
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === 1) ws.ping();
  }
}, 20000);

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", (err) => {
    console.error("WebSocket connection error:", err.message);
  });

  // Send auth requirement on connect
  send(ws, { type: "AUTH_REQUIRED", clientId: getClientId() });

  ws.on("message", async (raw: Buffer) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "ERROR", message: "Invalid JSON" });
      return;
    }

    if (!msg || typeof msg.type !== "string") {
      send(ws, { type: "ERROR", message: "Invalid message" });
      return;
    }

    // Validate required fields for messages that need them
    const needsRoomCode = ["OBSERVE_ROOM", "JOIN_ROOM", "ADMIN_DELETE_ROOM", "ADMIN_END_GAME"];
    if (needsRoomCode.includes(msg.type) && (!("roomCode" in msg) || typeof (msg as { roomCode?: unknown }).roomCode !== "string")) {
      send(ws, { type: "ERROR", message: "Missing roomCode" });
      return;
    }
    if (msg.type === "ADMIN_REMOVE_LEADERBOARD_USER" && (!("email" in msg) || typeof (msg as { email?: unknown }).email !== "string")) {
      send(ws, { type: "ERROR", message: "Missing email" });
      return;
    }
    if (msg.type === "GAME_ACTION" && (!("action" in msg) || !(msg as { action?: unknown }).action)) {
      send(ws, { type: "ERROR", message: "Missing action" });
      return;
    }
    if (msg.type === "AUTH" && (!("idToken" in msg) || typeof (msg as { idToken?: unknown }).idToken !== "string")) {
      send(ws, { type: "ERROR", message: "Missing idToken" });
      return;
    }
    const needsBool = ["MAP_VOTE", "END_GAME_VOTE", "PAUSE_VOTE"];
    if (needsBool.includes(msg.type) && !("accept" in msg)) {
      send(ws, { type: "ERROR", message: "Missing accept field" });
      return;
    }

    // AUTH doesn't require prior auth
    if (msg.type === "AUTH") {
      const user = await verifyGoogleToken(msg.idToken);
      console.log("AUTH: verifyGoogleToken returned:", user ? `${user.email} (${user.name})` : "null (using dev fallback)");
      if (!user) {
        // If GOOGLE_CLIENT_ID not set, accept with dummy user from token
        // This allows development without Google setup (disabled in production)
        if (process.env.NODE_ENV === "production") {
          send(ws, { type: "ERROR", message: "Authentication failed" });
          return;
        }
        try {
          const b64 = msg.idToken.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const payload = JSON.parse(Buffer.from(b64, "base64").toString());
          const devUser: GoogleUser = {
            id: payload.sub || "dev",
            email: payload.email || "dev@local",
            name: payload.name || "Developer",
            picture: payload.picture || "",
          };
          wsAuth.set(ws, devUser);
          registerUser(devUser.email, devUser.name, devUser.picture);
          send(ws, {
            type: "AUTH_OK",
            name: devUser.name,
            email: devUser.email,
            picture: devUser.picture,
            clientId: getClientId(),
            isAdmin: devUser.email.toLowerCase() === ADMIN_EMAIL,
          });
          console.log("AUTH dev path: email=", devUser.email, "isAdmin=", devUser.email.toLowerCase() === ADMIN_EMAIL);
          send(ws, { type: "LEADERBOARD", entries: getLeaderboard() });
        } catch (e) {
          console.error("AUTH dev fallback failed:", e);
          send(ws, { type: "ERROR", message: "Invalid token" });
        }
        return;
      }
      wsAuth.set(ws, user);
      registerUser(user.email, user.name, user.picture);
      send(ws, {
        type: "AUTH_OK",
        name: user.name,
        email: user.email,
        picture: user.picture,
        clientId: getClientId(),
        isAdmin: user.email.toLowerCase() === ADMIN_EMAIL,
      });
      console.log("AUTH real path: email=", user.email, "isAdmin=", user.email.toLowerCase() === ADMIN_EMAIL);

      // Auto-send room list and leaderboard after auth
      send(ws, { type: "LEADERBOARD", entries: getLeaderboard() });
      const rooms = listRooms();
      for (const info of rooms) {
        const session = getSession(info.code);
        if (session) {
          const extra = session.getRoomInfo();
          info.currentStep = extra.currentStep ?? 0;
          info.totalSteps = extra.totalSteps ?? 0;
          info.phase = extra.phase ?? "lobby";
        }
      }
      send(ws, { type: "ROOM_LIST", rooms });
      return;
    }

    // Game logs don't require auth
    if (msg.type === "LIST_GAME_LOGS") {
      send(ws, { type: "GAME_LOGS", logs: listGameLogs() });
      return;
    }
    if (msg.type === "GET_GAME_LOG") {
      const log = getGameLog(msg.id);
      if (log) {
        send(ws, { type: "GAME_LOG_DATA", log });
      } else {
        send(ws, { type: "ERROR", message: "Game log not found" });
      }
      return;
    }

    // Save game log (local games)
    if (msg.type === "SAVE_GAME_LOG") {
      saveGameLog(msg.log);
      return;
    }

    // GET_LEADERBOARD doesn't require auth
    if (msg.type === "GET_LEADERBOARD") {
      send(ws, { type: "LEADERBOARD", entries: getLeaderboard() });
      return;
    }

    // LIST_ROOMS doesn't require auth (for browsing)
    if (msg.type === "LIST_ROOMS") {
      const rooms = listRooms();
      for (const info of rooms) {
        const session = getSession(info.code);
        if (session) {
          const extra = session.getRoomInfo();
          info.currentStep = extra.currentStep ?? 0;
          info.totalSteps = extra.totalSteps ?? 0;
          info.phase = extra.phase ?? "lobby";
        }
      }
      send(ws, { type: "ROOM_LIST", rooms });
      // Also send leaderboard alongside room list
      send(ws, { type: "LEADERBOARD", entries: getLeaderboard() });
      return;
    }

    // OBSERVE_ROOM doesn't require auth
    if (msg.type === "OBSERVE_ROOM") {
      const room = getRoom(msg.roomCode);
      if (!room) {
        send(ws, { type: "ERROR", message: "Room not found" });
        return;
      }
      addObserver(room, ws);
      wsRoomMap.set(ws, room.code);
      send(ws, {
        type: "OBSERVING",
        roomCode: room.code,
        players: room.players.map((p) => p.name),
      });
      const session = getSession(room.code);
      if (session && room.started) {
        session.broadcastState();
      }
      return;
    }

    // WhatsApp sharing doesn't require auth
    if (msg.type === "SEND_LEADERBOARD_WHATSAPP") {
      console.log("WhatsApp: Leaderboard share requested");
      if (!isGreenApiConfigured()) {
        send(ws, { type: "ERROR", message: "WhatsApp not configured" });
        return;
      }
      const entries = getLeaderboard();
      if (entries.length === 0) {
        send(ws, { type: "ERROR", message: "Leaderboard is empty" });
        return;
      }
      const pngBuffer = renderLeaderboardImage(entries);
      sendWhatsAppImage(pngBuffer, "Star Lanes Leaderboard").then((ok) => {
        if (!ok) send(ws, { type: "ERROR", message: "Failed to send WhatsApp message" });
      });
      return;
    }

    if (msg.type === "SEND_GAME_RESULTS_WHATSAPP") {
      console.log("WhatsApp: Game results share requested", msg.state ? "(with state)" : "(no state)");
      if (!isGreenApiConfigured()) {
        send(ws, { type: "ERROR", message: "WhatsApp not configured" });
        return;
      }
      let resultState: GameState | undefined = msg.state;
      if (!resultState) {
        const roomCode = wsRoomMap.get(ws);
        if (roomCode) { const s = getSession(roomCode); if (s) resultState = s.state; }
      }
      if (!resultState || resultState.phase !== "gameOver") {
        send(ws, { type: "ERROR", message: "Game not over" });
        return;
      }
      const resultPng = renderGameOverImage(resultState);
      const winnerName = resultState.winner !== null ? resultState.players[resultState.winner]?.name : null;
      const caption = winnerName ? `Game Over — ${winnerName} Wins!` : "Game Over";
      sendWhatsAppImage(resultPng, caption).then((ok) => {
        if (!ok) send(ws, { type: "ERROR", message: "Failed to send WhatsApp message" });
      });
      return;
    }

    if (msg.type === "SEND_BOARD_WHATSAPP") {
      console.log("WhatsApp: Board snapshot share requested", msg.state ? "(with state)" : "(from session)");
      if (!isGreenApiConfigured()) {
        send(ws, { type: "ERROR", message: "WhatsApp not configured" });
        return;
      }
      let boardState: GameState | undefined = msg.state;
      if (!boardState) {
        const roomCode = wsRoomMap.get(ws);
        if (roomCode) { const s = getSession(roomCode); if (s) boardState = s.state; }
      }
      if (!boardState) { send(ws, { type: "ERROR", message: "No game state available" }); return; }
      const boardPng = renderBoardSnapshot(boardState);
      const caption = `Star Lanes — Step ${boardState.currentStep}/${boardState.totalSteps}`;
      sendWhatsAppImage(boardPng, caption).then((ok) => {
        if (!ok) send(ws, { type: "ERROR", message: "Failed to send WhatsApp message" });
      });
      return;
    }

    // All other actions require auth
    const user = requireAuth(ws);
    if (!user) return;

    switch (msg.type) {
      case "CREATE_ROOM": {
        const maxP = Math.min(6, Math.max(2, msg.maxPlayers || 4));
        const stars = Math.min(180, Math.max(100, msg.starCount || 150));
        const steps = Math.min(360, Math.max(80, msg.totalSteps || 180));
        const dpCount = Math.min(16, Math.max(2, msg.doublePayCount || 10));
        const moveTimeout = Math.min(300, Math.max(0, msg.moveTimeout || 0));
        const zoomLink = typeof msg.zoomLink === "string" ? msg.zoomLink.trim() : "";
        const room = createRoom(
          user.name, user.email, ws,
          maxP,
          stars,
          steps,
          dpCount,
          msg.fogOfWar || false,
          moveTimeout,
          zoomLink
        );
        wsRoomMap.set(ws, room.code);
        send(ws, {
          type: "ROOM_CREATED",
          roomCode: room.code,
          playerId: 0,
          players: room.players.map((p) => p.name),
          maxPlayers: room.maxPlayers,
          ...(room.zoomLink ? { zoomLink: room.zoomLink } : {}),
        });
        persistAll();
        break;
      }

      case "JOIN_ROOM": {
        const result = joinRoom(msg.roomCode, user.name, user.email, ws);
        if (!result) {
          send(ws, {
            type: "ERROR",
            message: "Room not found, full, or already started",
          });
          return;
        }
        const { room, playerId } = result;
        wsRoomMap.set(ws, room.code);

        const playerNames = room.players.map((p) => p.name);

        // Build rejoin state if reconnecting to a started game
        const existingSession = getSession(room.code);
        let rejoinState: Record<string, unknown> | undefined;
        if (existingSession && room.started) {
          rejoinState = {};
          if (existingSession.endGameVotingActive) {
            const votes: Record<number, boolean | null> = {};
            for (const [id, v] of existingSession.endGameVotes) {
              votes[id] = v;
            }
            rejoinState.endGameVotes = votes;
            rejoinState.endGameInitiator = existingSession.endGameInitiator;
          }
          if (existingSession.stepsVotingActive) {
            const votes: Record<number, boolean | null> = {};
            for (const [id, v] of existingSession.stepsVotes) {
              votes[id] = v;
            }
            rejoinState.stepsVote = { newSteps: existingSession.stepsNewValue, initiator: existingSession.stepsInitiator ?? "", votes };
          }
          if (existingSession.pauseVotingActive) {
            const votes: Record<number, boolean | null> = {};
            for (const [id, v] of existingSession.pauseVotes) {
              votes[id] = v;
            }
            rejoinState.pauseVotes = votes;
            rejoinState.pauseInitiator = existingSession.pauseInitiator;
          }
          if (existingSession.state.phase === "mapSelect") {
            const votes: Record<number, boolean | null> = {};
            for (const [id, v] of existingSession.mapVotes) {
              votes[id] = v;
            }
            rejoinState.mapVotes = votes;
          }
        }

        send(ws, {
          type: "ROOM_JOINED",
          roomCode: room.code,
          playerId,
          players: playerNames,
          ...(room.zoomLink ? { zoomLink: room.zoomLink } : {}),
          ...(rejoinState ? { rejoinState } : {}),
        });

        broadcast(room, {
          type: "PLAYER_JOINED",
          playerName: user.name,
          players: playerNames,
        });

        // If reconnecting to a started game, broadcast current state + timer
        if (existingSession && room.started) {
          existingSession.broadcastState();
          // Send retired player list
          broadcast(room, { type: "RETIRED_PLAYERS", playerIds: room.players.filter((p) => p.retired).map((p) => p.playerId) });

          // If it's this player's turn and they just un-retired, start their timer
          if (existingSession.state.phase === "move" && existingSession.state.currentPlayer === playerId) {
            existingSession.startMoveTimerIfNeeded();
          }

          const deadline = existingSession.getMoveDeadline();
          if (deadline > Date.now()) {
            send(ws, { type: "MOVE_TIMER", deadline, remainingMs: Math.max(0, deadline - Date.now()), playerId: existingSession.state.currentPlayer });
          }
        }

        // Auto-start when maxPlayers reached
        if (!room.started && room.players.length >= room.maxPlayers) {
          room.started = true;
          const session = getOrCreateSession(room);
          setupAutoMoveCallback(session);
          session.start(room.starCount, room.totalSteps, room.doublePayCount);
        }

        persistAll();
        break;
      }

      case "START_GAME": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) {
          send(ws, { type: "ERROR", message: "Not in a room" });
          return;
        }
        const room = getRoom(roomCode);
        if (!room) return;

        const host = room.players.find((p) => p.ws === ws);
        if (!host || host.playerId !== room.hostId) {
          send(ws, { type: "ERROR", message: "Only host can start" });
          return;
        }

        if (room.players.length < 2) {
          send(ws, {
            type: "ERROR",
            message: "Need at least 2 players",
          });
          return;
        }

        room.started = true;
        const session = getOrCreateSession(room);
        setupAutoMoveCallback(session);
        session.start(room.starCount, room.totalSteps, room.doublePayCount);
        persistAll();
        break;
      }

      case "START_NOW": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const host = room.players.find((p) => p.ws === ws);
        if (!host || host.playerId !== room.hostId) {
          send(ws, { type: "ERROR", message: "Only host can start early" });
          return;
        }
        if (room.started || room.players.length < 2) return;

        // Set maxPlayers to current count and start
        room.maxPlayers = room.players.length;
        room.started = true;
        const session = getOrCreateSession(room);
        setupAutoMoveCallback(session);
        session.start(room.starCount, room.totalSteps, room.doublePayCount);
        persistAll();
        break;
      }

      case "MAP_VOTE": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const voter = room.players.find((p) => p.ws === ws);
        if (!voter) return;
        const session = getSession(roomCode);
        if (!session) return;
        session.handleMapVote(voter.playerId, msg.accept);
        persistAll();
        break;
      }

      case "STEPS_VOTE": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const voter = room.players.find((p) => p.ws === ws);
        if (!voter) return;
        const session = getSession(roomCode);
        if (!session) return;
        session.handleStepsVote(voter.playerId, msg.newSteps, msg.accept);
        persistAll();
        break;
      }

      case "END_GAME_VOTE": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const voter = room.players.find((p) => p.ws === ws);
        if (!voter) return;
        const session = getSession(roomCode);
        if (!session) return;
        const ended = session.handleEndGameVote(voter.playerId, msg.accept);
        if (ended) {
          if (session.state.winner !== null) {
            const playerEmails = room.players.map((p) => p.email);
            const winnerEmail = room.players[session.state.winner]?.email;
            if (winnerEmail) {
              recordAndBroadcastResult(playerEmails, winnerEmail, session.state);
            }
            deleteGameLog("inprogress-" + roomCode);
            const log = session.getGameLog(true);
            if (log) saveGameLog(log);
          }
        }
        persistAll();
        break;
      }

      case "UPDATE_TIMEOUT": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const newTimeout = Math.min(300, Math.max(0, msg.timeout || 0));
        room.moveTimeout = newTimeout;
        console.log(`Timeout updated to ${newTimeout}s for room ${roomCode} by ${user.name}`);
        // Broadcast new timeout to all players via MOVE_TIMER with 0 deadline (info only)
        broadcast(room, { type: "MOVE_TIMER", deadline: 0, remainingMs: 0, playerId: -1 });
        // If a timer is active, restart it with the new timeout
        const session = getSession(roomCode);
        if (session && session.state.phase === "move" && !session.paused) {
          session.startMoveTimerIfNeeded();
        }
        persistAll();
        break;
      }

      case "PAUSE_VOTE": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const voter = room.players.find((p) => p.ws === ws);
        if (!voter) return;
        const session = getSession(roomCode);
        if (!session) return;
        session.handlePauseVote(voter.playerId, msg.accept);
        break;
      }

      case "GAME_ACTION": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;

        const player = room.players.find((p) => p.ws === ws);
        if (!player) return;

        const session = getSession(roomCode);
        if (!session) return;

        if (session.handleAction(player.playerId, msg.action)) {
          persistAll();

          if (session.state.phase === "gameOver" && session.state.winner !== null) {
            // Record leaderboard + save final game log on game end
            const playerEmails = room.players.map((p) => p.email);
            const winnerEmail = room.players[session.state.winner]?.email;
            if (winnerEmail) {
              recordAndBroadcastResult(playerEmails, winnerEmail, session.state);
            }
            // Delete in-progress log and save final version
            deleteGameLog("inprogress-" + roomCode);
            const log = session.getGameLog(true);
            if (log) saveGameLog(log);
          } else {
            // Save in-progress game log on every turn
            const log = session.getGameLog();
            if (log) saveGameLog(log);
          }
        }
        break;
      }

      case "ADMIN_CLEAR_LEADERBOARD": {
        if (user.email.toLowerCase() !== ADMIN_EMAIL) {
          send(ws, { type: "ERROR", message: "Not authorized" });
          return;
        }
        clearLeaderboard();
        for (const client of wss.clients) {
          send(client as WebSocket, {
            type: "LEADERBOARD",
            entries: getLeaderboard(),
          });
        }
        break;
      }

      case "ADMIN_REMOVE_LEADERBOARD_USER": {
        if (user.email.toLowerCase() !== ADMIN_EMAIL) {
          send(ws, { type: "ERROR", message: "Not authorized" });
          return;
        }
        removeLeaderboardUser(msg.email);
        for (const client of wss.clients) {
          send(client as WebSocket, {
            type: "LEADERBOARD",
            entries: getLeaderboard(),
          });
        }
        break;
      }

      case "ADMIN_DELETE_ROOM": {
        if (user.email.toLowerCase() !== ADMIN_EMAIL) {
          send(ws, { type: "ERROR", message: "Not authorized" });
          return;
        }
        const room = getRoom(msg.roomCode);
        if (room) {
          const session = getSession(msg.roomCode);
          if (session) session.clearMoveTimer();
          // Notify connected players to exit
          broadcast(room, { type: "ERROR", message: "GAME_DELETED" });
        }
        deleteRoom(msg.roomCode);
        deleteSession(msg.roomCode);
        persistAll();
        // Send updated room list to all
        const updatedRooms = listRooms();
        for (const info of updatedRooms) {
          const session = getSession(info.code);
          if (session) {
            const extra = session.getRoomInfo();
            info.currentStep = extra.currentStep ?? 0;
            info.totalSteps = extra.totalSteps ?? 0;
            info.phase = extra.phase ?? "lobby";
          }
        }
        for (const client of wss.clients) {
          send(client as WebSocket, { type: "ROOM_LIST", rooms: updatedRooms });
        }
        break;
      }

      case "ADMIN_END_GAME": {
        if (user.email.toLowerCase() !== ADMIN_EMAIL) {
          send(ws, { type: "ERROR", message: "Not authorized" });
          return;
        }
        const room = getRoom(msg.roomCode);
        const session = getSession(msg.roomCode);
        if (!room || !session) {
          send(ws, { type: "ERROR", message: "Room or session not found" });
          return;
        }
        if (session.state.phase === "gameOver") {
          send(ws, { type: "ERROR", message: "Game already ended" });
          return;
        }
        // Force end the game
        session.state = gameReducer(session.state, { type: "END_GAME_EARLY" });
        session.broadcastState();
        // Record winner on leaderboard + save final game log
        if (session.state.winner !== null) {
          const playerEmails = room.players.map((p) => p.email);
          const winnerEmail = room.players[session.state.winner]?.email;
          if (winnerEmail) {
            recordAndBroadcastResult(playerEmails, winnerEmail, session.state);
          }
        }
        deleteGameLog("inprogress-" + msg.roomCode);
        const adminLog = session.getGameLog(true);
        if (adminLog) saveGameLog(adminLog);
        persistAll();
        // Send updated room list
        const endedRooms = listRooms();
        for (const info of endedRooms) {
          const s = getSession(info.code);
          if (s) {
            const extra = s.getRoomInfo();
            info.currentStep = extra.currentStep ?? 0;
            info.totalSteps = extra.totalSteps ?? 0;
            info.phase = extra.phase ?? "lobby";
          }
        }
        for (const client of wss.clients) {
          send(client as WebSocket, { type: "ROOM_LIST", rooms: endedRooms });
        }
        break;
      }

      case "ADMIN_DELETE_GAME_LOG": {
        if (user.email.toLowerCase() !== ADMIN_EMAIL) {
          send(ws, { type: "ERROR", message: "Not authorized" });
          return;
        }
        deleteGameLog(msg.id);
        for (const client of wss.clients) {
          send(client as WebSocket, { type: "GAME_LOGS", logs: listGameLogs() });
        }
        break;
      }

      case "RETIRE": {
        const roomCode = wsRoomMap.get(ws);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room) return;
        const player = room.players.find((p) => p.ws === ws);
        if (!player) return;

        player.retired = true;
        console.log(`Player ${player.name} retired from room ${roomCode}`);

        // Broadcast retired list and player left
        broadcast(room, { type: "RETIRED_PLAYERS", playerIds: room.players.filter((p) => p.retired).map((p) => p.playerId) });
        broadcast(room, {
          type: "PLAYER_LEFT",
          playerName: player.name,
          players: room.players.map((p) => p.name),
        });

        const session = getSession(roomCode);
        if (session) {
          // Auto-accept any pending votes
          const gameEnded = session.autoVoteForRetired();
          if (gameEnded && session.state.winner !== null) {
            const playerEmails = room.players.map((p) => p.email);
            const winnerEmail = room.players[session.state.winner]?.email;
            if (winnerEmail) recordAndBroadcastResult(playerEmails, winnerEmail, session.state);
            deleteGameLog("inprogress-" + roomCode);
            const log = session.getGameLog(true);
            if (log) saveGameLog(log);
          }

          // Auto-play if it's the retired player's turn
          if (session.state.phase === "move" && session.state.currentPlayer === player.playerId) {
            session.autoPlayIfRetired();
          }
        }

        persistAll();
        break;
      }

    }
  });

  ws.on("close", () => {
    wsAuth.delete(ws);
    removeObserver(ws);
    const result = removePlayer(ws);
    wsRoomMap.delete(ws);

    if (result) {
      const { room, player } = result;
      broadcast(room, {
        type: "PLAYER_LEFT",
        playerName: player.name,
        players: room.players.filter((p) => p.ws !== null).map((p) => p.name),
      });
    }
  });
});

const PORT = parseInt(process.env.PORT || "3001");

const HTTP_PORT = parseInt(process.env.HTTP_PORT || "5174");

server.listen(PORT, () => {
  const proto = useSSL ? "https" : "http";
  console.log(`Star Lanes server running on ${proto}://localhost:${PORT}`);
  if (!getClientId()) {
    console.log("WARNING: GOOGLE_CLIENT_ID not set — auth will accept any token");
  }
});

// When SSL is enabled, also listen on HTTP and redirect to HTTPS
if (useSSL) {
  const redirectApp = express();
  redirectApp.use((req, res) => {
    const host = (req.headers.host || "").replace(/:.*/, "");
    const portSuffix = PORT === 443 ? "" : `:${PORT}`;
    res.redirect(301, `https://${host}${portSuffix}${req.url}`);
  });
  createServer(redirectApp).listen(HTTP_PORT, () => {
    console.log(`HTTP redirect server on port ${HTTP_PORT} -> https://localhost:${PORT}`);
  });
}

// Auto-save every 60 seconds as safety net
setInterval(() => {
  persistAll();
}, 60 * 1000);

// Graceful shutdown — persist all state before exit
function shutdown(signal: string) {
  console.log(`\n${signal} received — saving state...`);
  persistAll();
  console.log("State saved. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
