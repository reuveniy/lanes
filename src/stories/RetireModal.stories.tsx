import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { RetireModal } from "../components/RetireModal";
import { PLAYER_COLORS } from "../types/game";

const meta: Meta<typeof RetireModal> = {
  title: "Panels/RetireModal",
  component: RetireModal,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof RetireModal>;

export const Player1Green: Story = {
  name: "Player 1 (Green)",
  args: {
    playerName: "Alice",
    playerColor: PLAYER_COLORS[0],
    onConfirm: fn(),
    onCancel: fn(),
  },
};

export const Player2Red: Story = {
  name: "Player 2 (Red)",
  args: {
    playerName: "Bob",
    playerColor: PLAYER_COLORS[1],
    onConfirm: fn(),
    onCancel: fn(),
  },
};

export const LongName: Story = {
  name: "Long Player Name",
  args: {
    playerName: "Commander Spock",
    playerColor: PLAYER_COLORS[2],
    onConfirm: fn(),
    onCancel: fn(),
  },
};
