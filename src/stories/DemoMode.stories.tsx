import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { DemoMode } from "../components/DemoMode";

const meta: Meta<typeof DemoMode> = {
  title: "Screens/DemoMode",
  component: DemoMode,
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};

export default meta;
type Story = StoryObj<typeof DemoMode>;

export const Default: Story = {
  name: "Demo Mode",
  args: {
    onExit: fn(),
  },
};
