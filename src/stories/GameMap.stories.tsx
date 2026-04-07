import type { Meta, StoryObj } from "@storybook/react";
import { GameMap } from "../components/GameMap";
import { createEarlyGameState, createLateGameState } from "./fixtures";
import { PLAYER_COLORS } from "../types/game";

const meta: Meta<typeof GameMap> = {
  title: "Panels/GameMap",
  component: GameMap,
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof GameMap>;

const earlyState = createEarlyGameState();
const lateState = createLateGameState();

export const EarlyMap: Story = {
  name: "Early Game Map",
  args: {
    grid: earlyState.grid,
    moveOptions: earlyState.moveOptions,
    companyColors: earlyState.companies.map((c) =>
      c.controllingPlayer !== null
        ? PLAYER_COLORS[c.controllingPlayer]
        : c.size > 0
          ? "#6b7280"
          : null
    ),
  },
};

export const LateMap: Story = {
  name: "Late Game Map",
  args: {
    grid: lateState.grid,
    moveOptions: lateState.moveOptions,
    companyColors: lateState.companies.map((c) =>
      c.controllingPlayer !== null
        ? PLAYER_COLORS[c.controllingPlayer]
        : c.size > 0
          ? "#6b7280"
          : null
    ),
  },
};

export const EmptyMap: Story = {
  name: "Empty Map (no companies)",
  args: {
    grid: earlyState.grid.map((row) =>
      row.map((cell) => (cell >= 5 ? 1 : cell))
    ),
    moveOptions: [],
    companyColors: Array(26).fill(null),
  },
};
