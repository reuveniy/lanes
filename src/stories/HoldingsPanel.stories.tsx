import type { Meta, StoryObj } from "@storybook/react";
import { HoldingsPanel } from "../components/HoldingsPanel";
import { createMidGameState, createEarlyGameState, createLateGameState } from "./fixtures";

const meta: Meta<typeof HoldingsPanel> = {
  title: "Panels/HoldingsPanel",
  component: HoldingsPanel,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HoldingsPanel>;

function withShares() {
  const state = createMidGameState();
  state.companies[0].shares[2] = 12;
  state.companies[2].shares[2] = 5;
  state.companies[4].shares[2] = 20;
  state.companies[6].shares[2] = 3;
  return state;
}

export const WithHoldings: Story = {
  name: "With Holdings (4 companies)",
  args: { state: withShares() },
};

export const NoHoldings: Story = {
  name: "No Shares Held",
  args: { state: createMidGameState() },
};

export const EarlyGame: Story = {
  name: "Early Game (2 companies)",
  args: {
    state: (() => {
      const s = createEarlyGameState();
      s.companies[0].shares[0] = 5;
      return s;
    })(),
  },
};

export const LateGameManyCompanies: Story = {
  name: "Late Game (7 companies, diverse holdings)",
  args: {
    state: (() => {
      const s = createLateGameState();
      s.companies[0].shares[1] = 15;
      s.companies[2].shares[1] = 8;
      s.companies[4].shares[1] = 22;
      s.companies[6].shares[1] = 4;
      s.companies[9].shares[1] = 10;
      s.companies[12].shares[1] = 6;
      s.companies[18].shares[1] = 3;
      return s;
    })(),
  },
};
