import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { MoveSelector } from "../components/MoveSelector";
import { createMidGameState } from "./fixtures";

const meta: Meta<typeof MoveSelector> = {
  title: "Panels/MoveSelector",
  component: MoveSelector,
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
type Story = StoryObj<typeof MoveSelector>;

const midState = createMidGameState();

export const MovePhase: Story = {
  name: "Move Phase (5 options)",
  args: {
    moveOptions: midState.moveOptions,
    phase: "move",
    onSelect: fn(),
  },
};

export const TradingPhase: Story = {
  name: "Trading Phase",
  args: {
    moveOptions: [],
    phase: "trading",
  },
};

export const EventPhase: Story = {
  name: "Event Phase",
  args: {
    moveOptions: [],
    phase: "event",
  },
};
