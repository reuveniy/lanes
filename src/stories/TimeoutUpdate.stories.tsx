import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const FONT = "'Courier New', monospace";
const C = { bg: "#111827", border: "#374151", text: "#d1d5db", blue: "#60a5fa", dark: "#0a0a1a", gray: "#374151", lightGray: "#e5e7eb" };

const TimeoutUpdateDialog: React.FC<{
  currentTimeout: number;
  onUpdate: (timeout: number) => void;
  onCancel: () => void;
}> = ({ currentTimeout, onUpdate, onCancel }) => {
  const [value, setValue] = useState(currentTimeout);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ fontFamily: FONT, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, minWidth: 320, textAlign: "center" }}>
        <div style={{ color: C.blue, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>Move Timeout</div>
        <div style={{ color: C.text, fontSize: 13, marginBottom: 16 }}>{value === 0 ? "OFF" : `${value} seconds`}</div>
        <input type="range" min={0} max={300} step={5} value={value} onChange={(e) => setValue(Number(e.target.value))} style={{ width: "100%", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ fontFamily: FONT, fontSize: 14, fontWeight: "bold", background: C.gray, color: C.lightGray, border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onUpdate(value)} style={{ fontFamily: FONT, fontSize: 14, fontWeight: "bold", background: C.blue, color: C.dark, border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}>Update</button>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: "Panels/TimeoutUpdate",
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};
export default meta;

export const Default60s: StoryObj = {
  name: "Default (60s)",
  render: () => <TimeoutUpdateDialog currentTimeout={60} onUpdate={() => {}} onCancel={() => {}} />,
};

export const Disabled: StoryObj = {
  name: "Timeout OFF",
  render: () => <TimeoutUpdateDialog currentTimeout={0} onUpdate={() => {}} onCancel={() => {}} />,
};

export const Max300s: StoryObj = {
  name: "Max (300s)",
  render: () => <TimeoutUpdateDialog currentTimeout={300} onUpdate={() => {}} onCancel={() => {}} />,
};
