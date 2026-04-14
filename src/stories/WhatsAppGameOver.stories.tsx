import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { PLAYER_COLORS } from "../types/game";

const FONT = "'Courier New', monospace";
const C = { bg: "#0a0a1a", panelBg: "#111827", border: "#374151", dimBorder: "#1f2937", text: "#e5e7eb", dim: "#9ca3af", dimmer: "#6b7280", gold: "#fbbf24" };

interface GameOverPreviewProps {
  players: { name: string; color: string; cash: number; netWorth: number; isWinner: boolean }[];
  steps: number;
  totalSteps: number;
}

const GameOverImagePreview: React.FC<GameOverPreviewProps> = ({ players, steps, totalSteps }) => {
  const sorted = [...players].sort((a, b) => b.netWorth - a.netWorth);
  const winner = sorted.find((p) => p.isWinner);
  return (
    <div style={{ fontFamily: FONT, background: C.bg, padding: 32, textAlign: "center", width: 860 }}>
      <div style={{ color: C.gold, fontSize: 22, fontWeight: "bold", letterSpacing: 3, marginBottom: 16 }}>
        G A M E &nbsp; O V E R
      </div>
      {winner && (
        <div style={{ color: winner.color, fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
          {winner.name} Wins!
        </div>
      )}
      <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 18, color: C.text }}>
          <thead>
            <tr style={{ color: C.dim, fontSize: 14, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: "normal" }}>Rank</th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: "normal" }}>Player</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: "normal" }}>Stock</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: "normal" }}>Cash</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: "normal" }}>Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const stock = p.netWorth - p.cash;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.dimBorder}`, fontWeight: p.isWinner ? "bold" : "normal", color: p.isWinner ? p.color : C.text }}>
                  <td style={{ padding: "8px" }}>{i + 1}</td>
                  <td style={{ padding: "8px", color: p.color, textAlign: "left" }}>{p.name}</td>
                  <td style={{ textAlign: "right", padding: "8px" }}>${stock.toLocaleString()}</td>
                  <td style={{ textAlign: "right", padding: "8px" }}>${p.cash.toLocaleString()}</td>
                  <td style={{ textAlign: "right", padding: "8px", color: C.gold, fontWeight: "bold" }}>${p.netWorth.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 8, color: C.dimmer, fontSize: 14 }}>Steps: {steps} / {totalSteps}</div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: "WhatsApp/Game Over",
  parameters: { layout: "centered", backgrounds: { default: "dark" } },
};
export default meta;

export const ThreePlayers: StoryObj = {
  name: "3 Players",
  render: () => (
    <GameOverImagePreview
      players={[
        { name: "Captain Kirk", color: PLAYER_COLORS[0], cash: 17037, netWorth: 40987178, isWinner: true },
        { name: "Commander Spock", color: PLAYER_COLORS[1], cash: 0, netWorth: 28163777, isWinner: false },
        { name: "Dr. McCoy", color: PLAYER_COLORS[2], cash: 8659042, netWorth: 23320921, isWinner: false },
      ]}
      steps={125}
      totalSteps={180}
    />
  ),
};

export const TwoPlayers: StoryObj = {
  name: "2 Players",
  render: () => (
    <GameOverImagePreview
      players={[
        { name: "Alice", color: PLAYER_COLORS[0], cash: 45000, netWorth: 120000, isWinner: true },
        { name: "Bob", color: PLAYER_COLORS[1], cash: 30000, netWorth: 95000, isWinner: false },
      ]}
      steps={180}
      totalSteps={180}
    />
  ),
};
