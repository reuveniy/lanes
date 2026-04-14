import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { HomeScreen } from "../components/HomeScreen";

const meta: Meta<typeof HomeScreen> = {
  title: "Screens/HomeScreen",
  component: HomeScreen,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof HomeScreen>;

const baseArgs = {
  onPlayLocal: fn(),
  onWatchDemo: fn(),
  onHelp: fn(),
  onCreateRoom: fn(),
  onJoinRoom: fn(),
  onObserveRoom: fn(),
  onAuthenticate: fn(),
  onRefreshRooms: fn(),
};

export const NotConnected: Story = {
  name: "Not Connected",
  args: {
    ...baseArgs,
    connected: false,
    authenticated: false,
    user: null,
    googleClientId: "",
    error: null,
    roomList: [],
    leaderboard: [],
  },
};

export const ConnectedNotLoggedIn: Story = {
  name: "Connected, Not Logged In",
  args: {
    ...baseArgs,
    connected: true,
    authenticated: false,
    user: null,
    googleClientId: "test-client-id",
    error: null,
    roomList: [
      {
        code: "A3X7",
        players: ["Alice", "Bob"],
        playerEmails: ["alice@test.com", "bob@test.com"],
        maxPlayers: 4,
        started: true,
        currentStep: 45,
        totalSteps: 180,
        phase: "move",
      },
      {
        code: "K9F2",
        players: ["Carol"],
        playerEmails: ["carol@test.com"],
        maxPlayers: 4,
        started: false,
        currentStep: 0,
        totalSteps: 0,
        phase: "lobby",
      },
    ],
    leaderboard: [
      { email: "alice@test.com", name: "Alice", picture: "", wins: 5, games: 10 },
      { email: "bob@test.com", name: "Bob", picture: "", wins: 3, games: 8 },
      { email: "carol@test.com", name: "Carol", picture: "", wins: 1, games: 3 },
    ],
  },
};

export const LoggedIn: Story = {
  name: "Logged In",
  args: {
    ...baseArgs,
    connected: true,
    authenticated: true,
    user: { name: "Alice", email: "alice@test.com", picture: "" },
    googleClientId: "test-client-id",
    error: null,
    roomList: [
      {
        code: "A3X7",
        players: ["Alice", "Bob"],
        playerEmails: ["alice@test.com", "bob@test.com"],
        maxPlayers: 4,
        started: true,
        currentStep: 45,
        totalSteps: 180,
        phase: "move",
      },
      {
        code: "K9F2",
        players: ["Carol"],
        playerEmails: ["carol@test.com"],
        maxPlayers: 4,
        started: false,
        currentStep: 0,
        totalSteps: 0,
        phase: "lobby",
      },
    ],
    leaderboard: [
      { email: "alice@test.com", name: "Alice", picture: "", wins: 5, games: 10 },
      { email: "bob@test.com", name: "Bob", picture: "", wins: 3, games: 8 },
      { email: "carol@test.com", name: "Carol", picture: "", wins: 1, games: 3 },
    ],
  },
};

export const WithError: Story = {
  name: "With Error",
  args: {
    ...baseArgs,
    connected: true,
    authenticated: true,
    user: { name: "Alice", email: "alice@test.com", picture: "" },
    googleClientId: "test-client-id",
    error: "Room not found, full, or already started",
    roomList: [],
    leaderboard: [
      { email: "alice@test.com", name: "Alice", picture: "", wins: 0, games: 0 },
    ],
  },
};

export const EmptyServer: Story = {
  name: "Empty Server (no rooms, no leaderboard)",
  args: {
    ...baseArgs,
    connected: true,
    authenticated: true,
    user: { name: "Alice", email: "alice@test.com", picture: "" },
    googleClientId: "test-client-id",
    error: null,
    roomList: [],
    leaderboard: [],
  },
};
