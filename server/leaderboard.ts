import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "../data");
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");

const KV_APP_KEY = "lvob5zqc";
const KV_KEY = "lb";
const KV_BASE = "https://keyvalue.immanuel.co/api/KeyVal";

export interface LeaderboardEntry {
  email: string;
  name: string;
  picture: string;
  wins: number;
  games: number;
}

let leaderboard: Map<string, LeaderboardEntry> = new Map();

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function parseEntries(entries: LeaderboardEntry[]): void {
  leaderboard = new Map(entries.map((e) => [e.email, e]));
}

/** Load from local file, then try remote (remote wins if newer) */
export async function loadLeaderboard(): Promise<void> {
  // Load local first
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const raw = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
      const entries: LeaderboardEntry[] = JSON.parse(raw);
      parseEntries(entries);
      console.log(`Loaded ${entries.length} leaderboard entries from disk`);
    }
  } catch {
    console.error("Failed to load local leaderboard");
  }

  // Merge with remote
  try {
    const remote = await fetchRemoteLeaderboard();
    if (remote && remote.length > 0) {
      mergeRemote(remote);
      console.log(`Merged ${remote.length} entries from remote`);
    }
  } catch (e) {
    console.error("Failed to load remote leaderboard:", e);
  }
}

function mergeRemote(remote: LeaderboardEntry[]): void {
  for (const entry of remote) {
    const local = leaderboard.get(entry.email);
    if (!local) {
      leaderboard.set(entry.email, entry);
    } else {
      // Keep the higher stats
      if (entry.wins > local.wins) local.wins = entry.wins;
      if (entry.games > local.games) local.games = entry.games;
      // Update name/picture from remote
      local.name = entry.name || local.name;
      local.picture = entry.picture || local.picture;
    }
  }
  saveLocal();
}

function saveLocal(): void {
  ensureDir();
  const entries = [...leaderboard.values()];
  const tmp = LEADERBOARD_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
  fs.renameSync(tmp, LEADERBOARD_FILE);
}

function saveLeaderboard(): void {
  saveLocal();
  saveRemote().catch((e) =>
    console.error("Failed to save remote leaderboard:", e)
  );
}

function toBase64Url(s: string): string {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

/** Minimal format for remote: drop picture, shorten keys */
type MinEntry = [string, string, number, number]; // [email, name, wins, games]

function toMinEntries(): MinEntry[] {
  return [...leaderboard.values()].map((e) => [e.email, e.name, e.wins, e.games]);
}

function fromMinEntries(min: MinEntry[]): LeaderboardEntry[] {
  return min.map(([email, name, wins, games]) => ({
    email, name, picture: "", wins, games,
  }));
}

const MAX_SEGMENT = 190; // safe limit for URL path segment

async function fetchRemoteLeaderboard(): Promise<LeaderboardEntry[] | null> {
  // Read all chunks
  let combined = "";
  for (let i = 0; i < 20; i++) {
    const key = i === 0 ? KV_KEY : `${KV_KEY}${i}`;
    const res = await fetch(`${KV_BASE}/GetValue/${KV_APP_KEY}/${key}`);
    if (!res.ok) break;
    const text = await res.text();
    const cleaned = text.replace(/^"|"$/g, "");
    if (!cleaned || cleaned === "null") break;
    combined += cleaned;
  }
  if (!combined) return null;
  try {
    const json = fromBase64Url(combined);
    return fromMinEntries(JSON.parse(json));
  } catch {
    return null;
  }
}

async function saveRemote(): Promise<void> {
  const json = JSON.stringify(toMinEntries());
  const encoded = toBase64Url(json);

  // Split into chunks that fit in URL path
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += MAX_SEGMENT) {
    chunks.push(encoded.slice(i, i + MAX_SEGMENT));
  }

  for (let i = 0; i < chunks.length; i++) {
    const key = i === 0 ? KV_KEY : `${KV_KEY}${i}`;
    const res = await fetch(
      `${KV_BASE}/UpdateValue/${KV_APP_KEY}/${key}/${chunks[i]}`,
      { method: "POST", headers: { "Content-Length": "0" } }
    );
    if (!res.ok) {
      console.error(`Remote save chunk ${i} failed:`, res.status);
      return;
    }
  }

  // Clear leftover chunks from previous saves
  for (let i = chunks.length; i < 20; i++) {
    const key = `${KV_KEY}${i}`;
    await fetch(
      `${KV_BASE}/UpdateValue/${KV_APP_KEY}/${key}/null`,
      { method: "POST", headers: { "Content-Length": "0" } }
    ).catch(() => {});
  }
}

/** Register a user on first login (0 wins, 0 games) */
export function registerUser(
  email: string,
  name: string,
  picture: string
): void {
  const key = email.toLowerCase();
  if (leaderboard.has(key)) {
    const entry = leaderboard.get(key)!;
    entry.name = name;
    entry.picture = picture;
    saveLeaderboard();
    return;
  }
  leaderboard.set(key, { email: key, name, picture, wins: 0, games: 0 });
  saveLeaderboard();
}

/** Record game result for all players; winner gets a win */
export function recordGameResult(
  playerEmails: string[],
  winnerEmail: string
): void {
  const winnerKey = winnerEmail.toLowerCase();
  for (const email of playerEmails) {
    const key = email.toLowerCase();
    let entry = leaderboard.get(key);
    if (!entry) {
      entry = { email: key, name: key, picture: "", wins: 0, games: 0 };
      leaderboard.set(key, entry);
    }
    entry.games++;
    if (key === winnerKey) {
      entry.wins++;
    }
  }
  saveLeaderboard();
}

/** Clear all leaderboard data */
export function clearLeaderboard(): void {
  leaderboard.clear();
  saveLeaderboard();
}

/** Remove a single user from the leaderboard */
export function removeLeaderboardUser(email: string): boolean {
  const key = email.toLowerCase();
  if (!leaderboard.has(key)) return false;
  leaderboard.delete(key);
  saveLeaderboard();
  return true;
}

/** Get sorted leaderboard (most wins first) */
export function getLeaderboard(): LeaderboardEntry[] {
  return [...leaderboard.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.games !== a.games) return a.games - b.games;
    return a.name.localeCompare(b.name);
  });
}
