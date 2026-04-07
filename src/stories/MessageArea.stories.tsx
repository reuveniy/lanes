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
  name: "Merger Announcement",
  args: {
    messages: [
      { text: "Capella Freight merges into Altair Starways!", type: "critical" },
      { text: "Alice: 8 shares -> 4 shares + $960 bonus", type: "positive" },
      { text: "Bob: 3 shares -> 2 shares + $360 bonus", type: "positive" },
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
