import type { WebSocket } from "ws";
import type { ServerMessage } from "./protocol";
import type { PersistedRoom } from "./persist";

export interface PlayerConnection {
  ws: WebSocket | null;
  name: string;
  email: string;
  playerId: number;
}

export interface Room {
  code: string;
  players: PlayerConnection[];
  observers: Set<WebSocket>;
  hostId: number;
  maxPlayers: number;
  starCount: number;
  totalSteps: number;
  doublePayCount: number;
  fogOfWar: boolean;
  started: boolean;
  lastActivity: number;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

export function createRoom(
  playerName: string,
  email: string,
  ws: WebSocket,
  maxPlayers: number,
  starCount: number,
  totalSteps: number,
  doublePayCount: number,
  fogOfWar: boolean
): Room {
  const code = generateCode();
  const room: Room = {
    code,
    players: [{ ws, name: playerName, email, playerId: 0 }],
    observers: new Set(),
    hostId: 0,
    maxPlayers: Math.min(6, Math.max(2, maxPlayers)),
    starCount,
    totalSteps,
    doublePayCount,
    fogOfWar,
    started: false,
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  playerName: string,
  email: string,
  ws: WebSocket
): { room: Room; playerId: number } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  // Check if reconnecting (same email, disconnected)
  const existing = room.players.find(
    (p) => p.email.toLowerCase() === email.toLowerCase() && p.ws === null
  );
  if (existing) {
    existing.ws = ws;
    existing.name = playerName; // update display name in case it changed
    room.lastActivity = Date.now();
    return { room, playerId: existing.playerId };
  }

  if (room.started) return null;
  if (room.players.length >= (room.maxPlayers || 6)) return null;

  const playerId = room.players.length;
  room.players.push({ ws, name: playerName, email, playerId });
  room.lastActivity = Date.now();
  return { room, playerId };
}

export function deleteRoom(code: string): boolean {
  return rooms.delete(code.toUpperCase());
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function removePlayer(ws: WebSocket): {
  room: Room;
  player: PlayerConnection;
} | null {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.ws === ws);
    if (player) {
      player.ws = null;
      room.lastActivity = Date.now();
      return { room, player };
    }
  }
  return null;
}

export function broadcast(room: Room, msg: ServerMessage): void {
  const data = JSON.stringify(msg);
  for (const p of room.players) {
    if (p.ws && p.ws.readyState === 1) {
      p.ws.send(data);
    }
  }
  // Also send to observers
  for (const ws of Array.from(room.observers)) {
    if (ws.readyState === 1) {
      ws.send(data);
    } else {
      room.observers.delete(ws);
    }
  }
}

export function addObserver(room: Room, ws: WebSocket): void {
  room.observers.add(ws);
}

export function removeObserver(ws: WebSocket): void {
  for (const room of rooms.values()) {
    room.observers.delete(ws);
  }
}

export function listRooms(): import("./protocol").RoomInfo[] {
  const result: import("./protocol").RoomInfo[] = [];
  for (const room of rooms.values()) {
    result.push({
      code: room.code,
      players: room.players.map((p) => p.name),
      maxPlayers: room.maxPlayers,
      started: room.started,
      currentStep: 0,
      totalSteps: 0,
      phase: room.started ? "playing" : "lobby",
    });
  }
  return result;
}

export function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

/** Serialize all rooms for persistence (strips WebSocket refs) */
export function serializeRooms(): Record<string, PersistedRoom> {
  const result: Record<string, PersistedRoom> = {};
  for (const [code, room] of rooms) {
    result[code] = {
      code: room.code,
      players: room.players.map((p) => ({ name: p.name, email: p.email, playerId: p.playerId })),
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      starCount: room.starCount,
      totalSteps: room.totalSteps,
      doublePayCount: room.doublePayCount,
      fogOfWar: room.fogOfWar,
      started: room.started,
      lastActivity: room.lastActivity,
    };
  }
  return result;
}

/** Restore rooms from persisted data (all players start disconnected) */
export function restoreRooms(persisted: Record<string, PersistedRoom>): void {
  for (const [code, data] of Object.entries(persisted)) {
    rooms.set(code, {
      code: data.code,
      players: data.players.map((p) => ({
        ws: null,
        name: p.name,
        email: typeof p.email === "string" ? p.email : "",
        playerId: p.playerId,
      })),
      observers: new Set(),
      hostId: data.hostId,
      maxPlayers: data.maxPlayers || 4,
      starCount: data.starCount || 150,
      totalSteps: data.totalSteps || 180,
      doublePayCount: data.doublePayCount || 10,
      fogOfWar: data.fogOfWar || false,
      started: data.started,
      lastActivity: data.lastActivity,
    });
  }
}

// Cleanup: lobby rooms expire after 1 hour, started games after 1 week
setInterval(() => {
  const lobbyCutoff = Date.now() - 60 * 60 * 1000;
  const gameCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    const cutoff = room.started ? gameCutoff : lobbyCutoff;
    if (room.lastActivity < cutoff) {
      rooms.delete(code);
    }
  }
}, 60 * 60 * 1000);
