import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { GameOverScreen } from "../components/GameOverScreen";
import { createLateGameState, createMidGameState } from "./fixtures";

const meta: Meta<typeof GameOverScreen> = {
  title: "Screens/GameOverScreen",
  component: GameOverScreen,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof GameOverScreen>;

function gameOverState(winnerIdx: number) {
  const state = createLateGameState();
  state.phase = "gameOver";
  state.winner = winnerIdx;
  state.currentStep = state.totalSteps;
  // Set distinct double pays for display
  state.players[0].doublePays = 2;
  state.players[1].doublePays = 0;
  state.players[2].doublePays = 3;
  state.players[3].doublePays = 1;
  return state;
}

export const Player3Wins: Story = {
  name: "Carol Wins (highest net worth)",
  args: {
    state: gameOverState(2),
    onPlayAgain: fn(),
  },
};

export const Player1Wins: Story = {
  name: "Alice Wins",
  args: {
    state: gameOverState(0),
    onPlayAgain: fn(),
  },
};

export const CloseGame: Story = {
  name: "Close Game (similar net worths)",
  args: {
    state: (() => {
      const s = createMidGameState();
      s.phase = "gameOver";
      s.winner = 1;
      s.currentStep = s.totalSteps;
      s.players[0].netWorth = 25000;
      s.players[0].cash = 12000;
      s.players[1].netWorth = 25500;
      s.players[1].cash = 10000;
      s.players[2].netWorth = 24800;
      s.players[2].cash = 14000;
      s.players[3].netWorth = 23000;
      s.players[3].cash = 8000;
      return s;
    })(),
    onPlayAgain: fn(),
  },
};
