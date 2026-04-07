import React, { useState } from "react";
import { useMobile } from "../hooks/useMobile";
import { ExitButton } from "./ExitButton";

type Section =
  | "overview"
  | "map"
  | "turns"
  | "companies"
  | "trading"
  | "mergers"
  | "events"
  | "traps"
  | "economy"
  | "commands"
  | "install";

const SECTIONS: { id: Section; title: string }[] = [
  { id: "overview", title: "Overview" },
  { id: "map", title: "The Star Map" },
  { id: "turns", title: "Turn Structure" },
  { id: "companies", title: "Companies" },
  { id: "trading", title: "Stock Trading" },
  { id: "mergers", title: "Mergers" },
  { id: "events", title: "Random Events" },
  { id: "traps", title: "Traps & Special Cells" },
  { id: "economy", title: "Economy & Scoring" },
  { id: "commands", title: "Commands Reference" },
  { id: "install", title: "Install App" },
];

interface HelpScreenProps {
  onClose: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onClose }) => {
  const [active, setActive] = useState<Section>("overview");
  const isMobile = useMobile();

  const h2: React.CSSProperties = {
    color: "#fbbf24",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 0,
  };

  const h3: React.CSSProperties = {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 16,
  };

  const p: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 1.7,
    marginBottom: 10,
  };

  const code: React.CSSProperties = {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: "8px 12px",
    display: "block",
    whiteSpace: "pre",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#e5e7eb",
    marginBottom: 10,
    overflowX: "auto",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 11,
    marginBottom: 12,
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "4px 8px",
    borderBottom: "1px solid #374151",
    color: "#9ca3af",
    fontWeight: "normal",
  };

  const td: React.CSSProperties = {
    padding: "4px 8px",
    borderBottom: "1px solid #1f2937",
    color: "#d1d5db",
  };

  const sym = (char: string, color: string) => (
    <span style={{ color, fontWeight: "bold" }}>{char}</span>
  );

  function renderContent() {
    switch (active) {
      case "overview":
        return (
          <>
            <div style={h2}>The Star Lanes Game</div>
            <div style={p}>
              Star Lanes is a turn-based multiplayer stock trading and territory
              control game set in space. Originally created by E. Haddad in 1985
              for GW-BASIC, it has been faithfully recreated for the modern web.
            </div>
            <div style={h3}>Objective</div>
            <div style={p}>
              Accumulate the highest <span style={{ color: "#fbbf24" }}>net worth</span> (cash + stock value)
              by the end of the game. You do this by placing markers on the star
              map to form and grow shipping companies, then buying and selling
              stock in those companies.
            </div>
            <div style={h3}>Game Parameters</div>
            <table style={table}>
              <thead>
                <tr><th style={{ ...td, textAlign: "left" }}>Parameter</th><th style={{ ...td, textAlign: "left" }}>Value</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}>Players</td><td style={td}>2-6</td></tr>
                <tr><td style={td}>Grid Size</td><td style={td}>19 rows x 28 columns</td></tr>
                <tr><td style={td}>Companies</td><td style={td}>Up to 26 (A-Z)</td></tr>
                <tr><td style={td}>Stars</td><td style={td}>100-180 (default 150)</td></tr>
                <tr><td style={td}>Game Steps</td><td style={td}>80-360 turns (default 180)</td></tr>
                <tr><td style={td}>Starting Cash</td><td style={td}>$6,000</td></tr>
              </tbody>
            </table>
            <div style={h3}>How to Win</div>
            <div style={code}>
              {"Net Worth = Cash on Hand + Sum(shares × stock_price)\n"}
              {"The player with the highest net worth wins!"}
            </div>
          </>
        );

      case "map":
        return (
          <>
            <div style={h2}>The Star Map</div>
            <div style={p}>
              The game board is a 19×28 grid. Each cell contains one of the
              following:
            </div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Symbol</th>
                  <th style={th}>Meaning</th>
                  <th style={th}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>{sym("·", "#4b5563")}</td><td style={td}>Empty Space</td><td style={td}>Available for placement</td></tr>
                <tr><td style={td}>{sym("+", "#9ca3af")}</td><td style={td}>Outpost</td><td style={td}>Unclaimed marker, can trigger company formation</td></tr>
                <tr><td style={td}>{sym("★", "#c0c0c0")}</td><td style={td}>Star</td><td style={td}>Permanent feature, adds $500 to adjacent companies</td></tr>
                <tr><td style={td}>{sym("★", "#f59e0b")}</td><td style={td}>Gold Star</td><td style={td}>Adds $1,000 to adjacent companies, fades over time</td></tr>
                <tr><td style={td}>{sym("A-Z", "#22c55e")}</td><td style={td}>Company</td><td style={td}>Territory colored by controlling player</td></tr>
                <tr><td style={td}>{sym("1-5", "#facc15")}</td><td style={td}>Move Option</td><td style={td}>Selectable positions for your turn</td></tr>
              </tbody>
            </table>
            <div style={h3}>Example Map Section</div>
            <div style={code}>
              {"  · · "}
              {sym("★", "#c0c0c0")}
              {" · · · · · ·\n"}
              {"  · "}
              {sym("A", "#22c55e")}
              {" "}
              {sym("A", "#22c55e")}
              {" "}
              {sym("A", "#22c55e")}
              {" · "}
              {sym("★", "#f59e0b")}
              {" · · ·\n"}
              {"  · "}
              {sym("A", "#22c55e")}
              {" "}
              {sym("★", "#c0c0c0")}
              {" "}
              {sym("A", "#22c55e")}
              {" · · · "}
              {sym("3", "#facc15")}
              {" ·\n"}
              {"  · · + · · · · · ·\n"}
              {"  · · · · "}
              {sym("B", "#ef4444")}
              {" "}
              {sym("B", "#ef4444")}
              {" · · ·\n"}
            </div>
            <div style={p}>
              Stars are placed randomly at game start with clustering constraints
              — no cell can be a star if all 4 neighbors are stars, and no 2×2
              block of stars is allowed. Gold stars fade over time (3 random
              checks per turn).
            </div>
          </>
        );

      case "turns":
        return (
          <>
            <div style={h2}>Turn Structure</div>
            <div style={p}>Each turn consists of five phases:</div>

            <div style={h3}>1. Pre-Move Events</div>
            <div style={p}>
              {sym("★", "#f59e0b")} <strong>Gold Star Decay:</strong> 3 random
              positions are checked. Gold stars found are removed.
            </div>
            <div style={p}>
              <strong>Galactic Bomb:</strong> ~40% chance a random event
              affects a company's stock price (-50% to +30%).
            </div>

            <div style={h3}>2. Move Selection</div>
            <div style={p}>
              Five random empty cells are offered as numbered options (1-5).
              Select one to place your marker there. Options adjacent to
              stars/outposts but with no free company slots are re-rolled.
            </div>

            <div style={h3}>3. Placement Resolution</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Situation</th><th style={th}>Result</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}>No interesting neighbors</td><td style={td}>Becomes an outpost (+)</td></tr>
                <tr><td style={td}>Adjacent to star/outpost, free company slot</td><td style={td}>New company founded! 5 free shares</td></tr>
                <tr><td style={td}>Adjacent to one company</td><td style={td}>Joins that company (+$100 stock)</td></tr>
                <tr><td style={td}>Adjacent to 2+ companies</td><td style={td}>Triggers a merger!</td></tr>
              </tbody>
            </table>

            <div style={h3}>4. Income & Special Events</div>
            <div style={p}>
              Dividends paid (5% of holdings), bank bonus grows 5%, then
              special cell effects are checked in order: Double Pay → Trap →
              Random Bonus → Freeze Trap.
            </div>

            <div style={h3}>5. Stock Trading</div>
            <div style={p}>
              Buy and sell shares in active companies. The trading loop repeats
              if you still have over $2,500 cash.
            </div>
          </>
        );

      case "companies":
        return (
          <>
            <div style={h2}>Shipping Companies</div>
            <div style={p}>
              Up to 26 companies can exist, named A through Z. Each has a unique
              name inspired by the original game:
            </div>
            <div style={code}>
              {"A  Altair Starways      N  Nec Air-Cargo Co.\n"}
              {"B  Betelgeuse Ltd.      O  Olimpic Cargo\n"}
              {"C  Capella Freight      P  Pompa-Starways\n"}
              {"D  Denebola Shippers    Q  Queen Space Co.\n"}
              {"E  Eridani Expediters   R  Remigton Airways\n"}
              {"F  Fearary Airways      S  Sky-Explorer\n"}
              {"G  General Motors       T  T.W.A. Air-Lines\n"}
              {"H  Holy Land Starway    U  Uoeing Oil Ltd.\n"}
              {"I  I.B.M.              V  Vncover Airways\n"}
              {"J  Japanese Cargo       W  Wolf Sky-Ridder\n"}
              {"K  Kantakey Freight     X  X Ray Ltd.\n"}
              {"L  Lockhid Space Co.    Y  Yotomoto Crgo\n"}
              {"M  Mecdonal-Douglas     Z  Zapping Megic Co."}
            </div>
            <div style={h3}>Formation</div>
            <div style={p}>
              A company forms when you place next to a star or outpost and no
              company already borders that cell. The founding player receives
              <span style={{ color: "#22c55e" }}> 5 free shares</span>. Initial
              stock price: $100.
            </div>
            <div style={h3}>Growth</div>
            <div style={p}>
              Each new cell added: size +1, stock +$100. Adjacent stars add
              $500, gold stars add $1,000, outposts add $100 (and get absorbed).
            </div>
            <div style={h3}>Stock Split</div>
            <div style={p}>
              When a company's stock price reaches <span style={{ color: "#fbbf24" }}>$3,000+</span>,
              a 2-for-1 split occurs: price halved, all shares doubled.
            </div>
          </>
        );

      case "trading":
        return (
          <>
            <div style={h2}>Stock Trading</div>
            <div style={p}>
              After placing your marker, you can buy and sell shares in active
              companies. Companies are offered one at a time.
            </div>
            <div style={h3}>Buying</div>
            <div style={p}>
              Enter the number of shares to buy. Cost = shares × stock price.
              No commission on purchases.
            </div>
            <div style={h3}>Selling</div>
            <div style={p}>
              Enter the number followed by "s" (e.g., <span style={{ color: "#fbbf24" }}>5s</span>).
              Shares sell at <span style={{ color: "#f59e0b" }}>95%</span> of
              market value (5% commission). Limited to <span style={{ color: "#f59e0b" }}>30% of net worth</span> per turn.
            </div>
            <div style={h3}>Commands</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Input</th><th style={th}>Action</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>5</span></td><td style={td}>Buy 5 shares</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>3s</span></td><td style={td}>Sell 3 shares</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>m</span> or <span style={{ color: "#fbbf24" }}>max</span></td><td style={td}>Buy maximum affordable shares</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>a</span> or <span style={{ color: "#fbbf24" }}>allin</span></td><td style={td}>Buy max in every company, end trading</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>skip</span> or <span style={{ color: "#fbbf24" }}>-</span></td><td style={td}>Skip this company</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>.B</span></td><td style={td}>Jump to company B</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>Enter</span> (empty)</td><td style={td}>Skip to next company</td></tr>
              </tbody>
            </table>
            <div style={p}>
              The trading loop repeats if you still have over $2,500 cash after
              cycling through all companies.
            </div>
          </>
        );

      case "mergers":
        return (
          <>
            <div style={h2}>Mergers</div>
            <div style={p}>
              A merger occurs when you place a marker adjacent to two or more
              different companies. The larger company absorbs the smaller one.
            </div>
            <div style={h3}>What Happens</div>
            <div style={p}>
              1. The company with more cells <strong>survives</strong>
              <br />
              2. All territory of the absorbed company is recolored
              <br />
              3. The survivor gains the absorbed company's cells and stock value
              <br />
              4. Shareholders of the absorbed company receive:
            </div>
            <div style={h3}>Shareholder Compensation</div>
            <div style={code}>
              {"New shares = floor(0.5 × old_shares + 0.5)  (rounded)\n"}
              {"Cash bonus = floor(10 × (your_shares / total_shares) × stock_price)"}
            </div>
            <div style={p}>
              The absorbed company's letter becomes available for a new company
              to form later. If the survivor's stock reaches $3,000+ after
              absorbing, a stock split is triggered.
            </div>
          </>
        );

      case "events":
        return (
          <>
            <div style={h2}>Galactic Bomb Events</div>
            <div style={p}>
              Each turn has a ~40% chance of triggering a random event that
              affects a random active company's stock price.
            </div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Event</th><th style={th}>Impact</th></tr>
              </thead>
              <tbody>
                {[
                  ["Space-Fleet suffer damages", "-10%"],
                  ["Main computer out of order", "-20%"],
                  ["Communication to fleet lost", "-20%"],
                  ["Sabotage in energy sources", "-30%"],
                  ["Uncontrolled atomic reaction", "-50%"],
                  ["New energy sources discovered", "+30%"],
                  ["Sales increase by 25%", "+20%"],
                  ["Klingon ship destroyed", "+20%"],
                  ["Klingon attack on base", "-30%"],
                  ["Increase in royalties", "+10%"],
                  ["Tax returning", "+20%"],
                  ["Klingon attack on fleet", "-10%"],
                  ["Federation tax increase", "-15%"],
                  ["Battleship destroyed", "-5%"],
                  ["Stock sale", "+5%"],
                  ["New gold mine discovered", "+5%"],
                  ["Business ship crushed", "-5%"],
                  ["Good news from trading", "+5%"],
                  ["Sales drop by 15%", "-10%"],
                ].map(([event, impact], i) => (
                  <tr key={i}>
                    <td style={td}>{event}</td>
                    <td style={{ ...td, color: impact.startsWith("+") ? "#22c55e" : "#ef4444" }}>{impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={h3}>Alarm Sounds</div>
            <div style={p}>
              {sym("🔊", "#ef4444")} Severe loss (≤-30%): Siren
              <br />
              {sym("🔊", "#f59e0b")} Moderate loss: Short alarm
              <br />
              {sym("🔊", "#22c55e")} Positive event: Bell chime
            </div>
          </>
        );

      case "traps":
        return (
          <>
            <div style={h2}>Traps & Special Cells</div>
            <div style={p}>
              Hidden locations are placed during map generation. They are
              invisible to players and trigger when you land on them.
            </div>

            <div style={h3}>Trap (Cash Loss)</div>
            <div style={p}>
              <span style={{ color: "#ef4444" }}>Dormant until Company Z is formed.</span>
              <br />
              Placed near stars (2+ star neighbors). When triggered:
              <br />
              • 65% chance: lose <strong>ALL</strong> cash
              <br />
              • 35% chance: lose <strong>HALF</strong> cash
              <br />
              Lost cash goes to the bank bonus pool.
            </div>

            <div style={h3}>Freeze Trap</div>
            <div style={p}>
              <span style={{ color: "#06b6d4" }}>Always active from start.</span>
              <br />
              Randomly placed. When triggered, your turn ends immediately — you
              skip the entire trading phase. No cash penalty.
            </div>

            <div style={h3}>Double Pay</div>
            <div style={p}>
              <span style={{ color: "#22c55e" }}>Catch-up mechanic.</span>
              <br />
              10 locations placed randomly. Your cash is <strong>doubled</strong>!
              <br />
              Does NOT trigger for the player currently in first place.
            </div>

            <div style={h3}>Processing Order</div>
            <div style={code}>
              {"1. Dividends paid\n"}
              {"2. Bank bonus grows 5%\n"}
              {"3. Double Pay checked (if not leading)\n"}
              {"4. Trap checked (if Company Z exists)\n"}
              {"5. Random 10% bonus chance\n"}
              {"6. Freeze Trap checked\n"}
              {"7. Stock Trading (if not frozen/trapped)"}
            </div>
          </>
        );

      case "economy":
        return (
          <>
            <div style={h2}>Economy & Scoring</div>
            <div style={h3}>Income Sources</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Source</th><th style={th}>Amount</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}>Dividends (every turn)</td><td style={td}>5% of holdings value per company</td></tr>
                <tr><td style={td}>Merger bonus</td><td style={td}>Proportional to ownership of absorbed company</td></tr>
                <tr><td style={td}>Double Pay cell</td><td style={td}>Cash doubled (not for leader)</td></tr>
                <tr><td style={td}>Bank bonus (10% chance)</td><td style={td}>Half the bank bonus pool</td></tr>
                <tr><td style={td}>Company founding</td><td style={td}>5 free shares</td></tr>
              </tbody>
            </table>

            <div style={h3}>Bank Bonus Pool</div>
            <div style={p}>
              Starts at $1,000. Grows 5% each turn. Increased when players lose
              cash to traps. Paid out (halved) on 10% random bonus.
            </div>

            <div style={h3}>Stock Price Changes</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Trigger</th><th style={th}>Effect</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}>Cell joins company</td><td style={td}>+$100</td></tr>
                <tr><td style={td}>Adjacent to star</td><td style={td}>+$500</td></tr>
                <tr><td style={td}>Adjacent to gold star</td><td style={td}>+$1,000</td></tr>
                <tr><td style={td}>Adjacent outpost absorbed</td><td style={td}>+$100</td></tr>
                <tr><td style={td}>Random event</td><td style={td}>-50% to +30%</td></tr>
                <tr><td style={td}>Stock split (≥$3,000)</td><td style={td}>Price halved, shares doubled</td></tr>
              </tbody>
            </table>

            <div style={h3}>End Game</div>
            <div style={code}>
              {"Net Worth = Cash + Sum(stock_price[i] × shares[i])\n\n"}
              {"Highest net worth wins!"}
            </div>
          </>
        );

      case "commands":
        return (
          <>
            <div style={h2}>Commands Reference</div>
            <div style={h3}>Move Phase</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Key</th><th style={th}>Action</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>1-5</span></td><td style={td}>Select numbered move option</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>H</span></td><td style={td}>View current holdings</td></tr>
              </tbody>
            </table>

            <div style={h3}>Trading Phase</div>
            <table style={table}>
              <thead>
                <tr><th style={th}>Input</th><th style={th}>Action</th></tr>
              </thead>
              <tbody>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>number</span></td><td style={td}>Buy that many shares</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>Ns</span></td><td style={td}>Sell N shares (at 95%)</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>m</span> / <span style={{ color: "#fbbf24" }}>max</span></td><td style={td}>Buy maximum affordable</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>a</span> / <span style={{ color: "#fbbf24" }}>allin</span></td><td style={td}>Buy max everywhere, end turn</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>skip</span> / <span style={{ color: "#fbbf24" }}>-</span></td><td style={td}>Skip company</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>.X</span></td><td style={td}>Jump to company X</td></tr>
                <tr><td style={td}><span style={{ color: "#fbbf24" }}>Enter</span></td><td style={td}>Skip to next</td></tr>
              </tbody>
            </table>

            <div style={h3}>Player Colors</div>
            <table style={table}>
              <tbody>
                <tr><td style={td}><span style={{ color: "#22c55e" }}>■</span> Player 1</td><td style={td}>Green</td></tr>
                <tr><td style={td}><span style={{ color: "#ef4444" }}>■</span> Player 2</td><td style={td}>Red</td></tr>
                <tr><td style={td}><span style={{ color: "#d946ef" }}>■</span> Player 3</td><td style={td}>Magenta</td></tr>
                <tr><td style={td}><span style={{ color: "#06b6d4" }}>■</span> Player 4</td><td style={td}>Cyan</td></tr>
                <tr><td style={td}><span style={{ color: "#3b82f6" }}>■</span> Player 5</td><td style={td}>Blue</td></tr>
                <tr><td style={td}><span style={{ color: "#a16207" }}>■</span> Player 6</td><td style={td}>Brown</td></tr>
              </tbody>
            </table>
          </>
        );

      case "install":
        return (
          <>
            <div style={h2}>Install Star Lanes</div>
            <div style={p}>
              Star Lanes can be installed as an app on your device. Once installed,
              it opens in its own window (no browser toolbar) and{" "}
              <span style={{ color: "#22c55e" }}>Play Local</span> and{" "}
              <span style={{ color: "#22c55e" }}>Watch Demo</span> work offline.
            </div>

            <div style={h3}>Chrome / Edge (Desktop)</div>
            <div style={code}>
              {"1. Visit the Star Lanes website\n"}
              {"2. Look for the install icon in the address bar:\n\n"}
              {"   ┌─────────────────────────────────────────┐\n"}
              {"   │  ⬇  https://lanes.live         ⊕  ☰   │\n"}
              {"   └─────────────────────────────────────────┘\n"}
              {"                                     ↑\n"}
              {"                              Click this icon\n"}
              {"                         (monitor with ↓ arrow)\n\n"}
              {"3. Click \"Install\" in the popup dialog\n"}
              {"4. Star Lanes opens as a standalone app!\n"}
            </div>
            <div style={p}>
              <strong>Alternative:</strong> Click the{" "}
              <span style={{ color: "#9ca3af" }}>⋮</span> menu (three dots) →{" "}
              <span style={{ color: "#fbbf24" }}>Save and share</span> →{" "}
              <span style={{ color: "#fbbf24" }}>Install Star Lanes</span>
            </div>

            <div style={h3}>Chrome (Android)</div>
            <div style={code}>
              {"1. Visit the Star Lanes website in Chrome\n"}
              {"2. You may see an install banner at the bottom:\n\n"}
              {"   ┌─────────────────────────────────┐\n"}
              {"   │  ★ Add Star Lanes to Home screen │\n"}
              {"   │              [Install]            │\n"}
              {"   └─────────────────────────────────┘\n\n"}
              {"3. If no banner, tap ⋮ menu → \"Add to Home screen\"\n"}
              {"4. Tap \"Install\" to confirm\n"}
              {"5. Star Lanes appears on your home screen!\n"}
            </div>

            <div style={h3}>Safari (iPhone / iPad)</div>
            <div style={code}>
              {"1. Visit the Star Lanes website in Safari\n"}
              {"2. Tap the Share button (box with ↑ arrow):\n\n"}
              {"   ┌───────────────────────────────┐\n"}
              {"   │        ↑  Share button         │\n"}
              {"   │   (bottom bar on iPhone,       │\n"}
              {"   │    top bar on iPad)             │\n"}
              {"   └───────────────────────────────┘\n\n"}
              {"3. Scroll down, tap \"Add to Home Screen\"\n"}
              {"4. Tap \"Add\" in the top right\n"}
              {"5. Star Lanes appears on your home screen!\n"}
            </div>

            <div style={h3}>What Works Offline?</div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Feature</th>
                  <th style={th}>Offline</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>Play Local</td><td style={{ ...td, color: "#22c55e" }}>Yes</td></tr>
                <tr><td style={td}>Watch Demo</td><td style={{ ...td, color: "#22c55e" }}>Yes</td></tr>
                <tr><td style={td}>How to Play</td><td style={{ ...td, color: "#22c55e" }}>Yes</td></tr>
                <tr><td style={td}>Play Online</td><td style={{ ...td, color: "#ef4444" }}>No (needs server)</td></tr>
                <tr><td style={td}>Leaderboard</td><td style={{ ...td, color: "#ef4444" }}>No (needs server)</td></tr>
              </tbody>
            </table>

            <div style={h3}>Uninstall</div>
            <div style={p}>
              <strong>Desktop:</strong> Click ⋮ in the app title bar → "Uninstall Star Lanes"
              <br />
              <strong>Android:</strong> Long-press the icon → Uninstall
              <br />
              <strong>iOS:</strong> Long-press the icon → Remove App
            </div>
          </>
        );
    }
  }

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        background: "#0a0a1a",
        color: "#e5e7eb",
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* Navigation */}
      {isMobile ? (
        <div
          style={{
            background: "#111827",
            borderBottom: "1px solid #374151",
            padding: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: "bold", letterSpacing: 1 }}>
              GAME GUIDE
            </span>
            <ExitButton onClick={onClose} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  background: active === s.id ? "#374151" : "#1f2937",
                  color: active === s.id ? "#fbbf24" : "#6b7280",
                  border: active === s.id ? "1px solid #fbbf24" : "1px solid #374151",
                  borderRadius: 3,
                  padding: "3px 8px",
                  cursor: "pointer",
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            width: 200,
            minWidth: 200,
            background: "#111827",
            borderRight: "1px solid #374151",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 12px 12px 16px",
            }}
          >
            <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>
              GAME GUIDE
            </span>
            <ExitButton onClick={onClose} />
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                background: active === s.id ? "#1f2937" : "transparent",
                color: active === s.id ? "#fbbf24" : "#9ca3af",
                border: "none",
                borderLeft: active === s.id ? "2px solid #fbbf24" : "2px solid transparent",
                padding: "6px 16px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? "12px 16px" : "24px 32px",
          maxWidth: 700,
          overflowY: "auto",
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};
