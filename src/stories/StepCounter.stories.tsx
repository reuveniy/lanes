import type { Meta, StoryObj } from "@storybook/react";
import { StepCounter } from "../components/StepCounter";

const meta: Meta<typeof StepCounter> = {
  title: "Panels/StepCounter",
  component: StepCounter,
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
type Story = StoryObj<typeof StepCounter>;

export const EarlyGame: Story = {
  name: "Early Game (step 8/120)",
  args: { currentStep: 8, totalSteps: 120 },
};

export const MidGame: Story = {
  name: "Mid Game (step 55/120)",
  args: { currentStep: 55, totalSteps: 120 },
};

export const LateGame: Story = {
  name: "Late Game (step 108/120, red)",
  args: { currentStep: 108, totalSteps: 120 },
};

export const ShortGame: Story = {
  name: "Short Game (step 35/40)",
  args: { currentStep: 35, totalSteps: 40 },
};

export const LongGame: Story = {
  name: "Long Game (step 100/240)",
  args: { currentStep: 100, totalSteps: 240 },
};
