import fs from "fs";
import path from "path";
import type { GameLog } from "../src/types/game";

const DATA_DIR = path.join(__dirname, "../data");
const LOGS_DIR = path.join(DATA_DIR, "logs");

function ensureDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

export function saveGameLog(log: GameLog): void {
  ensureDir();
  const filename = `${log.id}.json`;
  fs.writeFileSync(path.join(LOGS_DIR, filename), JSON.stringify(log));
}

export interface GameLogSummary {
  id: string;
  playerNames: string[];
  playerColors: string[];
  winnerName: string;
  totalSteps: number;
  endedAt: number;
}

export function listGameLogs(): GameLogSummary[] {
  ensureDir();
  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith(".json"));
  const summaries: GameLogSummary[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
      const log: GameLog = JSON.parse(raw);
      summaries.push({
        id: log.id,
        playerNames: log.playerNames,
        playerColors: log.playerColors,
        winnerName: log.winnerName,
        totalSteps: log.totalSteps,
        endedAt: log.endedAt,
      });
    } catch {
      // skip corrupt files
    }
  }

  return summaries.sort((a, b) => b.endedAt - a.endedAt);
}

export function getGameLog(id: string): GameLog | null {
  ensureDir();
  const filename = `${id}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return null;
  }
}

export function deleteGameLog(id: string): boolean {
  ensureDir();
  const filepath = path.join(LOGS_DIR, `${id}.json`);
  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
}
