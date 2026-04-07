import fs from "fs";
import path from "path";
import type { GameState } from "../src/types/game";

const DATA_DIR = path.join(__dirname, "../data");
const STATE_FILE = path.join(DATA_DIR, "rooms.json");

/** Serializable room data (no WebSocket refs) */
export interface PersistedRoom {
  code: string;
  players: { name: string; email: string; playerId: number }[];
  hostId: number;
  maxPlayers: number;
  starCount: number;
  totalSteps: number;
  doublePayCount: number;
  fogOfWar: boolean;
  started: boolean;
  lastActivity: number;
}

export interface PersistedData {
  rooms: Record<string, PersistedRoom>;
  sessions: Record<string, GameState>;
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadState(): PersistedData | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    console.error("Failed to load persisted state, starting fresh");
    return null;
  }
}

export function saveState(data: PersistedData): void {
  ensureDir();
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, STATE_FILE);
}
