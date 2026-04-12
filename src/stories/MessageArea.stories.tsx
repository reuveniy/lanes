import type { Meta, StoryObj } from "@storybook/react";
import { MessageArea } from "../components/MessageArea";

const meta: Meta<typeof MessageArea> = {
  title: "Panels/MessageArea",
  component: MessageArea,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageArea>;

export const Empty: Story = {
  name: "Empty (awaiting)",
  args: { messages: [] },
};

export const MovePhase: Story = {
  name: "Move Phase",
  args: {
    messages: [{ text: "Alice's turn - select a move", type: "info" }],
  },
};

export const GalacticBombNegative: Story = {
  name: "Galactic Bomb (negative)",
  args: {
    messages: [
      { text: "Klingon attack on the Space-Fleet !!!", type: "critical" },
      { text: "Altair Starways stock: $2800 -> $2520", type: "alert" },
      { text: "Bob's turn - select a move", type: "info" },
    ],
  },
};

export const GalacticBombPositive: Story = {
  name: "Galactic Bomb (positive)",
  args: {
    messages: [
      { text: "Capella Freight: New energy sources discovered !!!", type: "positive" },
      { text: "Stock price: $1200 -> $1560", type: "info" },
      { text: "Carol's turn - select a move", type: "info" },
    ],
  },
};

export const TrapEvent: Story = {
  name: "Trap Event",
  args: {
    messages: [
      { text: "TRAP! Alice lost ALL cash ($12,400)!", type: "critical" },
      { text: "Freeze Trapped!!!!! Alice lost their trading phase!", type: "critical" },
    ],
  },
};

export const MergerAnnouncement: Story = {
  name: "Merger Results Table",
  args: {
    messages: [
      { text: "Capella Freight ($1200) merges into Altair Starways ($1800)", type: "critical" },
      { text: "C           Old    New  Total  Bonus", type: "alert" },
      { text: "Alice         8      4     16   $960", type: "positive" },
      { text: "Bob           3      2      5   $360", type: "positive" },
      { text: "Carol         0      0     10     $0", type: "info" },
      { text: "Dave          5      3      3   $600", type: "positive" },
      { text: "Altair Starways new price: $3000", type: "info" },
      { text: "Altair Starways stock split! Price halved, shares doubled.", type: "alert" },
    ],
  },
};

export const MergerNoSplit: Story = {
  name: "Merger (no stock split)",
  args: {
    messages: [
      { text: "Betelgeuse Ltd. ($400) merges into General Motors ($1500)", type: "critical" },
      { text: "B           Old    New  Total  Bonus", type: "alert" },
      { text: "Alice         5      3     10   $200", type: "positive" },
      { text: "Bob          12      6     14   $480", type: "positive" },
      { text: "Carol         0      0      8     $0", type: "info" },
      { text: "General Motors new price: $1900", type: "info" },
    ],
  },
};

export const DoublePay: Story = {
  name: "Double Pay + Bonus",
  args: {
    messages: [
      { text: "Bob hit Double Pay! Cash doubled to $17,800!", type: "positive" },
      { text: "Bob receives bank bonus of $2,125!", type: "positive" },
    ],
  },
};
