import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { Leaderboard } from "../components/Leaderboard";

const meta: Meta<typeof Leaderboard> = {
  title: "Panels/Leaderboard",
  component: Leaderboard,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Leaderboard>;

const players = [
  { email: "alice@test.com", name: "Alice", picture: "", wins: 12, games: 20 },
  { email: "bob@test.com", name: "Bob", picture: "", wins: 8, games: 15 },
  { email: "carol@test.com", name: "Carol", picture: "", wins: 5, games: 18 },
  { email: "dave@test.com", name: "Dave", picture: "", wins: 3, games: 10 },
  { email: "eve@test.com", name: "Eve", picture: "", wins: 1, games: 4 },
  { email: "frank@test.com", name: "Frank", picture: "", wins: 0, games: 7 },
];

export const WithPlayers: Story = {
  name: "Active Leaderboard",
  args: { entries: players },
};

export const AdminView: Story = {
  name: "Admin View (with controls)",
  args: {
    entries: players,
    isAdmin: true,
    onClearLeaderboard: fn(),
    onRemoveUser: fn(),
  },
};

export const NewPlayers: Story = {
  name: "All New Players (0 wins)",
  args: {
    entries: [
      { email: "a@t.com", name: "Alice", picture: "", wins: 0, games: 0 },
      { email: "b@t.com", name: "Bob", picture: "", wins: 0, games: 0 },
      { email: "c@t.com", name: "Carol", picture: "", wins: 0, games: 0 },
    ],
  },
};

export const TightRace: Story = {
  name: "Tight Race (close wins)",
  args: {
    entries: [
      { email: "a@t.com", name: "Alice", picture: "", wins: 10, games: 25 },
      { email: "b@t.com", name: "Bob", picture: "", wins: 10, games: 30 },
      { email: "c@t.com", name: "Carol", picture: "", wins: 9, games: 20 },
      { email: "d@t.com", name: "Dave", picture: "", wins: 9, games: 22 },
    ],
  },
};

export const Empty: Story = {
  name: "No Players",
  args: { entries: [] },
};

export const AdminEmpty: Story = {
  name: "Admin View (empty)",
  args: {
    entries: [],
    isAdmin: true,
    onClearLeaderboard: fn(),
    onRemoveUser: fn(),
  },
};
