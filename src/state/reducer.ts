import type { GameState, TradingState, GameMessage } from "../types/game";
import type { GameAction } from "./actions";
import { createInitialState } from "./initialState";
import { createRng } from "../engine/rng";
import { processGoldStarDecay, processGalacticBomb } from "../engine/events";
import { generateMoveOptions } from "../engine/moveGeneration";
import { resolvePlacement } from "../engine/placement";
import {
  payDividends,
  growBankBonus,
  checkDoublePay,
  checkTrap,
  checkBonusPayment,
  checkSpecialHelp,
  checkFreezeTrap,
  updateAllNetWorths,
  findLeadingPlayer,
} from "../engine/economy";
import {
  buyShares,
  sellShares,
  getNextTradableCompany,
  shouldRepeatTradingLoop,
} from "../engine/trading";

function advanceRng(state: GameState) {
  return createRng(state.rngSeed);
}

function startPreMove(state: GameState): GameState {
  const rng = advanceRng(state);
  let s: GameState = {
    ...state,
    messages: [...state.messages],
    frozen: false,
    trapped: false,
  };

  // Gold star decay
  s = processGoldStarDecay(s, rng);

  // Galactic bomb
  s = processGalacticBomb(s, rng);

  // Generate move options
  const moveOptions = generateMoveOptions(s, rng);

  const player = s.players[s.currentPlayer];
  s = {
    ...s,
    rngSeed: rng.state(),
    moveOptions,
    phase: "move",
    messages: [
      ...s.messages,
      {
        text: `${player.name}'s turn - select a move`,
        type: "info",
      },
    ],
  };

  return s;
}

function processPostPlacement(state: GameState, row: number, col: number): GameState {
  const rng = advanceRng(state);
  const p = state.currentPlayer;
  let s = state;

  // Dividends for current player
  s = payDividends(s, p);

  // Bank bonus grows
  s = growBankBonus(s);

  // Double pay check
  s = checkDoublePay(s, row, col, p);

  // Trap check
  s = checkTrap(s, row, col, p, rng);

  // Random bonus (10% chance)
  s = checkBonusPayment(s, p, rng);

  // SpecialHelp (v1.17) — if trailing badly, get 18% of leader's worth
  s = checkSpecialHelp(s, p);

  // Freeze trap check
  const frozen = checkFreezeTrap(s, row, col);
  if (frozen) {
    const frozenPlayers = s.players.map((pl) => ({ ...pl }));
    frozenPlayers[p].freezeCount++;
    s = {
      ...s,
      players: frozenPlayers,
      frozen: true,
      rngSeed: rng.state(),
      messages: [
        ...s.messages,
        {
          text: `Freeze Trapped!!!!! ${s.players[p].name} lost their trading phase!`,
          type: "critical",
          alarm: 1,
        },
      ],
    };
  } else {
    s = { ...s, rngSeed: rng.state() };
  }

  s = updateAllNetWorths(s);
  return s;
}

function startTrading(state: GameState): GameState {
  if (state.frozen || state.trapped) {
    return advanceToNextTurn(state);
  }

  const nextCompany = getNextTradableCompany(state, 0, state.currentPlayer);
  if (nextCompany === null) {
    return advanceToNextTurn(state);
  }

  const tradingState: TradingState = {
    companyIndex: nextCompany,
    loopCount: 0,
    soldThisTurn: 0,
  };

  return {
    ...state,
    phase: "trading",
    tradingState,
  };
}

function advanceTrading(state: GameState): GameState {
  if (!state.tradingState) return advanceToNextTurn(state);

  const nextCompany = getNextTradableCompany(
    state,
    state.tradingState.companyIndex + 1,
    state.currentPlayer
  );

  if (nextCompany !== null) {
    return {
      ...state,
      tradingState: {
        ...state.tradingState,
        companyIndex: nextCompany,
      },
    };
  }

  // End of company list - check if trading loop repeats
  const player = state.players[state.currentPlayer];
  if (
    shouldRepeatTradingLoop(player) &&
    state.tradingState.loopCount < 5 // safety cap
  ) {
    const restart = getNextTradableCompany(state, 0, state.currentPlayer);
    if (restart !== null) {
      return {
        ...state,
        tradingState: {
          companyIndex: restart,
          loopCount: state.tradingState.loopCount + 1,
          soldThisTurn: state.tradingState.soldThisTurn,
        },
      };
    }
  }

  return advanceToNextTurn(state);
}

function advanceToNextTurn(state: GameState): GameState {
  let s = updateAllNetWorths(state);

  // Find next player
  const currentIdx = s.turnOrder.indexOf(s.currentPlayer);
  const nextIdx = (currentIdx + 1) % s.turnOrder.length;
  const nextPlayer = s.turnOrder[nextIdx];

  // Increment step every turn (each player action counts as a step)
  const newStep = s.currentStep + 1;

  // Check game end
  if (newStep > s.totalSteps) {
    const leader = findLeadingPlayer(s);
    return {
      ...s,
      phase: "gameOver",
      winner: leader,
      currentStep: newStep - 1,
      tradingState: null,
      messages: [
        ...s.messages,
        {
          text: `Game Over! ${s.players[leader].name} wins with $${s.players[leader].netWorth}!`,
          type: "positive",
        },
      ],
    };
  }

  return startPreMove({
    ...s,
    currentPlayer: nextPlayer,
    currentStep: newStep,
    tradingState: null,
  });
}

