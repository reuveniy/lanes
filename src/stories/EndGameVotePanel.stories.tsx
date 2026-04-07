import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { EndGameVotePanel } from "../components/EndGameVotePanel";
import { PLAYER_COLORS } from "../types/game";

const meta: Meta<typeof EndGameVotePanel> = {
  title: "Panels/EndGameVotePanel",
  component: EndGameVotePanel,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof EndGameVotePanel>;

const players = [
  { index: 0, name: "Alice", cash: 12000, color: PLAYER_COLORS[0], netWorth: 28000, doublePays: 1 },
  { index: 1, name: "Bob", cash: 9000, color: PLAYER_COLORS[1], netWorth: 22000, doublePays: 0 },
  { index: 2, name: "Carol", cash: 15000, color: PLAYER_COLORS[2], netWorth: 31000, doublePays: 2 },
  { index: 3, name: "Dave", cash: 6200, color: PLAYER_COLORS[3], netWorth: 14800, doublePays: 0 },
];

export const InitiatorView: Story = {
  name: "Initiator (already voted)",
  args: {
    players,
    votes: { 0: true, 1: null, 2: null, 3: null },
    initiator: "Alice",
    myPlayerId: 0,
    onAccept: fn(),
    onReject: fn(),
  },
};

export const OtherPlayerView: Story = {
  name: "Other Player (voting)",
  args: {
    players,
    votes: { 0: true, 1: null, 2: null, 3: null },
    initiator: "Alice",
    myPlayerId: 1,
    onAccept: fn(),
    onReject: fn(),
  },
};

export const TwoAgreed: Story = {
  name: "Two Players Agreed",
  args: {
    players,
    votes: { 0: true, 1: true, 2: null, 3: null },
    initiator: "Alice",
    myPlayerId: 2,
    onAccept: fn(),
    onReject: fn(),
  },
};

export const AlmostDone: Story = {
  name: "Three Agreed, One Voting",
  args: {
    players,
    votes: { 0: true, 1: true, 2: true, 3: null },
    initiator: "Alice",
    myPlayerId: 3,
    onAccept: fn(),
    onReject: fn(),
  },
};

export const SixPlayers: Story = {
  name: "Six Players",
  args: {
    players: [
      ...players,
      { index: 4, name: "Eve", cash: 8500, color: PLAYER_COLORS[4], netWorth: 19000, doublePays: 0 },
      { index: 5, name: "Frank", cash: 4800, color: PLAYER_COLORS[5], netWorth: 11000, doublePays: 0 },
    ],
    votes: { 0: true, 1: true, 2: null, 3: null, 4: null, 5: null },
    initiator: "Alice",
    myPlayerId: 3,
    onAccept: fn(),
    onReject: fn(),
  },
};
