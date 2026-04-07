import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { GoogleLogin } from "../components/GoogleLogin";

const meta: Meta<typeof GoogleLogin> = {
  title: "Panels/GoogleLogin",
  component: GoogleLogin,
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300, padding: 24, background: "#111827", borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GoogleLogin>;

export const NoClientId: Story = {
  name: "No Client ID (dev mode)",
  args: {
    clientId: "",
    onToken: fn(),
  },
};

export const WithClientId: Story = {
  name: "With Client ID",
  args: {
    clientId: "fake-client-id.apps.googleusercontent.com",
    onToken: fn(),
  },
};
