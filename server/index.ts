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
    const needsRoomCode = ["OBSERVE_ROOM", "JOIN_ROOM", "ADMIN_DELETE_ROOM"];
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
    const needsBool = ["MAP_VOTE", "END_GAME_VOTE"];
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

    // All other actions require auth
    const user = requireAuth(ws);
    if (!user) return;

    switch (msg.type) {
      case "CREATE_ROOM": {
        const maxP = Math.min(6, Math.max(2, msg.maxPlayers || 4));
        const stars = Math.min(180, Math.max(100, msg.starCount || 150));
        const steps = Math.min(360, Math.max(80, msg.totalSteps || 180));
        const dpCount = Math.min(16, Math.max(2, msg.doublePayCount || 10));
        const room = createRoom(
          user.name, user.email, ws,
          maxP,
          stars,
          steps,
          dpCount,
          msg.fogOfWar || false
        );
        wsRoomMap.set(ws, room.code);
        send(ws, {
          type: "ROOM_CREATED",
          roomCode: room.code,
          playerId: 0,
          players: room.players.map((p) => p.name),
          maxPlayers: room.maxPlayers,
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

        send(ws, {
          type: "ROOM_JOINED",
          roomCode: room.code,
          playerId,
          players: playerNames,
        });

        broadcast(room, {
          type: "PLAYER_JOINED",
          playerName: user.name,
          players: playerNames,
        });

        // If reconnecting to a started game, send state + active votes
        const existingSession = getSession(room.code);
        if (existingSession && room.started) {
          existingSession.broadcastState();
          if (existingSession.endGameVotingActive) {
            const votes: Record<number, boolean | null> = {};
            for (const [id, v] of existingSession.endGameVotes) {
              votes[id] = v;
            }
            send(ws, { type: "END_GAME_VOTES", votes, initiator: existingSession.endGameInitiator });
          }
        }

        // Auto-start when maxPlayers reached
        if (!room.started && room.players.length >= room.maxPlayers) {
          room.started = true;
          const session = getOrCreateSession(room);
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
          // Record leaderboard
          if (session.state.winner !== null) {
            const playerEmails = room.players.map((p) => p.email);
            const winnerEmail = room.players[session.state.winner]?.email;
            if (winnerEmail) {
              recordGameResult(playerEmails, winnerEmail);
              for (const client of wss.clients) {
                send(client as WebSocket, { type: "LEADERBOARD", entries: getLeaderboard() });
              }
            }
          }
        }
        persistAll();
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

          // Record leaderboard on game end
          if (session.state.phase === "gameOver" && session.state.winner !== null) {
            const playerEmails = room.players.map((p) => p.email);
            const winnerEmail = room.players[session.state.winner]?.email;
            if (winnerEmail) {
              recordGameResult(playerEmails, winnerEmail);
              // Broadcast updated leaderboard to all connected clients
              for (const client of wss.clients) {
                send(client as WebSocket, {
                  type: "LEADERBOARD",
                  entries: getLeaderboard(),
                });
              }
            }
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
          // Notify connected players
          broadcast(room, { type: "ERROR", message: "Game deleted by admin" });
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