export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    case "INIT_GAME": {
      const initial = createInitialState(action.config);
      return { ...initial, phase: "mapSelect" as const };
    }

    case "ACCEPT_MAP": {
      if (state.phase !== "mapSelect") return state;
      return startPreMove(state);
    }

    case "REGENERATE_MAP": {
      if (state.phase !== "mapSelect" || !state.config) return state;
      const newConfig = { ...state.config, seed: Date.now() };
      const newState = createInitialState(newConfig);
      // Preserve the starting player and turn order from original init
      return {
        ...newState,
        phase: "mapSelect" as const,
        currentPlayer: state.currentPlayer,
        turnOrder: state.turnOrder,
      };
    }

    case "SELECT_MOVE": {
      if (state.phase !== "move") return state;
      const option = state.moveOptions[action.moveIndex - 1];
      if (!option) return state;

      // Resolve placement
      let s = resolvePlacement(
        { ...state, messages: [...state.messages] },
        option.row,
        option.col,
        state.currentPlayer
      );

      // Check if a merger or company founding happened — show announcement
      const hasAnnouncement = s.messages.some((m) => m.alarm);
      if (hasAnnouncement) {
        // Save placement position for post-placement processing after acknowledge
        return {
          ...s,
          phase: "specialEvents",
          // Store move position in moveOptions[0] for post-processing
          moveOptions: [{ row: option.row, col: option.col, label: "!" }],
        };
      }

      // Process post-placement effects
      s = processPostPlacement(s, option.row, option.col);

      if (s.frozen || s.trapped) {
        return { ...s, phase: "specialEvents" };
      }

      // Go to trading
      return startTrading(s);
    }

    case "ACKNOWLEDGE_EVENT": {
      if (state.phase === "specialEvents") {
        if (state.frozen || state.trapped) {
          return advanceToNextTurn(state);
        }

        // If we paused for a merger/founding announcement, now do post-placement
        const pendingMove = state.moveOptions[0];
        if (pendingMove && pendingMove.label === "!") {
          // Strip alarm from already-played messages to avoid replaying sounds
          const clearedMessages = state.messages.map((m) =>
            m.alarm ? { ...m, alarm: undefined } : m
          );
          let s = processPostPlacement(
            { ...state, messages: clearedMessages },
            pendingMove.row,
            pendingMove.col
          );
          if (s.frozen || s.trapped) {
            return { ...s, phase: "specialEvents", moveOptions: [] };
          }
          return startTrading({ ...s, moveOptions: [] });
        }

        return startTrading(state);
      }
      if (state.phase === "preMove") {
        return startPreMove(state);
      }
      return state;
    }

    case "BUY_SHARES": {
      if (state.phase !== "trading" || !state.tradingState) return state;
      let s = buyShares(
        state,
        action.companyIndex,
        action.amount,
        state.currentPlayer
      );
      s = updateAllNetWorths(s);
      return advanceTrading(s);
    }

    case "SELL_SHARES": {
      if (state.phase !== "trading" || !state.tradingState) return state;
      let s = sellShares(
        state,
        action.companyIndex,
        action.amount,
        state.currentPlayer
      );
      s = updateAllNetWorths(s);
      return advanceTrading(s);
    }

    case "SKIP_COMPANY": {
      if (state.phase !== "trading") return state;
      return advanceTrading(state);
    }

    case "ALL_IN": {
      if (state.phase !== "trading" || !state.tradingState) return state;
      let s = state;
      const p = s.currentPlayer;
      const startIdx = s.tradingState!.companyIndex;

      // Buy max in every active company from current onwards, then wrap around
      for (let pass = 0; pass <= 5; pass++) {
        const from = pass === 0 ? startIdx : 0;
        for (let i = from; i < s.companies.length; i++) {
          const c = s.companies[i];
          if (c.size === 0 || c.stockPrice <= 0) continue;
          const affordable = Math.floor(s.players[p].cash / c.stockPrice);
          if (affordable <= 0) continue;
          s = buyShares(s, i, affordable, p);
          s = updateAllNetWorths(s);
        }
        // Stop if can't afford anything
        if (!s.companies.some((c) => c.size > 0 && c.stockPrice <= s.players[p].cash)) break;
      }

      return advanceToNextTurn(s);
    }

    case "JUMP_TO_COMPANY": {
      if (state.phase !== "trading" || !state.tradingState) return state;
      const company = state.companies[action.companyIndex];
      if (!company || company.size === 0) return state;

      return {
        ...state,
        tradingState: {
          ...state.tradingState,
          companyIndex: action.companyIndex,
        },
      };
    }

    case "END_TRADING": {
      return advanceToNextTurn(state);
    }

    case "CHANGE_STEPS": {
      if (action.newSteps < 1 || action.newSteps > 999) return state;
      return {
        ...state,
        totalSteps: action.newSteps,
        messages: [
          ...state.messages,
          { text: `Game steps changed to ${action.newSteps}`, type: "info" as const },
        ],
      };
    }

    case "END_GAME_EARLY": {
      if (state.phase === "gameOver" || state.phase === "setup" || state.phase === "mapSelect")
        return state;
      let s = updateAllNetWorths(state);
      const leader = findLeadingPlayer(s);
      return {
        ...s,
        phase: "gameOver",
        winner: leader,
        tradingState: null,
        messages: [
          ...s.messages,
          {
            text: `Game ended early by vote! ${s.players[leader].name} wins with $${s.players[leader].netWorth}!`,
            type: "positive",
          },
        ],
      };
    }

    default:
      return state;
  }
}
