import type { Meta, StoryObj } from "@storybook/react";
import { CashDisplay } from "../components/CashDisplay";
import { PLAYER_COLORS } from "../types/game";

const meta: Meta<typeof CashDisplay> = {
  title: "Panels/CashDisplay",
  component: CashDisplay,
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
type Story = StoryObj<typeof CashDisplay>;

export const RichPlayer: Story = {
  name: "Rich Player ($45,200)",
  args: {
    player: {
      index: 0,
      name: "Alice",
      cash: 45200,
      color: PLAYER_COLORS[0],
      netWorth: 98500,
      doublePays: 2,
    },
    bankBonus: 12800,
  },
};

export const PoorPlayer: Story = {
  name: "Poor Player ($800)",
  args: {
    player: {
      index: 3,
      name: "Dave",
      cash: 800,
      color: PLAYER_COLORS[3],
      netWorth: 3200,
      doublePays: 0,
    },
    bankBonus: 1000,
  },
};

export const StartingPlayer: Story = {
  name: "Starting Player ($6,000)",
  args: {
    player: {
      index: 1,
      name: "Bob",
      cash: 6000,
      color: PLAYER_COLORS[1],
      netWorth: 6000,
      doublePays: 0,
    },
    bankBonus: 1000,
  },
};

export const Player5Blue: Story = {
  name: "Player 5 (Blue)",
  args: {
    player: {
      index: 4,
      name: "Eve",
      cash: 8500,
      color: PLAYER_COLORS[4],
      netWorth: 19000,
      doublePays: 1,
    },
    bankBonus: 3200,
  },
};

export const Player6Brown: Story = {
  name: "Player 6 (Brown)",
  args: {
    player: {
      index: 5,
      name: "Frank",
      cash: 4800,
      color: PLAYER_COLORS[5],
      netWorth: 11000,
      doublePays: 0,
    },
    bankBonus: 2100,
  },
};
