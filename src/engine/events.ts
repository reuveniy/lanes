import { CellType, ROWS, COLS, type GameState, type GameMessage } from "../types/game";
import type { Rng } from "./rng";

interface EventDef {
  message: string;
  impact: number;
}

const EVENT_TABLE: EventDef[] = [
  { message: "Space-Fleet suffer damages !!!", impact: -0.1 },
  { message: "Space-Fleet Main computer is out of order !!!", impact: -0.2 },
  { message: "Communication to fleet lost !!!", impact: -0.2 },
  { message: "Sabotage in energy sources !!!", impact: -0.3 },
  { message: "Uncontrolled atomic reaction in main base !!!", impact: -0.5 },
  { message: "New energy sources discovered !!!", impact: 0.3 },
  { message: "Sales increase by 25% !!!", impact: 0.2 },
  { message: "Klingon ship destroyed, Federation bonus received !!!", impact: 0.2 },
  { message: "Klingon attack on main Base !!!", impact: -0.3 },
  { message: "Increase in royalties reception !!!", impact: 0.1 },
  { message: "Tax Returning !!!", impact: 0.2 },
  { message: "Klingon attack on the Space-Fleet !!!", impact: -0.1 },
  { message: "Federation Increase in Tax Payment !!!", impact: -0.15 },
  { message: "Company battleship destroyed !!!", impact: -0.05 },
  { message: "Stock sale !!!", impact: 0.05 },
  { message: "New gold mine discovered !!!", impact: 0.05 },
  { message: "Business ship was crushed !!!", impact: -0.05 },
  { message: "Good news from trading mission !!!", impact: 0.05 },
  { message: "Sales drop by 15% !!!", impact: -0.1 },
];

export function processGoldStarDecay(state: GameState, rng: Rng): GameState {
  const grid = state.grid.map((r) => [...r]);
  const messages: GameMessage[] = [...state.messages];
  let changed = false;

  for (let i = 0; i < 3; i++) {
    const r = rng.nextInt(0, ROWS - 1);
    const c = rng.nextInt(0, COLS - 1);
    if (grid[r][c] === CellType.GoldStar) {
      grid[r][c] = CellType.Empty;
      changed = true;
    }
  }

  if (changed) {
    messages.push({
      text: "A gold star has faded from the map!",
      type: "alert",
      alarm: 1,
    });
  }

  return { ...state, grid, messages };
}

export function processGalacticBomb(
  state: GameState,
  rng: Rng
): GameState {
  const roll = rng.nextInt(0, 14);
  if (roll < 7 || roll > 13) return state;

  // Find active companies (stock > 100)
  const activeCompanies = state.companies.filter(
    (c) => c.size > 0 && c.stockPrice > 100
  );
  if (activeCompanies.length === 0) return state;

  const target =
    activeCompanies[rng.nextInt(0, activeCompanies.length - 1)];
  const event = EVENT_TABLE[rng.nextInt(0, EVENT_TABLE.length - 1)];

  const companies = state.companies.map((c) => ({
    ...c,
    shares: [...c.shares],
  }));
  const company = companies[target.index];
  const oldPrice = company.stockPrice;
  company.stockPrice = Math.max(
    100,
    Math.floor(oldPrice + oldPrice * event.impact)
  );

  const msgType: GameMessage["type"] =
    event.impact <= -0.3
      ? "critical"
      : event.impact < 0
        ? "alert"
        : "positive";

  // Alarm: 1=siren (≤-30%), 2=short (negative), 3=bell (positive)
  const alarm: 1 | 2 | 3 =
    event.impact <= -0.3 ? 1 : event.impact < 0 ? 2 : 3;

  const messages: GameMessage[] = [
    ...state.messages,
    { text: `${company.name}: ${event.message}`, type: msgType, alarm },
    {
      text: `Stock price: $${oldPrice} -> $${company.stockPrice}`,
      type: "info",
    },
  ];

  return { ...state, companies, messages };
}
