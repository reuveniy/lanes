import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { TradingPanel } from "../components/TradingPanel";
import { createMidGameState } from "./fixtures";

const meta: Meta<typeof TradingPanel> = {
  title: "Panels/TradingPanel",
  component: TradingPanel,
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
type Story = StoryObj<typeof TradingPanel>;

function tradingState(companyIndex: number, playerCash?: number) {
  const state = createMidGameState();
  state.tradingState = { companyIndex, loopCount: 0, soldThisTurn: 0 };
  if (playerCash !== undefined) {
    state.players[state.currentPlayer].cash = playerCash;
  }
  // Give the current player some shares for sell scenarios
  state.companies[companyIndex].shares[state.currentPlayer] = 8;
  return state;
}

export const CheapStock: Story = {
  name: "Cheap Stock (Altair $1800)",
  args: {
    state: tradingState(0),
    onBuy: fn(),
    onSell: fn(),
    onSkip: fn(),
    onJumpToCompany: fn(),
    onEndTrading: fn(),
    onAllIn: fn(),
  },
};

export const ExpensiveStock: Story = {
  name: "Expensive Stock (General Motors $1500)",
  args: {
    state: tradingState(6),
    onBuy: fn(),
    onSell: fn(),
    onSkip: fn(),
    onJumpToCompany: fn(),
    onEndTrading: fn(),
    onAllIn: fn(),
  },
};

export const LowCash: Story = {
  name: "Low Cash ($500)",
  args: {
    state: tradingState(0, 500),
    onBuy: fn(),
    onSell: fn(),
    onSkip: fn(),
    onJumpToCompany: fn(),
    onEndTrading: fn(),
    onAllIn: fn(),
  },
};

export const HighCash: Story = {
  name: "High Cash ($50,000)",
  args: {
    state: tradingState(2, 50000),
    onBuy: fn(),
    onSell: fn(),
    onSkip: fn(),
    onJumpToCompany: fn(),
    onEndTrading: fn(),
    onAllIn: fn(),
  },
};
