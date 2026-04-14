import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { RoomList } from "../components/RoomList";

const meta: Meta<typeof RoomList> = {
  title: "Panels/RoomList",
  component: RoomList,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoomList>;

const baseArgs = {
  connected: true,
  authenticated: true,
  userEmail: "alice@test.com",
  onRefresh: fn(),
  onJoin: fn(),
  onObserve: fn(),
};

export const WithGames: Story = {
  name: "Active Games",
  args: {
    ...baseArgs,
    rooms: [
      { code: "A3X7", players: ["Alice", "Bob"], playerEmails: ["alice@test.com", "bob@test.com"], maxPlayers: 4, started: true, currentStep: 45, totalSteps: 180, phase: "move", zoomLink: "https://zoom.us/j/1234567890" },
      { code: "K9F2", players: ["Carol"], playerEmails: ["carol@test.com"], maxPlayers: 4, started: false, currentStep: 0, totalSteps: 0, phase: "lobby" },
      { code: "M2P5", players: ["Dave", "Eve"], playerEmails: ["dave@test.com", "eve@test.com"], maxPlayers: 2, started: true, currentStep: 10, totalSteps: 180, phase: "mapSelect", zoomLink: "https://zoom.us/j/9876543210" },
    ],
  },
};

export const WithZoomAndGameOver: Story = {
  name: "Zoom + Game Over",
  args: {
    ...baseArgs,
    rooms: [
      { code: "A3X7", players: ["Alice", "Bob"], playerEmails: ["alice@test.com", "bob@test.com"], maxPlayers: 4, started: true, currentStep: 180, totalSteps: 180, phase: "gameOver", zoomLink: "https://zoom.us/j/1234567890" },
      { code: "K9F2", players: ["Carol", "Dave"], playerEmails: ["carol@test.com", "dave@test.com"], maxPlayers: 4, started: true, currentStep: 90, totalSteps: 180, phase: "move", zoomLink: "https://zoom.us/j/5555555555" },
      { code: "M2P5", players: ["Eve"], playerEmails: ["eve@test.com"], maxPlayers: 4, started: false, currentStep: 0, totalSteps: 0, phase: "lobby" },
    ],
  },
};

export const EmptyRooms: Story = {
  name: "No Active Games",
  args: {
    ...baseArgs,
    rooms: [],
  },
};

export const NotConnected: Story = {
  name: "Not Connected",
  args: {
    ...baseArgs,
    connected: false,
    rooms: [],
  },
};

export const AdminView: Story = {
  name: "Admin View (with delete)",
  args: {
    ...baseArgs,
    isAdmin: true,
    onDeleteRoom: fn(),
    onEndGame: fn(),
    rooms: [
      { code: "A3X7", players: ["Alice", "Bob"], playerEmails: ["alice@test.com", "bob@test.com"], maxPlayers: 4, started: true, currentStep: 45, totalSteps: 180, phase: "move", zoomLink: "https://zoom.us/j/1234567890" },
      { code: "K9F2", players: ["Carol", "Dave"], playerEmails: ["carol@test.com", "dave@test.com"], maxPlayers: 4, started: false, currentStep: 0, totalSteps: 0, phase: "lobby" },
    ],
  },
};

export const NotAuthenticated: Story = {
  name: "Not Logged In (observe only)",
  args: {
    ...baseArgs,
    authenticated: false,
    userEmail: null,
    rooms: [
      { code: "A3X7", players: ["Alice", "Bob"], playerEmails: ["alice@test.com", "bob@test.com"], maxPlayers: 4, started: true, currentStep: 45, totalSteps: 180, phase: "move", zoomLink: "https://zoom.us/j/1234567890" },
      { code: "K9F2", players: ["Carol"], playerEmails: ["carol@test.com"], maxPlayers: 4, started: true, currentStep: 100, totalSteps: 180, phase: "move" },
    ],
  },
};
