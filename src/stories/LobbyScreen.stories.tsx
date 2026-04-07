import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { LobbyScreen } from "../components/LobbyScreen";

const meta: Meta<typeof LobbyScreen> = {
  title: "Screens/LobbyScreen",
  component: LobbyScreen,
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};

export default meta;
type Story = StoryObj<typeof LobbyScreen>;

const baseArgs = {
  connected: true,
  error: null,
  userName: "Alice",
  onJoinRoom: fn(),
  onStartNow: fn(),
  onPlayLocal: fn(),
};

export const JoinByCode: Story = {
  name: "Join By Code (no room yet)",
  args: {
    ...baseArgs,
    roomCode: null,
    players: [],
    maxPlayers: 4,
    playerId: null,
  },
};

export const WaitingForPlayers: Story = {
  name: "Waiting for Players (host)",
  args: {
    ...baseArgs,
    roomCode: "A3X7",
    players: ["Alice"],
    maxPlayers: 4,
    playerId: 0,
  },
};

export const TwoPlayersJoined: Story = {
  name: "2 Players Joined (host, can start)",
  args: {
    ...baseArgs,
    roomCode: "A3X7",
    players: ["Alice", "Bob"],
    maxPlayers: 4,
    playerId: 0,
  },
};

export const NonHostWaiting: Story = {
  name: "Non-Host Waiting",
  args: {
    ...baseArgs,
    roomCode: "A3X7",
    players: ["Alice", "Bob"],
    maxPlayers: 4,
    playerId: 1,
    userName: "Bob",
  },
};

export const RoomFull: Story = {
  name: "Room Full (starting)",
  args: {
    ...baseArgs,
    roomCode: "A3X7",
    players: ["Alice", "Bob", "Carol", "Dave"],
    maxPlayers: 4,
    playerId: 0,
  },
};

export const SixPlayerLobby: Story = {
  name: "6-Player Lobby",
  args: {
    ...baseArgs,
    roomCode: "M2P5",
    players: ["Alice", "Bob", "Carol"],
    maxPlayers: 6,
    playerId: 0,
  },
};

export const WithError: Story = {
  name: "With Error",
  args: {
    ...baseArgs,
    roomCode: null,
    players: [],
    maxPlayers: 4,
    playerId: null,
    error: "Room not found, full, or already started",
  },
};
