import React from "react";
import type { Player } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface CashDisplayProps {
  player: Player;
  bankBonus: number;
}

export const CashDisplay: React.FC<CashDisplayProps> = ({
  player,
  bankBonus,
}) => {
  const m = useMobile();

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: m ? 10 : 13,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: m ? 8 : 12,
      }}
    >
      <div
        style={{
          color: player.color,
          fontWeight: "bold",
          marginBottom: m ? 4 : 8,
          fontSize: m ? 11 : 14,
        }}
      >
        {player.name}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9ca3af" }}>Cash</span>
        <span style={{ color: "#34d399" }}>${player.cash.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9ca3af" }}>Double Pays</span>
        <span>{player.doublePays}</span>
      </div>
      <div
        style={{
          borderTop: "1px solid #374151",
          marginTop: m ? 4 : 8,
          paddingTop: m ? 4 : 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#9ca3af" }}>Bank Bonus</span>
        <span style={{ color: "#fbbf24" }}>${bankBonus.toLocaleString()}</span>
      </div>
    </div>
  );
};
