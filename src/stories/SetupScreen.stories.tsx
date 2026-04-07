import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { SetupScreen } from "../components/SetupScreen";

const meta: Meta<typeof SetupScreen> = {
  title: "Screens/SetupScreen",
  component: SetupScreen,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof SetupScreen>;

export const Default: Story = {
  name: "Default (2 players)",
  args: {
    onStart: fn(),
  },
};
