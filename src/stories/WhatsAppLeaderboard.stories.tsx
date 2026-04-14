import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import type { LeaderboardEntryInfo } from "../../server/protocol";

const FONT = "'Courier New', monospace";
const C = { panelBg: "#111827", border: "#374151", dimBorder: "#1f2937", text: "#e5e7eb", dim: "#9ca3af", dimmer: "#6b7280", gold: "#fbbf24", green: "#22c55e" };

const LeaderboardImagePreview: React.FC<{ entries: LeaderboardEntryInfo[] }> = ({ entries }) => (
  <div style={{ fontFamily: FONT, background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, width: 520, color: C.text }}>
    <div style={{ color: C.gold, fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>STAR LANES LEADERBOARD</div>
    <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 8 }} />
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 18 }}>
      <thead>
        <tr style={{ color: C.dimmer, fontSize: 14 }}>
          <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "normal" }}>#</th>
          <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "normal" }}>Player</th>
          <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal" }}>W</th>
          <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal" }}>G</th>
          <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal" }}>%</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => {
          const isLeader = i === 0 && e.wins > 0;
          const pct = e.games > 0 ? Math.round((e.wins / e.games) * 100) : 0;
          return (
            <tr key={i} style={{ borderBottom: `1px solid ${C.dimBorder}`, color: isLeader ? C.gold : C.text }}>
              <td style={{ padding: "6px 8px", color: C.dimmer }}>{i + 1}</td>
              <td style={{ padding: "6px 8px", fontWeight: isLeader ? "bold" : "normal" }}>{e.name}</td>
              <td style={{ textAlign: "right", padding: "6px 8px", color: e.wins > 0 ? C.green : C.dimmer, fontWeight: e.wins > 0 ? "bold" : "normal" }}>{e.wins}</td>
              <td style={{ textAlign: "right", padding: "6px 8px", color: C.dim }}>{e.games}</td>
              <td style={{ textAlign: "right", padding: "6px 8px", color: C.dim }}>{e.games > 0 ? `${pct}%` : "-"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const meta: Meta = {
  title: "WhatsApp/Leaderboard",
  parameters: { layout: "centered", backgrounds: { default: "dark" } },
};
export default meta;

export const Default: StoryObj = {
  name: "Leaderboard",
  render: () => (
    <LeaderboardImagePreview entries={[
      { email: "alice@test.com", name: "Alice", picture: "", wins: 5, games: 8 },
      { email: "bob@test.com", name: "Bob", picture: "", wins: 3, games: 7 },
      { email: "carol@test.com", name: "Carol", picture: "", wins: 2, games: 6 },
      { email: "dave@test.com", name: "Dave", picture: "", wins: 1, games: 5 },
      { email: "eve@test.com", name: "Eve", picture: "", wins: 0, games: 3 },
    ]} />
  ),
};

export const ManyPlayers: StoryObj = {
  name: "Many Players",
  render: () => (
    <LeaderboardImagePreview entries={[
      { email: "a@t.com", name: "Captain Kirk", picture: "", wins: 12, games: 15 },
      { email: "b@t.com", name: "Commander Spock", picture: "", wins: 8, games: 14 },
      { email: "c@t.com", name: "Dr. McCoy", picture: "", wins: 6, games: 13 },
      { email: "d@t.com", name: "Lt. Uhura", picture: "", wins: 3, games: 10 },
      { email: "e@t.com", name: "Scotty", picture: "", wins: 1, games: 8 },
      { email: "f@t.com", name: "Ensign Chekov", picture: "", wins: 0, games: 4 },
    ]} />
  ),
};
