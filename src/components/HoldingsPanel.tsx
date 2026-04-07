import React, { useRef, useEffect, useState } from "react";
import type { GameState } from "../types/game";
import { PLAYER_COLORS } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface HoldingsPanelProps {
  state: GameState;
  viewPlayerId?: number;
  onCompanyClick?: (companyIndex: number) => void;
  showFullName?: boolean;
}

export const HoldingsPanel: React.FC<HoldingsPanelProps> = ({ state, viewPlayerId, onCompanyClick, showFullName }) => {
  const isMobile = useMobile();
  const activeCompanies = state.companies.filter((c) => c.size > 0);
  const pid = viewPlayerId !== undefined && viewPlayerId >= 0 ? viewPlayerId : state.currentPlayer;
  const player = state.players[pid];

  // Observer mode — no player to show holdings for
  if (!player) return null;

  // Track previous shares to highlight changes
  const prevSharesRef = useRef<Record<number, number>>({});
  const [changedCompanies, setChangedCompanies] = useState<Set<number>>(new Set());

  useEffect(() => {
    const prev = prevSharesRef.current;
    const changed = new Set<number>();

    for (const c of activeCompanies) {
      const shares = c.shares[pid];
      if (prev[c.index] !== undefined && prev[c.index] !== shares) {
        changed.add(c.index);
      }
    }

    if (changed.size > 0) {
      setChangedCompanies(changed);
      const timer = setTimeout(() => setChangedCompanies(new Set()), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.companies, pid]);

  // Update ref after render
  useEffect(() => {
    const snapshot: Record<number, number> = {};
    for (const c of state.companies) {
      snapshot[c.index] = c.shares[pid];
    }
    prevSharesRef.current = snapshot;
  });

  // Total stock value
  let totalStockValue = 0;
  for (const c of activeCompanies) {
    totalStockValue += c.shares[pid] * c.stockPrice;
  }

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: isMobile ? 10 : 11,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: isMobile ? 8 : 10,
        minWidth: isMobile ? 0 : 220,
      }}
    >
      <div
        style={{
          color: player.color,
          fontSize: 10,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: "bold",
        }}
      >
        Holdings - {player.name}
      </div>

      {activeCompanies.length === 0 ? (
        <div style={{ color: "#4b5563", fontSize: 11 }}>
          No active companies
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
                <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: "normal" }}>{isMobile && !showFullName ? "Co" : "Company"}</th>
                <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>Price</th>
                <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: "normal" }}>Val</th>
              </tr>
            </thead>
            <tbody>
              {activeCompanies.map((c) => {
                const shares = c.shares[pid];
                const value = shares * c.stockPrice;
                const isChanged = changedCompanies.has(c.index);
                const controllerColor = c.controllingPlayer !== null
                  ? PLAYER_COLORS[c.controllingPlayer]
                  : "#6b7280";
                const clickable = !!onCompanyClick;
                return (
                  <tr
                    key={c.index}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    aria-label={clickable ? `Jump to ${c.name}` : undefined}
                    onClick={() => onCompanyClick?.(c.index)}
                    onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onCompanyClick?.(c.index); } } : undefined}
                    style={{
                      color: shares > 0 ? "#e5e7eb" : "#374151",
                      borderBottom: "1px solid #1f2937",
                      background: isChanged ? "rgba(250, 204, 21, 0.15)" : "transparent",
                      transition: "background 0.3s ease",
                      cursor: clickable ? "pointer" : "default",
                    }}
                  >
                    <td style={{ padding: "2px 4px", color: controllerColor, whiteSpace: "nowrap" }}>
                      {isMobile && !showFullName ? c.letter : `${c.letter}. ${c.name}`}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 4px" }}>
                      {c.stockPrice}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "2px 4px",
                        fontWeight: isChanged ? "bold" : "normal",
                        color: isChanged ? "#fbbf24" : undefined,
                      }}
                    >
                      {shares}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "2px 4px",
                        color: value > 0 ? "#34d399" : "#374151",
                      }}
                    >
                      {value > 0 ? `$${value.toLocaleString()}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div
            style={{
              borderTop: "1px solid #374151",
              marginTop: 4,
              paddingTop: 4,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
            }}
          >
            <span style={{ color: "#9ca3af" }}>Stock</span>
            <span style={{ color: "#34d399" }}>${totalStockValue.toLocaleString()}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
            }}
          >
            <span style={{ color: "#9ca3af" }}>Cash</span>
            <span style={{ color: "#34d399" }}>${player.cash.toLocaleString()}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            <span style={{ color: "#9ca3af" }}>Total</span>
            <span style={{ color: "#fbbf24" }}>${player.netWorth.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
};
