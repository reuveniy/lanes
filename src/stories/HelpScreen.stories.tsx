import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { HelpScreen } from "../components/HelpScreen";

const meta: Meta<typeof HelpScreen> = {
  title: "Screens/HelpScreen",
  component: HelpScreen,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof HelpScreen>;

export const Default: Story = {
  name: "Game Guide",
  args: {
    onClose: fn(),
  },
};
