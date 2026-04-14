import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { PLAYER_COLORS } from "../types/game";

const FONT = "'Courier New', monospace";
const C = { bg: "#0a0a1a", panelBg: "#111827", border: "#374151", dimBorder: "#1f2937", text: "#e5e7eb", dim: "#9ca3af", dimmer: "#6b7280", gold: "#fbbf24", green: "#22c55e", red: "#ef4444" };

const BoardSnapshotPreview: React.FC = () => (
  <div style={{ fontFamily: FONT, background: C.bg, padding: 12, display: "flex", gap: 8 }}>
    <div style={{
      background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 4,
      width: 504, height: 342, display: "flex", alignItems: "center", justifyContent: "center",
      color: C.dimmer, fontSize: 14,
    }}>
      19x28 Game Map
    </div>
    <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: 8, textAlign: "center" }}>
        <div style={{ color: C.dimmer, fontSize: 10 }}>STEP</div>
        <div style={{ color: C.gold, fontSize: 16, fontWeight: "bold" }}>045/180</div>
        <div style={{ background: C.dimBorder, height: 3, marginTop: 4, borderRadius: 2 }}>
          <div style={{ background: C.green, height: 3, width: "25%", borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: 8 }}>
        <div style={{ color: C.dimmer, fontSize: 10, marginBottom: 4 }}>NET WORTH</div>
        {["Alice", "Bob", "Carol"].map((name, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: PLAYER_COLORS[i] }}>{i === 0 ? "\u25B6 " : "  "}{name}</span>
              <span style={{ color: C.text }}>${(18000 - i * 3000).toLocaleString()}</span>
            </div>
            <div style={{ background: C.dimBorder, height: 3, marginTop: 2 }}>
              <div style={{ background: PLAYER_COLORS[i], height: 3, width: `${100 - i * 20}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: 8 }}>
        <div style={{ color: PLAYER_COLORS[0], fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>Alice</div>
        {[
          { label: "Cash", value: "$12,000", color: C.green },
          { label: "Dp", value: "2", color: C.text },
          { label: "Bonus", value: "1 ($500)", color: C.text },
          { label: "Freeze", value: "0", color: C.text },
          { label: "Traps", value: "1 (\u00BD:1)", color: C.red },
          { label: "Bank", value: "$1,250", color: C.gold },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
            <span style={{ color: C.dim }}>{row.label}</span>
            <span style={{ color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const meta: Meta = {
  title: "WhatsApp/Board Snapshot",
  parameters: { layout: "centered", backgrounds: { default: "dark" } },
};
export default meta;

export const Default: StoryObj = {
  name: "Board Snapshot",
  render: () => <BoardSnapshotPreview />,
};
