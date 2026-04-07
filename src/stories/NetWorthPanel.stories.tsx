import type { Meta, StoryObj } from "@storybook/react";
import { NetWorthPanel } from "../components/NetWorthPanel";
import { PLAYER_COLORS } from "../types/game";
import { createMidGameState, createLateGameState } from "./fixtures";

const meta: Meta<typeof NetWorthPanel> = {
  title: "Panels/NetWorthPanel",
  component: NetWorthPanel,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NetWorthPanel>;

const midState = createMidGameState();
const lateState = createLateGameState();

export const FourPlayersMidGame: Story = {
  name: "4 Players - Mid Game",
  args: {
    players: midState.players,
    currentPlayer: 2,
  },
};

export const FourPlayersLateGame: Story = {
  name: "4 Players - Late Game (high values)",
  args: {
    players: lateState.players,
    currentPlayer: 1,
  },
};

export const TwoPlayers: Story = {
  name: "2 Players",
  args: {
    players: midState.players.slice(0, 2),
    currentPlayer: 0,
  },
};

export const SixPlayers: Story = {
  name: "6 Players",
  args: {
    players: [
      { index: 0, name: "Alice", cash: 12000, color: PLAYER_COLORS[0], netWorth: 28000, doublePays: 1 },
      { index: 1, name: "Bob", cash: 9000, color: PLAYER_COLORS[1], netWorth: 22000, doublePays: 0 },
      { index: 2, name: "Carol", cash: 15000, color: PLAYER_COLORS[2], netWorth: 31000, doublePays: 2 },
      { index: 3, name: "Dave", cash: 6200, color: PLAYER_COLORS[3], netWorth: 14800, doublePays: 0 },
      { index: 4, name: "Eve", cash: 8500, color: PLAYER_COLORS[4], netWorth: 19000, doublePays: 1 },
      { index: 5, name: "Frank", cash: 4800, color: PLAYER_COLORS[5], netWorth: 11000, doublePays: 0 },
    ],
    currentPlayer: 0,
  },
};
