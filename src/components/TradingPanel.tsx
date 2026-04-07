import React, { useState } from "react";
import type { GameState } from "../types/game";
import { playBeep } from "../engine/sound";
import { useMobile } from "../hooks/useMobile";
import { getMaxSellableShares } from "../engine/trading";

interface TradingPanelProps {
  state: GameState;
  onBuy: (companyIndex: number, amount: number) => void;
  onSell: (companyIndex: number, amount: number) => void;
  onSkip: () => void;
  onJumpToCompany: (companyIndex: number) => void;
  onEndTrading: () => void;
  onAllIn: () => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  state,
  onBuy,
  onSell,
  onSkip,
  onJumpToCompany,
  onEndTrading,
  onAllIn,
}) => {
  const m = useMobile();
  const [amount, setAmount] = useState("");

  if (!state.tradingState) return null;

  const company = state.companies[state.tradingState.companyIndex];
  const player = state.players[state.currentPlayer];
  const held = company.shares[state.currentPlayer];
  const maxBuy = Math.floor(player.cash / company.stockPrice);
  const maxSell = getMaxSellableShares(state, company.index, state.currentPlayer);

  const handleAction = () => {
    const val = amount.trim();
    if (!val) {
      onSkip();
      return;
    }

    // Jump to company: .B or ,B
    if (val.length === 2 && (val[0] === "." || val[0] === ",")) {
      const letter = val[1].toUpperCase();
      const idx = letter.charCodeAt(0) - 65;
      if (idx >= 0 && idx < 26 && state.companies[idx].size > 0) {
        onJumpToCompany(idx);
        setAmount("");
      } else {
        playBeep();
      }
      return;
    }

    const lower = val.toLowerCase();

    // Skip: "skip", "-"
    if (lower === "skip" || lower === "-") {
      onSkip();
      setAmount("");
      return;
    }

    // All in: buy max in every company until broke
    if (lower === "allin" || lower === "a") {
      onAllIn();
      setAmount("");
      return;
    }

    // Buy max: "max", "all", or "m"
    if (lower === "max" || lower === "all" || lower === "m") {
      if (maxBuy > 0) {
        onBuy(company.index, maxBuy);
        setAmount("");
      } else {
        playBeep();
      }
      return;
    }

    if (lower.endsWith("s")) {
      const sellAmt = parseInt(val.slice(0, -1));
      if (sellAmt > 0 && sellAmt <= held) {
        onSell(company.index, sellAmt);
        setAmount("");
      } else {
        playBeep();
      }
    } else {
      const buyAmt = parseInt(val);
      if (buyAmt > 0 && buyAmt <= maxBuy) {
        onBuy(company.index, buyAmt);
        setAmount("");
      } else {
        playBeep();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAction();
    if (e.key === "-") {
      e.preventDefault();
      onSkip();
      setAmount("");
    }
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: m ? 10 : 12,
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: m ? "4px 8px" : "4px 10px",
    cursor: "pointer",
  };

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
          color: "#fbbf24",
          fontWeight: "bold",
          fontSize: m ? 11 : 14,
          marginBottom: m ? 4 : 8,
        }}
      >
        {company.letter}. {company.name}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: m ? "2px 8px" : "4px 16px",
          marginBottom: m ? 6 : 10,
        }}
      >
        <span style={{ color: "#9ca3af" }}>Price:</span>
        <span>${company.stockPrice}</span>
        <span style={{ color: "#9ca3af" }}>Held:</span>
        <span>{held} shares</span>
        <span style={{ color: "#9ca3af" }}>Cash:</span>
        <span style={{ color: "#34d399" }}>${player.cash.toLocaleString()}</span>
        <span style={{ color: "#9ca3af" }}>Max Buy:</span>
        <span>{maxBuy}</span>
        <span style={{ color: "#9ca3af" }}>Max Sell:</span>
        <span>{maxSell}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="qty | Ns sell | max | allin | skip | .X"
          aria-label="Trade amount or command"
          autoFocus
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: m ? 11 : 13,
            background: "#0f0f23",
            color: "#e5e7eb",
            border: "1px solid #374151",
            borderRadius: 4,
            padding: "6px 8px",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          borderTop: "1px solid #374151",
          paddingTop: 8,
        }}
      >
        <span style={{ color: "#6b7280", fontSize: 11 }}>.X to jump to company</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onEndTrading}
          style={{ ...btnStyle, color: "#f87171" }}
        >
          End Trading
        </button>
      </div>
    </div>
  );
};
