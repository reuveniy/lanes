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
      <div style={{ borderTop: "1px solid #374151", marginBottom: m ? 4 : 6 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ color: "#34d399" }}>Cash</span>
        <span style={{ color: "#34d399" }}>${player.cash.toLocaleString()}</span>
      </div>
      {(player.doublePays > 0 || player.bonusCount > 0 || player.specialHelpCount > 0 || player.totalBonusReceived > 0) && (
        <div style={{ borderTop: "1px solid #374151", marginTop: m ? 4 : 6, paddingTop: m ? 4 : 6 }} />
      )}
      {player.doublePays > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#34d399" }}>Double Pays</span>
          <span style={{ color: "#34d399" }}>{player.doublePays}</span>
        </div>
      )}
      {player.bonusCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#34d399" }}>Bonuses</span>
          <span style={{ color: "#34d399" }}>{player.bonusCount}</span>
        </div>
      )}
      {player.specialHelpCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#34d399" }}>Special Help</span>
          <span style={{ color: "#34d399" }}>{player.specialHelpCount}</span>
        </div>
      )}
      {player.totalBonusReceived > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#34d399" }}>Total Bonus</span>
          <span style={{ color: "#34d399" }}>${player.totalBonusReceived.toLocaleString()}</span>
        </div>
      )}
      {(player.freezeCount > 0 || player.trapCount > 0 || player.halfTrapCount > 0 || player.totalTrapLost > 0) && (
        <div style={{ borderTop: "1px solid #374151", marginTop: m ? 4 : 6, paddingTop: m ? 4 : 6 }} />
      )}
      {player.freezeCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#ef4444" }}>Freezes</span>
          <span style={{ color: "#ef4444" }}>{player.freezeCount}</span>
        </div>
      )}
      {player.trapCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#ef4444" }}>Traps</span>
          <span style={{ color: "#ef4444" }}>{player.trapCount}</span>
        </div>
      )}
      {player.halfTrapCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#ef4444" }}>Half Traps</span>
          <span style={{ color: "#ef4444" }}>{player.halfTrapCount}</span>
        </div>
      )}
      {player.totalTrapLost > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: "#ef4444" }}>Trap Losses</span>
          <span style={{ color: "#ef4444" }}>${player.totalTrapLost.toLocaleString()}</span>
        </div>
      )}
      <div
        style={{
          borderTop: "1px solid #374151",
          marginTop: m ? 4 : 8,
          paddingTop: m ? 4 : 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#f59e0b" }}>Bank Bonus</span>
        <span style={{ color: "#f59e0b" }}>${bankBonus.toLocaleString()}</span>
      </div>
    </div>
  );
};
