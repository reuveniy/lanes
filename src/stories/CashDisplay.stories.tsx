import type { Meta, StoryObj } from "@storybook/react";
import { CashDisplay } from "../components/CashDisplay";
import { PLAYER_COLORS, type Player } from "../types/game";

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

const basePlayer: Player = {
  index: 0, name: "Alice", cash: 6000, color: PLAYER_COLORS[0], netWorth: 6000,
  doublePays: 0, bonusCount: 0, totalBonusReceived: 0, freezeCount: 0,
  trapCount: 0, halfTrapCount: 0, totalTrapLost: 0, specialHelpCount: 0,
};

export const StartingPlayer: Story = {
  name: "Starting Player (clean)",
  args: {
    player: { ...basePlayer, name: "Bob", cash: 6000, color: PLAYER_COLORS[1], netWorth: 6000 },
    bankBonus: 1000,
  },
};

export const RichWithDoublePays: Story = {
  name: "Rich + Double Pays",
  args: {
    player: { ...basePlayer, cash: 45200, netWorth: 98500, doublePays: 3 },
    bankBonus: 12800,
  },
};

export const WithBonuses: Story = {
  name: "With Bonuses",
  args: {
    player: { ...basePlayer, name: "Carol", cash: 18000, color: PLAYER_COLORS[2], netWorth: 42000, bonusCount: 2, totalBonusReceived: 4500 },
    bankBonus: 3200,
  },
};

export const TrappedPlayer: Story = {
  name: "Trapped (full + half)",
  args: {
    player: { ...basePlayer, name: "Dave", cash: 2100, color: PLAYER_COLORS[3], netWorth: 15000, trapCount: 1, halfTrapCount: 2, totalTrapLost: 28000 },
    bankBonus: 29000,
  },
};

export const FrozenPlayer: Story = {
  name: "Frozen Multiple Times",
  args: {
    player: { ...basePlayer, name: "Eve", cash: 9500, color: PLAYER_COLORS[4], netWorth: 22000, freezeCount: 3 },
    bankBonus: 5000,
  },
};

export const SpecialHelpRecipient: Story = {
  name: "Special Help Received",
  args: {
    player: { ...basePlayer, name: "Frank", cash: 14000, color: PLAYER_COLORS[5], netWorth: 18000, specialHelpCount: 2, totalBonusReceived: 9000, bonusCount: 1 },
    bankBonus: 2000,
  },
};

export const AllEventsHit: Story = {
  name: "All Events (everything > 0)",
  args: {
    player: {
      ...basePlayer, name: "Captain Kirk", cash: 31000, color: PLAYER_COLORS[0], netWorth: 85000,
      doublePays: 2, bonusCount: 3, totalBonusReceived: 12500,
      freezeCount: 1, trapCount: 1, halfTrapCount: 2, totalTrapLost: 35000,
      specialHelpCount: 1,
    },
    bankBonus: 41000,
  },
};

export const OnlyTraps: Story = {
  name: "Only Traps (no bonuses)",
  args: {
    player: { ...basePlayer, name: "Spock", cash: 500, color: PLAYER_COLORS[1], netWorth: 8000, trapCount: 2, totalTrapLost: 19000 },
    bankBonus: 20000,
  },
};

export const OnlyHalfTraps: Story = {
  name: "Only Half Traps",
  args: {
    player: { ...basePlayer, name: "McCoy", cash: 4200, color: PLAYER_COLORS[2], netWorth: 12000, halfTrapCount: 3, totalTrapLost: 9600 },
    bankBonus: 10600,
  },
};

export const LargeNumbers: Story = {
  name: "Large Numbers",
  args: {
    player: {
      ...basePlayer, name: "Uhura", cash: 2_450_000, color: PLAYER_COLORS[3], netWorth: 40_987_178,
      doublePays: 5, bonusCount: 4, totalBonusReceived: 890_000,
      trapCount: 2, halfTrapCount: 1, totalTrapLost: 1_200_000,
    },
    bankBonus: 1_350_000,
  },
};
