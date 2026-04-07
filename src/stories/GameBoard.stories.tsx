import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { GameBoard } from "../components/GameBoard";
import {
  createEarlyGameState,
  createMidGameState,
  createLateGameState,
  createTradingPhaseState,
  createMergerEventState,
} from "./fixtures";

const meta: Meta<typeof GameBoard> = {
  title: "Screens/GameBoard",
  component: GameBoard,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof GameBoard>;

export const EarlyGame: Story = {
  name: "Early Game (2 companies, 3 players)",
  args: {
    gameState: createEarlyGameState(),
    selectedMove: null,
    onMoveSelect: fn(),
    onCellClick: fn(),
  },
};

export const MidGame: Story = {
  name: "Mid Game (5 companies, 4 players)",
  args: {
    gameState: createMidGameState(),
    selectedMove: null,
    onMoveSelect: fn(),
    onCellClick: fn(),
  },
};

export const LateGame: Story = {
  name: "Late Game (7 companies, high stakes)",
  args: {
    gameState: createLateGameState(),
    selectedMove: null,
    onMoveSelect: fn(),
    onCellClick: fn(),
  },
};

export const MoveSelected: Story = {
  name: "Move Selected (option 3 highlighted)",
  args: {
    gameState: createMidGameState(),
    selectedMove: 3,
    onMoveSelect: fn(),
    onCellClick: fn(),
  },
};

export const TradingPhase: Story = {
  name: "Trading Phase",
  args: {
    gameState: createTradingPhaseState(),
    selectedMove: null,
  },
};

export const MergerEvent: Story = {
  name: "Merger Event",
  args: {
    gameState: createMergerEventState(),
    selectedMove: null,
  },
};
