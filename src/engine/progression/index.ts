import type { BattleResult, GameSnapshot } from "@/types";
import {
  HOME_REPAIR_PER_WIN,
  SANGZI_PER_WIN,
} from "../constants";

export function settleStage(
  snapshot: GameSnapshot,
  result: BattleResult,
): GameSnapshot {
  const { state } = snapshot;

  if (result.won) {
    const sangziGained = SANGZI_PER_WIN;
    const availableSangzi = state.sangzi + sangziGained;
    const sangziConsumed = Math.min(availableSangzi, SANGZI_PER_WIN);
    const homeRepairBefore = state.homeRepair;
    const homeRepairAfter = Math.min(
      100,
      homeRepairBefore + HOME_REPAIR_PER_WIN,
    );

    return {
      ...snapshot,
      state: {
        ...state,
        kebi: state.kebi + 1,
        sangzi: availableSangzi - sangziConsumed,
        winStreak: state.winStreak + 1,
        loseStreak: 0,
      },
      lastBattleResult: result,
      settlement: {
        won: true,
        kebiGained: 1,
        sangziGained,
        sangziConsumed,
        homeRepairBefore,
        homeRepairGained: homeRepairAfter - homeRepairBefore,
        homeRepairAfter,
        survivalLost: 0,
      },
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      survival: state.survival - 1,
      winStreak: 0,
      loseStreak: state.loseStreak + 1,
    },
    lastBattleResult: result,
    settlement: {
      won: false,
      kebiGained: 0,
      sangziGained: 0,
      sangziConsumed: 0,
      homeRepairBefore: state.homeRepair,
      homeRepairGained: 0,
      homeRepairAfter: state.homeRepair,
      survivalLost: 1,
    },
  };
}

/** Apply pending home repair after the victory cinematic (board swaps here). */
export function applyHomeRepairFromSettlement(
  snapshot: GameSnapshot,
): GameSnapshot {
  const settlement = snapshot.settlement;
  if (!settlement?.won) return snapshot;
  if (snapshot.state.homeRepair >= settlement.homeRepairAfter) return snapshot;

  return {
    ...snapshot,
    state: {
      ...snapshot.state,
      homeRepair: settlement.homeRepairAfter,
    },
  };
}

export function resolveProgression(snapshot: GameSnapshot): GameSnapshot {
  const { state, lastBattleResult } = snapshot;
  const won = lastBattleResult?.won ?? false;

  if (!won && state.survival <= 0) {
    return {
      ...snapshot,
      phase: "ending",
      state: { ...state, result: "lose" },
    };
  }

  if (won && state.stage >= state.totalStages) {
    const endingWon = state.kebi >= state.kebiThreshold;
    return {
      ...snapshot,
      phase: "ending",
      state: { ...state, result: endingWon ? "win" : "lose" },
    };
  }

  if (won) {
    return {
      ...snapshot,
      state: {
        ...state,
        stage: state.stage + 1,
        result: state.result ?? "playing",
      },
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      result: state.result ?? "playing",
    },
  };
}

export { homeRepairVisualStage as homeRepairStage } from "@/data/balance";
