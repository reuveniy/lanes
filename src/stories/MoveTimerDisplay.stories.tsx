import type { Meta, StoryObj } from "@storybook/react";
import { MoveTimerDisplay } from "../components/GameView";

const meta: Meta<typeof MoveTimerDisplay> = {
  title: "Panels/MoveTimerDisplay",
  component: MoveTimerDisplay,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof MoveTimerDisplay>;

export const MyTurnPlenty: Story = {
  name: "My Turn - Plenty of Time",
  args: {
    deadline: Date.now() + 45 * 1000,
    isMyTurn: true,
    playerName: "Alice",
    playerColor: "#22c55e",
  },
};

export const MyTurnUrgent: Story = {
  name: "My Turn - Urgent (<10s)",
  args: {
    deadline: Date.now() + 7 * 1000,
    isMyTurn: true,
    playerName: "Alice",
    playerColor: "#22c55e",
  },
};

export const OtherPlayerTurn: Story = {
  name: "Other Player's Turn",
  args: {
    deadline: Date.now() + 30 * 1000,
    isMyTurn: false,
    playerName: "Bob",
    playerColor: "#ef4444",
  },
};

export const LongTimer: Story = {
  name: "Long Timer (5 min)",
  args: {
    deadline: Date.now() + 300 * 1000,
    isMyTurn: true,
    playerName: "Alice",
    playerColor: "#22c55e",
  },
};

export const Expired: Story = {
  name: "Expired (0s)",
  args: {
    deadline: Date.now() - 1000,
    isMyTurn: true,
    playerName: "Alice",
    playerColor: "#22c55e",
  },
};
