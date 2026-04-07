import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { MapSelectScreen } from "../components/MapSelectScreen";
import { createEarlyGameState, createMidGameState } from "./fixtures";

const meta: Meta<typeof MapSelectScreen> = {
  title: "Screens/MapSelectScreen",
  component: MapSelectScreen,
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};

export default meta;
type Story = StoryObj<typeof MapSelectScreen>;

export const LocalMode: Story = {
  name: "Local (New Map / Accept)",
  args: {
    state: createEarlyGameState(),
    onAccept: fn(),
    onRegenerate: fn(),
  },
};

export const MultiplayerInitiator: Story = {
  name: "Multiplayer - Initiator Voted",
  args: {
    state: createMidGameState(),
    onAccept: fn(),
    onRegenerate: fn(),
    mapVotes: { 0: true, 1: null, 2: null, 3: null },
    playerId: 0,
  },
};

export const MultiplayerVoting: Story = {
  name: "Multiplayer - Waiting to Vote",
  args: {
    state: createMidGameState(),
    onAccept: fn(),
    onRegenerate: fn(),
    mapVotes: { 0: true, 1: null, 2: null, 3: null },
    playerId: 2,
  },
};

export const MultiplayerAlmostDone: Story = {
  name: "Multiplayer - 3 Accepted",
  args: {
    state: createMidGameState(),
    onAccept: fn(),
    onRegenerate: fn(),
    mapVotes: { 0: true, 1: true, 2: true, 3: null },
    playerId: 3,
  },
};
